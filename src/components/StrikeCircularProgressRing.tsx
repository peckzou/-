import React, { useMemo } from 'react';
import { Flame, Crown, Sparkles, Target, Award, ArrowUpRight } from 'lucide-react';
import { StrikeBadgeItem, STRIKE_BADGE_CATALOG } from '../three/BadgeGeometries';

interface StrikeCircularProgressRingProps {
  strikeDays: number;
  selectedTarget?: 3 | 7 | 'auto';
  onTargetChange?: (target: 3 | 7) => void;
  onSimulateTarget?: (targetDays: number) => void;
  className?: string;
  size?: number;
}

export const StrikeCircularProgressRing: React.FC<StrikeCircularProgressRingProps> = ({
  strikeDays,
  selectedTarget = 'auto',
  onTargetChange,
  onSimulateTarget,
  className = '',
  size = 136,
}) => {
  // Determine effective target milestone (3-Day vs 7-Day vs Next)
  const targetInfo = useMemo(() => {
    let targetDays: number;
    let badge: StrikeBadgeItem;
    let title: string;
    let subtitle: string;
    let gradientColors: [string, string, string];

    if (selectedTarget === 3) {
      targetDays = 3;
      badge = STRIKE_BADGE_CATALOG[0];
      title = '3天·初燃之焰';
      subtitle = '新手连击起步';
      gradientColors = ['#ff5500', '#ff9500', '#ffd60a'];
    } else if (selectedTarget === 7) {
      targetDays = 7;
      badge = STRIKE_BADGE_CATALOG[1];
      title = '7天·耀日之冠';
      subtitle = '整周满贯全勤';
      gradientColors = ['#ffd60a', '#ffaa00', '#00f0ff'];
    } else {
      // Auto Mode
      if (strikeDays < 3) {
        targetDays = 3;
        badge = STRIKE_BADGE_CATALOG[0];
        title = '3天·初燃之焰';
        subtitle = '第一里程碑';
        gradientColors = ['#ff5500', '#ff9500', '#ffd60a'];
      } else if (strikeDays < 7) {
        targetDays = 7;
        badge = STRIKE_BADGE_CATALOG[1];
        title = '7天·耀日之冠';
        subtitle = '1 WEEKS 整周全勤';
        gradientColors = ['#ffd60a', '#ffaa00', '#00f0ff'];
      } else {
        // Next highest milestone
        const next =
          STRIKE_BADGE_CATALOG.find((b) => b.strikeDays > strikeDays) ||
          STRIKE_BADGE_CATALOG[STRIKE_BADGE_CATALOG.length - 1];
        targetDays = next.strikeDays;
        badge = next;
        title = `${next.strikeDays}天·${next.name.split(':')[1]?.trim() || next.name}`;
        subtitle = '进阶传奇勋章';
        gradientColors = ['#00f0ff', '#a855f7', '#ffd60a'];
      }
    }

    const daysRemaining = Math.max(0, targetDays - strikeDays);
    const progressRatio = Math.min(1.0, strikeDays / targetDays);
    const percentage = Math.round(progressRatio * 100);
    const isCompleted = strikeDays >= targetDays;

    return {
      targetDays,
      badge,
      title,
      subtitle,
      gradientColors,
      daysRemaining,
      progressRatio,
      percentage,
      isCompleted,
    };
  }, [strikeDays, selectedTarget]);

  // SVG Ring Dimension calculations
  const strokeWidth = 10;
  const center = size / 2;
  const radius = center - strokeWidth - 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - targetInfo.progressRatio * circumference;

  // Unique SVG gradient ID to avoid namespace collision
  const gradId = `strike-ring-grad-${targetInfo.targetDays}`;
  const glowFilterId = `strike-ring-glow-${targetInfo.targetDays}`;

  return (
    <div
      className={`bg-[#0e121c]/92 backdrop-blur-2xl border border-white/15 rounded-2xl p-3.5 shadow-2xl shadow-black/60 flex flex-col items-center gap-2.5 select-none transition-all duration-300 ${className}`}
    >
      {/* Top Header Badge */}
      <div className="flex items-center justify-between w-full border-b border-white/10 pb-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-black shadow-sm">
            {targetInfo.targetDays === 7 ? (
              <Crown className="w-3.5 h-3.5" />
            ) : (
              <Flame className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="text-[11px] font-black text-white tracking-tight">
            目标达成环 (Target Ring)
          </span>
        </div>

        {/* Target Switch Pills */}
        <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
          <button
            onClick={() => onTargetChange && onTargetChange(3)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
              targetInfo.targetDays === 3
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="查看 3 天初燃之焰目标"
          >
            3D
          </button>
          <button
            onClick={() => onTargetChange && onTargetChange(7)}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all ${
              targetInfo.targetDays === 7
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="查看 7 天耀日之冠目标"
          >
            7D
          </button>
        </div>
      </div>

      {/* Center SVG Circular Progress Ring */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 origin-center filter drop-shadow-md"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={targetInfo.gradientColors[0]} />
              <stop offset="50%" stopColor={targetInfo.gradientColors[1]} />
              <stop offset="100%" stopColor={targetInfo.gradientColors[2]} />
            </linearGradient>

            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Track Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />

          {/* Secondary Subtle Glow Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            opacity={0.35}
            filter={`url(#${glowFilterId})`}
            style={{
              transition: 'stroke-dashoffset 0.85s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />

          {/* Active Foreground Progress Ring with Smooth Tweening */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.85s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.5s ease',
            }}
          />
        </svg>

        {/* Center Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="flex items-center justify-center gap-0.5">
            {targetInfo.targetDays === 7 ? (
              <Crown className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : (
              <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            )}
            <span className="text-xl font-mono font-black text-white tracking-tight leading-none">
              {targetInfo.percentage}%
            </span>
          </div>

          <span className="text-[10px] font-mono font-bold text-amber-300 mt-0.5 block">
            {strikeDays}/{targetInfo.targetDays} 天
          </span>

          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">
            {targetInfo.isCompleted ? '已达标' : `还差 ${targetInfo.daysRemaining} 天`}
          </span>
        </div>
      </div>

      {/* Bottom Target Card & Quick Simulation Action */}
      <div className="w-full bg-white/5 rounded-xl p-2 border border-white/5 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-200 truncate">
            {targetInfo.title}
          </span>
          <span
            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
              targetInfo.isCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-400/20 text-orange-300 border border-orange-400/30'
            }`}
          >
            {targetInfo.isCompleted ? '✓ 已解锁' : `待解锁`}
          </span>
        </div>

        <p className="text-[9px] text-slate-400 leading-tight">
          {targetInfo.subtitle} · 闭环 100% 触发 3D 浮雕自动入墙
        </p>

        {/* Quick Target Reach Simulation Button */}
        {onSimulateTarget && (
          <button
            onClick={() => onSimulateTarget(targetInfo.targetDays)}
            className="mt-1 w-full py-1 rounded-lg bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/35 hover:to-amber-500/35 border border-orange-500/30 text-orange-200 hover:text-white text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>一键达标 {targetInfo.targetDays} 天目标</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
