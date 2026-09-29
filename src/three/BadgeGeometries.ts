/**
 * Procedural Apple Watch Badges & Hex Assembly Geometries
 * Crafted with chamfered bezels, multi-layered cloisonné enamel, and engraved backplates.
 */

import * as THREE from 'three';
import { AppleAwardMaterials } from './AppleAwardMaterials';

export interface BadgeCatalogItem {
  id: string;
  name: string;
  category: string;
  earnedDate: string;
  badgeStyle: string;
  primaryColor: number;
  secondaryColor: number;
  bezel: 'gold' | 'silver' | 'titanium';
  description: string;
  longDescription: string;
  stats: string;
}

export interface StrikeBadgeItem extends BadgeCatalogItem {
  strikeDays: number;
  displayNumber: string;
  displayUnit: string;
  iconName: string;
  glowColor: string;
  accentHex: string;
}

export const STRIKE_BADGE_CATALOG: StrikeBadgeItem[] = [
  {
    id: 'strike-3-day',
    strikeDays: 3,
    displayNumber: '3',
    displayUnit: 'DAYS',
    name: '3-Day Strike: 初燃之焰 (Ember Flame)',
    category: 'Streak Milestones',
    earnedDate: 'OCTOBER 29, 2026',
    badgeStyle: 'Tri-Flame Ingot',
    primaryColor: 0xff5500,
    secondaryColor: 0xffd60a,
    bezel: 'gold',
    iconName: 'Flame',
    glowColor: 'rgba(255, 85, 0, 0.65)',
    accentHex: '#ff5500',
    description: '连续 3 天达成运动三环全闭合目标。',
    longDescription: '点燃第一道连击之火！连续3天三环圆满，炽热的金色微芒铭刻出坚毅的开端。',
    stats: '3 连续天数 · 累计消耗 1,840 kcal · 100% 达标率',
  },
  {
    id: 'strike-7-day',
    strikeDays: 7,
    displayNumber: '7',
    displayUnit: 'DAYS',
    name: '7-Day Strike: 耀日之冠 (Solar Corona)',
    category: 'Streak Milestones',
    earnedDate: 'NOVEMBER 04, 2026',
    badgeStyle: '7-Ray Solar Crest',
    primaryColor: 0xffb703,
    secondaryColor: 0x00f0ff,
    bezel: 'gold',
    iconName: 'Crown',
    glowColor: 'rgba(255, 183, 3, 0.75)',
    accentHex: '#ffd60a',
    description: '连续 7 天完美闭合全部三环，铸就整周全勤荣耀。',
    longDescription: '7天整周全满冠冕！无懈可击的自律节奏，24K 缎面金冕折射出璀璨阳光。',
    stats: '7 连续天数 · 累计运动 315 分钟 · 完美整周 (Perfect Week)',
  },
  {
    id: 'strike-14-day',
    strikeDays: 14,
    displayNumber: '14',
    displayUnit: 'DAYS',
    name: '14-Day Strike: 钢铁恒毅 (Titanium Fortitude)',
    category: 'Streak Milestones',
    earnedDate: 'NOVEMBER 18, 2026',
    badgeStyle: 'Fortified Hex Iron',
    primaryColor: 0xaf52de,
    secondaryColor: 0x5e5ce6,
    bezel: 'titanium',
    iconName: 'Shield',
    glowColor: 'rgba(175, 82, 222, 0.7)',
    accentHex: '#af52de',
    description: '连续 14 天不间断运动，铸就钢铁般坚韧身心。',
    longDescription: '两周钢铁连击！双层钛合金凹槽与深紫等离子珐琅，见证习惯固化为本能。',
    stats: '14 连续天数 · 累计站立 168 小时 · 跨越两周大关',
  },
  {
    id: 'strike-30-day',
    strikeDays: 30,
    displayNumber: '30',
    displayUnit: 'DAYS',
    name: '30-Day Strike: 赤焰神话 (Crimson Dragon)',
    category: 'Streak Milestones',
    earnedDate: 'DECEMBER 04, 2026',
    badgeStyle: 'Radiant Dragon Star',
    primaryColor: 0xff2d55,
    secondaryColor: 0xff9500,
    bezel: 'gold',
    iconName: 'Zap',
    glowColor: 'rgba(255, 45, 85, 0.75)',
    accentHex: '#ff2d55',
    description: '连续 30 天保持每日三环全满，步入月度传奇殿堂。',
    longDescription: '30天整月传奇神话！红宝石珐琅与龙焰浮雕，只有最狂热的自律者方能摘得。',
    stats: '30 连续天数 · 累计消耗 18,600 kcal · 月度传奇宗师',
  },
  {
    id: 'strike-40-day',
    strikeDays: 40,
    displayNumber: '40',
    displayUnit: 'DAYS',
    name: '40-Day Strike: 炽光破晓 (Radiant Dawn)',
    category: 'Streak Milestones',
    earnedDate: 'DECEMBER 14, 2026',
    badgeStyle: 'Radiant Dawn Prism',
    primaryColor: 0xff9f0a,
    secondaryColor: 0xffd60a,
    bezel: 'gold',
    iconName: 'Sparkles',
    glowColor: 'rgba(255, 159, 10, 0.75)',
    accentHex: '#ff9f0a',
    description: '连续 40 天晨曦破晓，晨光微熹中铸造身心不灭意志。',
    longDescription: '40天破晓金辉！暖金珐琅搭配光芒棱柱浮雕，黎明破晓见证坚不可摧的自律习惯。',
    stats: '40 连续天数 · 跨越 5 周 · 破晓金辉认证',
  },
  {
    id: 'strike-50-day',
    strikeDays: 50,
    displayNumber: '50',
    displayUnit: 'DAYS',
    name: '50-Day Strike: 黄金半百 (Golden Fifty)',
    category: 'Streak Milestones',
    earnedDate: 'DECEMBER 24, 2026',
    badgeStyle: 'Faceted 50 Gold Prism',
    primaryColor: 0xe5a93b,
    secondaryColor: 0xffffff,
    bezel: 'gold',
    iconName: 'Crown',
    glowColor: 'rgba(229, 169, 59, 0.8)',
    accentHex: '#e5a93b',
    description: '连续 50 天达标！跨越半百关隘，坚固的金色丰碑。',
    longDescription: '50天半百神迹！多棱角反射黄金外环与白金十字光芒，意志力坚不可摧。',
    stats: '50 连续天数 · 跨越 7 周 · 黄金荣耀认证',
  },
  {
    id: 'strike-60-day',
    strikeDays: 60,
    displayNumber: '60',
    displayUnit: 'DAYS',
    name: '60-Day Strike: 双月凌空 (Twin Moon)',
    category: 'Streak Milestones',
    earnedDate: 'JANUARY 03, 2027',
    badgeStyle: 'Dual Crescent Apex',
    primaryColor: 0x30d158,
    secondaryColor: 0x00f0ff,
    bezel: 'silver',
    iconName: 'Shield',
    glowColor: 'rgba(48, 209, 88, 0.8)',
    accentHex: '#30d158',
    description: '连续 60 天双月坚守！两整月无一缺席的自律奇迹。',
    longDescription: '60天双月双环！翡翠微晶珐琅与双月凌空徽记，见证习惯蜕变为生命本能。',
    stats: '60 连续天数 · 整整两月每日全满 · 极高阶成就',
  },
  {
    id: 'strike-80-day',
    strikeDays: 80,
    displayNumber: '80',
    displayUnit: 'DAYS',
    name: '80-Day Strike: 极光领航 (Aurora Horizon)',
    category: 'Streak Milestones',
    earnedDate: 'JANUARY 23, 2027',
    badgeStyle: 'Borealis Ribbon Shield',
    primaryColor: 0x5e5ce6,
    secondaryColor: 0x30d158,
    bezel: 'titanium',
    iconName: 'Shield',
    glowColor: 'rgba(94, 92, 230, 0.75)',
    accentHex: '#5e5ce6',
    description: '连续 80 天运动！如同黑夜中恒久不灭的北极光。',
    longDescription: '80天极光领航者！渐变紫绿极光薄膜干涉材质，点亮运动生涯的长夜之光。',
    stats: '80 连续天数 · 近 3 个月无间断 · 极光远征家',
  },
  {
    id: 'strike-90-day',
    strikeDays: 90,
    displayNumber: '90',
    displayUnit: 'DAYS',
    name: '90-Day Strike: 季度宗师 (Quarter Titan)',
    category: 'Streak Milestones',
    earnedDate: 'FEBRUARY 02, 2027',
    badgeStyle: 'Quarter Titan Trinity',
    primaryColor: 0xbf5af2,
    secondaryColor: 0xff375f,
    bezel: 'gold',
    iconName: 'Zap',
    glowColor: 'rgba(191, 90, 242, 0.85)',
    accentHex: '#bf5af2',
    description: '连续 90 天坚守！一整季度无缺席，铸造真正的自律传奇。',
    longDescription: '90天季度宗师！三阶光芒环绕与帝王紫宝石珐琅，铸就无可争议的季度传奇。',
    stats: '90 连续天数 · 整季每日全满 · 季度宗师名人堂',
  },
  {
    id: 'strike-100-day',
    strikeDays: 100,
    displayNumber: '100',
    displayUnit: 'DAYS',
    name: '100-Day Strike: 百日破壁 (Centennial Quantum)',
    category: 'Streak Milestones',
    earnedDate: 'FEBRUARY 12, 2027',
    badgeStyle: 'Hyper-Prism Centennial',
    primaryColor: 0x00f0ff,
    secondaryColor: 0xffffff,
    bezel: 'silver',
    iconName: 'Sparkles',
    glowColor: 'rgba(0, 240, 255, 0.8)',
    accentHex: '#00f0ff',
    description: '连续百日突破极限，点亮无与伦比的百日宗师光环。',
    longDescription: '百日破壁量子丰碑！钻石切面铂金外圈与青核光子聚能，人类自律之巅峰。',
    stats: '100 连续天数 · 跨越 3 个月 · 百日宗师勋爵',
  },
];

