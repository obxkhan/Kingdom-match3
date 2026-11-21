import type { BuildingType } from "../types/game";
import { useBuildingSprites } from "../utils/buildingSprites";

interface BuildingSvgProps {
  type: BuildingType;
  level: number;
  className?: string;
}

export function BuildingSvg({
  type,
  level,
  className = "h-12 w-12",
}: BuildingSvgProps) {
  const buildingSprites = useBuildingSprites();
  const spriteUrl = buildingSprites[type];

  if (spriteUrl) {
    return (
      <img
        src={spriteUrl}
        alt=""
        aria-hidden="true"
        draggable={false}
        referrerPolicy="no-referrer"
        className={`${className} object-contain select-none`}
      />
    );
  }

  if (type === "house") {
    if (level === 1) {
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <ellipse cx="32" cy="54" rx="22" ry="5" fill="#14532D" opacity="0.25" />
          <rect x="16" y="30" width="32" height="22" rx="2" fill="#FFFBEB" stroke="#78350F" strokeWidth="2" />
          {/* Timber siding lines */}
          <line x1="16" y1="37" x2="48" y2="37" stroke="#FDE68A" strokeWidth="1" />
          <line x1="16" y1="44" x2="48" y2="44" stroke="#FDE68A" strokeWidth="1" />
          {/* Chimney + subtle smoke */}
          <rect x="40" y="16" width="5" height="9" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
          <circle cx="42.5" cy="11" r="2.2" fill="#E2E8F0" className="animate-smoke-rise" />
          <polygon points="12,32 32,14 52,32" fill="#DC2626" stroke="#7F1D1D" strokeWidth="2" strokeLinejoin="round" />
          <rect x="28" y="39" width="8" height="13" rx="1" fill="#92400E" />
          <rect x="20" y="36" width="5" height="5" rx="0.8" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.2" />
          <rect x="39" y="36" width="5" height="5" rx="0.8" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.2" />
        </svg>
      );
    }
    if (level === 2) {
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <ellipse cx="32" cy="55" rx="24" ry="5" fill="#14532D" opacity="0.25" />
          <rect x="12" y="23" width="40" height="30" rx="2" fill="#FEF3C7" stroke="#78350F" strokeWidth="2" />
          <line x1="12" y1="36" x2="52" y2="36" stroke="#FDE68A" strokeWidth="1.2" />
          <rect x="42" y="10" width="5" height="9" fill="#9A3412" stroke="#7C2D12" strokeWidth="1.5" />
          <circle cx="44.5" cy="6" r="2.2" fill="#E2E8F0" className="animate-smoke-rise" />
          <polygon points="9,24 32,9 55,24" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="2" strokeLinejoin="round" />
          <rect x="27" y="40" width="10" height="13" rx="1" fill="#78350F" />
          <rect x="17" y="28" width="6" height="6" rx="1" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.2" />
          <rect x="29" y="28" width="6" height="6" rx="1" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.2" />
          <rect x="41" y="28" width="6" height="6" rx="1" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.2" />
          <rect x="17" y="40" width="6" height="6" rx="1" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.2" />
          <rect x="41" y="40" width="6" height="6" rx="1" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.2" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <ellipse cx="32" cy="56" rx="24" ry="5" fill="#0F172A" opacity="0.22" />
        <rect x="15" y="10" width="34" height="44" rx="2.5" fill="#E2E8F0" stroke="#334155" strokeWidth="2" />
        <rect x="13" y="8" width="38" height="5" rx="1.5" fill="#475569" />
        <rect x="26" y="42" width="12" height="12" rx="1" fill="#1E293B" />
        {[17, 26, 35].map((y) => (
          <g key={y}>
            <rect x="20" y={y} width="6" height="5" rx="0.8" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
            <rect x="29" y={y} width="6" height="5" rx="0.8" fill="#FDE047" stroke="#CA8A04" strokeWidth="1" />
            <rect x="38" y={y} width="6" height="5" rx="0.8" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
          </g>
        ))}
      </svg>
    );
  }

  if (type === "park") {
    if (level === 1) {
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <ellipse cx="32" cy="52" rx="23" ry="6" fill="#16A34A" opacity="0.3" />
          <rect x="29" y="34" width="6" height="16" rx="1.5" fill="#78350F" />
          <circle cx="32" cy="26" r="14" fill="#22C55E" stroke="#15803D" strokeWidth="2" />
          <circle cx="23" cy="30" r="8" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />
          <circle cx="41" cy="30" r="8" fill="#16A34A" stroke="#14532D" strokeWidth="1.5" />
          <rect x="21" y="46" width="22" height="4" rx="1" fill="#B45309" />
        </svg>
      );
    }
    if (level === 2) {
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <ellipse cx="32" cy="52" rx="24" ry="7" fill="#16A34A" opacity="0.35" />
          <ellipse cx="32" cy="45" rx="14" ry="6" fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
          <ellipse cx="32" cy="45" rx="8" ry="2.5" fill="#BAE6FD" opacity="0.7" />
          <rect x="17" y="28" width="4" height="14" fill="#78350F" />
          <circle cx="19" cy="22" r="10" fill="#22C55E" stroke="#15803D" strokeWidth="2" />
          <rect x="43" y="28" width="4" height="14" fill="#78350F" />
          <circle cx="45" cy="22" r="10" fill="#4ADE80" stroke="#15803D" strokeWidth="2" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <ellipse cx="32" cy="53" rx="25" ry="7" fill="#16A34A" opacity="0.35" />
        <ellipse cx="32" cy="44" rx="16" ry="7" fill="#0EA5E9" stroke="#0369A1" strokeWidth="2" />
        <rect x="29" y="29" width="6" height="14" rx="1.5" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
        <path d="M32 28 C25 18, 19 26, 21 37" fill="none" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 28 C39 18, 45 26, 43 37" fill="none" stroke="#BAE6FD" strokeWidth="2" strokeLinecap="round" />
        <circle cx="13" cy="29" r="8" fill="#22C55E" stroke="#15803D" strokeWidth="1.8" />
        <circle cx="51" cy="29" r="8" fill="#22C55E" stroke="#15803D" strokeWidth="1.8" />
      </svg>
    );
  }

  if (type === "mill") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <ellipse cx="32" cy="55" rx="23" ry="5" fill="#78350F" opacity="0.22" />
        <rect x="14" y={level >= 2 ? 24 : 30} width="36" height={level >= 2 ? 28 : 22} rx="2" fill="#D97706" stroke="#78350F" strokeWidth="2" />
        <polygon points={`11,${level >= 2 ? 25 : 31} 32,${level >= 2 ? 11 : 17} 53,${level >= 2 ? 25 : 31}`} fill="#92400E" stroke="#451A03" strokeWidth="2" strokeLinejoin="round" />
        <g style={{ transformOrigin: "32px 41px" }} className="animate-spin-slow">
          <circle cx="32" cy="41" r={level === 3 ? 9 : 7} fill="#FDE68A" stroke="#78350F" strokeWidth="2" />
          <line x1="32" y1="33" x2="32" y2="49" stroke="#78350F" strokeWidth="1.5" />
          <line x1="24" y1="41" x2="40" y2="41" stroke="#78350F" strokeWidth="1.5" />
        </g>
        <circle cx="32" cy="41" r="2.5" fill="#78350F" />
        {level >= 2 && (
          <rect x="41" y="12" width="6" height="11" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
        )}
        {level === 3 && (
          <g>
            <circle cx="18" cy="48" r="3" fill="#92400E" stroke="#451A03" strokeWidth="1.2" />
            <circle cx="46" cy="48" r="3" fill="#92400E" stroke="#451A03" strokeWidth="1.2" />
          </g>
        )}
      </svg>
    );
  }

  if (type === "brickworks") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <ellipse cx="32" cy="55" rx="24" ry="5" fill="#7C2D12" opacity="0.22" />
        <rect x="14" y="28" width="36" height="24" rx="2" fill="#EA580C" stroke="#7C2D12" strokeWidth="2" />
        {/* Masonry lines */}
        <line x1="14" y1="35" x2="50" y2="35" stroke="#C2410C" strokeWidth="1" />
        <line x1="14" y1="42" x2="50" y2="42" stroke="#C2410C" strokeWidth="1" />
        <rect x="19" y="13" width="7" height="15" fill="#9A3412" stroke="#431407" strokeWidth="1.8" />
        <circle cx="22.5" cy="8" r="2.6" fill="#CBD5E1" className="animate-smoke-rise" />
        {level >= 2 && (
          <>
            <rect x="30" y="10" width="7" height="18" fill="#9A3412" stroke="#431407" strokeWidth="1.8" />
            <circle cx="33.5" cy="5" r="2.4" fill="#CBD5E1" className="animate-smoke-rise" />
          </>
        )}
        {level === 3 && (
          <rect x="41" y="13" width="7" height="15" fill="#9A3412" stroke="#431407" strokeWidth="1.8" />
        )}
        <path d="M24 52 V40 A8 8 0 0 1 40 40 V52 Z" fill="#431407" />
        <path d="M27 52 V42 A5 5 0 0 1 37 42 V52 Z" fill="#FB923C" />
      </svg>
    );
  }

  if (type === "solar") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <ellipse cx="32" cy="55" rx="23" ry="5" fill="#0369A1" opacity="0.22" />
        <rect x="29" y="38" width="6" height="14" fill="#64748B" stroke="#334155" strokeWidth="1.5" />
        <polygon points="12,38 20,20 44,20 52,38" fill="#0284C7" stroke="#0F172A" strokeWidth="2" strokeLinejoin="round" />
        <line x1="25" y1="20" x2="21" y2="38" stroke="#7DD3FC" strokeWidth="1.5" />
        <line x1="39" y1="20" x2="43" y2="38" stroke="#7DD3FC" strokeWidth="1.5" />
        <line x1="16" y1="29" x2="48" y2="29" stroke="#7DD3FC" strokeWidth="1.5" />
        <polygon points="22,22 27,22 24,36 19,36" fill="#BAE6FD" opacity="0.35" />
        {level >= 2 && (
          <circle cx="50" cy="14" r="5" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
        )}
        {level === 3 && (
          <rect x="14" y="45" width="36" height="6" rx="1.5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.2" />
        )}
      </svg>
    );
  }

  if (type === "market") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <ellipse cx="32" cy="55" rx="24" ry="5" fill="#92400E" opacity="0.22" />
        <rect x="13" y="31" width="38" height="21" rx="2" fill="#FFFBEB" stroke="#78350F" strokeWidth="2" />
        {/* Striped market awning */}
        <path d="M10 31 L14 21 H50 L54 31 Z" fill="#EF4444" stroke="#7F1D1D" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="19,21 26,21 24,31 16,31" fill="#FEF3C7" />
        <polygon points="34,21 41,21 43,31 35,31" fill="#FEF3C7" />
        <rect x="18" y="38" width="11" height="9" rx="1" fill="#FDE047" stroke="#B45309" strokeWidth="1.5" />
        <rect x="35" y="38" width="11" height="9" rx="1" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />
        {level >= 2 && (
          <rect x="26" y="13" width="12" height="8" rx="1" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
        )}
        {level === 3 && (
          <circle cx="32" cy="9" r="3.5" fill="#FACC15" stroke="#92400E" strokeWidth="1.3" />
        )}
      </svg>
    );
  }

  if (type === "school") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <ellipse cx="32" cy="55" rx="25" ry="5" fill="#7F1D1D" opacity="0.22" />
        <rect x="12" y="29" width="40" height="23" rx="2" fill="#DC2626" stroke="#7F1D1D" strokeWidth="2" />
        <polygon points="10,30 32,18 54,30" fill="#334155" stroke="#0F172A" strokeWidth="2" strokeLinejoin="round" />
        <rect x="26" y="11" width="12" height="10" rx="1" fill="#F8FAFC" stroke="#334155" strokeWidth="1.6" />
        <polygon points="24,12 32,5 40,12" fill="#1E293B" />
        <rect x="27" y="40" width="10" height="12" rx="5" fill="#FDE68A" stroke="#78350F" strokeWidth="1.5" />
        <rect x="16" y="35" width="6" height="7" rx="1" fill="#BAE6FD" stroke="#0369A1" strokeWidth="1.2" />
        <rect x="42" y="35" width="6" height="7" rx="1" fill="#BAE6FD" stroke="#0369A1" strokeWidth="1.2" />
        {level >= 2 && (
          <circle cx="32" cy="16" r="2.5" fill="#FACC15" stroke="#78350F" strokeWidth="1" />
        )}
      </svg>
    );
  }

  if (type === "station") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <ellipse cx="32" cy="56" rx="25" ry="5" fill="#1E293B" opacity="0.24" />
        <path d="M12 52 V28 A20 16 0 0 1 52 28 V52 Z" fill="#E2E8F0" stroke="#334155" strokeWidth="2" />
        <path d="M18 52 V32 A14 11 0 0 1 46 32 V52 Z" fill="#0F172A" />
        {/* Glass roof ribs */}
        <path d="M22 21 V52" stroke="#94A3B8" strokeWidth="1" opacity="0.5" />
        <path d="M42 21 V52" stroke="#94A3B8" strokeWidth="1" opacity="0.5" />
        {/* Sleek commuter train */}
        <rect x="23" y="36" width="18" height="15" rx="3" fill="#2563EB" stroke="#93C5FD" strokeWidth="1.5" />
        <rect x="26" y="39" width="12" height="5" rx="1" fill="#BAE6FD" />
        <circle cx="27" cy="48" r="1.5" fill="#FDE047" />
        <circle cx="37" cy="48" r="1.5" fill="#FDE047" />
        {level >= 2 && (
          <rect x="29" y="8" width="6" height="8" rx="1" fill="#334155" />
        )}
        {level === 3 && (
          <circle cx="32" cy="11" r="3" fill="#FACC15" />
        )}
      </svg>
    );
  }

  if (type === "observatory") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <ellipse cx="32" cy="56" rx="24" ry="5" fill="#0F172A" opacity="0.24" />
        <rect x="16" y="34" width="32" height="19" rx="2" fill="#F8FAFC" stroke="#334155" strokeWidth="2" />
        <path d="M15 35 A17 17 0 0 1 49 35 Z" fill="#0284C7" stroke="#0F172A" strokeWidth="2" />
        {/* Telescope barrel */}
        <line x1="34" y1="22" x2="50" y2="10" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
        <circle cx="51" cy="9" r="2.2" fill="#FEF08A" />
        <rect x="27" y="42" width="10" height="11" rx="1" fill="#334155" />
        {level >= 2 && (
          <circle cx="21" cy="26" r="2.5" fill="#BAE6FD" opacity="0.8" />
        )}
        {level === 3 && (
          <polygon points="32,4 33.8,9 29.5,6.5 34.5,6.5 30.2,9" fill="#FACC15" />
        )}
      </svg>
    );
  }

  // Town Hall (Lv 1 - 4)
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <ellipse cx="32" cy="56" rx="25" ry="5" fill="#1E293B" opacity="0.24" />
      <rect x="13" y="30" width="38" height="23" rx="2" fill="#F8FAFC" stroke="#334155" strokeWidth="2" />
      <rect x="24" y={level >= 3 ? 12 : 18} width="16" height={level >= 3 ? 41 : 35} rx="1.5" fill="#E2E8F0" stroke="#334155" strokeWidth="2" />
      <polygon
        points={`22,${level >= 3 ? 13 : 19} 32,${level >= 3 ? 4 : 9} 42,${level >= 3 ? 13 : 19}`}
        fill="#2563EB"
        stroke="#1E3A8A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="32" cy={level >= 3 ? 21 : 26} r="5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.8" />
      <line x1="32" y1={level >= 3 ? 21 : 26} x2="32" y2={level >= 3 ? 18 : 23} stroke="#1E293B" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="32" y1={level >= 3 ? 21 : 26} x2="34.5" y2={level >= 3 ? 21 : 26} stroke="#1E293B" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="28" y="41" width="8" height="12" rx="1" fill="#1E3A8A" />
      {level >= 2 && (
        <>
          <rect x="16" y="36" width="5" height="7" rx="0.8" fill="#38BDF8" stroke="#0369A1" strokeWidth="1" />
          <rect x="43" y="36" width="5" height="7" rx="0.8" fill="#38BDF8" stroke="#0369A1" strokeWidth="1" />
        </>
      )}
      {level >= 4 && (
        <polygon points="32,1 33.5,4 30.5,4" fill="#FACC15" stroke="#CA8A04" strokeWidth="1" />
      )}
    </svg>
  );
}
