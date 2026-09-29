import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  STRIKE_BADGE_CATALOG,
  StrikeBadgeItem,
} from '../three/BadgeGeometries';
import {
  OptimizedStrikeBadgeScene,
  StrikeSpatialState,
  StrikeWallSlot,
} from '../three/OptimizedStrikeBadgeScene';
import { AppleAwardMaterials } from '../three/AppleAwardMaterials';
import { PerformanceMetrics } from '../three/OptimizedBadgeInspectorScene';
import { StrikeFlameBadgeIcon } from './StrikeFlameBadgeIcon';
import {
  Flame,
  Sparkles,
  Gift,
  Award,
  Crown,
  RotateCcw,
  ArrowRight,
  MousePointerClick,
  RotateCw,
  Volume2,
  VolumeX,
  Check,
  Calendar,
  Palette,
  Play,
  FastForward,
  X,
  Eye,
} from 'lucide-react';
import { badgeAudio, triggerHaptic } from '../utils/hapticsAndAudio';

// Helper function for inspirational achievement slogans (鼓励性成就标语)
export const getStrikeEncouragingSlogan = (strikeDays: number): string => {
  if (strikeDays <= 3) {
    return '好的开始是成功的一半！初燃之火已点亮，每一步坚持都在汇聚成不凡力量！';
  } else if (strikeDays <= 7) {
    return '完美整周全勤达成！在自律的轨道上稳健前行，耀日金冕见证你的卓越节律！';
  } else if (strikeDays <= 14) {
    return '连续两周打破惯性界限！自律已深入肌理，意志坚如磐石，习惯已然成自然！';
  } else if (strikeDays <= 30) {
    return '跨越一整个自然月！你用不竭的热情创造了属于你的运动神话，传奇由此开启！';
  } else if (strikeDays <= 40) {
    return '炽光破晓，动能永驻！40天的恒久专注正在深刻重塑你的身体与心灵形态！';
  } else if (strikeDays <= 50) {
    return '半百黄金里程碑！你已超越了99%的同行者，纯金意志在岁月中熠熠生辉！';
  } else if (strikeDays <= 60) {
    return '双月凌空，持之以恒的自律是最强大的引力场，浩瀚征程无可阻挡！';
  } else if (strikeDays <= 80) {
    return '极光拂晓，长达80天的奔跑见证了无与伦比的坚韧意志与全方位蜕变！';
  } else if (strikeDays <= 90) {
    return '季度宗师！一整季度的风雨无阻与自律积累，成就了不可撼动的卓越殿堂！';
  } else {
    return '百日破壁，量子跃迁！一百个全力以赴的日夜，跨越极限，致敬每一个不凡的自己！';
  }
};

interface StrikeCelebrationFlowViewProps {
  onMetricsUpdate?: (m: PerformanceMetrics) => void;
  sharedMaterials: AppleAwardMaterials;
}