export const BADGE_CATALOG: BadgeCatalogItem[] = [
  {
    id: 'challenge-hex-perfect-week',
    name: 'Perfect Week: Quantum Focus',
    category: 'Weekly Milestones',
    earnedDate: 'OCTOBER 28, 2026',
    badgeStyle: 'Convex Hexagonal Prism',
    primaryColor: 0x00f0ff,
    secondaryColor: 0xffd60a,
    bezel: 'gold',
    description: 'Closed all focus rings every day of the week with zero lapses.',
    longDescription: 'Awarded for seven continuous days of immaculate study retention. The hex chamfers reflect 24K specular gold under motion.',
    stats: '7 Consecutive Days · 42 Total Hours · 98.4% Retention',
  },
  {
    id: 'octopus-polymath',
    name: 'Octopus Polymath Distinction',
    category: 'Mastery Quests',
    earnedDate: 'NOVEMBER 12, 2026',
    badgeStyle: '8-Lobe Radial Star Basin',
    primaryColor: 0xff2d55,
    secondaryColor: 0x00f0ff,
    bezel: 'gold',
    description: 'Simultaneously mastered 8 non-overlapping knowledge disciplines.',
    longDescription: 'Embodying the agile, eight-armed intellect of the cephalopod. Terraced cloisonné enamel with golden radial spines.',
    stats: '8 Knowledge Tracks · 1,200 Retained Concepts · 100% Score',
  },
  {
    id: 'night-owl-scholar',
    name: 'Night Owl Nocturnal Scholar',
    category: 'Deep Focus Sprint',
    earnedDate: 'DECEMBER 03, 2026',
    badgeStyle: 'Scalloped Parabolic Wing Dish',
    primaryColor: 0x5e5ce6,
    secondaryColor: 0xffd60a,
    bezel: 'titanium',
    description: 'Logged 50 midnight deep immersion study sessions after 10 PM.',
    longDescription: 'Embodying Athena’s legendary owl of nocturnal wisdom. Midnight violet enamel with luminous amber ocular inlays.',
    stats: '50 Midnight Sessions · 84.5 Hours · Average 11:42 PM',
  },
  {
    id: 'challenge-da-vinci',
    name: 'Da Vinci Polymath Challenge',
    category: 'Limited Edition Challenges',
    earnedDate: 'APRIL 15, 2026',
    badgeStyle: 'Faceted Radial Citadel Pentagon',
    primaryColor: 0xff9f0a,
    secondaryColor: 0xaf52de,
    bezel: 'gold',
    description: 'Closed study goals across Science, Art, and Code in a single day.',
    longDescription: 'True Renaissance intellect: active learning spanning art history, structural mechanics, and programming.',
    stats: '3 Distinct Domains · Single 24-Hour Cycle · 600 Flashcards',
  },
  {
    id: 'challenge-turing-sprint',
    name: 'Turing Cryptographic Marathon',
    category: 'Computational Science',
    earnedDate: 'JUNE 23, 2026',
    badgeStyle: '10-Spoke Sunburst Wheel',
    primaryColor: 0x0a84ff,
    secondaryColor: 0x30d158,
    bezel: 'silver',
    description: 'Solved and retained 50 cryptographic proofs & automata.',
    longDescription: 'Honoring Alan Turing: complete mastery of finite state automata, cipher theory, and computability limits.',
    stats: '50 Proofs Verified · Zero Errors · O(1) Cognitive Recall',
  }
];

// Helper: Surface curvature for mystery hex dish
function getMysteryHexSurfaceZ(x: number, y: number, isBack = false, thickness = 0.09): number {
  const rSq = x * x + y * y;
  const dish = -0.04 * (1 - Math.exp(-rSq * 0.8));
  return (isBack ? -1 : 1) * (thickness * 0.5 + dish);
}

/**
 * 1. Build Mystery Hex Base (Mode 1 in Hex Assembly)
 */
