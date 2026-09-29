import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { AppleAwardMaterials } from './AppleAwardMaterials';
import {
  STRIKE_BADGE_CATALOG,
  StrikeBadgeItem,
  buildAppleBadge3D,
  buildAppleBadge3DShadow,
  createStrikeFlameShape,
} from './BadgeGeometries';
import {
  badgeAudio,
  triggerHaptic,
  triggerSpringOvershootHaptic,
} from '../utils/hapticsAndAudio';
import {
  SpringPhysicsIntegrator,
  SpringPhysicsTelemetry,
} from '../utils/springPhysicsIntegrator';
import { PerformanceMetrics } from './OptimizedBadgeInspectorScene';

export type StrikeSpatialState =
  | 'pending_float'     // 悬浮待领取态：3D 缓动悬浮呼吸、星芒环绕、可拖拽赏玩，等待用户点击领取
  | 'flying_to_wall'    // 抛物线轨迹自转飞回 Strike Badge Wall 对应槽位
  | 'magnetic_snap'     // 磁吸吸附弹跳归位 (Spring Overshoot 物理震动)
  | 'wall_overview'     // Strike 勋章墙全景浏览
  | 'inspect_badge'     // 墙上选中的勋章调出至中央 3D 赏玩与 180° 翻面
  | 'unlock_ceremony';  // Strike 专属勋章沉浸式多阶段解锁仪式 (Ignition -> Molten -> Levitate)

export type StrikeCeremonyPhase = 'idle' | 'igniting' | 'molten_burst' | 'hero_levitate' | 'complete';

export interface StrikeWallSlot {
  index: number;
  badge: StrikeBadgeItem;
  x: number;
  y: number;
  z: number;
  baseZ: number;
  slotGroup: THREE.Group;
  pedestalMesh: THREE.Mesh;
  socketRimMesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
  goldStreamMesh?: THREE.Mesh;
  badgeMesh: THREE.Group | null;
  shadowBadgeMesh: THREE.Group | null;
  isUnlocked: boolean;
  isPendingClaim: boolean;
  hoverIntensity: number;
  liftOffset: number;
  liftVelocity: number;
  liftTarget: number;
}

/**
 * High-performance Radial Velocity Blur Post-Processing Shader
 * Produces cinematic radial streaks emanating from the moving badge
 */