export const StrikeCelebrationFlowView: React.FC<StrikeCelebrationFlowViewProps> = ({
  onMetricsUpdate,
  sharedMaterials,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<OptimizedStrikeBadgeScene | null>(null);

  // Theme Mode: Purple (Screenshot exact replica) vs Dark (Apple Watch Obsidian)
  const [stageTheme, setStageTheme] = useState<'purple' | 'dark'>('purple');

  // Streak / Strike Days State
  const [strikeDays, setStrikeDays] = useState<number>(3); // Defaults to Day 3 for instant experience
  const [longestStrike, setLongestStrike] = useState<number>(7);
  const [claimedBadgeIds, setClaimedBadgeIds] = useState<string[]>([]);
  const [activeBadge, setActiveBadge] = useState<StrikeBadgeItem>(STRIKE_BADGE_CATALOG[0]);
  const [spatialState, setSpatialState] = useState<StrikeSpatialState>('pending_float');

  // Milestone Celebration Overlay State (Auto-triggers on reaching 3/7 days)
  const [showMilestoneBanner, setShowMilestoneBanner] = useState<boolean>(false);
  const [bannerMilestone, setBannerMilestone] = useState<StrikeBadgeItem | null>(null);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Screen Micro-Shake Effect State (屏幕微震动)
  const [screenShake, setScreenShake] = useState<'none' | 'unlock' | 'snap'>('none');

  // Selected Slot Achievement Details Modal State (点击卡槽弹出的成就名称与获取日期详情)
  const [selectedSlotModal, setSelectedSlotModal] = useState<StrikeWallSlot | null>(null);

  // Dedicated Celebratory Arrival Modal State (勋章完成抛物线入场并触发烟花后弹出的精致成就卡片)
  const [arrivalCelebrationModal, setArrivalCelebrationModal] = useState<{
    badge: StrikeBadgeItem;
    earnedDate: string;
    slogan: string;
  } | null>(null);

  // Strike Theme Badge Dedicated Unlock Ceremony State (Strike 专属解锁动画状态与阶段管线)
  const [ceremonyPhase, setCeremonyPhase] = useState<'idle' | 'igniting' | 'molten_burst' | 'hero_levitate' | 'complete'>('idle');
  const [ceremonyProgress, setCeremonyProgress] = useState<number>(0);
  const [selectedCeremonyBadge, setSelectedCeremonyBadge] = useState<StrikeBadgeItem>(STRIKE_BADGE_CATALOG[0]);

  // Trigger calibrated Haptic Feedback API + Screen Micro-Shake
  const triggerCelebrationHapticAndShake = useCallback((type: 'unlock' | 'claim_launch' | 'snap') => {
    // 1. Screen Micro-Shake Animation on UI
    setScreenShake(type === 'unlock' ? 'unlock' : 'snap');
    setTimeout(() => {
      setScreenShake('none');
    }, type === 'snap' ? 360 : 480);

    // 2. Physical Three.js Camera Screen Shake
    if (sceneRef.current) {
      sceneRef.current.triggerCameraShake(type === 'snap' ? 0.24 : 0.18);
    }

    // 3. Web Haptics Feedback API (navigator.vibrate)
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        if (type === 'unlock') {
          // Festive triumphant celebration vibration sequence
          navigator.vibrate([25, 35, 20, 30, 45]);
        } else if (type === 'claim_launch') {
          // Energetic launch impulse shockwave
          navigator.vibrate([28, 16, 20]);
        } else if (type === 'snap') {
          // Precision snap + spring overshoot rebound double-pulse
          navigator.vibrate([40, 20, 25, 15, 10]);
        }
      } catch {}
    } else {
      triggerHaptic(type === 'unlock' ? 'success' : type === 'snap' ? 'spring-snap' : 'impact');
    }
  }, []);

  // Dedicated Strike Icon Replica Playground State
  const [replicaNumber, setReplicaNumber] = useState<string>('1');
  const [replicaUnit, setReplicaUnit] = useState<string>('WEEKS');
  const [replicaViewMode, setReplicaViewMode] = useState<'both' | 'gold' | 'shadow'>('both');
  const [replicaSize, setReplicaSize] = useState<number>(88);

  // Initialize 3D Strike Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new OptimizedStrikeBadgeScene(containerRef.current, sharedMaterials);
    scene.onMetricsUpdate = onMetricsUpdate;
    scene.playbackSpeed = playbackSpeed;
    scene.soundEnabled = soundEnabled;
    scene.setTheme(stageTheme);

    scene.onStateChange = (state, badge) => {
      setSpatialState(state);
      if (badge) setActiveBadge(badge);
      if (state !== 'inspect_badge') {
        setIsFlipped(false);
      }
    };

    scene.onClaimComplete = (badge) => {
      setClaimedBadgeIds((prev) => (prev.includes(badge.id) ? prev : [...prev, badge.id]));
      triggerCelebrationHapticAndShake('snap');

      // Pop up the refined achievement arrival card after 400ms for fireworks flare
      setTimeout(() => {
        setArrivalCelebrationModal({
          badge,
          earnedDate: badge.earnedDate || 'OCTOBER 29, 2026',
          slogan: getStrikeEncouragingSlogan(badge.strikeDays),
        });
        if (soundEnabled) {
          badgeAudio.playStrikeUnlockFlourish();
        }
      }, 450);
    };

    scene.onSlotClick = (slot) => {
      setSelectedSlotModal(slot);
      triggerHaptic('impact');
    };

    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [sharedMaterials, onMetricsUpdate, triggerCelebrationHapticAndShake]);

  // Sync speed & sound settings to scene
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.playbackSpeed = playbackSpeed;
      sceneRef.current.soundEnabled = soundEnabled;
      sceneRef.current.setTheme(stageTheme);
    }
  }, [playbackSpeed, soundEnabled, stageTheme]);

  /**
   * Check Milestone condition & trigger automatic unlock
   */
  const checkMilestoneUnlock = useCallback(
    (days: number) => {
      const milestone = STRIKE_BADGE_CATALOG.find((b) => b.strikeDays === days);
      if (milestone) {
        // Trigger Milestone Unlock Celebration
        setBannerMilestone(milestone);
        setShowMilestoneBanner(true);

        if (soundEnabled) {
          badgeAudio.playStrikeUnlockFlourish();
        }
        triggerCelebrationHapticAndShake('unlock');

        // Load into 3D scene as floating pending badge & burst celebratory fireworks on wall
        if (sceneRef.current) {
          sceneRef.current.loadPendingBadge(milestone);
          const slotIdx = STRIKE_BADGE_CATALOG.findIndex((b) => b.strikeDays === days);
          sceneRef.current.triggerWallFireworks(slotIdx !== -1 ? slotIdx : 0, 260);
        }

        // Auto hide splash banner after 2.8s
        setTimeout(() => {
          setShowMilestoneBanner(false);
        }, 2800);
      }
    },
    [soundEnabled, triggerCelebrationHapticAndShake]
  );

  /**
   * Action: Claim Pending Badge $\to$ Parabolic Flight to Strike Wall
   */
  const handleClaimToWall = () => {
    if (sceneRef.current) {
      triggerCelebrationHapticAndShake('claim_launch');
      sceneRef.current.triggerClaimToWall();
    }
  };

  /**
   * Action: Simulate 3-Day Milestone Unlock & Parabolic Entrance
   * @param autoParabolic if true, automatically fires parabolic flight to wall after 1.5s
   */
  const handleSimulate3DayUnlock = (autoParabolic = false) => {
    // 1. Reset 3-day claim status to ensure pristine test
    setClaimedBadgeIds((prev) => prev.filter((id) => id !== 'strike-3-day'));
    setStrikeDays(3);
    const badge = STRIKE_BADGE_CATALOG[0]; // 3-Day Ember Flame
    setActiveBadge(badge);
    setBannerMilestone(badge);
    setShowMilestoneBanner(true);

    if (soundEnabled) {
      badgeAudio.playStrikeUnlockFlourish();
    }
    triggerCelebrationHapticAndShake('unlock');

    if (sceneRef.current) {
      sceneRef.current.loadPendingBadge(badge);
      sceneRef.current.triggerWallFireworks(0, 260);
    }

    setTimeout(() => {
      setShowMilestoneBanner(false);
    }, 2400);

    if (autoParabolic) {
      setTimeout(() => {
        if (sceneRef.current) {
          triggerCelebrationHapticAndShake('claim_launch');
          sceneRef.current.triggerClaimToWall();
        }
      }, 1500);
    }
  };

  /**
   * Action: Simulate 7-Day Milestone Unlock & Parabolic Entrance
   * @param autoParabolic if true, automatically fires parabolic flight to wall after 1.5s
   */
  const handleSimulate7DayUnlock = (autoParabolic = false) => {
    // 1. Reset 7-day claim status to ensure pristine test
    setClaimedBadgeIds((prev) => prev.filter((id) => id !== 'strike-7-day'));
    setStrikeDays(7);
    if (longestStrike < 7) setLongestStrike(7);

    const badge = STRIKE_BADGE_CATALOG[1]; // 7-Day Solar Corona / 1 WEEKS
    setActiveBadge(badge);
    setBannerMilestone(badge);
    setShowMilestoneBanner(true);

    if (soundEnabled) {
      badgeAudio.playStrikeUnlockFlourish();
    }
    triggerCelebrationHapticAndShake('unlock');

    if (sceneRef.current) {
      sceneRef.current.loadPendingBadge(badge);
      sceneRef.current.triggerWallFireworks(1, 280);
    }

    setTimeout(() => {
      setShowMilestoneBanner(false);
    }, 2400);

    if (autoParabolic) {
      setTimeout(() => {
        if (sceneRef.current) {
          triggerCelebrationHapticAndShake('claim_launch');
          sceneRef.current.triggerClaimToWall();
        }
      }, 1500);
    }
  };

  /**
   * Action: Trigger Strike Theme Badge Unlock Ceremony (多阶段沉浸式解锁动画)
   */
  const handleStartStrikeUnlockCeremony = (badgeItem?: StrikeBadgeItem) => {
    const targetBadge = badgeItem || selectedCeremonyBadge || STRIKE_BADGE_CATALOG[0];
    setSelectedCeremonyBadge(targetBadge);
    setActiveBadge(targetBadge);
    setBannerMilestone(targetBadge);

    // Reset this badge claim status in wall to showcase metamorphosis
    setClaimedBadgeIds((prev) => prev.filter((id) => id !== targetBadge.id));

    if (sceneRef.current) {
      sceneRef.current.startStrikeUnlockCeremony(
        targetBadge,
        (phase, prog) => {
          setCeremonyPhase(phase);
          setCeremonyProgress(prog);
        },
        (unlockedBadge) => {
          setClaimedBadgeIds((prev) => (prev.includes(unlockedBadge.id) ? prev : [...prev, unlockedBadge.id]));
          triggerCelebrationHapticAndShake('snap');
        }
      );
    }
  };

  /**
   * Action: Cancel ongoing ceremony
   */
  const handleCancelCeremony = () => {
    setCeremonyPhase('idle');
    setCeremonyProgress(0);
    if (sceneRef.current) {
      sceneRef.current.cancelCeremony();
    }
  };

  /**
   * Action: Toggle 180° Flip for inspecting backplate
   */
  const handleToggleFlip = () => {
    if (sceneRef.current) {
      sceneRef.current.toggleFlip();
      setIsFlipped(!isFlipped);
    }
  };

  /**
   * Action: Return from Inspect mode to Wall Overview
   */
  const handleReturnToWall = () => {
    if (sceneRef.current) {
      sceneRef.current.returnToWall();
    }
  };

  /**
   * Action: Reset Streak & All 10 Wall Slots to Gray Shadow Initial State
   */
  const handleReset = () => {
    setStrikeDays(0);
    setClaimedBadgeIds([]);
    if (sceneRef.current) {
      sceneRef.current.resetAllSlotsToShadow();
    }
    const badge = STRIKE_BADGE_CATALOG[0];
    setActiveBadge(badge);
    triggerHaptic('selection');
  };

  return (
    <div
      className={`flex flex-col gap-4 max-w-6xl mx-auto w-full select-none transition-transform duration-75 ${
        screenShake === 'unlock'
          ? 'animate-micro-shake'
          : screenShake === 'snap'
          ? 'animate-impact-snap'
          : ''
      }`}
    >
      {/* Top Header */}
      <header className="bg-[#121620]/95 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff5500] via-[#ffd60a] to-[#00f0ff] p-[1.5px] shadow-lg shadow-orange-500/20 shrink-0">
            <div className="w-full h-full bg-[#0a0d14] rounded-[14px] flex items-center justify-center">
              <Flame className="w-5 h-5 text-[#ff5500] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Apple Strike 连击成就与勋章墙 (Streak Milestones)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                自动解锁 · 悬浮待领取 · 磁吸归位
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Haptics 触觉反馈 &amp; 屏幕微震动就绪
              </span>
            </div>
            <p className="text-xs text-[#8e8e93] mt-0.5">
              连续达标 3 天、7 天等自动解锁 · 3D 浮雕金胚待领取 · 抛物线轨迹自转飞回 Strike Badge Wall
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Switcher: Screenshot Replica Purple vs Dark Slate */}
          <button
            onClick={() => setStageTheme(stageTheme === 'purple' ? 'dark' : 'purple')}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              stageTheme === 'purple'
                ? 'bg-purple-600/30 border-purple-400/50 text-purple-200 shadow-md shadow-purple-600/30'
                : 'bg-white/5 border-white/10 text-slate-300'
            }`}
            title="切换截图同款紫色主题 / 原生深色"
          >
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">{stageTheme === 'purple' ? '截图同款紫色' : '黑曜石深色'}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
              soundEnabled
                ? 'bg-amber-400/15 border-amber-400/30 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
            title={soundEnabled ? '音效开启' : '音效静音'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs font-mono">
            {[0.5, 1.0, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  playbackSpeed === spd
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Strike 图标像素级复刻展台 (Pixel-Accurate Strike Icon Replica Showcase) */}
      <div
        className={`rounded-3xl p-5 border transition-all duration-300 shadow-2xl relative overflow-hidden flex flex-col gap-4 ${
          stageTheme === 'purple'
            ? 'bg-gradient-to-r from-[#4c1d95]/95 via-[#581c87]/90 to-[#6b21a8]/95 border-purple-400/40 text-white'
            : 'bg-[#121620]/95 border-white/10 text-white'
        }`}
      >
        {/* Ambient Radial Glow behind the flame */}
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar of the Replica Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider border border-amber-400/40 flex items-center gap-1.5 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Strike 图标 1:1 像素级复刻 (Flame Medallion Replica)</span>
            </span>
            <span className="text-xs text-purple-200/80 font-mono">
              复刻参考原型：三叉飞扬火舌 · 内嵌压铸硬币凹槽 · 24K Olympic 镜面金 vs 灰色阴影卡槽
            </span>
          </div>

          {/* View Mode Switcher: Both vs Gold vs Shadow */}
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/15 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setReplicaViewMode('both')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                replicaViewMode === 'both'
                  ? 'bg-amber-400 text-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              双态对比 (1:1)
            </button>
            <button
              onClick={() => setReplicaViewMode('gold')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                replicaViewMode === 'gold'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              24K 耀金火焰
            </button>
            <button
              onClick={() => setReplicaViewMode('shadow')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                replicaViewMode === 'shadow'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              灰色阴影卡槽
            </button>
          </div>
        </div>

        {/* Center Main Stage: Medallion Showcase Display */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center z-10 pt-1">
          {/* Left / Center: Interactive Medallions */}
          <div className="md:col-span-7 flex flex-wrap items-center justify-around gap-6 bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            {/* 1. 24K Gold Replica Flame Medallion */}
            {(replicaViewMode === 'both' || replicaViewMode === 'gold') && (
              <div className="flex flex-col items-center gap-2">
                <div
                  onClick={() => {
                    if (soundEnabled) badgeAudio.playStrikeDayCheckin(Number(replicaNumber) || 7);
                    triggerHaptic('impact');
                  }}
                  title="点击触发 24K 金币金属共鸣声效"
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                >
                  <StrikeFlameBadgeIcon
                    number={replicaNumber}
                    unit={replicaUnit}
                    size={replicaSize}
                    isShadow={false}
                    hasGlow={true}
                    shimmer={true}
                  />
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold text-amber-300 block">
                    24K 耀金火焰勋章
                  </span>
                  <span className="text-[10px] text-purple-200/70 font-mono">
                    已达成 / 悬浮待领取
                  </span>
                </div>
              </div>
            )}

            {/* 2. 灰色阴影卡槽 (Gray Shadow Socket Slot) */}
            {(replicaViewMode === 'both' || replicaViewMode === 'shadow') && (
              <div className="flex flex-col items-center gap-2">
                <div
                  onClick={() => {
                    if (soundEnabled) badgeAudio.playStrikeDayCheckin(1);
                    triggerHaptic('selection');
                  }}
                  title="点击触发展示灰色阴影卡槽触感"
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                >
                  <StrikeFlameBadgeIcon
                    number={replicaNumber}
                    unit={replicaUnit}
                    size={replicaSize}
                    isShadow={true}
                    hasGlow={false}
                    shimmer={false}
                  />
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    灰色阴影卡槽
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    未解锁 · 专属凹槽雏形
                  </span>
                </div>
              </div>
            )}

            {/* Size Controller */}
            <div className="flex flex-col items-center gap-1.5 border-l border-white/15 pl-4 hidden sm:flex">
              <span className="text-[10px] font-bold uppercase text-slate-400">尺寸规格</span>
              <div className="flex flex-col gap-1">
                {[56, 88, 120].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setReplicaSize(sz)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                      replicaSize === sz
                        ? 'bg-amber-400 text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {sz}px
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Milestone Presets & Reference Screenshot Nodes */}
          <div className="md:col-span-5 flex flex-col justify-between gap-3 h-full">
            {/* Screenshot Reference Step Bar: [🔥 1] — (2) — (3) — (4) — (5) */}
            <div className="bg-black/35 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                  截图里程碑步进条 (Milestone Nodes)
                </span>
                <span className="text-[10px] text-slate-300 font-mono font-bold">
                  {replicaNumber} {replicaUnit}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Active node */}
                <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-black px-2.5 py-1 rounded-xl shadow-md font-bold text-xs">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{replicaNumber}</span>
                </div>
                {/* Subsequent step nodes */}
                {[2, 3, 4, 5].map((st) => (
                  <div
                    key={st}
                    onClick={() => {
                      setReplicaNumber(String(st));
                      setReplicaUnit('WEEKS');
                      if (soundEnabled) badgeAudio.playStrikeDayCheckin(st * 7);
                    }}
                    className="w-7 h-7 rounded-full border border-white/20 hover:border-amber-400/60 bg-white/5 hover:bg-white/15 flex items-center justify-center text-xs font-mono font-bold text-white/70 cursor-pointer transition-all active:scale-90"
                    title={`切换至第 ${st} 周`}
                  >
                    {st}
                  </div>
                ))}
              </div>
            </div>

            {/* Preset Milestone Value Switchers */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mr-1">
                快捷复刻切换:
              </span>
              {[
                { num: '1', unit: 'WEEKS', label: '1 周 (截图原型)' },
                { num: '3', unit: 'DAYS', label: '3 天' },
                { num: '2', unit: 'WEEKS', label: '2 周' },
                { num: '30', unit: 'DAYS', label: '30 天' },
                { num: '52', unit: 'WEEKS', label: '52 周 (年轮)' },
              ].map((m) => {
                const isCur = replicaNumber === m.num && replicaUnit === m.unit;
                return (
                  <button
                    key={m.num + m.unit}
                    onClick={() => {
                      setReplicaNumber(m.num);
                      setReplicaUnit(m.unit);
                      if (soundEnabled) badgeAudio.playStrikeDayCheckin(Number(m.num) || 7);
                      triggerHaptic('selection');
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCur
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-black shadow-md'
                        : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/15'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Quick Action: Load into 3D stage */}
            <button
              onClick={() => {
                const match = STRIKE_BADGE_CATALOG.find(
                  (b) => b.displayNumber === replicaNumber && b.displayUnit === replicaUnit
                ) || STRIKE_BADGE_CATALOG[0];
                setActiveBadge(match);
                if (sceneRef.current) {
                  sceneRef.current.loadPendingBadge(match);
                }
                triggerHaptic('success');
                if (soundEnabled) badgeAudio.playStrikeUnlockFlourish();
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>载入下方 3D 舞台进行 360° 自转赏玩与抛物线入墙</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Strike 主题 Badge 专属沉浸式解锁动画控制台 (Dedicated Strike Unlock Animation Ceremony Studio) */}
      <div className="bg-gradient-to-r from-[#17142b]/95 via-[#1e1738]/95 to-[#121620]/95 border-2 border-orange-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col gap-4 relative overflow-hidden">
        {/* Ambient Top Fiery Glow */}
        <div className="absolute -top-10 left-1/3 w-80 h-28 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 bottom-0 w-64 h-32 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Console Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center text-black font-black shadow-lg shadow-orange-500/30 shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Strike 主题勋章专属解锁动画 (Streak Badge Unlock Ceremony)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold border border-orange-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping" />
                  4 阶段沉浸式仪式
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                烈焰旋涡聚能 $\to$ 熔金破茧冲击波 $\to$ 浮空 360° 巡礼 $\to$ 抛物线磁吸入墙
              </p>
            </div>
          </div>

          {/* Current Animation Phase Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-slate-400">仪式状态:</span>
            <span
              className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                spatialState === 'unlock_ceremony'
                  ? ceremonyPhase === 'igniting'
                    ? 'bg-orange-500/25 border-orange-400/60 text-orange-300 animate-pulse'
                    : ceremonyPhase === 'molten_burst'
                    ? 'bg-amber-400/30 border-amber-300 text-amber-200 animate-bounce'
                    : ceremonyPhase === 'hero_levitate'
                    ? 'bg-purple-500/25 border-purple-400 text-purple-200'
                    : 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                  : 'bg-black/40 border-white/15 text-slate-300'
              }`}
            >
              {spatialState === 'unlock_ceremony' ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {ceremonyPhase === 'igniting'
                      ? '🌋 阶段一: 烈焰聚能中...'
                      : ceremonyPhase === 'molten_burst'
                      ? '💥 阶段二: 熔金破茧爆发!'
                      : ceremonyPhase === 'hero_levitate'
                      ? '✨ 阶段三: 浮空 360° 巡礼'
                      : '🏁 仪式完成 / 就绪赏玩'}
                  </span>
                </>
              ) : spatialState === 'pending_float' ? (
                '🔥 待领取 (3D 悬浮)'
              ) : spatialState === 'flying_to_wall' ? (
                '🚀 抛物线自转飞入'
              ) : spatialState === 'magnetic_snap' ? (
                '⚡ 磁吸弹性归位'
              ) : (
                '🏛️ 勋章墙就绪'
              )}
            </span>
          </div>
        </div>

        {/* Milestone Badge Target Quick Selector */}
        <div className="z-10 flex flex-col gap-2 bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>选择解锁目标里程碑勋章:</span>
            </span>
            <span className="text-[11px] font-mono text-amber-300 font-bold">
              {selectedCeremonyBadge.name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {STRIKE_BADGE_CATALOG.slice(0, 6).map((item) => {
              const isSelected = selectedCeremonyBadge.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedCeremonyBadge(item);
                    if (soundEnabled) badgeAudio.playStrikeDayCheckin(item.strikeDays);
                    triggerHaptic('selection');
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500/30 to-amber-500/20 border-orange-400 text-white shadow-md shadow-orange-500/20'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="shrink-0">
                    <StrikeFlameBadgeIcon
                      number={item.displayNumber}
                      unit={item.displayUnit}
                      size={28}
                      isShadow={false}
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold block truncate">{item.displayNumber} {item.displayUnit}</span>
                    <span className="text-[9px] text-slate-400 font-mono block truncate">{item.strikeDays} 天达成</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4-Stage Choreography Stepper Banner */}
        <div className="z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Step 1 */}
          <div
            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
              spatialState === 'unlock_ceremony' && ceremonyPhase === 'igniting'
                ? 'bg-orange-500/25 border-orange-400 shadow-md shadow-orange-500/20'
                : 'bg-white/5 border-white/10 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-orange-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                01. 烈焰聚能 (Vortex)
              </span>
              <span className="text-[9px] font-mono text-slate-400">0 ~ 1.3s</span>
            </div>
            <p className="text-[10px] text-slate-300">
              450 粒子漩涡向卡槽疾速内聚，低频熔火轰鸣蓄力
            </p>
          </div>

          {/* Step 2 */}
          <div
            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
              spatialState === 'unlock_ceremony' && ceremonyPhase === 'molten_burst'
                ? 'bg-amber-500/25 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-white/5 border-white/10 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                02. 熔金破茧 (Burst)
              </span>
              <span className="text-[9px] font-mono text-slate-400">1.3 ~ 2.3s</span>
            </div>
            <p className="text-[10px] text-slate-300">
              灰影瞬间熔铸 24K 金胚，冲击波与 4 阶烟花炸裂
            </p>
          </div>

          {/* Step 3 */}
          <div
            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
              spatialState === 'unlock_ceremony' && ceremonyPhase === 'hero_levitate'
                ? 'bg-purple-500/25 border-purple-400 shadow-md shadow-purple-500/20'
                : 'bg-white/5 border-white/10 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                03. 浮空巡礼 (Levitate)
              </span>
              <span className="text-[9px] font-mono text-slate-400">2.3 ~ 4.6s</span>
            </div>
            <p className="text-[10px] text-slate-300">
              金勋章升腾至中央舞台，360° 自转巡礼全景光泽
            </p>
          </div>

          {/* Step 4 */}
          <div
            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
              spatialState === 'flying_to_wall' || spatialState === 'magnetic_snap'
                ? 'bg-cyan-500/25 border-cyan-400 shadow-md shadow-cyan-500/20'
                : 'bg-white/5 border-white/10 opacity-80'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                <FastForward className="w-3.5 h-3.5 text-cyan-400" />
                04. 磁吸归位 (Snap)
              </span>
              <span className="text-[9px] font-mono text-slate-400">交互触发</span>
            </div>
            <p className="text-[10px] text-slate-300">
              抛物线自转飞回 Strike 墙面，Spring 弹性吸附归位
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="z-10 flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-white/10">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Main Trigger Button */}
            <button
              onClick={() => handleStartStrikeUnlockCeremony()}
              disabled={spatialState === 'unlock_ceremony'}
              className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                spatialState === 'unlock_ceremony'
                  ? 'bg-white/10 text-slate-400 border border-white/15 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 text-black shadow-orange-500/30 hover:brightness-110 active:scale-95'
              }`}
            >
              <Flame className="w-4 h-4 text-black animate-pulse" />
              <span>🔥 启动 Strike 专属解锁动画 (Start Unlock Ceremony)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick 3-Day & 7-Day Shortcuts */}
            <button
              onClick={() => handleStartStrikeUnlockCeremony(STRIKE_BADGE_CATALOG[0])}
              className="px-3 py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>3天初燃</span>
            </button>

            <button
              onClick={() => handleStartStrikeUnlockCeremony(STRIKE_BADGE_CATALOG[1])}
              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>7天整周</span>
            </button>

            <button
              onClick={() => handleStartStrikeUnlockCeremony(STRIKE_BADGE_CATALOG[9])}
              className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>100天百日殿堂</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {spatialState === 'unlock_ceremony' && (
              <button
                onClick={handleCancelCeremony}
                className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-bold transition-all active:scale-95"
              >
                中止动画
              </button>
            )}

            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/15 hover:border-red-500/40 text-slate-300 hover:text-red-200 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
              title="重置所有卡槽为灰色阴影"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置卡槽为灰影</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 3D Stage Viewport */}
      <div
        className={`relative w-full h-[520px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#0a0d14] via-[#07090e] to-[#040508] border shadow-2xl transition-all duration-150 ${
          screenShake === 'unlock'
            ? 'border-amber-400/80 shadow-amber-500/25 ring-2 ring-amber-400/40'
            : screenShake === 'snap'
            ? 'border-cyan-400/80 shadow-cyan-500/30 ring-2 ring-cyan-400/40'
            : 'border-white/10'
        }`}
      >
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Unlock Ceremony In-Viewport Live Cinematic HUD (沉浸式解锁仪式视口浮层) */}
        {spatialState === 'unlock_ceremony' && (
          <div className="absolute top-5 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 bg-[#121620]/90 backdrop-blur-2xl border border-orange-500/50 rounded-2xl p-3.5 sm:px-6 shadow-2xl z-20 flex flex-col items-center gap-2 max-w-lg w-full animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-black font-black shadow-md shadow-orange-500/30">
                  <Flame className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                      {ceremonyPhase === 'igniting'
                        ? '🌋 阶段 1/3: 烈焰旋涡聚能 (Ignition)'
                        : ceremonyPhase === 'molten_burst'
                        ? '💥 阶段 2/3: 熔金破茧爆发 (Molten Burst)'
                        : ceremonyPhase === 'hero_levitate'
                        ? '✨ 阶段 3/3: 浮空 360° 巡礼 (Hero Orbit)'
                        : '🏁 仪式完成 / 已就绪'}
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-300 font-mono font-medium block">
                    {selectedCeremonyBadge.name} · {selectedCeremonyBadge.strikeDays} 天连击勋章
                  </span>
                </div>
              </div>

              <span className="text-xs font-mono font-black text-amber-400">
                {Math.round(ceremonyProgress * 100)}%
              </span>
            </div>

            {/* Live progress ribbon */}
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 transition-all duration-100 rounded-full"
                style={{ width: `${Math.max(5, ceremonyProgress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Floating Pending State Badge Claim Bar (悬浮待领取) */}
        {spatialState === 'pending_float' && (
          <div className="absolute bottom-5 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 bg-[#121620]/90 backdrop-blur-2xl border border-amber-500/40 rounded-2xl p-3.5 sm:px-6 shadow-2xl flex flex-col sm:flex-row items-center gap-3.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-black shadow-md shadow-orange-500/30 shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                    {activeBadge.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold animate-pulse">
                    待领取 (Pending)
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  3D 悬浮星芒环绕 · 可拖拽自由赏玩 · 点击下方按钮磁吸归位
                </p>
              </div>
            </div>

            <button
              onClick={handleClaimToWall}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5500] via-[#ffd60a] to-[#ff9500] text-black font-extrabold text-xs shadow-lg shadow-orange-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <FastForward className="w-4 h-4" />
              <span>触发抛物线入场入墙 (Parabolic Flight)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Inspect Mode Controls Bar (赏玩态) */}
        {spatialState === 'inspect_badge' && (
          <div className="absolute bottom-5 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 bg-[#121620]/90 backdrop-blur-2xl border border-white/20 rounded-2xl p-3.5 sm:px-6 shadow-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="text-xs sm:text-sm font-bold text-white block">
                  {activeBadge.name}
                </span>
                <span className="text-[11px] text-slate-400">{activeBadge.stats}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFlip}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-semibold text-xs transition-all active:scale-95 flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isFlipped ? '翻回正面' : '翻看背面'}</span>
              </button>

              <button
                onClick={handleReturnToWall}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>返回勋章墙</span>
              </button>
            </div>
          </div>
        )}

        {/* Milestone Celebration Splash Banner Overlay */}
        {showMilestoneBanner && bannerMilestone && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-in zoom-in-95 duration-300 pointer-events-none">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-500 via-amber-400 to-yellow-300 flex items-center justify-center text-black shadow-2xl shadow-orange-500/50 mb-3 animate-bounce">
              <Crown className="w-8 h-8" />
            </div>

            <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs uppercase tracking-widest mb-2 shadow-lg">
              🔥 STRIKE UNLOCKED!
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              连续达标 {bannerMilestone.strikeDays} 天！专属勋章已解锁！
            </h3>

            <p className="text-amber-200 text-sm max-w-md mt-1.5 font-medium">
              {bannerMilestone.name} · 进入 3D 悬浮待领取态
            </p>
          </div>
        )}

        {/* Slot Achievement Details Popup Card (点击卡槽弹出的获取日期与成就详情面板) */}
        {selectedSlotModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-30 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#10141f]/95 border border-white/20 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl shadow-black/80 flex flex-col gap-4 relative animate-in slide-in-from-bottom-4 duration-300">
              {/* Close Button */}
              <button
                onClick={() => setSelectedSlotModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header Info */}
              <div className="flex items-center gap-3.5 pt-1">
                <div className="shrink-0">
                  <StrikeFlameBadgeIcon
                    number={selectedSlotModal.badge.displayNumber}
                    unit={selectedSlotModal.badge.displayUnit}
                    size={56}
                    isShadow={!selectedSlotModal.isUnlocked}
                    hasGlow={selectedSlotModal.isUnlocked}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        selectedSlotModal.isUnlocked
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-white/10 text-slate-400 border border-white/10'
                      }`}
                    >
                      {selectedSlotModal.isUnlocked ? (
                        <>
                          <Check className="w-2.5 h-2.5" /> 已解锁入墙 (Unlocked)
                        </>
                      ) : (
                        '🔒 灰色阴影卡槽 (未达成)'
                      )}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white tracking-tight truncate">
                    {selectedSlotModal.badge.name}
                  </h3>
                  <span className="text-xs font-mono text-amber-400 font-bold block">
                    {selectedSlotModal.badge.badgeStyle}
                  </span>
                </div>
              </div>

              {/* Milestone & Earned Date Section */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>获取日期 (Earned Date)</span>
                  </div>
                  <span className="text-xs font-bold text-white font-mono block">
                    {selectedSlotModal.isUnlocked ? selectedSlotModal.badge.earnedDate : '达成后点亮记录'}
                  </span>
                </div>

                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>连续达成目标</span>
                  </div>
                  <span className="text-xs font-bold text-amber-300 font-mono block">
                    连续打卡 {selectedSlotModal.badge.strikeDays} 天
                  </span>
                </div>
              </div>

              {/* Description & Stats */}
              <div className="bg-gradient-to-r from-white/[0.06] to-white/[0.02] rounded-2xl p-3.5 border border-white/10 space-y-2">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">成就详情 (Description)</span>
                  <p className="text-xs text-slate-200 mt-1 leading-relaxed font-normal">
                    {selectedSlotModal.badge.longDescription || selectedSlotModal.badge.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[10px] text-slate-400 font-medium block">成就数据认证 (Verified Stats)</span>
                  <span className="text-xs font-mono font-bold text-slate-300 mt-0.5 block">
                    {selectedSlotModal.badge.stats}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  onClick={() => setSelectedSlotModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  关闭
                </button>
                {selectedSlotModal.isUnlocked && (
                  <button
                    onClick={() => {
                      if (sceneRef.current) {
                        sceneRef.current.selectSlotForInspect(selectedSlotModal.index);
                        setSelectedSlotModal(null);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>调入中央 3D 赏玩与 180° 翻面</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Parabolic Arrival Celebration Achievement Card Modal (勋章完成抛物线入场并触发烟花后弹出的精致成就卡片) */}
        {arrivalCelebrationModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-2xl z-40 flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Ambient Dynamic Background Glow */}
            <div
              className="absolute w-80 h-80 rounded-full blur-3xl opacity-35 pointer-events-none animate-pulse"
              style={{ backgroundColor: arrivalCelebrationModal.badge.accentHex || '#ff9500' }}
            />

            <div className="bg-gradient-to-b from-[#141926]/98 via-[#0e121d]/98 to-[#0a0d14]/98 border-2 border-amber-400/50 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl shadow-black/95 flex flex-col gap-4 relative z-10 animate-in slide-in-from-bottom-6 duration-300">
              {/* Close 'X' Button */}
              <button
                onClick={() => setArrivalCelebrationModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer border border-white/10 shadow-sm"
                title="关闭"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Top Medal Icon & Celebration Badge Header */}
              <div className="flex flex-col items-center text-center gap-3 pt-1">
                {/* 3D Glowing Medallion Replica with Pulsing Halo */}
                <div className="relative group cursor-pointer">
                  <div className="absolute -inset-3 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 rounded-full blur-xl opacity-70 group-hover:opacity-100 transition-all animate-pulse" />
                  <div className="relative">
                    <StrikeFlameBadgeIcon
                      number={arrivalCelebrationModal.badge.displayNumber}
                      unit={arrivalCelebrationModal.badge.displayUnit}
                      size={74}
                      isShadow={false}
                      hasGlow={true}
                      shimmer={true}
                    />
                  </div>
                </div>

                {/* Triumphant Header Pill */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-orange-500/25 via-amber-500/20 to-yellow-500/25 border border-amber-400/50 text-amber-300 font-extrabold text-xs tracking-wider uppercase shadow-md">
                  <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
                  <span>STRIKE 勋章已荣耀入墙归位</span>
                </div>

                {/* Achievement Name */}
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {arrivalCelebrationModal.badge.name}
                  </h3>
                  <span className="text-xs font-mono font-bold text-amber-400 block">
                    {arrivalCelebrationModal.badge.badgeStyle} · {arrivalCelebrationModal.badge.category}
                  </span>
                </div>
              </div>

              {/* Milestone & Earned Date Section */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>达成日期 (Earned Date)</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white font-mono block">
                    {arrivalCelebrationModal.earnedDate}
                  </span>
                </div>

                <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>连续达成目标</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-amber-300 font-mono block">
                    连续打卡 {arrivalCelebrationModal.badge.strikeDays} 天
                  </span>
                </div>
              </div>

              {/* Encouraging Slogan Callout Box (鼓励性成就标语) */}
              <div className="bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-yellow-500/15 rounded-2xl p-4 border border-amber-400/30 relative overflow-hidden shadow-inner">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shrink-0 mt-0.5 text-black shadow-md shadow-orange-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                      鼓励成就寄语 (Inspirational Slogan)
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-amber-100 leading-relaxed italic">
                      “{arrivalCelebrationModal.slogan}”
                    </p>
                  </div>
                </div>
              </div>

              {/* Description & Verified Stats */}
              <div className="bg-white/[0.04] rounded-2xl p-3 border border-white/10 space-y-1.5 text-xs">
                <p className="text-slate-300 leading-relaxed font-normal">
                  {arrivalCelebrationModal.badge.longDescription || arrivalCelebrationModal.badge.description}
                </p>
                <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>官方数据认证:</span>
                  <span className="text-slate-200 font-bold">{arrivalCelebrationModal.badge.stats}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  onClick={() => setArrivalCelebrationModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer border border-white/15"
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    const slotIdx = STRIKE_BADGE_CATALOG.findIndex((b) => b.id === arrivalCelebrationModal.badge.id);
                    if (sceneRef.current && slotIdx !== -1) {
                      sceneRef.current.selectSlotForInspect(slotIdx);
                    }
                    setArrivalCelebrationModal(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-extrabold text-xs shadow-lg shadow-orange-500/25 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>调入中央 3D 赏玩与 180° 翻面</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top-Right State Indicator Pill */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {spatialState === 'pending_float'
                ? '3D 悬浮待领取 (Pending)'
                : spatialState === 'flying_to_wall'
                ? '抛物线磁吸飞回中 (Flying)'
                : spatialState === 'magnetic_snap'
                ? '磁吸弹簧吸附归位 (Snap)'
                : spatialState === 'inspect_badge'
                ? '3D 赏玩与翻面 (Inspect)'
                : 'Strike 勋章墙全景 (Wall)'}
            </span>
          </div>
        </div>

        {/* Bottom Left Gesture Hint */}
        <div className="absolute bottom-4 left-4 z-20 text-[11px] text-slate-400 bg-black/40 backdrop-blur-lg px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 pointer-events-none">
          <MousePointerClick className="w-3.5 h-3.5 text-cyan-400" />
          <span>按住鼠标拖拽自由 3D 旋转 · 点击领取勋章飞回墙面</span>
        </div>
      </div>

      {/* Strike Badge Wall Catalog Grid (连续达标勋章矩阵) */}
      <div className="bg-[#121620]/95 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Strike 连续达标勋章名录 (Strike Badge Wall Collection)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            已收录: {claimedBadgeIds.length} / {STRIKE_BADGE_CATALOG.length} 枚
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {STRIKE_BADGE_CATALOG.map((item) => {
            const isUnlocked = strikeDays >= item.strikeDays;
            const isClaimed = claimedBadgeIds.includes(item.id);
            const isSelected = activeBadge.id === item.id;
            const progressRatio = Math.min(1.0, strikeDays / item.strikeDays);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (sceneRef.current) {
                    sceneRef.current.loadPendingBadge(item);
                    setActiveBadge(item);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-b from-white/15 to-white/5 border-amber-400/60 shadow-xl shadow-amber-500/10'
                    : isClaimed
                    ? 'bg-gradient-to-b from-[#161f2e] to-[#0f141f] border-emerald-500/30 hover:border-emerald-400/50'
                    : isUnlocked
                    ? 'bg-gradient-to-b from-amber-500/10 to-orange-500/5 border-amber-400/40 hover:border-amber-400/70 shadow-lg'
                    : 'bg-[#0a0d14]/95 border-dashed border-white/10 hover:border-white/20 shadow-[inset_0_4px_16px_rgba(0,0,0,0.85)]'
                }`}
              >
                <div>
                  {/* Top Bar with Slot Type and Status Tag */}
                  <div className="flex items-center justify-between mb-2">
                    {/* Strike Flame Badge Icon (Golden vs 灰色阴影卡槽) */}
                    <div className="shrink-0 transition-all">
                      <StrikeFlameBadgeIcon
                        number={item.displayNumber}
                        unit={item.displayUnit}
                        size={46}
                        isShadow={!isUnlocked && !isClaimed}
                        hasGlow={isUnlocked || isClaimed}
                      />
                    </div>

                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isClaimed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isUnlocked
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse'
                          : 'bg-white/5 text-slate-500 border border-white/5'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <Check className="w-2.5 h-2.5" /> 已入墙
                        </>
                      ) : isUnlocked ? (
                        <>
                          <Sparkles className="w-2.5 h-2.5" /> 待领取
                        </>
                      ) : (
                        '灰色阴影卡槽'
                      )}
                    </span>
                  </div>

                  {/* Badge Title & Style */}
                  <div className="space-y-0.5">
                    <h4
                      className={`text-xs font-bold truncate ${
                        isUnlocked || isClaimed ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {item.name}
                    </h4>
                    <span className="text-[10px] text-amber-400/90 font-mono block">
                      {item.badgeStyle}
                    </span>
                  </div>

                  <p
                    className={`text-[10px] line-clamp-2 mt-1.5 leading-relaxed ${
                      isUnlocked || isClaimed ? 'text-[#8e8e93]' : 'text-slate-600'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Bottom Progress Bar & Days Indicator for Gray Shadow Slot */}
                <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={isUnlocked ? 'text-amber-300 font-semibold' : 'text-slate-500'}>
                      {isClaimed ? '已达成收录' : isUnlocked ? '已达成可领取' : `进度 ${strikeDays}/${item.strikeDays} 天`}
                    </span>
                    <span className="font-mono font-bold text-slate-400">{item.strikeDays}D</span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isClaimed
                          ? 'bg-emerald-400'
                          : isUnlocked
                          ? 'bg-gradient-to-r from-orange-500 to-amber-400'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${progressRatio * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