export function buildAppleMysteryHexBase(mats: AppleAwardMaterials, options: { rHex?: number; thickness?: number } = {}): THREE.Group {
  const group = new THREE.Group();
  group.name = 'mystery-hex-base';

  const rHex = options.rHex || 1.48;
  const thickness = options.thickness || 0.12;

  // Hexagon vertices
  const pts: [number, number][] = [];
  const numSteps = 72;
  for (let i = 0; i < 6; i++) {
    const a1 = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const a2 = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6;
    const x1 = Math.cos(a1) * rHex;
    const y1 = Math.sin(a1) * rHex;
    const x2 = Math.cos(a2) * rHex;
    const y2 = Math.sin(a2) * rHex;
    for (let s = 0; s < numSteps / 6; s++) {
      const t = s / (numSteps / 6);
      pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
  }

  // 1. Mirror Chamfered Perimeter Rim (Platinum / Chrome)
  const rimGeo = new THREE.BufferGeometry();
  const rimPos: number[] = [];
  const rimIdx: number[] = [];
  const len = pts.length;

  for (let i = 0; i < len; i++) {
    const [x, y] = pts[i];
    const zF = getMysteryHexSurfaceZ(x, y, false, thickness);
    const zB = getMysteryHexSurfaceZ(x, y, true, thickness);
    rimPos.push(x, y, zF);
    rimPos.push(x, y, zB);
  }

  for (let i = 0; i < len; i++) {
    const next = (i + 1) % len;
    const f1 = i * 2, b1 = i * 2 + 1;
    const f2 = next * 2, b2 = next * 2 + 1;
    rimIdx.push(f1, f2, b2);
    rimIdx.push(f1, b2, b1);
  }

  rimGeo.setAttribute('position', new THREE.Float32BufferAttribute(rimPos, 3));
  rimGeo.setIndex(rimIdx);
  rimGeo.computeVertexNormals();

  const rimMesh = new THREE.Mesh(rimGeo, mats.brushedPlatinum);
  group.add(rimMesh);

  // 2. Front Dish Surface (Mystery Dark Metallic Hex Face)
  const faceGeo = new THREE.BufferGeometry();
  const facePos: number[] = [0, 0, getMysteryHexSurfaceZ(0, 0, false, thickness)];
  const faceIdx: number[] = [];

  for (let i = 0; i < len; i++) {
    const [x, y] = pts[i];
    facePos.push(x, y, getMysteryHexSurfaceZ(x, y, false, thickness));
  }

  for (let i = 0; i < len; i++) {
    const next = (i + 1) % len;
    faceIdx.push(0, i + 1, next + 1);
  }

  faceGeo.setAttribute('position', new THREE.Float32BufferAttribute(facePos, 3));
  faceGeo.setIndex(faceIdx);
  faceGeo.computeVertexNormals();

  const faceMesh = new THREE.Mesh(faceGeo, mats.mysteryShell);
  group.add(faceMesh);

  // 3. Central Locked Energy Core Ring
  const coreRingGeo = new THREE.RingGeometry(0.38, 0.44, 48);
  const coreRingMesh = new THREE.Mesh(coreRingGeo, mats.lockEnergyCyan);
  coreRingMesh.position.z = thickness * 0.5 + 0.002;
  group.add(coreRingMesh);

  // 4. Central Locked Insignia (Mysterious Hex Lock Node)
  const lockNodeGeo = new THREE.CircleGeometry(0.28, 6);
  const lockNodeMesh = new THREE.Mesh(lockNodeGeo, mats.darkTitanium);
  lockNodeMesh.position.z = thickness * 0.5 + 0.004;
  group.add(lockNodeMesh);

  // Small glowing center pin
  const pinGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const pinMesh = new THREE.Mesh(pinGeo, mats.lockEnergyCyan);
  pinMesh.position.z = thickness * 0.5 + 0.04;
  group.add(pinMesh);

  // Radial Laser Engraved Grooves (6 spokes pointing outward)
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const spokeGeo = new THREE.PlaneGeometry(0.04, 0.7);
    const spokeMesh = new THREE.Mesh(spokeGeo, mats.mysteryEngraving);
    spokeMesh.position.set(Math.cos(ang) * 0.85, Math.sin(ang) * 0.85, thickness * 0.5 + 0.001);
    spokeMesh.rotation.z = ang - Math.PI / 2;
    group.add(spokeMesh);
  }

  return group;
}

export interface AssemblyBracketMesh extends THREE.Group {
  userData: {
    index: number;
    angle: number;
    dirX: number;
    dirY: number;
    dockRadius: number;
    spreadRadius: number;
  };
}

export interface OuterMechanicalAssemblyGroup extends THREE.Group {
  brackets: AssemblyBracketMesh[];
  setAssemblyProgress: (progress: number) => void;
}

/**
 * 2. Build Outer Mechanical Assembly (6 Clamps with Alignment Teeth)
 */
export function buildOuterMechanicalAssembly(mats: AppleAwardMaterials, options: { initialProgress?: number } = {}): OuterMechanicalAssemblyGroup {
  const group = new THREE.Group() as OuterMechanicalAssemblyGroup;
  group.name = 'outer-mechanical-assembly';

  const brackets: AssemblyBracketMesh[] = [];
  const dockR = 1.48; // Hex outer radius
  const spreadR = 2.45; // Exploded start radius

  for (let i = 0; i < 6; i++) {
    const bracket = new THREE.Group() as AssemblyBracketMesh;
    bracket.name = `bracket-${i}`;

    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    bracket.userData = {
      index: i,
      angle,
      dirX,
      dirY,
      dockRadius: dockR,
      spreadRadius: spreadR,
    };

    // Bracket Main Arm (Curved Chamfered Clamp)
    const armShape = new THREE.Shape();
    armShape.moveTo(-0.48, -0.06);
    armShape.lineTo(0.48, -0.06);
    armShape.lineTo(0.44, 0.12);
    armShape.lineTo(-0.44, 0.12);
    armShape.closePath();

    const extrudeSettings = {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };

    const armGeo = new THREE.ExtrudeGeometry(armShape, extrudeSettings);
    armGeo.center();
    const armMesh = new THREE.Mesh(armGeo, mats.bracketMetal);
    bracket.add(armMesh);

    // Beveled Polished Edge Trim
    const edgeTrimGeo = new THREE.BoxGeometry(0.96, 0.03, 0.15);
    const edgeTrimMesh = new THREE.Mesh(edgeTrimGeo, mats.bracketEdge);
    edgeTrimMesh.position.y = -0.06;
    bracket.add(edgeTrimMesh);

    // Luminous Alignment Cyan Dot / Notch
    const notchGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 16);
    notchGeo.rotateX(Math.PI / 2);
    const notchMesh = new THREE.Mesh(notchGeo, mats.bracketAccent);
    notchMesh.position.set(0, 0.04, 0);
    bracket.add(notchMesh);

    // Orientation: bracket faces toward hex edge
    bracket.rotation.z = angle - Math.PI / 2;

    brackets.push(bracket);
    group.add(bracket);
  }

  group.brackets = brackets;

  // Assembly Progress method (0.0 = spread out, 1.0 = docked)
  group.setAssemblyProgress = function (progress: number) {
    const clamped = Math.max(0, Math.min(1, progress));
    brackets.forEach((b) => {
      const currentR = b.userData.spreadRadius + (b.userData.dockRadius - b.userData.spreadRadius) * clamped;
      b.position.x = b.userData.dirX * currentR;
      b.position.y = b.userData.dirY * currentR;
      b.position.z = (1 - clamped) * 0.4;
      b.scale.setScalar(0.7 + 0.3 * clamped);
    });
  };

  group.setAssemblyProgress(options.initialProgress !== undefined ? options.initialProgress : 1.0);
  return group;
}

/**
 * Procedural 3D Golden Flame Medallion Shape (Exact replica from reference image)
 * Features rounded circular base lofting into 3 sculpted flame peaks
 */
export function createStrikeFlameShape(scale = 1.0): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0 * scale, -1.08 * scale);
  // Bottom circular arc
  s.bezierCurveTo(0.68 * scale, -1.08 * scale, 1.15 * scale, -0.68 * scale, 1.15 * scale, 0.0 * scale);
  // Right flame tip
  s.bezierCurveTo(1.15 * scale, 0.42 * scale, 1.25 * scale, 0.72 * scale, 1.10 * scale, 0.98 * scale);
  s.bezierCurveTo(0.96 * scale, 0.88 * scale, 0.82 * scale, 0.75 * scale, 0.65 * scale, 0.78 * scale);
  // Central tallest soaring peak
  s.bezierCurveTo(0.52 * scale, 0.85 * scale, 0.40 * scale, 1.15 * scale, 0.26 * scale, 1.45 * scale);
  s.bezierCurveTo(0.18 * scale, 1.62 * scale, 0.08 * scale, 1.70 * scale, -0.02 * scale, 1.72 * scale);
  // Left curve of central flame
  s.bezierCurveTo(-0.16 * scale, 1.55 * scale, -0.28 * scale, 1.25 * scale, -0.42 * scale, 1.10 * scale);
  // Left flame cusp
  s.bezierCurveTo(-0.55 * scale, 1.05 * scale, -0.72 * scale, 1.22 * scale, -0.85 * scale, 1.28 * scale);
  s.bezierCurveTo(-0.95 * scale, 1.12 * scale, -1.12 * scale, 0.78 * scale, -1.15 * scale, 0.42 * scale);
  // Left circular arc into bottom
  s.bezierCurveTo(-1.18 * scale, -0.05 * scale, -0.92 * scale, -0.68 * scale, -0.55 * scale, -0.98 * scale);
  s.bezierCurveTo(-0.35 * scale, -1.08 * scale, -0.15 * scale, -1.08 * scale, 0 * scale, -1.08 * scale);
  s.closePath();
  return s;
}

