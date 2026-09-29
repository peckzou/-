import React from 'react';

interface StrikeFlameBadgeIconProps {
  number?: string | number;
  unit?: string;
  size?: number;
  className?: string;
  isShadow?: boolean;
  hasGlow?: boolean;
  glowColor?: string;
  shimmer?: boolean;
  onClick?: () => void;
}

/**
 * Pixel-accurate replica of the Golden Flame Strike Medallion
 * As seen in the reference screenshot:
 * - Rounded circular coin base transitioning into organic 3-tongue golden flame crest
 * - Two-tone 24K gold with upper-left glossy cream highlight facet
 * - Debossed inner coin groove framing the bold numeral
 * - Bold chocolate brown numeral + WEEKS / DAYS subtitle
 * - Also supports Gray Shadow Slot (灰色阴影卡槽) mode for locked/slot representations
 */
export const StrikeFlameBadgeIcon: React.FC<StrikeFlameBadgeIconProps> = ({
  number = '1',
  unit = 'WEEKS',
  size = 120,
  className = '',
  isShadow = false,
  hasGlow = true,
  glowColor = 'rgba(255, 214, 10, 0.45)',
  shimmer = true,
  onClick,
}) => {
  const numStr = String(number);
  const numFontSize = numStr.length >= 3 ? 34 : numStr.length === 2 ? 42 : 50;

  // Unique IDs for SVG gradients to prevent DOM collisions
  const uid = React.useId().replace(/:/g, '_');
  const flameGradId = `flame_gold_${uid}`;
  const highlightGradId = `flame_highlight_${uid}`;
  const shadowGradId = `flame_shadow_${uid}`;
  const rimGradId = `flame_rim_${uid}`;
  const innerWellGradId = `flame_inner_well_${uid}`;
  const radialGlowId = `flame_glow_${uid}`;
  const clipId = `flame_clip_${uid}`;

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size * 1.08 }}
      className={`relative inline-flex items-center justify-center select-none group ${className} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      }`}
    >
      {/* Radial Light Aura Burst (as seen in screenshot behind flame) */}
      {hasGlow && !isShadow && (
        <div
          className="absolute inset-0 -m-3 pointer-events-none rounded-full animate-pulse"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, rgba(255,183,3,0.15) 45%, transparent 72%)`,
            filter: 'blur(8px)',
          }}
        />
      )}

      <svg
        viewBox="0 0 140 152"
        width="100%"
        height="100%"
        className="relative z-10 overflow-visible drop-shadow-md"
      >
        <defs>
          {/* Main 24K Golden Flame Gradient */}
          <linearGradient id={flameGradId} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#fff899" />
            <stop offset="18%" stopColor="#ffd826" />
            <stop offset="52%" stopColor="#f59e0b" />
            <stop offset="85%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>

          {/* Inner Debossed Medallion Well Gradient */}
          <linearGradient id={innerWellGradId} x1="0.5" y1="0" x2="0.5" y2="1">
            {isShadow ? (
              <>
                <stop offset="0%" stopColor="#0c1017" />
                <stop offset="100%" stopColor="#151b26" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ffea75" />
                <stop offset="40%" stopColor="#fbc02d" />
                <stop offset="100%" stopColor="#f59e0b" />
              </>
            )}
          </linearGradient>

          {/* Upper-Left Curved Glossy Highlight Facet (exact match with reference image) */}
          <linearGradient id={highlightGradId} x1="0.2" y1="0.05" x2="0.6" y2="0.85">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="35%" stopColor="#fef08a" stopOpacity="0.88" />
            <stop offset="70%" stopColor="#facc15" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
          </linearGradient>

          {/* 灰色阴影卡槽专属渐变 (Deep Matte Charcoal Shadow) */}
          <linearGradient id={shadowGradId} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#1e2634" />
            <stop offset="45%" stopColor="#121722" />
            <stop offset="100%" stopColor="#080b10" />
          </linearGradient>

          {/* Outer Chamfered Rim Gradient */}
          <linearGradient id={rimGradId} x1="0" y1="0" x2="1" y2="1">
            {isShadow ? (
              <>
                <stop offset="0%" stopColor="#334155" />
                <stop offset="40%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#090d14" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="25%" stopColor="#fde047" />
                <stop offset="75%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#7c2d12" />
              </>
            )}
          </linearGradient>

          {/* Radial Rays Background Aura */}
          <radialGradient id={radialGlowId} cx="50%" cy="55%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#eab308" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
          </radialGradient>

          {/* Subtle Drop Shadow */}
          <filter id={`filter_${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy={isShadow ? '1' : '3'}
              stdDeviation={isShadow ? '2' : '4'}
              floodColor={isShadow ? '#000000' : 'rgba(180, 83, 9, 0.45)'}
            />
          </filter>

          {/* Flame silhouette clip path for internal effects */}
          <clipPath id={clipId}>
            <path
              d="
                M 70 144
                C 104 144, 126 122, 126 88
                C 126 65, 134 48, 126 34
                C 118 42, 110 50, 96 46
                C 88 42, 82 24, 73 8
                C 71 4, 67 2, 63 6
                C 55 16, 50 36, 40 44
                C 32 46, 20 34, 14 44
                C 9 52, 14 74, 14 88
                C 14 122, 36 144, 70 144
                Z
              "
            />
          </clipPath>
        </defs>

        {/* 1. Base Flame Silhouette with 3D Rim */}
        <path
          d="
            M 70 144
            C 104 144, 126 122, 126 88
            C 126 65, 134 48, 126 34
            C 118 42, 110 50, 96 46
            C 88 42, 82 24, 73 8
            C 71 4, 67 2, 63 6
            C 55 16, 50 36, 40 44
            C 32 46, 20 34, 14 44
            C 9 52, 14 74, 14 88
            C 14 122, 36 144, 70 144
            Z
          "
          fill={isShadow ? `url(#${shadowGradId})` : `url(#${flameGradId})`}
          stroke={`url(#${rimGradId})`}
          strokeWidth={isShadow ? 2.5 : 3.2}
          strokeLinejoin="round"
          filter={`url(#filter_${uid})`}
        />

        {/* 2. Inner Concentric Circular Coin Debossed Medallion Well */}
        <g clipPath={`url(#${clipId})`}>
          <circle
            cx="70"
            cy="96"
            r="44"
            fill={isShadow ? `url(#${innerWellGradId})` : `url(#${innerWellGradId})`}
            stroke={isShadow ? '#242e3f' : '#f59e0b'}
            strokeWidth={isShadow ? 1.5 : 2}
            strokeDasharray={isShadow ? '3 2' : 'none'}
            opacity={isShadow ? 0.85 : 0.92}
          />

          {/* Inner Coin Highlight Arc (Specular sheen on upper edge of well) */}
          {!isShadow && (
            <path
              d="M 32 86 A 44 44 0 0 1 108 86"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.6"
            />
          )}
        </g>

        {/* 3. Inner Glossy Highlight Facet (Upper left cusp, exactly as in reference image) */}
        {!isShadow ? (
          <path
            d="
              M 63 12
              C 56 22, 50 38, 42 46
              C 35 48, 26 39, 18 48
              C 14 56, 18 76, 20 86
              C 22 62, 32 50, 48 50
              C 58 50, 64 36, 68 20
              Z
            "
            fill={`url(#${highlightGradId})`}
          />
        ) : (
          /* Subtle debossed shadow facet in gray shadow mode */
          <path
            d="
              M 63 12
              C 56 22, 50 38, 42 46
              C 35 48, 26 39, 18 48
              C 14 56, 18 76, 20 86
              C 22 62, 32 50, 48 50
              C 58 50, 64 36, 68 20
              Z
            "
            fill="#232c3d"
            opacity="0.4"
          />
        )}

        {/* 4. Circular Rim Crest Lip along bottom arc */}
        {!isShadow && (
          <path
            d="
              M 26 102
              C 34 130, 60 140, 70 140
              C 80 140, 106 130, 114 102
              C 106 124, 82 134, 70 134
              C 58 134, 34 124, 26 102
              Z
            "
            fill="#ffffff"
            opacity="0.38"
          />
        )}

        {/* 5. Center Bold Milestone Number */}
        <text
          x="70"
          y="91"
          textAnchor="middle"
          dominantBaseline="central"
          fill={isShadow ? '#3b485d' : '#381c02'}
          fontWeight="900"
          fontSize={numFontSize}
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Rounded', 'Arial Rounded MT Bold', system-ui, sans-serif"
          letterSpacing="-1px"
        >
          {number}
        </text>

        {/* 6. Center Bold Unit Label (WEEKS / DAYS) */}
        <text
          x="70"
          y="118"
          textAnchor="middle"
          dominantBaseline="central"
          fill={isShadow ? '#242f40' : '#452608'}
          fontWeight="800"
          fontSize="11.5"
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Arial Rounded MT Bold', system-ui, sans-serif"
          letterSpacing="1.4px"
        >
          {unit.toUpperCase()}
        </text>

        {/* Optional Interactive Shimmer Highlight */}
        {shimmer && !isShadow && (
          <g clipPath={`url(#${clipId})`} className="opacity-0 group-hover:opacity-100 transition-opacity">
            <line
              x1="10"
              y1="10"
              x2="130"
              y2="130"
              stroke="#ffffff"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.4"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