export const RadialBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uStrength: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uCenter;
    uniform float uStrength;
    varying vec2 vUv;

    void main() {
      if (uStrength <= 0.001) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      vec2 toCenter = uCenter - vUv;
      float dist = length(toCenter);
      vec2 stepVec = (toCenter / 14.0) * uStrength * clamp(dist * 1.6, 0.2, 1.2);

      vec4 color = vec4(0.0);
      float totalWeight = 0.0;
      const int SAMPLES = 14;

      for (int i = 0; i < SAMPLES; i++) {
        float fi = float(i);
        vec2 sampleUv = vUv + stepVec * fi;
        float weight = 1.0 - (fi / float(SAMPLES)) * 0.48;
        color += texture2D(tDiffuse, clamp(sampleUv, 0.0, 1.0)) * weight;
        totalWeight += weight;
      }

      gl_FragColor = color / totalWeight;
    }
  `,
};

export class OptimizedStrikeBadgeScene {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  private radialBlurPass!: ShaderPass;

  private mats: AppleAwardMaterials;
  private wallGroup!: THREE.Group;
  public slots: StrikeWallSlot[] = [];
  private hoveredSlotIndex = -1; // Index of currently hovered slot for breathing halo stream

  // Floating Pending Badge & Center Showcase
  private centerGroup!: THREE.Group;
  private pendingBadgeMesh: THREE.Group | null = null;
  private activeStrikeBadge: StrikeBadgeItem = STRIKE_BADGE_CATALOG[0];
  private activeSlotIndex: number = 0;

  // Starlight / Ember Particle System for Floating State & Flight Trail
  private particleGeo!: THREE.BufferGeometry;
  private particleMat!: THREE.PointsMaterial;
  private particlePoints!: THREE.Points;
  private particlePositions!: Float32Array;
  private particleVelocities!: Float32Array;
  private readonly MAX_PARTICLES = 360;

  // ── Dynamic Parabolic Trail Renderer (动态拖尾光效) ──
  private trailMesh!: THREE.Mesh;
  private trailCoreMesh!: THREE.Mesh;
  private trailPositions!: Float32Array;
  private trailColors!: Float32Array;
  private trailCorePositions!: Float32Array;
  private trailCoreColors!: Float32Array;
  private readonly MAX_TRAIL_SEGMENTS = 30;
  private trailPoints: Array<{ pos: THREE.Vector3; time: number }> = [];
  private prevFlightPos = new THREE.Vector3();

  // ── Scatter Spark Particles along Trajectory (粒子散落) ──
  private scatterPoints!: THREE.Points;
  private scatterPositions!: Float32Array;
  private scatterColors!: Float32Array;
  private scatterVelocities!: Float32Array;
  private scatterLifetimes!: Float32Array;
  private scatterMaxLifetimes!: Float32Array;
  private readonly MAX_SCATTER = 380;

  // ── Celebration Fireworks Particle System (勋章解锁局域烟花爆破特效) ──
  private fireworksPoints!: THREE.Points;
  private fireworksPositions!: Float32Array;
  private fireworksColors!: Float32Array;
  private fireworksVelocities!: Float32Array;
  private fireworksLifetimes!: Float32Array;
  private fireworksMaxLifetimes!: Float32Array;
  private readonly MAX_FIREWORKS = 900;

  // ── Strike Unlock Ceremony Flame Vortex System (烈焰旋涡聚能粒子) ──
  private vortexPoints!: THREE.Points;
  private vortexPositions!: Float32Array;
  private vortexColors!: Float32Array;
  private vortexAngles!: Float32Array;
  private vortexRadii!: Float32Array;
  private vortexHeights!: Float32Array;
  private vortexSpeeds!: Float32Array;
  private readonly MAX_VORTEX = 450;

  // ── Strike Unlock Shockwave Ring (冲击波扩散光环) ──
  private shockwaveMesh!: THREE.Mesh;
  private shockwaveStartTime = 0;
  private shockwaveDuration = 900;

  // ── Dedicated Ceremony Orchestrator State ──
  public isCeremonyActive = false;
  public ceremonyPhase: StrikeCeremonyPhase = 'idle';
  public onCeremonyPhaseChange?: (phase: StrikeCeremonyPhase, progress: number) => void;
  public onCeremonyComplete?: (badge: StrikeBadgeItem) => void;
  private ceremonyStartTime = 0;
  private ceremonyTargetSlotIndex = 0;

  // Spatial State
  public currentState: StrikeSpatialState = 'pending_float';
  private animStartTime = 0;
  private animDuration = 1000;
  public playbackSpeed = 1.0;
  public overshootElasticity = 1.0;
  public soundEnabled = true;

  // Flight Path Interpolation Vectors
  private flightStartPos = new THREE.Vector3();
  private flightArcPeak = new THREE.Vector3();
  private flightEndPos = new THREE.Vector3();
  private flightStartScale = 1.0;
  private flightEndScale = 0.38;
  private flightStartQuat = new THREE.Quaternion();
  private flightEndQuat = new THREE.Quaternion();

  // Raycasting & Interaction
  private raycaster = new THREE.Raycaster();
  private mouseVec = new THREE.Vector2();
  private isPointerDown = false;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private hasPointerDragged = false;

  // 3D Center Drag Rotation
  private targetQuat = new THREE.Quaternion();
  private currentQuat = new THREE.Quaternion();
  private pointerVelocityX = 0;
  private pointerVelocityY = 0;

  // Lights
  private movingLight!: THREE.PointLight;
  private snapFlashLight!: THREE.PointLight;

  // Spring Physics for Snap
  public springIntegrator: SpringPhysicsIntegrator = new SpringPhysicsIntegrator();

  // Physical Camera Screen Shake / Micro-tremor
  private cameraShakeIntensity = 0;
  private cameraShakeDecay = 7.5;
  private baseCameraPos = new THREE.Vector3(0, 0, 7.2);
  public onPhysicsTelemetry?: (telemetry: SpringPhysicsTelemetry) => void;
  private lastFrameTime: number = performance.now();

  // Performance Reporting & Callbacks
  public onMetricsUpdate?: (m: PerformanceMetrics) => void;
  public onStateChange?: (state: StrikeSpatialState, badge: StrikeBadgeItem) => void;
  public onSlotClick?: (slot: StrikeWallSlot) => void;
  public onClaimComplete?: (badge: StrikeBadgeItem) => void;

  private frameCount = 0;
  private lastFpsCalcTime = 0;
  private isDestroyed = false;
  private reqId: number | null = null;
  private isFlipped = false;

  constructor(container: HTMLElement, sharedMaterials: AppleAwardMaterials) {
    this.container = container;
    this.mats = sharedMaterials;
    this.init();
  }

  private init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 560;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090e);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.2);

    // 2. WebGLRenderer with high-DPI & PBR capabilities
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05; // Balanced, natural exposure avoiding blown-out specular
    this.container.appendChild(this.renderer.domElement);

    // 3. Post-Processing Bloom Pass & Radial Velocity Blur Pass
    // Softened glint to avoid over-exposure
    const renderPass = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.32, // strength (softened from 0.65)
      0.28, // radius
      0.88  // threshold (higher threshold so only intense points glint)
    );

    this.radialBlurPass = new ShaderPass(RadialBlurShader);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.radialBlurPass);

    // 4. Lights (Calibrated for Apple Olympic satin-gold specular warmth)
    const ambient = new THREE.AmbientLight(0xffffff, 0.90);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.45);
    keyLight.position.set(4, 6, 6);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.05);
    rimLight.position.set(-5, -3, 3);
    this.scene.add(rimLight);

    const goldFill = new THREE.DirectionalLight(0xffb700, 0.85);
    goldFill.position.set(0, -5, 4);
    this.scene.add(goldFill);

    this.movingLight = new THREE.PointLight(0xffd60a, 1.30, 10);
    this.movingLight.position.set(0, 0, 3);
    this.scene.add(this.movingLight);

    this.snapFlashLight = new THREE.PointLight(0xffffff, 0, 8);
    this.scene.add(this.snapFlashLight);

    // 5. Build Strike Badge Wall
    this.buildStrikeWall();

    // 6. Build Center Showcase / Floating Group
    this.centerGroup = new THREE.Group();
    this.centerGroup.name = 'strike-center-group';
    this.scene.add(this.centerGroup);

    // 7. Build Orbiting Embers / Starlight Particles
    this.buildParticleSystem();

    // 7.5 Build Dynamic Trail Renderer & Trajectory Scatter Particles
    this.buildTrailRenderer();
    this.buildScatterSystem();

    // 7.8 Build Celebration Fireworks Particle System (局域烟花爆破)
    this.buildFireworksSystem();

    // 7.9 Build Strike Unlock Ceremony Flame Vortex & Shockwave Ring
    this.buildVortexSystem();
    this.buildShockwaveMesh();

    // 8. Load Initial Floating Badge (3-Day by default)
    this.loadPendingBadge(STRIKE_BADGE_CATALOG[0]);

    // 9. Event Listeners
    this.bindEvents();

    // 10. Start Animation Loop
    this.lastFrameTime = performance.now();
    this.lastFpsCalcTime = performance.now();
    this.animate();
  }

  /**
   * Build the Strike Badge Wall (10 Distinct Milestone Slots in 2 Tiers)
   * Rendered with authentic 灰色阴影卡槽 (Gray Shadow Socket Slots)
   */
  private buildStrikeWall() {
    this.wallGroup = new THREE.Group();
    this.wallGroup.name = 'strike-badge-wall';
    this.wallGroup.position.set(0, 0, -1.6);
    this.scene.add(this.wallGroup);

    // 10 milestone slots arranged in 2 curved rows of 5
    // Row 1: 3D, 7D, 14D, 21D, 30D
    // Row 2: 50D, 75D, 100D, 200D, 365D
    const slotPositions = [
      // Row 1 (Upper Arc)
      { x: -3.2, y: 1.0, z: -0.3 },   // Slot 0: 3-Day Strike
      { x: -1.6, y: 1.15, z: -0.05 }, // Slot 1: 7-Day Strike
      { x: 0.0, y: 1.2, z: 0.05 },    // Slot 2: 14-Day Strike
      { x: 1.6, y: 1.15, z: -0.05 },  // Slot 3: 21-Day Strike
      { x: 3.2, y: 1.0, z: -0.3 },    // Slot 4: 30-Day Strike

      // Row 2 (Lower Arc)
      { x: -3.2, y: -0.95, z: -0.3 },  // Slot 5: 50-Day Strike
      { x: -1.6, y: -0.85, z: -0.05 }, // Slot 6: 75-Day Strike
      { x: 0.0, y: -0.8, z: 0.05 },    // Slot 7: 100-Day Strike
      { x: 1.6, y: -0.85, z: -0.05 },  // Slot 8: 200-Day Strike
      { x: 3.2, y: -0.95, z: -0.3 },   // Slot 9: 365-Day Strike
    ];

    this.slots = STRIKE_BADGE_CATALOG.map((item, idx) => {
      const pos = slotPositions[idx] || { x: (idx % 5 - 2) * 1.6, y: idx < 5 ? 1.0 : -1.0, z: 0 };
      const slotGroup = new THREE.Group();
      slotGroup.name = `strike-slot-${item.id}`;
      slotGroup.position.set(pos.x, pos.y, pos.z);

      // (A) 灰色阴影火焰异形卡槽底座 (Strike Flame-Shaped Matte Shadow Socket Pedestal)
      const flameSocketShape = createStrikeFlameShape(0.48);
      const pedestalGeo = new THREE.ExtrudeGeometry(flameSocketShape, {
        steps: 1,
        depth: 0.12,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 3,
      });
      pedestalGeo.center();
      const shadowPedestalMat = new THREE.MeshStandardMaterial({
        color: 0x0c0f16, // 深炭灰阴影底座
        roughness: 0.94,
        metalness: 0.10,
        envMap: this.mats.envMap,
        envMapIntensity: 0.3,
      });
      const pedestalMesh = new THREE.Mesh(pedestalGeo, shadowPedestalMat);
      pedestalMesh.position.z = -0.09;
      slotGroup.add(pedestalMesh);

      // (B) 灰色阴影火焰立体倒角外边框 (Strike Flame-Shaped Frosted Shadow Chamfered Rim)
      const flameRimShape = createStrikeFlameShape(0.51);
      const socketRimGeo = new THREE.ExtrudeGeometry(flameRimShape, {
        steps: 1,
        depth: 0.04,
        bevelEnabled: true,
        bevelThickness: 0.018,
        bevelSize: 0.018,
        bevelSegments: 2,
      });
      socketRimGeo.center();
      const shadowRimMat = new THREE.MeshStandardMaterial({
        color: 0x1a212e, // 哑光烟熏灰卡槽外边框
        roughness: 0.70,
        metalness: 0.30,
      });
      const socketRimMesh = new THREE.Mesh(socketRimGeo, shadowRimMat);
      socketRimMesh.position.z = -0.02;
      slotGroup.add(socketRimMesh);

      // (C) 灰色阴影火焰凹槽内壁 (Strike Flame Inner Cavity Drop-Shadow Plate)
      const innerCavityShape = createStrikeFlameShape(0.46);
      const innerCavityGeo = new THREE.ShapeGeometry(innerCavityShape);
      innerCavityGeo.center();
      const innerCavityPlate = new THREE.Mesh(
        innerCavityGeo,
        new THREE.MeshStandardMaterial({
          color: 0x06080c, // 极深内凹火焰暗影
          roughness: 0.98,
          metalness: 0.02,
        })
      );
      innerCavityPlate.position.z = -0.065;
      slotGroup.add(innerCavityPlate);

      // (D) 3D 灰色阴影卡槽真实勋章雏形 (Ghost Silhouette 3D Flame Medallion Shadow Mesh)
      // 未解锁状态下展示与截图标配完全一致的 3D 灰色阴影浮雕火焰勋章卡槽
      const shadowBadgeMesh = buildAppleBadge3DShadow(this.mats, item);
      shadowBadgeMesh.scale.setScalar(0.44);
      shadowBadgeMesh.position.set(0, 0, 0.02);
      slotGroup.add(shadowBadgeMesh);

      // (E) 悬浮待领取 / 激活发光能量火焰光晕 (Strike Flame-Shaped Pulsing Energy Halo)
      const haloShape = createStrikeFlameShape(0.53);
      const haloGeo = new THREE.ShapeGeometry(haloShape);
      haloGeo.center();
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffd700),
        transparent: true,
        opacity: 0.08, // 默认灰暗，解锁/hover时激活
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.z = -0.005;
      slotGroup.add(haloMesh);

      // (F) 卡槽边缘微弱金色流光层 (Contoured Golden Streaming Edge Halo Ribbon)
      const streamShape = createStrikeFlameShape(0.515);
      const streamGeo = new THREE.ShapeGeometry(streamShape);
      streamGeo.center();
      const streamMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffea75),
        transparent: true,
        opacity: 0.04,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const goldStreamMesh = new THREE.Mesh(streamGeo, streamMat);
      goldStreamMesh.position.z = 0.01;
      slotGroup.add(goldStreamMesh);

      this.wallGroup.add(slotGroup);

      return {
        index: idx,
        badge: item,
        x: pos.x,
        y: pos.y,
        z: pos.z - 1.6,
        baseZ: pos.z - 1.6,
        slotGroup,
        pedestalMesh,
        socketRimMesh,
        haloMesh,
        goldStreamMesh,
        badgeMesh: null,
        shadowBadgeMesh,
        isUnlocked: false,
        isPendingClaim: false,
        hoverIntensity: 0.0,
        liftOffset: 0.0,
        liftVelocity: 0.0,
        liftTarget: 0.0,
      };
    });
  }

  /**
   * Build floating ember / starlight particle field
   */
  private buildParticleSystem() {
    this.particlePositions = new Float32Array(this.MAX_PARTICLES * 3);
    this.particleVelocities = new Float32Array(this.MAX_PARTICLES * 3);

    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const dist = 1.3 + Math.random() * 0.9;

      this.particlePositions[i * 3] = Math.cos(theta) * Math.cos(phi) * dist;
      this.particlePositions[i * 3 + 1] = Math.sin(phi) * dist;
      this.particlePositions[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * dist;

      this.particleVelocities[i * 3] = (Math.random() - 0.5) * 0.4;
      this.particleVelocities[i * 3 + 1] = 0.2 + Math.random() * 0.5; // upward drift
      this.particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }

    this.particleGeo = new THREE.BufferGeometry();
    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    this.particleMat = new THREE.PointsMaterial({
      color: 0xffb700,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particlePoints = new THREE.Points(this.particleGeo, this.particleMat);
    this.centerGroup.add(this.particlePoints);
  }

  /**
   * Build Dynamic Parabolic Trail Ribbon Renderer
   */
  private buildTrailRenderer() {
    const numPoints = this.MAX_TRAIL_SEGMENTS;
    const numVerts = numPoints * 2;
    this.trailPositions = new Float32Array(numVerts * 3);
    this.trailColors = new Float32Array(numVerts * 3);

    const indices: number[] = [];
    for (let i = 0; i < numPoints - 1; i++) {
      const v0 = i * 2;
      const v1 = i * 2 + 1;
      const v2 = (i + 1) * 2;
      const v3 = (i + 1) * 2 + 1;
      indices.push(v0, v1, v2);
      indices.push(v1, v3, v2);
    }

    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    trailGeo.setAttribute('color', new THREE.BufferAttribute(this.trailColors, 3));
    trailGeo.setIndex(indices);

    const trailMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.trailMesh = new THREE.Mesh(trailGeo, trailMat);
    this.trailMesh.frustumCulled = false;
    this.trailMesh.visible = false;
    this.scene.add(this.trailMesh);

    // Inner Specular Hot-Plasma Core Ribbon
    this.trailCorePositions = new Float32Array(numVerts * 3);
    this.trailCoreColors = new Float32Array(numVerts * 3);
    const coreGeo = new THREE.BufferGeometry();
    coreGeo.setAttribute('position', new THREE.BufferAttribute(this.trailCorePositions, 3));
    coreGeo.setAttribute('color', new THREE.BufferAttribute(this.trailCoreColors, 3));
    coreGeo.setIndex(indices);

    const coreMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.trailCoreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.trailCoreMesh.frustumCulled = false;
    this.trailCoreMesh.visible = false;
    this.scene.add(this.trailCoreMesh);
  }

  /**
   * Build Trajectory Scatter Particle System (Sparks & Embers along flight path)
   */
  private buildScatterSystem() {
    this.scatterPositions = new Float32Array(this.MAX_SCATTER * 3);
    this.scatterColors = new Float32Array(this.MAX_SCATTER * 3);
    this.scatterVelocities = new Float32Array(this.MAX_SCATTER * 3);
    this.scatterLifetimes = new Float32Array(this.MAX_SCATTER);
    this.scatterMaxLifetimes = new Float32Array(this.MAX_SCATTER);

    // Initialize all particles hidden
    for (let i = 0; i < this.MAX_SCATTER; i++) {
      this.scatterPositions[i * 3 + 2] = -9999;
      this.scatterLifetimes[i] = 0;
    }

    const scatterGeo = new THREE.BufferGeometry();
    scatterGeo.setAttribute('position', new THREE.BufferAttribute(this.scatterPositions, 3));
    scatterGeo.setAttribute('color', new THREE.BufferAttribute(this.scatterColors, 3));

    const scatterMat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.scatterPoints = new THREE.Points(scatterGeo, scatterMat);
    this.scatterPoints.frustumCulled = false;
    this.scatterPoints.visible = false;
    this.scene.add(this.scatterPoints);
  }

  /**
   * Add a new position sample to the dynamic trail
   */
  private addTrailPoint(pos: THREE.Vector3) {
    this.trailPoints.unshift({ pos: pos.clone(), time: performance.now() });
    if (this.trailPoints.length > this.MAX_TRAIL_SEGMENTS) {
      this.trailPoints.pop();
    }
  }

  /**
   * Update Trail Ribbon Geometry & Camera-facing Billboarding
   */
  private updateTrailMesh() {
    if (this.trailPoints.length < 2) {
      if (this.trailMesh) this.trailMesh.visible = false;
      if (this.trailCoreMesh) this.trailCoreMesh.visible = false;
      return;
    }

    if (this.trailMesh) this.trailMesh.visible = true;
    if (this.trailCoreMesh) this.trailCoreMesh.visible = true;

    const baseColor = new THREE.Color(this.activeStrikeBadge.accentHex || '#ffd60a');
    const headColor = new THREE.Color(0xffffff); // Specular white-gold head
    const tailColor = new THREE.Color(0xff5500); // Amber-orange tail

    const camPos = this.camera.position;
    const len = this.trailPoints.length;

    for (let i = 0; i < this.MAX_TRAIL_SEGMENTS; i++) {
      const idx = Math.min(i, len - 1);
      const pt = this.trailPoints[idx];
      const nextPt = this.trailPoints[Math.min(idx + 1, len - 1)];

      // Direction tangent
      const dir = new THREE.Vector3().subVectors(pt.pos, nextPt.pos);
      if (dir.lengthSq() < 0.0001) {
        dir.set(0, 1, 0);
      } else {
        dir.normalize();
      }

      // Normal perpendicular to tangent and camera ray
      const toCam = new THREE.Vector3().subVectors(camPos, pt.pos).normalize();
      const normal = new THREE.Vector3().crossVectors(dir, toCam).normalize();

      const progress = i / (this.MAX_TRAIL_SEGMENTS - 1);
      const widthFactor = Math.pow(1.0 - progress, 1.35);
      const outerWidth = 0.42 * widthFactor;
      const coreWidth = 0.14 * widthFactor;

      const alpha = Math.max(0, 1.0 - progress * 1.15);

      // Outer ribbon vertices
      const v0x = pt.pos.x + normal.x * outerWidth;
      const v0y = pt.pos.y + normal.y * outerWidth;
      const v0z = pt.pos.z + normal.z * outerWidth;

      const v1x = pt.pos.x - normal.x * outerWidth;
      const v1y = pt.pos.y - normal.y * outerWidth;
      const v1z = pt.pos.z - normal.z * outerWidth;

      const vi = i * 2;
      this.trailPositions[vi * 3] = v0x;
      this.trailPositions[vi * 3 + 1] = v0y;
      this.trailPositions[vi * 3 + 2] = v0z;

      this.trailPositions[(vi + 1) * 3] = v1x;
      this.trailPositions[(vi + 1) * 3 + 1] = v1y;
      this.trailPositions[(vi + 1) * 3 + 2] = v1z;

      // Color gradient
      const curCol = new THREE.Color().copy(headColor).lerp(baseColor, Math.min(1.0, progress * 1.6)).lerp(tailColor, Math.max(0, progress - 0.35));
      const r = curCol.r * alpha;
      const g = curCol.g * alpha;
      const b = curCol.b * alpha;

      this.trailColors[vi * 3] = r;
      this.trailColors[vi * 3 + 1] = g;
      this.trailColors[vi * 3 + 2] = b;

      this.trailColors[(vi + 1) * 3] = r;
      this.trailColors[(vi + 1) * 3 + 1] = g;
      this.trailColors[(vi + 1) * 3 + 2] = b;

      // Inner core ribbon
      this.trailCorePositions[vi * 3] = pt.pos.x + normal.x * coreWidth;
      this.trailCorePositions[vi * 3 + 1] = pt.pos.y + normal.y * coreWidth;
      this.trailCorePositions[vi * 3 + 2] = pt.pos.z + normal.z * coreWidth;

      this.trailCorePositions[(vi + 1) * 3] = pt.pos.x - normal.x * coreWidth;
      this.trailCorePositions[(vi + 1) * 3 + 1] = pt.pos.y - normal.y * coreWidth;
      this.trailCorePositions[(vi + 1) * 3 + 2] = pt.pos.z - normal.z * coreWidth;

      const coreAlpha = Math.max(0, 1.0 - progress * 1.3);
      this.trailCoreColors[vi * 3] = 1.0 * coreAlpha;
      this.trailCoreColors[vi * 3 + 1] = 0.95 * coreAlpha;
      this.trailCoreColors[vi * 3 + 2] = 0.7 * coreAlpha;

      this.trailCoreColors[(vi + 1) * 3] = 1.0 * coreAlpha;
      this.trailCoreColors[(vi + 1) * 3 + 1] = 0.95 * coreAlpha;
      this.trailCoreColors[(vi + 1) * 3 + 2] = 0.7 * coreAlpha;
    }

    if (this.trailMesh && this.trailMesh.geometry) {
      (this.trailMesh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.trailMesh.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }

    if (this.trailCoreMesh && this.trailCoreMesh.geometry) {
      (this.trailCoreMesh.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.trailCoreMesh.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }
  }

  /**
   * Emit Spark particles along flight path
   */
  private emitScatterSparks(pos: THREE.Vector3, tangentDir: THREE.Vector3, count = 10) {
    if (!this.scatterPoints) return;
    this.scatterPoints.visible = true;
    const accentCol = new THREE.Color(this.activeStrikeBadge.accentHex || '#ffd60a');
    const goldCol = new THREE.Color(0xffd60a);
    const cyanCol = new THREE.Color(0x00f0ff);

    for (let c = 0; c < count; c++) {
      let targetIdx = 0;
      let minLife = 999;
      for (let i = 0; i < this.MAX_SCATTER; i++) {
        if (this.scatterLifetimes[i] <= 0) {
          targetIdx = i;
          break;
        }
        if (this.scatterLifetimes[i] < minLife) {
          minLife = this.scatterLifetimes[i];
          targetIdx = i;
        }
      }

      const life = 0.45 + Math.random() * 0.45;
      this.scatterLifetimes[targetIdx] = life;
      this.scatterMaxLifetimes[targetIdx] = life;

      const offset = (Math.random() - 0.5) * 0.16;
      this.scatterPositions[targetIdx * 3] = pos.x + offset;
      this.scatterPositions[targetIdx * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.16;
      this.scatterPositions[targetIdx * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.16;

      const backSpeed = 0.7 + Math.random() * 1.5;
      const spreadX = (Math.random() - 0.5) * 1.6;
      const spreadY = (Math.random() - 0.5) * 1.6 + 0.25;
      const spreadZ = (Math.random() - 0.5) * 1.6;

      this.scatterVelocities[targetIdx * 3] = -tangentDir.x * backSpeed + spreadX;
      this.scatterVelocities[targetIdx * 3 + 1] = -tangentDir.y * backSpeed + spreadY;
      this.scatterVelocities[targetIdx * 3 + 2] = -tangentDir.z * backSpeed + spreadZ;

      const rnd = Math.random();
      const col = rnd < 0.6 ? goldCol : rnd < 0.85 ? accentCol : cyanCol;
      this.scatterColors[targetIdx * 3] = col.r;
      this.scatterColors[targetIdx * 3 + 1] = col.g;
      this.scatterColors[targetIdx * 3 + 2] = col.b;
    }
  }

  /**
   * Update active scatter spark particles
   */
  private updateScatterSparks(dt: number) {
    if (!this.scatterPoints) return;
    let hasActive = false;

    for (let i = 0; i < this.MAX_SCATTER; i++) {
      if (this.scatterLifetimes[i] > 0) {
        hasActive = true;
        this.scatterLifetimes[i] -= dt;

        if (this.scatterLifetimes[i] <= 0) {
          this.scatterPositions[i * 3 + 2] = -9999;
          continue;
        }

        const tNorm = this.scatterLifetimes[i] / this.scatterMaxLifetimes[i];

        this.scatterVelocities[i * 3] *= 0.94;
        this.scatterVelocities[i * 3 + 1] -= dt * 0.75; // Subtle gravity
        this.scatterVelocities[i * 3 + 1] *= 0.94;
        this.scatterVelocities[i * 3 + 2] *= 0.94;

        this.scatterPositions[i * 3] += this.scatterVelocities[i * 3] * dt;
        this.scatterPositions[i * 3 + 1] += this.scatterVelocities[i * 3 + 1] * dt;
        this.scatterPositions[i * 3 + 2] += this.scatterVelocities[i * 3 + 2] * dt;

        this.scatterColors[i * 3] *= tNorm;
        this.scatterColors[i * 3 + 1] *= tNorm;
        this.scatterColors[i * 3 + 2] *= tNorm;
      }
    }

    this.scatterPoints.visible = hasActive;
    (this.scatterPoints.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.scatterPoints.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  /**
   * Build celebration fireworks particle system
   */
  private buildFireworksSystem() {
    this.fireworksPositions = new Float32Array(this.MAX_FIREWORKS * 3);
    this.fireworksColors = new Float32Array(this.MAX_FIREWORKS * 3);
    this.fireworksVelocities = new Float32Array(this.MAX_FIREWORKS * 3);
    this.fireworksLifetimes = new Float32Array(this.MAX_FIREWORKS);
    this.fireworksMaxLifetimes = new Float32Array(this.MAX_FIREWORKS);

    for (let i = 0; i < this.MAX_FIREWORKS; i++) {
      this.fireworksPositions[i * 3 + 2] = -9999;
      this.fireworksLifetimes[i] = 0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.fireworksPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.fireworksColors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.fireworksPoints = new THREE.Points(geo, mat);
    this.fireworksPoints.name = 'celebration-fireworks';
    this.scene.add(this.fireworksPoints);
  }

  /**
   * Trigger localized fireworks celebration explosion in Badge Wall area
   * Features dynamic 4-tier Color Grading (颜色分级机制):
   * - Tier 1 (3 ~ 14 天): 暖金赤焰 (Warm Olympic Gold & Ember Orange)
   * - Tier 2 (30 ~ 40 天): 龙焰日冕 (Crimson Dragon & Solar Gold)
   * - Tier 3 (50 ~ 60 天): 霓虹金与极光星云 (Neon Gold & Aurora Emerald)
   * - Tier 4 (80 ~ 100+ 天): 极光紫与幻彩霓虹金殿堂级渐变 (Aurora Violet & Prismatic Neon Gold)
   */
  public triggerWallFireworks(targetSlotIndex = 0, burstCount?: number, milestoneDays?: number) {
    if (!this.fireworksPoints) return;
    this.fireworksPoints.visible = true;

    const targetSlot = this.slots[targetSlotIndex] || this.slots[0];
    const days = milestoneDays !== undefined ? milestoneDays : (targetSlot.badge.strikeDays || 3);
    const center = new THREE.Vector3(targetSlot.x, targetSlot.y, targetSlot.z + 0.15);

    let count = burstCount || (days >= 80 ? 480 : days >= 50 ? 380 : days >= 30 ? 300 : 240);
    let burstOrigins: Array<{ pos: THREE.Vector3; delay: number; scale: number; colorTheme: string }> = [];

    if (days >= 80) {
      // Tier 4: 80天 ~ 100+天 终极殿堂：极光紫与幻彩霓虹金 5 阶级联流光爆破
      burstOrigins = [
        { pos: center.clone(), delay: 0, scale: 1.35, colorTheme: 'aurora_violet_neon_gold' },
        { pos: new THREE.Vector3(center.x - 0.95, center.y + 0.65, center.z + 0.05), delay: 90, scale: 1.15, colorTheme: 'aurora_violet_neon_gold' },
        { pos: new THREE.Vector3(center.x + 0.95, center.y + 0.65, center.z + 0.05), delay: 180, scale: 1.15, colorTheme: 'aurora_violet_neon_gold' },
        { pos: new THREE.Vector3(center.x, center.y + 1.1, center.z), delay: 270, scale: 1.05, colorTheme: 'aurora_violet_neon_gold' },
        { pos: center.clone(), delay: 360, scale: 0.9, colorTheme: 'aurora_violet_neon_gold' },
      ];
      this.triggerCameraShake(0.32);
    } else if (days >= 50) {
      // Tier 3: 50天 ~ 60天 黄金半百与双月：霓虹金与极光星云渐变
      burstOrigins = [
        { pos: center.clone(), delay: 0, scale: 1.2, colorTheme: 'neon_gold_aurora' },
        { pos: new THREE.Vector3(center.x - 0.8, center.y + 0.55, center.z), delay: 100, scale: 1.0, colorTheme: 'neon_gold_aurora' },
        { pos: new THREE.Vector3(center.x + 0.8, center.y + 0.55, center.z), delay: 200, scale: 1.0, colorTheme: 'neon_gold_aurora' },
        { pos: new THREE.Vector3(center.x, center.y + 0.85, center.z), delay: 300, scale: 0.85, colorTheme: 'neon_gold_aurora' },
      ];
      this.triggerCameraShake(0.26);
    } else if (days >= 30) {
      // Tier 2: 30天 ~ 40天 整月与破晓：龙焰红宝石与日冕金
      burstOrigins = [
        { pos: center.clone(), delay: 0, scale: 1.1, colorTheme: 'crimson_solar_gold' },
        { pos: new THREE.Vector3(center.x - 0.75, center.y + 0.5, center.z), delay: 110, scale: 0.9, colorTheme: 'crimson_solar_gold' },
        { pos: new THREE.Vector3(center.x + 0.75, center.y + 0.5, center.z), delay: 220, scale: 0.9, colorTheme: 'crimson_solar_gold' },
      ];
      this.triggerCameraShake(0.22);
    } else {
      // Tier 1: 3天 ~ 14天 初阶连击：温润暖金与初燃赤焰
      burstOrigins = [
        { pos: center.clone(), delay: 0, scale: 1.0, colorTheme: 'warm_gold_flame' },
        { pos: new THREE.Vector3(center.x - 0.7, center.y + 0.45, center.z), delay: 110, scale: 0.8, colorTheme: 'warm_gold_flame' },
        { pos: new THREE.Vector3(center.x + 0.7, center.y + 0.45, center.z), delay: 220, scale: 0.8, colorTheme: 'warm_gold_flame' },
      ];
      this.triggerCameraShake(0.18);
    }

    const perWave = Math.floor(count / burstOrigins.length);
    burstOrigins.forEach((wave) => {
      setTimeout(() => {
        if (this.isDestroyed) return;
        this.spawnFireworksCluster(wave.pos, perWave, wave.scale, wave.colorTheme);
      }, wave.delay);
    });
  }

  private spawnFireworksCluster(origin: THREE.Vector3, count: number, scale = 1.0, colorTheme = 'warm_gold_flame') {
    // Color Palette definitions
    const neonGold = new THREE.Color(0xffd700);
    const neonAmber = new THREE.Color(0xffbe0b);
    const auroraViolet = new THREE.Color(0xbf5af2);
    const quantumPurple = new THREE.Color(0x7000ff);
    const electricCyan = new THREE.Color(0x00f5ff);
    const auroraPink = new THREE.Color(0xff375f);
    const diamondWhite = new THREE.Color(0xffffff);
    const auroraEmerald = new THREE.Color(0x30d158);
    const dragonCrimson = new THREE.Color(0xff2d55);
    const flameOrange = new THREE.Color(0xff5500);

    for (let c = 0; c < count; c++) {
      let targetIdx = 0;
      let minLife = 999;
      for (let i = 0; i < this.MAX_FIREWORKS; i++) {
        if (this.fireworksLifetimes[i] <= 0) {
          targetIdx = i;
          break;
        }
        if (this.fireworksLifetimes[i] < minLife) {
          minLife = this.fireworksLifetimes[i];
          targetIdx = i;
        }
      }

      const life = (0.75 + Math.random() * 0.75) * scale;
      this.fireworksLifetimes[targetIdx] = life;
      this.fireworksMaxLifetimes[targetIdx] = life;

      // Initial origin with slight jitter
      this.fireworksPositions[targetIdx * 3] = origin.x + (Math.random() - 0.5) * 0.08;
      this.fireworksPositions[targetIdx * 3 + 1] = origin.y + (Math.random() - 0.5) * 0.08;
      this.fireworksPositions[targetIdx * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.08;

      // 3D Spherical shell explosion distribution
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const speed = (1.5 + Math.random() * 3.2) * scale;

      this.fireworksVelocities[targetIdx * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      this.fireworksVelocities[targetIdx * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed + 0.52; // upward lift
      this.fireworksVelocities[targetIdx * 3 + 2] = Math.cos(phi) * speed * 0.8;

      // Tier-based Color Grading
      let col = neonGold;
      const rnd = Math.random();

      if (colorTheme === 'aurora_violet_neon_gold') {
        // Tier 4 (80D+): 极光紫与幻彩霓虹金渐变
        if (rnd < 0.35) {
          // 霓虹金与流金光芒
          col = rnd < 0.20 ? neonGold : neonAmber;
        } else if (rnd < 0.70) {
          // 帝王极光紫与深空紫
          col = rnd < 0.55 ? auroraViolet : quantumPurple;
        } else if (rnd < 0.88) {
          // 幻彩青核电光
          col = electricCyan;
        } else if (rnd < 0.95) {
          // 极光粉钻火花
          col = auroraPink;
        } else {
          col = diamondWhite;
        }
      } else if (colorTheme === 'neon_gold_aurora') {
        // Tier 3 (50D~60D): 霓虹金与极光翡翠星云
        if (rnd < 0.45) {
          col = rnd < 0.25 ? neonGold : neonAmber;
        } else if (rnd < 0.75) {
          col = rnd < 0.60 ? auroraEmerald : electricCyan;
        } else if (rnd < 0.90) {
          col = auroraViolet;
        } else {
          col = diamondWhite;
        }
      } else if (colorTheme === 'crimson_solar_gold') {
        // Tier 2 (30D~40D): 龙焰赤红与日冕纯金
        if (rnd < 0.45) {
          col = dragonCrimson;
        } else if (rnd < 0.80) {
          col = neonGold;
        } else if (rnd < 0.92) {
          col = electricCyan;
        } else {
          col = diamondWhite;
        }
      } else {
        // Tier 1 (3D~14D): 初燃赤橙与温润缎金
        if (rnd < 0.48) {
          col = neonGold;
        } else if (rnd < 0.82) {
          col = flameOrange;
        } else if (rnd < 0.92) {
          col = neonAmber;
        } else {
          col = diamondWhite;
        }
      }

      this.fireworksColors[targetIdx * 3] = col.r;
      this.fireworksColors[targetIdx * 3 + 1] = col.g;
      this.fireworksColors[targetIdx * 3 + 2] = col.b;
    }
  }

  /**
   * Update fireworks particles in render loop
   */
  private updateFireworks(dt: number) {
    if (!this.fireworksPoints) return;
    let hasActive = false;

    for (let i = 0; i < this.MAX_FIREWORKS; i++) {
      if (this.fireworksLifetimes[i] > 0) {
        hasActive = true;
        this.fireworksLifetimes[i] -= dt;

        if (this.fireworksLifetimes[i] <= 0) {
          this.fireworksPositions[i * 3 + 2] = -9999;
          continue;
        }

        const tNorm = this.fireworksLifetimes[i] / this.fireworksMaxLifetimes[i];

        // Physics: drag + gravity
        this.fireworksVelocities[i * 3] *= 0.95;
        this.fireworksVelocities[i * 3 + 1] -= dt * 1.85; // Gravity pull
        this.fireworksVelocities[i * 3 + 1] *= 0.95;
        this.fireworksVelocities[i * 3 + 2] *= 0.95;

        this.fireworksPositions[i * 3] += this.fireworksVelocities[i * 3] * dt;
        this.fireworksPositions[i * 3 + 1] += this.fireworksVelocities[i * 3 + 1] * dt;
        this.fireworksPositions[i * 3 + 2] += this.fireworksVelocities[i * 3 + 2] * dt;

        // Scintillation / sparkle fade
        const sparkle = 0.8 + 0.2 * Math.sin(tNorm * 40.0 + i);
        const alpha = Math.pow(tNorm, 1.4) * sparkle;
        this.fireworksColors[i * 3] *= alpha;
        this.fireworksColors[i * 3 + 1] *= alpha;
        this.fireworksColors[i * 3 + 2] *= alpha;
      }
    }

    this.fireworksPoints.visible = hasActive;
    (this.fireworksPoints.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.fireworksPoints.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  /**
   * Clear trail points
   */
  private clearTrail() {
    this.trailPoints = [];
    if (this.trailMesh) this.trailMesh.visible = false;
    if (this.trailCoreMesh) this.trailCoreMesh.visible = false;
  }

  /**
   * Build Flame Vortex Particle System (烈焰旋涡聚能粒子) for Strike Unlock Ceremony
   */
  private buildVortexSystem() {
    this.vortexPositions = new Float32Array(this.MAX_VORTEX * 3);
    this.vortexColors = new Float32Array(this.MAX_VORTEX * 3);
    this.vortexAngles = new Float32Array(this.MAX_VORTEX);
    this.vortexRadii = new Float32Array(this.MAX_VORTEX);
    this.vortexHeights = new Float32Array(this.MAX_VORTEX);
    this.vortexSpeeds = new Float32Array(this.MAX_VORTEX);

    for (let i = 0; i < this.MAX_VORTEX; i++) {
      this.vortexPositions[i * 3 + 2] = -9999;
      this.vortexAngles[i] = Math.random() * Math.PI * 2;
      this.vortexRadii[i] = 0.8 + Math.random() * 2.2;
      this.vortexHeights[i] = (Math.random() - 0.5) * 1.5;
      this.vortexSpeeds[i] = 3.5 + Math.random() * 5.0;

      // Warm fiery colors: orange, gold, crimson
      const rnd = Math.random();
      if (rnd < 0.45) {
        this.vortexColors[i * 3] = 1.0;
        this.vortexColors[i * 3 + 1] = 0.84;
        this.vortexColors[i * 3 + 2] = 0.04;
      } else if (rnd < 0.8) {
        this.vortexColors[i * 3] = 1.0;
        this.vortexColors[i * 3 + 1] = 0.35;
        this.vortexColors[i * 3 + 2] = 0.0;
      } else {
        this.vortexColors[i * 3] = 1.0;
        this.vortexColors[i * 3 + 1] = 0.15;
        this.vortexColors[i * 3 + 2] = 0.3;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.vortexPositions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.vortexColors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.vortexPoints = new THREE.Points(geo, mat);
    this.vortexPoints.name = 'ceremony-vortex';
    this.vortexPoints.frustumCulled = false;
    this.vortexPoints.visible = false;
    this.scene.add(this.vortexPoints);
  }

  /**
   * Build Luminous Shockwave Ring (冲击波扩散光环)
   */
  private buildShockwaveMesh() {
    const shockGeo = new THREE.RingGeometry(0.85, 1.08, 64);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xffd60a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.shockwaveMesh = new THREE.Mesh(shockGeo, shockMat);
    this.shockwaveMesh.name = 'ceremony-shockwave';
    this.shockwaveMesh.visible = false;
    this.scene.add(this.shockwaveMesh);
  }

  /**
   * Trigger expanding shockwave from origin
   */
  public triggerShockwave(origin: THREE.Vector3, colorHex = 0xffd60a) {
    if (!this.shockwaveMesh) return;
    this.shockwaveMesh.position.copy(origin);
    this.shockwaveMesh.scale.setScalar(0.1);
    (this.shockwaveMesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    (this.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
    this.shockwaveMesh.visible = true;
    this.shockwaveStartTime = performance.now();
  }

  /**
   * Update shockwave ring expansion & fade
   */
  private updateShockwave(now: number) {
    if (!this.shockwaveMesh || !this.shockwaveMesh.visible) return;
    const elapsed = now - this.shockwaveStartTime;
    const progress = Math.min(1.0, elapsed / this.shockwaveDuration);

    if (progress >= 1.0) {
      this.shockwaveMesh.visible = false;
      return;
    }

    const ease = Math.sin((progress * Math.PI) / 2);
    const scale = 0.1 + ease * 3.6;
    this.shockwaveMesh.scale.setScalar(scale);
    (this.shockwaveMesh.material as THREE.MeshBasicMaterial).opacity = (1.0 - progress) * 0.92;
  }

  /**
   * Update flame vortex convergence in ignition phase
   */
  private updateVortex(dt: number, now: number, progress: number, targetPos: THREE.Vector3) {
    if (!this.vortexPoints) return;
    this.vortexPoints.visible = true;

    // Radius shrinks as ignition progresses (from 2.2 down to 0.05)
    const radiusFactor = Math.max(0.02, 1.0 - Math.pow(progress, 1.5));

    for (let i = 0; i < this.MAX_VORTEX; i++) {
      this.vortexAngles[i] += this.vortexSpeeds[i] * dt * (1.0 + progress * 2.5);
      const angle = this.vortexAngles[i];
      const r = this.vortexRadii[i] * radiusFactor;
      const h = this.vortexHeights[i] * radiusFactor;

      // Spiral inwards toward target slot
      this.vortexPositions[i * 3] = targetPos.x + Math.cos(angle) * r;
      this.vortexPositions[i * 3 + 1] = targetPos.y + Math.sin(angle) * r * 0.75 + h;
      this.vortexPositions[i * 3 + 2] = targetPos.z + Math.sin(angle * 2.0) * 0.15 + (1.0 - progress) * 0.3;

      // Color intensifies to white-gold near convergence
      const heat = Math.min(1.0, progress * 1.5);
      this.vortexColors[i * 3] = 1.0;
      this.vortexColors[i * 3 + 1] = 0.4 + heat * 0.55;
      this.vortexColors[i * 3 + 2] = heat * 0.35;
    }

    (this.vortexPoints.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.vortexPoints.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  /**
   * Start High-Fidelity Strike Badge Multi-Stage Unlock Ceremony
   * Choreography:
   * 1. 🌋 初燃聚能 (Ignition & Flame Vortex) -> 0 ~ 1300ms
   * 2. 💥 熔金破茧 (Molten Burst, Shockwave & Tiered Fireworks) -> 1300 ~ 2300ms
   * 3. ✨ 浮空巡礼 (Hero Levitation & 3D 360° Inspection Orbit) -> 2300 ~ 4500ms
   * 4. 🏁 达成入列 (Ready for interactive exploration or parabolic snap)
   */
  public startStrikeUnlockCeremony(
    badge: StrikeBadgeItem,
    onPhaseChange?: (phase: StrikeCeremonyPhase, progress: number) => void,
    onComplete?: (badge: StrikeBadgeItem) => void
  ) {
    this.isCeremonyActive = true;
    this.ceremonyPhase = 'igniting';
    this.ceremonyStartTime = performance.now();
    this.activeStrikeBadge = badge;
    this.currentState = 'unlock_ceremony';

    if (onPhaseChange) this.onCeremonyPhaseChange = onPhaseChange;
    if (onComplete) this.onCeremonyComplete = onComplete;

    const slotIdx = this.slots.findIndex((s) => s.badge.id === badge.id);
    this.ceremonyTargetSlotIndex = slotIdx !== -1 ? slotIdx : 0;
    this.activeSlotIndex = this.ceremonyTargetSlotIndex;

    const targetSlot = this.slots[this.ceremonyTargetSlotIndex];

    // Reset pending mesh in center during initial ignition
    if (this.pendingBadgeMesh) {
      this.centerGroup.remove(this.pendingBadgeMesh);
      this.pendingBadgeMesh = null;
    }

    // Audio & Haptics for Ignition
    if (this.soundEnabled) {
      badgeAudio.playStrikeIgnitionSound();
    }
    triggerHaptic('impact');

    if (this.onCeremonyPhaseChange) {
      this.onCeremonyPhaseChange('igniting', 0.0);
    }
    if (this.onStateChange) {
      this.onStateChange('unlock_ceremony', badge);
    }
  }

  /**
   * Cancel ongoing ceremony and restore default overview
   */
  public cancelCeremony() {
    this.isCeremonyActive = false;
    this.ceremonyPhase = 'idle';
    if (this.vortexPoints) this.vortexPoints.visible = false;
    if (this.shockwaveMesh) this.shockwaveMesh.visible = false;
    this.camera.position.set(0, 0, 7.2);
    this.loadPendingBadge(this.activeStrikeBadge);
  }

  /**
   * Load Floating Pending Strike Badge (3D Mesh in Center Showcase)
   */
  public loadPendingBadge(badgeItem: StrikeBadgeItem) {
    this.activeStrikeBadge = badgeItem;
    this.activeSlotIndex = this.slots.findIndex((s) => s.badge.id === badgeItem.id);
    if (this.activeSlotIndex === -1) this.activeSlotIndex = 0;

    // Clean previous pending mesh
    if (this.pendingBadgeMesh) {
      this.centerGroup.remove(this.pendingBadgeMesh);
      this.pendingBadgeMesh = null;
    }

    // Build fresh 3D badge mesh
    const badgeMesh = buildAppleBadge3D(this.mats, badgeItem);
    badgeMesh.name = `pending-${badgeItem.id}`;
    badgeMesh.scale.setScalar(1.0);
    badgeMesh.position.set(0, 0, 0);
    this.pendingBadgeMesh = badgeMesh;
    this.centerGroup.add(badgeMesh);

    // Update particle color to match badge accent
    this.particleMat.color.set(badgeItem.accentHex);

    // Mark slot state as pending claim
    const slot = this.slots[this.activeSlotIndex];
    if (slot) {
      slot.isPendingClaim = true;
      (slot.haloMesh.material as THREE.MeshBasicMaterial).opacity = 0.4;
    }

    this.currentState = 'pending_float';
    this.targetQuat.identity();
    this.currentQuat.identity();
    this.isFlipped = false;

    // Reset camera for pending floating view
    this.camera.position.set(0, 0, 7.2);
    this.camera.lookAt(0, 0, 0);

    if (this.onStateChange) {
      this.onStateChange(this.currentState, this.activeStrikeBadge);
    }
  }

  /**
   * Trigger Claim & 3D Flight to Strike Badge Wall
   * High-speed parabolic arc trajectory $\to$ Magnetic snap with spring overshoot!
   */
  public triggerClaimToWall() {
    if (this.currentState !== 'pending_float' || !this.pendingBadgeMesh) return;

    this.currentState = 'flying_to_wall';
    this.animStartTime = performance.now();
    this.animDuration = 950 / this.playbackSpeed;

    const targetSlot = this.slots[this.activeSlotIndex];
    if (!targetSlot) return;

    // World position of the center badge currently
    this.flightStartPos.copy(this.pendingBadgeMesh.position);
    this.flightStartScale = this.pendingBadgeMesh.scale.x;
    this.flightStartQuat.copy(this.pendingBadgeMesh.quaternion);

    // Destination slot coordinate in world space
    this.flightEndPos.set(targetSlot.x, targetSlot.y, targetSlot.z);
    this.flightEndScale = 0.44; // Scale to fit socket
    this.flightEndQuat.identity(); // Face flat forward in wall socket

    // Parabolic Bezier Arc Peak: rises up and toward camera before descending into wall socket
    this.flightArcPeak.set(
      (this.flightStartPos.x + this.flightEndPos.x) * 0.5,
      Math.max(this.flightStartPos.y, this.flightEndPos.y) + 1.2,
      Math.max(this.flightStartPos.z, this.flightEndPos.z) + 1.6
    );

    // Sound & Haptic
    if (this.soundEnabled) {
      badgeAudio.playStrikeFlightWhoosh();
    }
    triggerHaptic('impact');
    this.triggerCameraShake(0.12);

    this.clearTrail();
    this.prevFlightPos.copy(this.flightStartPos);

    if (this.onStateChange) {
      this.onStateChange(this.currentState, this.activeStrikeBadge);
    }
  }

  /**
   * Complete the Magnetic Snap into Wall Socket
   */
  private executeMagneticSnap() {
    this.currentState = 'magnetic_snap';
    const targetSlot = this.slots[this.activeSlotIndex];
    if (!targetSlot || !this.pendingBadgeMesh) return;

    // Snap sound & tactile haptics
    if (this.soundEnabled) {
      badgeAudio.playKineticSnapRebound(1.6);
      badgeAudio.playBracketSnap(targetSlot.index, 1.0);
    }
    triggerSpringOvershootHaptic();
    this.triggerCameraShake(0.24);

    // Burst Arrival Sparks
    const arrivalPos = new THREE.Vector3(targetSlot.x, targetSlot.y, targetSlot.z);
    this.emitScatterSparks(arrivalPos, new THREE.Vector3(0, 0, 1), 36);
    this.clearTrail();
    if (this.radialBlurPass) {
      this.radialBlurPass.uniforms.uStrength.value = 0.0;
    }

    // Trigger visual light flash
    this.snapFlashLight.position.set(targetSlot.x, targetSlot.y, targetSlot.z + 0.5);
    this.snapFlashLight.color.set(this.activeStrikeBadge.accentHex);
    this.snapFlashLight.intensity = 5.0;

    // Setup spring physics overshoot integrator
    this.springIntegrator.configure({
      stiffness: 380,
      damping: 24,
      mass: 0.85,
    });
    this.springIntegrator.reset(0.35 * this.overshootElasticity, -2.8);

    // Transfer mesh to wall slot
    targetSlot.isUnlocked = true;
    targetSlot.isPendingClaim = false;

    // Remove 3D gray shadow placeholder from slot if present
    if (targetSlot.shadowBadgeMesh) {
      targetSlot.slotGroup.remove(targetSlot.shadowBadgeMesh);
      targetSlot.shadowBadgeMesh = null;
    }

    // Clone badge mesh into slot permanently
    if (!targetSlot.badgeMesh) {
      const slotBadge = buildAppleBadge3D(this.mats, this.activeStrikeBadge);
      slotBadge.scale.setScalar(0.44);
      slotBadge.position.set(0, 0, 0.02);
      targetSlot.slotGroup.add(slotBadge);
      targetSlot.badgeMesh = slotBadge;
    }

    // Illuminate socket halo
    (targetSlot.haloMesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
    (targetSlot.haloMesh.material as THREE.MeshBasicMaterial).color.set(this.activeStrikeBadge.accentHex);

    // Trigger celebratory localized color-graded fireworks burst on this slot
    this.triggerWallFireworks(targetSlot.index, 360, this.activeStrikeBadge.strikeDays);

    // Remove pending mesh from center
    this.centerGroup.remove(this.pendingBadgeMesh);
    this.pendingBadgeMesh = null;

    if (this.onStateChange) {
      this.onStateChange('wall_overview', this.activeStrikeBadge);
    }
    if (this.onClaimComplete) {
      this.onClaimComplete(this.activeStrikeBadge);
    }

    // Settle into wall overview state
    setTimeout(() => {
      this.currentState = 'wall_overview';
    }, 450);
  }

  /**
   * Select a slot on the wall to inspect in 3D
   */
  public selectSlotForInspect(slotIdx: number) {
    const slot = this.slots[slotIdx];
    if (!slot || !slot.isUnlocked) return;

    this.activeSlotIndex = slotIdx;
    this.activeStrikeBadge = slot.badge;
    this.loadPendingBadge(slot.badge);
    this.currentState = 'inspect_badge';

    if (this.soundEnabled) {
      badgeAudio.playClick(1.3);
    }
    triggerHaptic('selection');

    if (this.onStateChange) {
      this.onStateChange('inspect_badge', slot.badge);
    }
  }

  /**
   * Toggle 180° Flip for inspecting engraved backplate
   */
  public toggleFlip() {
    this.isFlipped = !this.isFlipped;
    if (this.isFlipped) {
      this.targetQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    } else {
      this.targetQuat.identity();
    }
    if (this.soundEnabled) {
      badgeAudio.playClick(1.1);
    }
    triggerHaptic('tap');
  }

  /**
   * Return to Wall Overview mode
   */
  public returnToWall() {
    if (this.pendingBadgeMesh) {
      this.centerGroup.remove(this.pendingBadgeMesh);
      this.pendingBadgeMesh = null;
    }
    this.currentState = 'wall_overview';
    this.camera.position.set(0, 0, 7.2);
    if (this.onStateChange) {
      this.onStateChange('wall_overview', this.activeStrikeBadge);
    }
  }

  /**
   * Set theme background color (Purple screenshot replica vs Dark obsidian)
   */
  public setTheme(theme: 'purple' | 'dark') {
    if (this.scene) {
      if (theme === 'purple') {
        this.scene.background = new THREE.Color(0x581c87);
      } else {
        this.scene.background = new THREE.Color(0x07090e);
      }
    }
  }

  /**
   * Trigger subtle physical camera micro-shake (Screen shake effect)
   */
  public triggerCameraShake(intensity = 0.16) {
    this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, intensity);
  }

  /**
   * Trigger 3D tactile lift & spring overshoot bounce on slot click
   */
  public triggerSlotLiftAnimation(slotIdx: number) {
    const slot = this.slots[slotIdx];
    if (!slot) return;

    slot.liftTarget = 0.32;
    slot.liftVelocity = 2.0;

    // Burst golden star sparks at slot position
    this.emitScatterSparks(new THREE.Vector3(slot.x, slot.y, slot.z + 0.1), new THREE.Vector3(0, 0, 1), 16);

    if (this.soundEnabled) {
      badgeAudio.playClick(1.4);
    }
    triggerHaptic('impact');

    // Bounce back to wall base with spring overshoot
    setTimeout(() => {
      slot.liftTarget = 0.0;
    }, 220);
  }

  /**
   * Reset / Unlock specific strike day milestone (e.g. 3-day or 7-day)
   */
  public unlockMilestone(days: number) {
    const matchedBadge = STRIKE_BADGE_CATALOG.find((b) => b.strikeDays === days) || STRIKE_BADGE_CATALOG[0];
    const slotIdx = this.slots.findIndex((s) => s.badge.strikeDays === days);
    this.loadPendingBadge(matchedBadge);

    // Trigger celebratory localized particle fireworks explosion on Badge Wall
    this.triggerWallFireworks(slotIdx !== -1 ? slotIdx : 0, 260);

    if (this.soundEnabled) {
      badgeAudio.playStrikeUnlockFlourish();
    }
    triggerHaptic('success');
    this.triggerCameraShake(0.24);
  }

  /**
   * Reset all 10 wall slots back to initial 灰色阴影卡槽 (Gray Shadow Socket Slots)
   */
  public resetAllSlotsToShadow() {
    this.slots.forEach((slot) => {
      slot.isUnlocked = false;
      slot.isPendingClaim = false;

      // Remove colored badge if mounted
      if (slot.badgeMesh) {
        slot.slotGroup.remove(slot.badgeMesh);
        slot.badgeMesh = null;
      }

      // Re-create or restore gray shadow badge silhouette
      if (!slot.shadowBadgeMesh) {
        const shadowBadgeMesh = buildAppleBadge3DShadow(this.mats, slot.badge);
        shadowBadgeMesh.scale.setScalar(0.44);
        shadowBadgeMesh.position.set(0, 0, 0.02);
        slot.slotGroup.add(shadowBadgeMesh);
        slot.shadowBadgeMesh = shadowBadgeMesh;
      }

      // Reset halo opacity
      if (slot.haloMesh && slot.haloMesh.material) {
        (slot.haloMesh.material as THREE.MeshBasicMaterial).opacity = 0.08;
      }
    });

    // Reset center pending badge to 3-Day strike badge
    this.loadPendingBadge(STRIKE_BADGE_CATALOG[0]);
  }

  /**
   * Pointer & Drag Events
   */
  private bindEvents() {
    const el = this.renderer.domElement;

    el.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isPointerDown = true;
      this.pointerStartX = e.clientX;
      this.pointerStartY = e.clientY;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
      this.hasPointerDragged = false;
      this.pointerVelocityX = 0;
      this.pointerVelocityY = 0;
      el.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      // Raycasting for hovered slots
      const rect = el.getBoundingClientRect();
      this.mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Realtime raycasting to track hovered slot for breathing golden hover stream
      this.raycaster.setFromCamera(this.mouseVec, this.camera);
      const intersects = this.raycaster.intersectObjects(this.wallGroup.children, true);
      let hoveredIndex = -1;
      if (intersects.length > 0) {
        let current: THREE.Object3D | null = intersects[0].object;
        while (current && current.parent && current.parent !== this.wallGroup) {
          current = current.parent;
        }
        if (current) {
          const matched = this.slots.find((s) => s.slotGroup === current);
          if (matched) hoveredIndex = matched.index;
        }
      }
      this.hoveredSlotIndex = hoveredIndex;

      if (!this.isPointerDown) return;

      const dx = e.clientX - this.prevPointerX;
      const dy = e.clientY - this.prevPointerY;
      const totalDist = Math.hypot(e.clientX - this.pointerStartX, e.clientY - this.pointerStartY);

      if (totalDist > 6) {
        this.hasPointerDragged = true;
      }

      this.pointerVelocityX = dx;
      this.pointerVelocityY = dy;

      // 3D rotation of floating pending badge
      if (this.pendingBadgeMesh && (this.currentState === 'pending_float' || this.currentState === 'inspect_badge')) {
        const rotY = dx * 0.009;
        const rotX = dy * 0.009;
        const deltaQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, 0, 'XYZ'));
        this.targetQuat.multiplyQuaternions(deltaQuat, this.targetQuat);
      }

      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
    });

    window.addEventListener('pointerup', () => {
      if (this.isPointerDown) {
        this.isPointerDown = false;

        // If not dragged (clean tap)
        if (!this.hasPointerDragged) {
          this.handleTap();
        }
      }
    });

    // Resize Observer
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(width, height);
          this.composer.setSize(width, height);
        }
      }
    });
    ro.observe(this.container);
  }

  /**
   * Handle Click / Tap on 3D elements
   */
  private handleTap() {
    this.raycaster.setFromCamera(this.mouseVec, this.camera);

    // If currently in pending_float, clicking the pending badge triggers claim to wall!
    if (this.currentState === 'pending_float') {
      this.triggerClaimToWall();
      return;
    }

    // If clicking a slot on the badge wall
    const intersects = this.raycaster.intersectObjects(this.wallGroup.children, true);
    if (intersects.length > 0) {
      let current: THREE.Object3D | null = intersects[0].object;
      while (current && current.parent && current.parent !== this.wallGroup) {
        current = current.parent;
      }
      if (current) {
        const matchedSlot = this.slots.find((s) => s.slotGroup === current);
        if (matchedSlot) {
          // Trigger 3D tactile lift animation!
          this.triggerSlotLiftAnimation(matchedSlot.index);

          if (this.onSlotClick) {
            this.onSlotClick(matchedSlot);
          }
        }
      }
    }
  }

  /**
   * Main Render Loop
   */
  private animate = () => {
    if (this.isDestroyed) return;
    this.reqId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;

    // Moving studio specular highlight
    this.movingLight.position.x = Math.sin(now * 0.0015) * 3.5;
    this.movingLight.position.y = Math.cos(now * 0.0012) * 2.5;

    // Fade out snap flash light
    if (this.snapFlashLight.intensity > 0) {
      this.snapFlashLight.intensity = Math.max(0, this.snapFlashLight.intensity - dt * 15.0);
    }

    // Physical Camera Screen Shake / Micro-tremor
    if (this.cameraShakeIntensity > 0.001) {
      const shakeX = (Math.random() - 0.5) * 2 * this.cameraShakeIntensity;
      const shakeY = (Math.random() - 0.5) * 2 * this.cameraShakeIntensity;
      this.camera.position.x = this.baseCameraPos.x + shakeX;
      this.camera.position.y = this.baseCameraPos.y + shakeY;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * this.cameraShakeDecay);
    } else if (this.camera.position.x !== this.baseCameraPos.x || this.camera.position.y !== this.baseCameraPos.y) {
      this.camera.position.x = this.baseCameraPos.x;
      this.camera.position.y = this.baseCameraPos.y;
    }

    // ───────────────────────────────────────────────────────────────────────
    // State 1: Floating Pending Badge Animation (悬浮待领取)
    // ───────────────────────────────────────────────────────────────────────
    if (this.currentState === 'pending_float' && this.pendingBadgeMesh) {
      // 1. Natural Breathing Harmonic Levitation: y = sin(w * t) * A
      const levitateY = Math.sin(now * 0.0022) * 0.12;
      this.pendingBadgeMesh.position.y = levitateY;
      this.pendingBadgeMesh.position.z = 0;

      // 2. Gentle auto yaw idle spin if not dragging
      if (!this.isPointerDown) {
        const autoSpin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dt * 0.45);
        this.targetQuat.multiply(autoSpin);
      }

      // Smooth quaternion slerp
      this.currentQuat.slerp(this.targetQuat, dt * 8.0);
      this.pendingBadgeMesh.quaternion.copy(this.currentQuat);

      // 3. Orbiting ember starlight particles animation
      this.updateParticles(dt, now);
    }

    // ───────────────────────────────────────────────────────────────────────
    // State 2: Parabolic Flight Trajectory to Wall Slot (3D 自转飞向勋章墙)
    // ───────────────────────────────────────────────────────────────────────
    else if (this.currentState === 'flying_to_wall' && this.pendingBadgeMesh) {
      const elapsed = now - this.animStartTime;
      const progress = Math.min(1.0, elapsed / this.animDuration);
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Quadratic Bezier Curve: B(t) = (1-t)^2 P0 + 2(1-t)t Ppeak + t^2 Pend
      const t = ease;
      const oneMinusT = 1.0 - t;
      const bx = oneMinusT * oneMinusT * this.flightStartPos.x + 2 * oneMinusT * t * this.flightArcPeak.x + t * t * this.flightEndPos.x;
      const by = oneMinusT * oneMinusT * this.flightStartPos.y + 2 * oneMinusT * t * this.flightArcPeak.y + t * t * this.flightEndPos.y;
      const bz = oneMinusT * oneMinusT * this.flightStartPos.z + 2 * oneMinusT * t * this.flightArcPeak.z + t * t * this.flightEndPos.z;

      this.pendingBadgeMesh.position.set(bx, by, bz);

      // Scale transition from full size to slot size
      const currentScale = this.flightStartScale + (this.flightEndScale - this.flightStartScale) * ease;
      this.pendingBadgeMesh.scale.setScalar(currentScale);

      // Rapid spin rotation during flight (360° spin on flight path)
      const spinAngle = ease * Math.PI * 4;
      const spinQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), spinAngle);
      this.pendingBadgeMesh.quaternion.copy(this.flightStartQuat).slerp(this.flightEndQuat, ease).multiply(spinQuat);

      // Trailing flame embers
      this.particlePoints.position.set(bx, by, bz);

      // ── 1. Dynamic Parabolic Trail Renderer Update ──
      const currentPos = new THREE.Vector3(bx, by, bz);
      this.addTrailPoint(currentPos);
      this.updateTrailMesh();

      // ── 2. Scatter Sparks along Trajectory ──
      const tangent = new THREE.Vector3().subVectors(currentPos, this.prevFlightPos);
      if (tangent.lengthSq() > 0.00001) {
        tangent.normalize();
        this.emitScatterSparks(currentPos, tangent, Math.round(9 * (1.0 + ease)));
      }
      this.prevFlightPos.copy(currentPos);

      // ── 3. Radial Velocity Blur Post-Processing ──
      if (this.radialBlurPass) {
        const proj = currentPos.clone().project(this.camera);
        const uvX = (proj.x + 1.0) * 0.5;
        const uvY = (proj.y + 1.0) * 0.5;
        this.radialBlurPass.uniforms.uCenter.value.set(uvX, uvY);
        // High-speed radial blur reaches peak at mid-flight
        const blurStrength = Math.sin(progress * Math.PI) * 0.42;
        this.radialBlurPass.uniforms.uStrength.value = blurStrength;
      }

      if (progress >= 1.0) {
        this.executeMagneticSnap();
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // State 3: Magnetic Snap Spring Overshoot (磁吸弹簧吸附震动)
    // ───────────────────────────────────────────────────────────────────────
    else if (this.currentState === 'magnetic_snap') {
      const telemetry = this.springIntegrator.step(dt);
      if (this.onPhysicsTelemetry) {
        this.onPhysicsTelemetry(telemetry);
      }

      const targetSlot = this.slots[this.activeSlotIndex];
      if (targetSlot && targetSlot.badgeMesh) {
        // Apply spring displacement along Z-axis (overshoot forward and back)
        targetSlot.badgeMesh.position.z = 0.02 + telemetry.displacement * 0.15;
      }
    }

    // ───────────────────────────────────────────────────────────────────────
    // State 4: Inspect 3D Badge Mode (中央赏玩态)
    // ───────────────────────────────────────────────────────────────────────
    else if (this.currentState === 'inspect_badge' && this.pendingBadgeMesh) {
      this.currentQuat.slerp(this.targetQuat, dt * 8.0);
      this.pendingBadgeMesh.quaternion.copy(this.currentQuat);
    }

    // ───────────────────────────────────────────────────────────────────────
    // State 5: Strike Multi-Stage Unlock Ceremony (专属解锁动画多阶段管线)
    // ───────────────────────────────────────────────────────────────────────
    else if (this.currentState === 'unlock_ceremony' && this.isCeremonyActive) {
      const ceremonyElapsed = (now - this.ceremonyStartTime) * this.playbackSpeed;
      const targetSlot = this.slots[this.ceremonyTargetSlotIndex] || this.slots[0];
      const slotPos = new THREE.Vector3(targetSlot.x, targetSlot.y, targetSlot.z);

      // Phase 1: 🌋 初燃聚能 (Ignition & Flame Vortex) -> 0 ~ 1300ms
      if (ceremonyElapsed < 1300) {
        this.ceremonyPhase = 'igniting';
        const p = Math.min(1.0, ceremonyElapsed / 1300);

        // Update vortex inward spiraling
        this.updateVortex(dt, now, p, slotPos);

        // Lift slot slightly forward and pulse molten rim
        targetSlot.liftTarget = 0.28 * p;
        if (targetSlot.socketRimMesh && targetSlot.socketRimMesh.material) {
          const rimMat = targetSlot.socketRimMesh.material as THREE.MeshStandardMaterial;
          if (rimMat.emissive) {
            rimMat.emissive.setHex(0xff3700);
            rimMat.emissiveIntensity = 0.5 + Math.sin(now * 0.01) * 0.4 + p * 0.8;
          }
        }
        if (targetSlot.haloMesh && targetSlot.haloMesh.material) {
          (targetSlot.haloMesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + p * 0.6;
          (targetSlot.haloMesh.material as THREE.MeshBasicMaterial).color.setHex(0xff5500);
        }

        // Camera eases in slightly towards the slot
        const targetCamX = slotPos.x * 0.25;
        const targetCamY = slotPos.y * 0.25;
        this.camera.position.x += (targetCamX - this.camera.position.x) * dt * 3.0;
        this.camera.position.y += (targetCamY - this.camera.position.y) * dt * 3.0;
        this.camera.position.z += (5.6 - this.camera.position.z) * dt * 3.0;

        if (this.onCeremonyPhaseChange) {
          this.onCeremonyPhaseChange('igniting', p);
        }
      }
      // Phase 2: 💥 熔金破茧 (Molten Burst & Shockwave Explosion) -> 1300 ~ 2300ms
      else if (ceremonyElapsed < 2300) {
        const p = Math.min(1.0, (ceremonyElapsed - 1300) / 1000);
        if (this.ceremonyPhase === 'igniting') {
          this.ceremonyPhase = 'molten_burst';

          // Turn on unlocked slot badge
          targetSlot.isUnlocked = true;
          if (targetSlot.shadowBadgeMesh) {
            targetSlot.slotGroup.remove(targetSlot.shadowBadgeMesh);
            targetSlot.shadowBadgeMesh = null;
          }
          if (!targetSlot.badgeMesh) {
            const slotBadge = buildAppleBadge3D(this.mats, this.activeStrikeBadge);
            slotBadge.scale.setScalar(0.44);
            slotBadge.position.set(0, 0, 0.02);
            targetSlot.slotGroup.add(slotBadge);
            targetSlot.badgeMesh = slotBadge;
          }

          // Trigger shockwave & localized color-graded fireworks
          const accentColor = parseInt(this.activeStrikeBadge.accentHex.replace('#', '0x')) || 0xffd60a;
          this.triggerShockwave(new THREE.Vector3(targetSlot.x, targetSlot.y, targetSlot.z + 0.05), accentColor);
          this.triggerWallFireworks(this.ceremonyTargetSlotIndex, 420, this.activeStrikeBadge.strikeDays);

          if (this.soundEnabled) {
            badgeAudio.playStrikeShockwaveSound();
            badgeAudio.playStrikeUnlockFlourish();
          }
          this.triggerCameraShake(0.35);

          // Flash light
          this.snapFlashLight.position.set(targetSlot.x, targetSlot.y, targetSlot.z + 0.6);
          this.snapFlashLight.color.set(this.activeStrikeBadge.accentHex);
          this.snapFlashLight.intensity = 5.0;

          // Hide vortex points
          if (this.vortexPoints) this.vortexPoints.visible = false;
        }

        if (this.onCeremonyPhaseChange) {
          this.onCeremonyPhaseChange('molten_burst', p);
        }
      }
      // Phase 3: ✨ 浮空巡礼 (Hero Levitation & 3D 360° Inspection Orbit) -> 2300 ~ 4600ms
      else if (ceremonyElapsed < 4600) {
        const p = Math.min(1.0, (ceremonyElapsed - 2300) / 2300);
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

        if (this.ceremonyPhase === 'molten_burst') {
          this.ceremonyPhase = 'hero_levitate';

          // Spawn floating pending badge mesh in center
          if (!this.pendingBadgeMesh) {
            const badgeMesh = buildAppleBadge3D(this.mats, this.activeStrikeBadge);
            badgeMesh.name = `pending-${this.activeStrikeBadge.id}`;
            this.pendingBadgeMesh = badgeMesh;
            this.centerGroup.add(badgeMesh);
          }
        }

        if (this.pendingBadgeMesh) {
          // Ascend from slot coordinate to center stage
          const currentX = slotPos.x * (1.0 - ease);
          const currentY = slotPos.y * (1.0 - ease);
          const currentZ = slotPos.z * (1.0 - ease) + Math.sin(ease * Math.PI) * 0.4;
          this.pendingBadgeMesh.position.set(currentX, currentY, currentZ);

          // Scale smoothly from 0.44 to 1.0
          this.pendingBadgeMesh.scale.setScalar(0.44 + ease * 0.56);

          // 360° showcase tumbling rotation
          const yaw = ease * Math.PI * 2;
          const tilt = Math.sin(ease * Math.PI) * 0.28;
          const rotQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, yaw, 0, 'XYZ'));
          this.pendingBadgeMesh.quaternion.copy(rotQuat);
        }

        // Camera pulls back smoothly to baseline
        this.camera.position.x += (0 - this.camera.position.x) * dt * 4.0;
        this.camera.position.y += (0 - this.camera.position.y) * dt * 4.0;
        this.camera.position.z += (7.2 - this.camera.position.z) * dt * 4.0;

        // Orbit particles shimmer
        this.updateParticles(dt, now);

        if (this.onCeremonyPhaseChange) {
          this.onCeremonyPhaseChange('hero_levitate', p);
        }
      }
      // Phase 4: 🏁 达成入列与自由赏玩
      else {
        this.isCeremonyActive = false;
        this.ceremonyPhase = 'complete';
        this.currentState = 'pending_float';
        if (this.vortexPoints) this.vortexPoints.visible = false;
        if (this.shockwaveMesh) this.shockwaveMesh.visible = false;
        targetSlot.liftTarget = 0.0;

        this.camera.position.set(0, 0, 7.2);
        this.targetQuat.identity();
        this.currentQuat.identity();

        if (this.onCeremonyPhaseChange) {
          this.onCeremonyPhaseChange('complete', 1.0);
        }
        if (this.onCeremonyComplete) {
          this.onCeremonyComplete(this.activeStrikeBadge);
        }
        if (this.onStateChange) {
          this.onStateChange('pending_float', this.activeStrikeBadge);
        }
      }
    }

    // Update active scatter spark particles
    this.updateScatterSparks(dt);

    // Update active celebration fireworks particles
    this.updateFireworks(dt);

    // Update expanding shockwave
    this.updateShockwave(now);

    // ───────────────────────────────────────────────────────────────────────
    // Update Slots Breathing Halo & Golden Streaming Hover Glow
    // ───────────────────────────────────────────────────────────────────────
    const flyingPos = (this.currentState === 'flying_to_wall' && this.pendingBadgeMesh)
      ? this.pendingBadgeMesh.position
      : (this.currentState === 'pending_float' && this.pendingBadgeMesh)
      ? this.pendingBadgeMesh.position
      : null;

    this.slots.forEach((slot) => {
      // 1. Mouse hover check
      const isMouseHovered = (this.hoveredSlotIndex === slot.index);

      // 2. Proximity check (when moving badge approaches within 2.5 distance)
      let proximity = 0;
      if (flyingPos) {
        const slotWorldPos = new THREE.Vector3(slot.x, slot.y, slot.z);
        const dist = flyingPos.distanceTo(slotWorldPos);
        if (dist < 2.5) {
          proximity = Math.max(0, 1.0 - dist / 2.5);
        }
      }

      // 3. Target intensity
      const isTargetPending = slot.isPendingClaim || (this.currentState === 'flying_to_wall' && slot.index === this.activeSlotIndex);
      const targetHover = isMouseHovered ? 1.0 : Math.max(proximity, isTargetPending ? 0.85 : slot.isUnlocked ? 0.35 : 0.0);

      // Smooth lerp hover intensity
      slot.hoverIntensity += (targetHover - slot.hoverIntensity) * Math.min(1.0, dt * 7.5);

      // 4. Subtle breathing harmonic modulation
      const breath = Math.sin(now * 0.0038 + slot.index * 0.65) * 0.5 + 0.5;

      // 5. Golden Streaming Edge Glow (微弱金色流光)
      if (slot.goldStreamMesh && slot.goldStreamMesh.material) {
        const streamMat = slot.goldStreamMesh.material as THREE.MeshBasicMaterial;
        // Subtle base aura (0.04 ~ 0.08) that smoothly blooms into rich gold on hover / approach (0.45 ~ 0.75)
        const streamAlpha = (0.04 + slot.hoverIntensity * 0.55) * (0.65 + breath * 0.35);
        streamMat.opacity = streamAlpha;
        
        // Scale breathing pulse on hover
        const scalePulse = 1.0 + slot.hoverIntensity * (0.03 + breath * 0.02);
        slot.goldStreamMesh.scale.setScalar(scalePulse);
      }

      // 6. Halo Mesh Breathing Glow
      if (slot.haloMesh && slot.haloMesh.material) {
        const haloMat = slot.haloMesh.material as THREE.MeshBasicMaterial;
        const haloAlpha = (0.06 + slot.hoverIntensity * 0.45) * (0.7 + breath * 0.3);
        haloMat.opacity = haloAlpha;
        const haloPulse = 1.0 + slot.hoverIntensity * (0.05 + breath * 0.03);
        slot.haloMesh.scale.setScalar(haloPulse);
      }

      // 7. Socket Rim Emissive Highlight
      if (slot.socketRimMesh && slot.socketRimMesh.material) {
        const rimMat = slot.socketRimMesh.material as THREE.MeshStandardMaterial;
        if (rimMat.emissive) {
          rimMat.emissive.setHex(0xffaa22);
          rimMat.emissiveIntensity = slot.hoverIntensity * (0.35 + breath * 0.25);
        }
      }

      // 8. 3D Tactile Lift Spring Physics (点击微浮起与回弹)
      const springForce = (slot.liftTarget - slot.liftOffset) * 36.0;
      const damping = slot.liftVelocity * 7.5;
      slot.liftVelocity += (springForce - damping) * dt;
      slot.liftOffset += slot.liftVelocity * dt;
      slot.slotGroup.position.z = slot.baseZ + slot.liftOffset;
      slot.slotGroup.rotation.x = -slot.liftOffset * 0.45;
    });

    // Fade out trail and radial blur when not actively flying
    if (this.currentState !== 'flying_to_wall') {
      if (this.trailPoints.length > 0) {
        this.trailPoints.pop();
        this.updateTrailMesh();
      }
      if (this.radialBlurPass && this.radialBlurPass.uniforms.uStrength.value > 0) {
        this.radialBlurPass.uniforms.uStrength.value = Math.max(0, this.radialBlurPass.uniforms.uStrength.value - dt * 2.5);
      }
    }

    // Performance FPS metrics calculation
    this.frameCount++;
    if (now - this.lastFpsCalcTime >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;
      if (this.onMetricsUpdate) {
        this.onMetricsUpdate({
          fps,
          frameTimeMs: parseFloat((dt * 1000).toFixed(1)),
          drawCalls: this.renderer.info.render.calls,
          triangles: this.renderer.info.render.triangles,
          isSleeping: false,
          allocationsPerFrame: 0,
        });
      }
    }

    this.composer.render();
  };

  /**
   * Update particle positions around pending badge
   */
  private updateParticles(dt: number, now: number) {
    const pos = this.particlePositions;
    const vel = this.particleVelocities;

    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3] += Math.sin(now * 0.003 + i) * dt * 0.15;
      pos[i * 3 + 2] += Math.cos(now * 0.003 + i) * dt * 0.15;

      // Wrap around if drifted too high
      if (pos[i * 3 + 1] > 2.0) {
        pos[i * 3 + 1] = -1.2;
        const theta = Math.random() * Math.PI * 2;
        pos[i * 3] = Math.cos(theta) * (1.2 + Math.random() * 0.6);
        pos[i * 3 + 2] = Math.sin(theta) * (1.2 + Math.random() * 0.6);
      }
    }

    this.particleGeo.attributes.position.needsUpdate = true;
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.reqId) cancelAnimationFrame(this.reqId);

    if (this.trailMesh) {
      this.trailMesh.geometry.dispose();
      (this.trailMesh.material as THREE.Material).dispose();
    }
    if (this.trailCoreMesh) {
      this.trailCoreMesh.geometry.dispose();
      (this.trailCoreMesh.material as THREE.Material).dispose();
    }
    if (this.scatterPoints) {
      this.scatterPoints.geometry.dispose();
      (this.scatterPoints.material as THREE.Material).dispose();
    }

    this.renderer.dispose();
    this.container.innerHTML = '';
  }
}