/**
 * Curved Specular Highlight Facet (Upper-left glossy facet as seen in reference image)
 */
export function createStrikeFlameHighlightShape(scale = 1.0): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.08 * scale, 0.20 * scale);
  s.bezierCurveTo(-0.20 * scale, 0.50 * scale, -0.32 * scale, 0.90 * scale, -0.40 * scale, 1.15 * scale);
  s.bezierCurveTo(-0.55 * scale, 1.05 * scale, -0.72 * scale, 1.22 * scale, -0.78 * scale, 1.26 * scale);
  s.bezierCurveTo(-0.88 * scale, 1.10 * scale, -1.02 * scale, 0.72 * scale, -1.02 * scale, 0.40 * scale);
  s.bezierCurveTo(-1.02 * scale, 0.05 * scale, -0.80 * scale, -0.38 * scale, -0.50 * scale, -0.68 * scale);
  s.bezierCurveTo(-0.30 * scale, -0.38 * scale, -0.15 * scale, -0.08 * scale, -0.08 * scale, 0.20 * scale);
  s.closePath();
  return s;
}

/**
 * High-DPI Canvas Texture for 3D Flame Medallion Typography (Number & WEEKS/DAYS)
 */
export function createStrikeFlameTextTexture(
  badgeData: StrikeBadgeItem | BadgeCatalogItem,
  isShadow = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  const strikeItem = badgeData as Partial<StrikeBadgeItem>;
  const displayText = strikeItem.displayNumber || (strikeItem.strikeDays ? String(strikeItem.strikeDays) : '1');
  const displayUnit = strikeItem.displayUnit || (strikeItem.strikeDays && strikeItem.strikeDays >= 7 ? 'WEEKS' : 'DAYS');

  // 1. Draw Inner Medallion Circular Coin Cavity
  const cx = 256;
  const cy = 295;
  const r = 160;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  if (isShadow) {
    const shadowWellGrad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    shadowWellGrad.addColorStop(0, '#0a0d14');
    shadowWellGrad.addColorStop(1, '#161d28');
    ctx.fillStyle = shadowWellGrad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#273244';
    ctx.setLineDash([8, 6]);
    ctx.stroke();
  } else {
    const goldWellGrad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    goldWellGrad.addColorStop(0, '#ffea75');
    goldWellGrad.addColorStop(0.35, '#fbc02d');
    goldWellGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = goldWellGrad;
    ctx.fill();

    // Inner Coin Edge Groove
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#d97706';
    ctx.stroke();

    // Top Specular Highlight Arc
    ctx.beginPath();
    ctx.arc(cx, cy, r - 3, Math.PI * 1.05, Math.PI * 1.95);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 3.5;
    ctx.stroke();
  }
  ctx.restore();

  // 2. Draw Number
  const numColor = isShadow ? '#3b485d' : '#381c02';
  const unitColor = isShadow ? '#242f40' : '#452608';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const numLen = displayText.length;
  const numFontSize = numLen >= 3 ? 128 : numLen === 2 ? 152 : 180;
  ctx.font = `900 ${numFontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Rounded", "Arial Rounded MT Bold", sans-serif`;

  if (!isShadow) {
    ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = numColor;
  ctx.fillText(displayText, cx, cy - 20);

  // 3. Draw Unit Subtitle (WEEKS / DAYS)
  ctx.shadowColor = 'transparent';
  ctx.font = `800 40px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Arial Rounded MT Bold", sans-serif`;
  ctx.letterSpacing = '3px';
  ctx.fillStyle = unitColor;
  ctx.fillText(displayUnit, cx, cy + 72);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * 3.5. Build Authentic 3D Strike Flame Medallion (Direct replica of reference screenshot)
 */
export function buildAppleStrikeFlameMedallion3D(
  mats: AppleAwardMaterials,
  badgeData: StrikeBadgeItem | BadgeCatalogItem,
  options?: { isShadowSlot?: boolean }
): THREE.Group {
  const root = new THREE.Group();
  root.name = `strike-flame-${badgeData.id}${options?.isShadowSlot ? '-shadow' : ''}`;
  const isShadow = !!options?.isShadowSlot;

  // Materials selection (Gentle Apple Olympic satin-gold with soft specular reflection)
  const bodyMaterial = isShadow
    ? mats.shadowEnamel
    : new THREE.MeshStandardMaterial({
        color: 0xf5a50b,
        roughness: 0.32,
        metalness: 0.82,
        envMap: mats.envMap,
        envMapIntensity: 0.85,
      });

  const rimMaterial = isShadow ? mats.shadowBezel : mats.goldBezel;
  const highlightMaterial = isShadow
    ? mats.shadowRelief
    : new THREE.MeshStandardMaterial({
        color: 0xffe680,
        roughness: 0.38,
        metalness: 0.75,
        transparent: true,
        opacity: 0.38,
        envMap: mats.envMap,
        envMapIntensity: 0.75,
      });

  // 1. Extrude Main Flame Body with Bevel Rim
  const flameShape = createStrikeFlameShape(1.0);
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 1,
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelOffset: 0,
    bevelSegments: 4,
  };
  const bodyGeo = new THREE.ExtrudeGeometry(flameShape, extrudeSettings);
  bodyGeo.center();
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMaterial);
  bodyMesh.position.z = 0;
  root.add(bodyMesh);

  // 2. Beveled Golden Outer Contour Rim
  const rimShape = createStrikeFlameShape(1.03);
  const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
    steps: 1,
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
  });
  rimGeo.center();
  const rimMesh = new THREE.Mesh(rimGeo, rimMaterial);
  rimMesh.position.z = -0.05;
  root.add(rimMesh);

  // 3. Curved Specular Highlight Facet (Upper-left glossy facet as seen in image)
  const highlightShape = createStrikeFlameHighlightShape(0.96);
  const highlightGeo = new THREE.ShapeGeometry(highlightShape);
  const highlightMesh = new THREE.Mesh(highlightGeo, highlightMaterial);
  highlightMesh.position.set(0, 0, 0.165);
  root.add(highlightMesh);

  // 4. Center Typography Planar Plate (Crisp High-DPI canvas texture for milestone number and label)
  const textTexture = createStrikeFlameTextTexture(badgeData, isShadow);
  const textGeo = new THREE.PlaneGeometry(1.68, 1.68);
  const textMat = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true,
    depthWrite: false,
  });
  const textMesh = new THREE.Mesh(textGeo, textMat);
  textMesh.position.set(0, -0.16, 0.17);
  root.add(textMesh);

  // 5. Backplate for 180° flip inspection
  const backGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.04, 36);
  backGeo.rotateX(Math.PI / 2);
  const backMesh = new THREE.Mesh(backGeo, isShadow ? mats.shadowEnamel : mats.backEngravedMetal);
  backMesh.position.set(0, -0.25, -0.14);
  root.add(backMesh);

  return root;
}

/**
 * 3. Build Full 3D Apple Watch Badge (Real Badge Materialization & Detail Inspector)
 * Includes dual-sided detail: front cloisonné jewel + engraved backplate.
 */
export function buildAppleBadge3D(
  mats: AppleAwardMaterials,
  badgeData: BadgeCatalogItem,
  options?: { isShadowSlot?: boolean }
): THREE.Group {
  // If it's a strike milestone badge, route to authentic 3D Flame Medallion replica!
  if (badgeData.id.startsWith('strike-') || badgeData.category === 'Streak Milestones') {
    return buildAppleStrikeFlameMedallion3D(mats, badgeData, options);
  }

  const root = new THREE.Group();
  root.name = `badge-${badgeData.id}`;

  const primaryEnamel = options?.isShadowSlot
    ? mats.shadowEnamel
    : mats.createEnamel(badgeData.primaryColor, 0.12);
  const secondaryEnamel = options?.isShadowSlot
    ? mats.shadowRelief
    : mats.createEnamel(badgeData.secondaryColor, 0.08);
  const bezelMat = options?.isShadowSlot
    ? mats.shadowBezel
    : (badgeData.bezel === 'gold' ? mats.goldBezel : badgeData.bezel === 'silver' ? mats.silverBezel : mats.darkTitanium);

  const r = 1.38;
  const depth = 0.22;

  // 1. FRONT BEZEL RING (Chamfered Mirror Bezel)
  const bezelGeo = new THREE.TorusGeometry(r, 0.13, 24, 64);
  const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
  bezelMesh.position.z = 0;
  root.add(bezelMesh);

  // 2. MAIN FRONT ENAMEL DISH
  const dishGeo = new THREE.CylinderGeometry(r - 0.02, r - 0.06, depth, 48);
  dishGeo.rotateX(Math.PI / 2);
  const dishMesh = new THREE.Mesh(dishGeo, primaryEnamel);
  dishMesh.position.z = -0.01;
  root.add(dishMesh);

  // 3. INNER CLOISONNÉ PATTERN (Geometric Relief Star/Hex/Emblem)
  if (badgeData.id.includes('hex') || badgeData.id.includes('week')) {
    // Hexagonal Concentric Rings (Pure 24K Gold Relief - strictly NO ghosting / shadow ring)
    for (let i = 0; i < 3; i++) {
      const hexRingGeo = new THREE.RingGeometry(0.35 + i * 0.28, 0.42 + i * 0.28, 6);
      const hexRingMesh = new THREE.Mesh(hexRingGeo, bezelMat);
      hexRingMesh.position.z = depth * 0.5 + 0.005;
      root.add(hexRingMesh);
    }
  } else if (badgeData.id.includes('polymath') || badgeData.id.includes('octopus')) {
    // 8-Lobe Radial Star
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rayGeo = new THREE.BoxGeometry(0.08, 0.9, 0.04);
      const rayMesh = new THREE.Mesh(rayGeo, secondaryEnamel);
      rayMesh.position.set(Math.cos(a) * 0.5, Math.sin(a) * 0.5, depth * 0.5 + 0.005);
      rayMesh.rotation.z = a;
      root.add(rayMesh);
    }
  } else if (badgeData.id.includes('owl')) {
    // Owl nocturnal eyes & crescent
    const leftEye = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 32), secondaryEnamel);
    leftEye.rotateX(Math.PI / 2);
    leftEye.position.set(-0.38, 0.15, depth * 0.5 + 0.01);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.38;
    root.add(leftEye);
    root.add(rightEye);

    // Golden pupil pins
    const pupilLeft = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), mats.goldBezel);
    pupilLeft.position.set(-0.38, 0.15, depth * 0.5 + 0.035);
    const pupilRight = pupilLeft.clone();
    pupilRight.position.x = 0.38;
    root.add(pupilLeft);
    root.add(pupilRight);
  } else if (badgeData.id.includes('strike-3') || badgeData.id.includes('3-day')) {
    // 3 Sculpted Flame Wings Relief & Glowing Core
    for (let f = 0; f < 3; f++) {
      const fAng = (f / 3) * Math.PI * 2 - Math.PI / 2;
      const flameShape = new THREE.Shape();
      flameShape.moveTo(0, 0);
      flameShape.quadraticCurveTo(0.24, 0.42, 0.06, 0.72);
      flameShape.quadraticCurveTo(0, 0.58, -0.06, 0.72);
      flameShape.quadraticCurveTo(-0.24, 0.42, 0, 0);
      flameShape.closePath();
      const flameGeo = new THREE.ShapeGeometry(flameShape);
      const flameMesh = new THREE.Mesh(flameGeo, bezelMat);
      flameMesh.position.set(Math.cos(fAng) * 0.44, Math.sin(fAng) * 0.44, depth * 0.5 + 0.008);
      flameMesh.rotation.z = fAng - Math.PI / 2;
      root.add(flameMesh);
    }
    const centerRing = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.30, 24), bezelMat);
    centerRing.position.z = depth * 0.5 + 0.012;
    root.add(centerRing);
    const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 20), secondaryEnamel);
    coreMesh.position.z = depth * 0.5 + 0.024;
    root.add(coreMesh);
  } else if (badgeData.id.includes('strike-7') || badgeData.id.includes('7-day')) {
    // 7-Point Solar Corona Crown & Radial Gold Rays
    for (let rIdx = 0; rIdx < 7; rIdx++) {
      const rAng = (rIdx / 7) * Math.PI * 2 - Math.PI / 2;
      const rayGeo = new THREE.BoxGeometry(0.065, 0.85, 0.035);
      const rayMesh = new THREE.Mesh(rayGeo, bezelMat);
      rayMesh.position.set(Math.cos(rAng) * 0.46, Math.sin(rAng) * 0.46, depth * 0.5 + 0.006);
      rayMesh.rotation.z = rAng;
      root.add(rayMesh);
    }
    const sunRing = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.34, 28), bezelMat);
    sunRing.position.z = depth * 0.5 + 0.01;
    root.add(sunRing);
    const sunCore = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), secondaryEnamel);
    sunCore.position.z = depth * 0.5 + 0.025;
    root.add(sunCore);
  } else if (badgeData.id.includes('strike-14') || badgeData.id.includes('14-day')) {
    // Fortified Titanium Interlocking Hexes
    for (let h = 0; h < 2; h++) {
      const hexMesh = new THREE.Mesh(new THREE.RingGeometry(0.36 + h * 0.32, 0.44 + h * 0.32, 6), bezelMat);
      hexMesh.position.z = depth * 0.5 + 0.008;
      hexMesh.rotation.z = (h * Math.PI) / 6;
      root.add(hexMesh);
    }
    const centerShield = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 6), secondaryEnamel);
    centerShield.rotateX(Math.PI / 2);
    centerShield.position.z = depth * 0.5 + 0.018;
    root.add(centerShield);
  } else if (badgeData.id.includes('strike-30') || badgeData.id.includes('30-day')) {
    // 12-Ray Radiant Dragon Sunburst with Ruby Core
    for (let rIdx = 0; rIdx < 12; rIdx++) {
      const rAng = (rIdx / 12) * Math.PI * 2;
      const spikeGeo = new THREE.BoxGeometry(0.05, 0.82, 0.03);
      const spikeMesh = new THREE.Mesh(spikeGeo, bezelMat);
      spikeMesh.position.set(Math.cos(rAng) * 0.45, Math.sin(rAng) * 0.45, depth * 0.5 + 0.006);
      spikeMesh.rotation.z = rAng;
      root.add(spikeMesh);
    }
    const dragonCore = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), secondaryEnamel);
    dragonCore.position.z = depth * 0.5 + 0.025;
    root.add(dragonCore);
  } else if (badgeData.id.includes('strike-100') || badgeData.id.includes('100-day')) {
    // Quantum Concentric Light Rings
    for (let q = 0; q < 4; q++) {
      const ringGeo = new THREE.RingGeometry(0.22 + q * 0.20, 0.26 + q * 0.20, 36);
      const ringMesh = new THREE.Mesh(ringGeo, bezelMat);
      ringMesh.position.z = depth * 0.5 + 0.006;
      root.add(ringMesh);
    }
    const photonPin = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), mats.lockEnergyCyan);
    photonPin.position.z = depth * 0.5 + 0.03;
    root.add(photonPin);
  } else {
    // Golden central star emblem
    const starShape = new THREE.Shape();
    const spikes = 5, outerR = 0.65, innerR = 0.32;
    for (let i = 0; i < spikes * 2; i++) {
      const rad = (i / (spikes * 2)) * Math.PI * 2;
      const dist = i % 2 === 0 ? outerR : innerR;
      const x = Math.cos(rad) * dist;
      const y = Math.sin(rad) * dist;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const starGeo = new THREE.ShapeGeometry(starShape);
    const starMesh = new THREE.Mesh(starGeo, bezelMat);
    starMesh.position.z = depth * 0.5 + 0.006;
    root.add(starMesh);
  }

  // 4. AUTHENTIC BACKPLATE (FOR 180° FLIP INSPECTION)
  // Brushed dark metal back disc with laurel branch engraving simulation and cert serial
  const backPlateGeo = new THREE.CylinderGeometry(r - 0.04, r - 0.04, 0.03, 48);
  backPlateGeo.rotateX(Math.PI / 2);
  const backPlate = new THREE.Mesh(backPlateGeo, mats.backEngravedMetal);
  backPlate.position.z = -depth * 0.5 - 0.015;
  root.add(backPlate);

  // Concentric engraved rings on back
  const backRing1 = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.52, 48), mats.bracketEdge);
  backRing1.position.z = -depth * 0.5 - 0.032;
  backRing1.rotation.y = Math.PI; // Face towards back
  root.add(backRing1);

  const backRing2 = new THREE.Mesh(new THREE.RingGeometry(0.85, 0.87, 48), mats.bracketEdge);
  backRing2.position.z = -depth * 0.5 - 0.032;
  backRing2.rotation.y = Math.PI;
  root.add(backRing2);

  // Center serial medal stamp on back
  const backStampGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.02, 32);
  backStampGeo.rotateX(Math.PI / 2);
  const backStamp = new THREE.Mesh(backStampGeo, bezelMat);
  backStamp.position.z = -depth * 0.5 - 0.034;
  backStamp.rotation.y = Math.PI;
  root.add(backStamp);

  return root;
}

/**
 * Build 3D Gray Shadow Slot (灰色阴影卡槽) for any badge
 * Uses deep matte smoked charcoal and dark titanium materials for authentic unearned / slot socket representation.
 */
export function buildAppleBadge3DShadow(
  mats: AppleAwardMaterials,
  badgeData: BadgeCatalogItem
): THREE.Group {
  return buildAppleBadge3D(mats, badgeData, { isShadowSlot: true });
}

/**
 * 4. Build 24K Gold Hexagonal Mechanical Pending Badge (待领取机械金勋章)
 * Faithfully designed according to the exact Hexagonal Mechanical Assembly badge architecture:
 * - 6-sided filleted hexagon matching the 6-arm mechanical brackets
 * - 24K Olympic mirror gold finish with razor-sharp specular chamfers
 * - 6 outer edge mechanical docking slots & alignment notches where brackets clamp
 * - 6 radial laser-engraved cyber-energy channels radiating from the center core
 * - Central mechanical locking core:
 *    - 24K gold notched lock ring
 *    - Concentric cyber energy conduit ring (cyan-gold pulse)
 *    - Raised 6-sided faceted titanium & gold medallion
 *    - Center luminous energy gemstone / power pin
 *    - 6 corner precision micro-rivets
 * - 6 outer vertex corner armor reinforcement caps
 * - Liquid sapphire crystal protective dome with physical refraction and specular sheen
 * - Heavy 3D brushed gold side-walls and engraved certification backplate
 */
export function buildAppleHexMechanicalPendingBadge(
  mats: AppleAwardMaterials,
  options: {
    rHex?: number;
    thickness?: number;
    domeHeight?: number;
  } = {}
): THREE.Group {
  const root = new THREE.Group();
  root.name = 'apple-hex-mechanical-pending-badge';

  const R = options.rHex || 1.50;
  const thickness = options.thickness || 0.24;
  const domeHeight = options.domeHeight || 0.085;
  const filletR = 0.16; // Apple rounded corner radius
  const bevelWidth = 0.12; // Front mirror chamfer width

  // Helper to generate filleted hexagon 2D perimeter contour
  // Vertices are at (i / 6) * 2 * PI (0°, 60°, 120°, 180°, 240°, 300°)
  // The 6 flat edges are at (i / 6) * 2 * PI + PI / 6 (30°, 90°, 150°, 210°, 270°, 330°)
  // where the 6 mechanical brackets clamp!
  function generateFilletedHexContour(outerRadius: number, cornerRadius: number, pointsPerCorner = 16): [number, number][] {
    const pts: [number, number][] = [];
    const dCenter = outerRadius - cornerRadius * (2 / Math.sqrt(3) - 1);

    for (let i = 0; i < 6; i++) {
      const cornerAngle = (i / 6) * Math.PI * 2;
      const cx = Math.cos(cornerAngle) * dCenter;
      const cy = Math.sin(cornerAngle) * dCenter;

      for (let s = 0; s < pointsPerCorner; s++) {
        const arcT = (s / pointsPerCorner) - 0.5; // -0.5 to +0.5
        const currentAngle = cornerAngle + arcT * (Math.PI / 3);
        const px = cx + Math.cos(currentAngle) * cornerRadius;
        const py = cy + Math.sin(currentAngle) * cornerRadius;
        pts.push([px, py]);
      }
    }
    return pts;
  }

  // 1. Outer perimeter contour (at full radius R)
  const outerContour = generateFilletedHexContour(R, filletR, 16);
  const numPts = outerContour.length;

  // 2. Inner contour (start of convex face, inside the mirror chamfer bevel)
  const innerContour = generateFilletedHexContour(R - bevelWidth, Math.max(0.06, filletR - bevelWidth * 0.5), 16);

  // 3. FRONT CONVEX DOMED FACE MESH (24K Gold Cloisonné Bed)
  const faceGeo = new THREE.BufferGeometry();
  const facePositions: number[] = [];
  const faceIndices: number[] = [];
  const numRings = 4;

  const zPeak = thickness * 0.5 + domeHeight;
  facePositions.push(0, 0, zPeak);

  for (let ring = 1; ring <= numRings; ring++) {
    const ringT = ring / numRings;
    const zRing = thickness * 0.5 + domeHeight * (1 - Math.pow(ringT, 1.85));

    for (let i = 0; i < numPts; i++) {
      const [ix, iy] = innerContour[i];
      facePositions.push(ix * ringT, iy * ringT, zRing);
    }
  }

  for (let i = 0; i < numPts; i++) {
    const next = (i + 1) % numPts;
    faceIndices.push(0, i + 1, next + 1);
  }

  for (let ring = 1; ring < numRings; ring++) {
    const currentOffset = 1 + (ring - 1) * numPts;
    const nextOffset = 1 + ring * numPts;
    for (let i = 0; i < numPts; i++) {
      const next = (i + 1) % numPts;
      const c1 = currentOffset + i;
      const c2 = currentOffset + next;
      const n1 = nextOffset + i;
      const n2 = nextOffset + next;
      faceIndices.push(c1, n1, n2);
      faceIndices.push(c1, n2, c2);
    }
  }

  faceGeo.setAttribute('position', new THREE.Float32BufferAttribute(facePositions, 3));
  faceGeo.setIndex(faceIndices);
  faceGeo.computeVertexNormals();

  const faceMesh = new THREE.Mesh(faceGeo, mats.pendingBlankFace);
  faceMesh.name = 'convex-gold-face';
  root.add(faceMesh);

  // 4. FRONT POLISHED MIRROR CHAMFER BEVEL (24K Mirror Gold Razor Highlight Catcher)
  const bevelGeo = new THREE.BufferGeometry();
  const bevelPositions: number[] = [];
  const bevelIndices: number[] = [];
  const zOuterFront = thickness * 0.5 - 0.035;
  const zInnerFront = thickness * 0.5;

  for (let i = 0; i < numPts; i++) {
    const [ix, iy] = innerContour[i];
    const [ox, oy] = outerContour[i];
    bevelPositions.push(ix, iy, zInnerFront);
    bevelPositions.push(ox, oy, zOuterFront);
  }

  for (let i = 0; i < numPts; i++) {
    const next = (i + 1) % numPts;
    const in1 = i * 2, out1 = i * 2 + 1;
    const in2 = next * 2, out2 = next * 2 + 1;
    bevelIndices.push(in1, out1, out2);
    bevelIndices.push(in1, out2, in2);
  }

  bevelGeo.setAttribute('position', new THREE.Float32BufferAttribute(bevelPositions, 3));
  bevelGeo.setIndex(bevelIndices);
  bevelGeo.computeVertexNormals();

  const bevelMesh = new THREE.Mesh(bevelGeo, mats.pendingChamferMirror);
  bevelMesh.name = 'mirror-chamfer-bevel-front';
  root.add(bevelMesh);

  // 5. VERTICAL SIDE WALL (Substantial 3D thickness with brushed warm gold)
  const sideGeo = new THREE.BufferGeometry();
  const sidePositions: number[] = [];
  const sideIndices: number[] = [];
  const zOuterBack = -thickness * 0.5 + 0.035;

  for (let i = 0; i < numPts; i++) {
    const [ox, oy] = outerContour[i];
    sidePositions.push(ox, oy, zOuterFront);
    sidePositions.push(ox, oy, zOuterBack);
  }

  for (let i = 0; i < numPts; i++) {
    const next = (i + 1) % numPts;
    const f1 = i * 2, b1 = i * 2 + 1;
    const f2 = next * 2, b2 = next * 2 + 1;
    sideIndices.push(f1, b1, b2);
    sideIndices.push(f1, b2, f2);
  }

  sideGeo.setAttribute('position', new THREE.Float32BufferAttribute(sidePositions, 3));
  sideGeo.setIndex(sideIndices);
  sideGeo.computeVertexNormals();

  const sideMesh = new THREE.Mesh(sideGeo, mats.pendingSideWall);
  sideMesh.name = 'brushed-gold-side-wall';
  root.add(sideMesh);

  // 6. BACK MIRROR CHAMFER BEVEL & AUTHENTIC BACK PLATE
  const backBevelGeo = new THREE.BufferGeometry();
  const backBevelPositions: number[] = [];
  const backBevelIndices: number[] = [];
  const zInnerBack = -thickness * 0.5;

  for (let i = 0; i < numPts; i++) {
    const [ox, oy] = outerContour[i];
    const [ix, iy] = innerContour[i];
    backBevelPositions.push(ox, oy, zOuterBack);
    backBevelPositions.push(ix, iy, zInnerBack);
  }

  for (let i = 0; i < numPts; i++) {
    const next = (i + 1) % numPts;
    const o1 = i * 2, in1 = i * 2 + 1;
    const o2 = next * 2, in2 = next * 2 + 1;
    backBevelIndices.push(o1, o2, in2);
    backBevelIndices.push(o1, in2, in1);
  }

  backBevelGeo.setAttribute('position', new THREE.Float32BufferAttribute(backBevelPositions, 3));
  backBevelGeo.setIndex(backBevelIndices);
  backBevelGeo.computeVertexNormals();

  const backBevelMesh = new THREE.Mesh(backBevelGeo, mats.pendingChamferMirror);
  backBevelMesh.name = 'mirror-chamfer-bevel-back';
  root.add(backBevelMesh);

  // Back plate disc with certification rings
  const backDiscGeo = new THREE.BufferGeometry();
  const backPositions: number[] = [0, 0, zInnerBack];
  const backIndices: number[] = [];

  for (let i = 0; i < numPts; i++) {
    const [ix, iy] = innerContour[i];
    backPositions.push(ix, iy, zInnerBack);
  }

  for (let i = 0; i < numPts; i++) {
    const next = (i + 1) % numPts;
    backIndices.push(0, next + 1, i + 1);
  }

  backDiscGeo.setAttribute('position', new THREE.Float32BufferAttribute(backPositions, 3));
  backDiscGeo.setIndex(backIndices);
  backDiscGeo.computeVertexNormals();

  const backPlateMesh = new THREE.Mesh(backDiscGeo, mats.backEngravedMetal);
  backPlateMesh.name = 'apple-award-backplate';
  root.add(backPlateMesh);

  // Concentric engraved rings on back
  const backGroove1 = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.53, 48), mats.pendingChamferMirror);
  backGroove1.position.z = zInnerBack - 0.002;
  backGroove1.rotation.y = Math.PI;
  root.add(backGroove1);

  const backGroove2 = new THREE.Mesh(new THREE.RingGeometry(0.85, 0.88, 48), mats.pendingChamferMirror);
  backGroove2.position.z = zInnerBack - 0.002;
  backGroove2.rotation.y = Math.PI;
  root.add(backGroove2);

  // Center gold medal seal on back
  const backStamp = new THREE.Mesh(new THREE.CircleGeometry(0.26, 32), mats.goldBezel);
  backStamp.position.z = zInnerBack - 0.004;
  backStamp.rotation.y = Math.PI;
  root.add(backStamp);

  // ─────────────────────────────────────────────────────────────────────────
  // 7. MECHANICAL ASSEMBLY ANATOMY (六边机械装配专用造型结构)
  // ─────────────────────────────────────────────────────────────────────────

  // (A) 6 EDGE DOCKING RECESSES & ALIGNMENT NOTCHES
  // Located at each of the 6 flat edges: (i / 6) * 2 * PI + PI / 6
  // Exact matching docking ports where the 6 mechanical brackets clamp during Phase 1
  const edgeDist = R * 0.866; // Distance from center to flat edge (~1.30)
  const zSurfaceEdge = thickness * 0.5 + 0.015;

  for (let i = 0; i < 6; i++) {
    const edgeAngle = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const ex = Math.cos(edgeAngle) * edgeDist;
    const ey = Math.sin(edgeAngle) * edgeDist;

    // Recessed Docking Guide Plate (Dark titanium with gold trim)
    const slotPlateGeo = new THREE.BoxGeometry(0.82, 0.07, 0.035);
    const slotPlateMesh = new THREE.Mesh(slotPlateGeo, mats.darkTitanium);
    slotPlateMesh.position.set(ex * 0.96, ey * 0.96, zSurfaceEdge);
    slotPlateMesh.rotation.z = edgeAngle - Math.PI / 2;
    root.add(slotPlateMesh);

    // Beveled Gold Border on the docking port
    const slotLipGeo = new THREE.BoxGeometry(0.86, 0.02, 0.04);
    const slotLipMesh = new THREE.Mesh(slotLipGeo, mats.pendingChamferMirror);
    slotLipMesh.position.set(ex * 0.94, ey * 0.94, zSurfaceEdge + 0.005);
    slotLipMesh.rotation.z = edgeAngle - Math.PI / 2;
    root.add(slotLipMesh);

    // Central Luminous Cyber-Energy Alignment Notch (Matches bracket clamp notch!)
    const notchGeo = new THREE.BoxGeometry(0.09, 0.05, 0.045);
    const notchMesh = new THREE.Mesh(notchGeo, mats.lockEnergyCyan);
    notchMesh.position.set(ex * 0.96, ey * 0.96, zSurfaceEdge + 0.01);
    notchMesh.rotation.z = edgeAngle - Math.PI / 2;
    root.add(notchMesh);
  }

  // (B) 6 RADIAL LASER ENGRAVED ENERGY SPOKES (六道激光能量导轨)
  // Radiate from center lock core (r=0.42) out to edge docking ports (r=1.20)
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const spokeLen = 0.74;
    const spokeCenterR = 0.81;

    // Dark channel recess
    const spokeGeo = new THREE.PlaneGeometry(0.048, spokeLen);
    const spokeMesh = new THREE.Mesh(spokeGeo, mats.mysteryEngraving);
    const sx = Math.cos(ang) * spokeCenterR;
    const sy = Math.sin(ang) * spokeCenterR;
    spokeMesh.position.set(sx, sy, zPeak - 0.03);
    spokeMesh.rotation.z = ang - Math.PI / 2;
    root.add(spokeMesh);

    // Gold energy rail highlight line inside the spoke
    const railGeo = new THREE.PlaneGeometry(0.018, spokeLen * 0.95);
    const railMesh = new THREE.Mesh(railGeo, mats.goldAccent);
    railMesh.position.set(sx, sy, zPeak - 0.028);
    railMesh.rotation.z = ang - Math.PI / 2;
    root.add(railMesh);
  }

  // (C) CENTRAL MECHANICAL LOCK CORE (中央锁闭机械结构)
  const zCore = zPeak + 0.005;

  // 1. Outer 24K Gold Stepped Notched Lock Bezel
  const lockRingGeo = new THREE.RingGeometry(0.38, 0.47, 48);
  const lockRingMesh = new THREE.Mesh(lockRingGeo, mats.pendingChamferMirror);
  lockRingMesh.position.z = zCore;
  root.add(lockRingMesh);

  // 12 Micro-Machined Mechanical Cog Teeth / Tick Marks on Lock Ring
  for (let t = 0; t < 12; t++) {
    const tAng = (t / 12) * Math.PI * 2;
    const tickGeo = new THREE.BoxGeometry(0.02, 0.07, 0.015);
    const tickMesh = new THREE.Mesh(tickGeo, mats.darkTitanium);
    tickMesh.position.set(Math.cos(tAng) * 0.425, Math.sin(tAng) * 0.425, zCore + 0.008);
    tickMesh.rotation.z = tAng;
    root.add(tickMesh);
  }

  // 2. Concentric Cyber Energy Conduit Ring (Cyan & Gold Energy Glow)
  const energyRingGeo = new THREE.RingGeometry(0.30, 0.38, 48);
  const energyRingMesh = new THREE.Mesh(energyRingGeo, mats.lockEnergyCyan);
  energyRingMesh.position.z = zCore + 0.004;
  root.add(energyRingMesh);

  // 3. Raised 6-Sided Mechanical Medallion (Dark Titanium with Chamfered Gold Rim)
  const hexMedallionGeo = new THREE.CircleGeometry(0.26, 6);
  const hexMedallionMesh = new THREE.Mesh(hexMedallionGeo, mats.darkTitanium);
  hexMedallionMesh.position.z = zCore + 0.016;
  root.add(hexMedallionMesh);

  const hexMedallionRim = new THREE.Mesh(new THREE.RingGeometry(0.23, 0.26, 6), mats.pendingChamferMirror);
  hexMedallionRim.position.z = zCore + 0.019;
  root.add(hexMedallionRim);

  // 4. Center Luminous Power Crystal / Sphere Node (Pending Pulsing Beacon)
  const powerSphereGeo = new THREE.SphereGeometry(0.088, 20, 20);
  const powerSphereMesh = new THREE.Mesh(powerSphereGeo, mats.lockEnergyCyan);
  powerSphereMesh.position.set(0, 0, zCore + 0.045);
  root.add(powerSphereMesh);

  // 5. Six Micro-Rivet Studs on the Inner Medallion Vertices
  for (let r = 0; r < 6; r++) {
    const rAng = (r / 6) * Math.PI * 2;
    const rivetGeo = new THREE.SphereGeometry(0.028, 12, 12);
    const rivetMesh = new THREE.Mesh(rivetGeo, mats.pendingChamferMirror);
    rivetMesh.position.set(Math.cos(rAng) * 0.18, Math.sin(rAng) * 0.18, zCore + 0.024);
    root.add(rivetMesh);
  }

  // (D) 6 OUTER VERTEX ARMOR CORNER CAPS (六角外突防撞护甲)
  for (let c = 0; c < 6; c++) {
    const cAng = (c / 6) * Math.PI * 2;
    const cornerCapGeo = new THREE.BoxGeometry(0.16, 0.07, 0.04);
    const cornerCapMesh = new THREE.Mesh(cornerCapGeo, mats.pendingChamferMirror);
    cornerCapMesh.position.set(Math.cos(cAng) * (R - 0.06), Math.sin(cAng) * (R - 0.06), zOuterFront + 0.01);
    cornerCapMesh.rotation.z = cAng + Math.PI / 2;
    root.add(cornerCapMesh);
  }

  // Front face already has clearcoat: 1.0 on pendingBlankFace - strictly NO duplicate glass overlay to prevent ghosting or shadows
  return root;
}

/**
 * Backward compatibility alias: maps buildApplePendingConvexHexBlank to the
 * authentic Hex Mechanical Pending Badge.
 */
export function buildApplePendingConvexHexBlank(
  mats: AppleAwardMaterials,
  options: {
    rHex?: number;
    thickness?: number;
    domeHeight?: number;
  } = {}
): THREE.Group {
  return buildAppleHexMechanicalPendingBadge(mats, options);
}

export interface ActivityRings3In1Group extends THREE.Group {
  moveRing: THREE.Group;
  exerciseRing: THREE.Group;
  standRing: THREE.Group;
  setRingsProgress?: (progress: number) => void;
}

/**
 * Build 3-in-1 Apple Activity Rings (Move Red, Exercise Green, Stand Cyan)
 * Physical 3D Glowing Concentric Rings for assembly and spark fusion
 */
export function buildActivityRings3In1Group(mats: AppleAwardMaterials): ActivityRings3In1Group {
  const root = new THREE.Group() as ActivityRings3In1Group;
  root.name = 'apple-activity-rings-3in1';

  // 1. Move Ring (Red #ff2d55)
  const moveGroup = new THREE.Group();
  moveGroup.name = 'move-ring-red';
  const moveTorus = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.08, 24, 64), mats.moveRingMat);
  moveGroup.add(moveTorus);

  // Beveled outer mirror trim on Move Ring
  const moveTrim = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.018, 16, 64), mats.pendingChamferMirror);
  moveGroup.add(moveTrim);

  // 2. Exercise Ring (Green #a1e70a)
  const exerciseGroup = new THREE.Group();
  exerciseGroup.name = 'exercise-ring-green';
  const exerciseTorus = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.075, 24, 64), mats.exerciseRingMat);
  exerciseGroup.add(exerciseTorus);

  const exerciseTrim = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.016, 16, 64), mats.pendingChamferMirror);
  exerciseGroup.add(exerciseTrim);

  // 3. Stand Ring (Cyan #00e5ff)
  const standGroup = new THREE.Group();
  standGroup.name = 'stand-ring-cyan';
  const standTorus = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.07, 24, 64), mats.standRingMat);
  standGroup.add(standTorus);

  const standTrim = new THREE.Mesh(new THREE.TorusGeometry(0.87, 0.014, 16, 64), mats.pendingChamferMirror);
  standGroup.add(standTrim);

  root.add(moveGroup);
  root.add(exerciseGroup);
  root.add(standGroup);

  root.moveRing = moveGroup;
  root.exerciseRing = exerciseGroup;
  root.standRing = standGroup;

  return root;
}

