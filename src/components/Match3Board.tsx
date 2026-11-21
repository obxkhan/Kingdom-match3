import { useRef, useState, type PointerEvent } from "react";
import {
  ArrowLeftRight,
  ArrowUpDown,
  BrickWall,
  Coins,
  Lightbulb,
  Map as MapIcon,
  RefreshCw,
  Sparkles,
  Trees,
  Users,
  Zap,
} from "lucide-react";
import type {
  BoardCoord,
  ClearBurstEffect,
  FloatingGain,
  MatchTile,
  ResourceType,
} from "../types/game";
import { BOARD_SIZE } from "../utils/match3";
import { useTileSprites } from "../utils/tileSprites";

const SLATE_TEXTURE_SRC =
  "/src/assets/images/texture_board_slate_1795188540964.jpg";

interface Match3BoardProps {
  board: MatchTile[][];
  selectedCoord: BoardCoord | null;
  hintPair: [BoardCoord, BoardCoord] | null;
  clearingKeys: Set<string>;
  invalidKeys: Set<string>;
  burstEffects: ClearBurstEffect[];
  isResolving: boolean;
  comboCount: number;
  floatingGains: FloatingGain[];
  statusNotice: string | null;
  onTileClick: (coord: BoardCoord) => void;
  onSwipeSwap: (from: BoardCoord, to: BoardCoord) => void;
  onRequestHint: () => void;
  onReshuffle: () => void;
  onOpenCityMap?: () => void;
}

const TILE_VISUALS: Record<
  ResourceType,
  {
    label: string;
    surface: string;
    iconColor: string;
    pattern: "wood" | "masonry" | "coin" | "energy" | "civic";
    Icon: typeof Trees;
  }
> = {
  timber: {
    label: "Timber",
    surface:
      "bg-gradient-to-b from-[#DCFCE7] via-[#BBF7D0] to-[#86EFAC] border-emerald-800/80 shadow-[inset_0_2px_0_rgba(255,255,255,0.75),0_3px_0_rgba(6,95,70,0.55)]",
    iconColor: "text-emerald-950",
    pattern: "wood",
    Icon: Trees,
  },
  brick: {
    label: "Brick",
    surface:
      "bg-gradient-to-b from-[#FFF3E6] via-[#FED7AA] to-[#FDBA74] border-orange-900/75 shadow-[inset_0_2px_0_rgba(255,255,255,0.75),0_3px_0_rgba(154,52,18,0.55)]",
    iconColor: "text-orange-950",
    pattern: "masonry",
    Icon: BrickWall,
  },
  gold: {
    label: "Gold",
    surface:
      "bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] border-amber-800/80 shadow-[inset_0_2px_0_rgba(255,255,255,0.85),0_3px_0_rgba(146,64,14,0.55)]",
    iconColor: "text-amber-950",
    pattern: "coin",
    Icon: Coins,
  },
  power: {
    label: "Power",
    surface:
      "bg-gradient-to-b from-[#1E293B] via-[#1E3A5F] to-[#172554] border-sky-400/80 shadow-[inset_0_2px_0_rgba(186,230,253,0.35),0_3px_0_rgba(7,89,133,0.7)]",
    iconColor: "text-sky-200",
    pattern: "energy",
    Icon: Zap,
  },
  civic: {
    label: "Citizens",
    surface:
      "bg-gradient-to-b from-[#FFF1F2] via-[#FFE4E6] to-[#FECDD3] border-rose-800/75 shadow-[inset_0_2px_0_rgba(255,255,255,0.8),0_3px_0_rgba(159,18,57,0.5)]",
    iconColor: "text-rose-950",
    pattern: "civic",
    Icon: Users,
  },
};

function TokenMicroTexture({
  pattern,
}: {
  pattern: "wood" | "masonry" | "coin" | "energy" | "civic";
}) {
  if (pattern === "wood") {
    return (
      <svg
        viewBox="0 0 40 40"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
        aria-hidden="true"
      >
        <path d="M4 11 Q20 7 36 12" fill="none" stroke="#064E3B" strokeWidth="1.2" />
        <path d="M4 29 Q20 33 36 28" fill="none" stroke="#064E3B" strokeWidth="1.2" />
      </svg>
    );
  }
  if (pattern === "masonry") {
    return (
      <svg
        viewBox="0 0 40 40"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-18"
        aria-hidden="true"
      >
        <line x1="2" y1="13" x2="38" y2="13" stroke="#7C2D12" strokeWidth="1.2" />
        <line x1="2" y1="27" x2="38" y2="27" stroke="#7C2D12" strokeWidth="1.2" />
        <line x1="20" y1="2" x2="20" y2="13" stroke="#7C2D12" strokeWidth="1.2" />
        <line x1="12" y1="27" x2="12" y2="38" stroke="#7C2D12" strokeWidth="1.2" />
      </svg>
    );
  }
  if (pattern === "coin") {
    return (
      <svg
        viewBox="0 0 40 40"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="14" fill="none" stroke="#78350F" strokeWidth="1.4" strokeDasharray="3 2" />
      </svg>
    );
  }
  if (pattern === "energy") {
    return (
      <svg
        viewBox="0 0 40 40"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
        aria-hidden="true"
      >
        <circle cx="20" cy="20" r="13" fill="none" stroke="#0C4A6E" strokeWidth="1.2" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 40 40"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-15"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="28" height="28" rx="6" fill="none" stroke="#881337" strokeWidth="1.2" />
    </svg>
  );
}

export function Match3Board({
  board,
  selectedCoord,
  hintPair,
  clearingKeys,
  invalidKeys,
  burstEffects,
  isResolving,
  comboCount,
  floatingGains,
  statusNotice,
  onTileClick,
  onSwipeSwap,
  onRequestHint,
  onReshuffle,
  onOpenCityMap,
}: Match3BoardProps) {
  const [slateFailed, setSlateFailed] = useState(false);
  const tileSprites = useTileSprites();

  const dragStartRef = useRef<{
    coord: BoardCoord;
    x: number;
    y: number;
    swiped: boolean;
  } | null>(null);

  const handlePointerDown = (
    e: PointerEvent<HTMLButtonElement>,
    coord: BoardCoord
  ) => {
    if (isResolving) return;
    dragStartRef.current = {
      coord,
      x: e.clientX,
      y: e.clientY,
      swiped: false,
    };
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || start.swiped || isResolving) return;

    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const threshold = 14;

    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    start.swiped = true;
    let target: BoardCoord;
    if (Math.abs(dx) > Math.abs(dy)) {
      target = { r: start.coord.r, c: start.coord.c + (dx > 0 ? 1 : -1) };
    } else {
      target = { r: start.coord.r + (dy > 0 ? 1 : -1), c: start.coord.c };
    }

    if (
      target.r >= 0 &&
      target.r < board.length &&
      target.c >= 0 &&
      target.c < (board[0]?.length ?? 0)
    ) {
      onSwipeSwap(start.coord, target);
    }
    dragStartRef.current = null;
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
  };

  const isHintTile = (r: number, c: number) =>
    hintPair !== null &&
    ((hintPair[0].r === r && hintPair[0].c === c) ||
      (hintPair[1].r === r && hintPair[1].c === c));

  // Flatten board into absolute-positioned items keyed by stable tile.id for smooth glide swaps & gravity falls
  const positionedTiles: Array<{
    tile: MatchTile;
    r: number;
    c: number;
  }> = [];

  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < (board[r]?.length ?? 0); c += 1) {
      positionedTiles.push({ tile: board[r][c], r, c });
    }
  }

  return (
    <section
      aria-label="Match-3 resource board"
      className="flex h-full flex-col gap-4 rounded-2xl border border-[#D4CBB8] bg-[#FAF7F0] p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap">
            Resource Harvest
          </h2>
          {comboCount > 1 && (
            <span className="font-mono text-xs font-bold text-amber-700 tabular-nums animate-pulse">
              {comboCount}x Combo!
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={isResolving}
            onClick={onRequestHint}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDD5C7] bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0"
          >
            <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
            <span>Hint</span>
          </button>

          <button
            type="button"
            disabled={isResolving}
            onClick={onReshuffle}
            title="Reshuffle board (free)"
            aria-label="Reshuffle board"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDD5C7] bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {onOpenCityMap && (
            <button
              type="button"
              onClick={onOpenCityMap}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0"
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span>City Map</span>
            </button>
          )}
        </div>
      </div>

      {/* Carved Dark Slate Tray Frame */}
      <div
        className="relative overflow-hidden rounded-2xl border-2 border-slate-700 bg-slate-900 p-3.5 shadow-inner select-none touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {!slateFailed && (
          <img
            src={SLATE_TEXTURE_SRC}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            onError={() => setSlateFailed(true)}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-75"
          />
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-slate-950/35"
        />

        {/* 15x15 Playfield */}
        <div className="relative aspect-square w-full">
          {/* Recessed Stone Sockets underneath */}
          <div
            aria-hidden="true"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
            }}
            className="grid h-full w-full gap-[3px]"
          >
            {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-md border border-slate-700/70 bg-slate-950/55 shadow-inner"
              />
            ))}
          </div>

          {/* Positioned Animated Tiles Layer */}
          <div className="absolute inset-0">
            {positionedTiles.map(({ tile, r, c }) => {
              const visual = TILE_VISUALS[tile.type];
              const Icon = visual.Icon;
              const coordKey = `${r},${c}`;
              const isSelected =
                selectedCoord?.r === r && selectedCoord?.c === c;
              const hinted = isHintTile(r, c);
              const isClearing = clearingKeys.has(coordKey);
              const isInvalid = invalidKeys.has(coordKey);
              const cellPct = `${100 / BOARD_SIZE}%`;

              return (
                <div
                  key={tile.id}
                  style={{
                    width: cellPct,
                    height: cellPct,
                    transform: `translate3d(${c * 100}%, ${r * 100}%, 0)`,
                    transition: "transform 210ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  className={`absolute top-0 left-0 p-[1.5px] ${
                    isSelected ? "z-20" : "z-10"
                  }`}
                >
                  <button
                    type="button"
                    disabled={isResolving}
                    onPointerDown={(e) => handlePointerDown(e, { r, c })}
                    onClick={() => onTileClick({ r, c })}
                    aria-label={`${visual.label} tile at row ${r + 1} column ${c + 1}${
                      tile.special !== "none" ? ` (${tile.special} booster)` : ""
                    }`}
                    className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-md border transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:translate-y-0.5 ${
                      visual.surface
                    } ${tile.isNew ? "animate-tile-enter" : ""} ${
                      isClearing ? "animate-tile-clear pointer-events-none" : ""
                    } ${isInvalid ? "animate-tile-shake" : ""} ${
                      isSelected
                        ? "scale-105 ring-2 ring-white shadow-lg"
                        : "hover:brightness-105"
                    } ${hinted ? "ring-2 ring-amber-300 animate-hint-ring" : ""}`}
                  >
                    <TokenMicroTexture pattern={visual.pattern} />
                    {tileSprites[tile.type] ? (
                      <img
                        src={tileSprites[tile.type]}
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        referrerPolicy="no-referrer"
                        className="pointer-events-none relative z-10 h-[88%] w-[88%] object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
                      />
                    ) : (
                      <Icon
                        className={`relative z-10 h-4 w-4 ${visual.iconColor} drop-shadow-xs`}
                      />
                    )}

                    {tile.special === "row" && (
                      <span className="absolute right-0.5 bottom-0.5 z-10 rounded bg-slate-900/90 p-[1px] text-white shadow-xs">
                        <ArrowLeftRight className="h-2 w-2" />
                      </span>
                    )}
                    {tile.special === "col" && (
                      <span className="absolute right-0.5 bottom-0.5 z-10 rounded bg-slate-900/90 p-[1px] text-white shadow-xs">
                        <ArrowUpDown className="h-2 w-2" />
                      </span>
                    )}
                    {tile.special === "bomb" && (
                      <span className="absolute right-0.5 bottom-0.5 z-10 rounded bg-slate-900/95 p-[1px] text-amber-300 shadow-xs">
                        <Sparkles className="h-2 w-2" />
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Special Beam & Blast Shockwave Layer */}
          <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
            {burstEffects.map((fx) => {
              const stepPct = 100 / BOARD_SIZE;
              if (fx.kind === "row") {
                return (
                  <div
                    key={fx.id}
                    style={{
                      top: `${fx.r * stepPct + stepPct * 0.35}%`,
                      height: `${stepPct * 0.3}%`,
                    }}
                    className="absolute inset-x-1 rounded-full bg-gradient-to-r from-amber-300 via-white to-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.9)] animate-beam-x"
                  />
                );
              }
              if (fx.kind === "col") {
                return (
                  <div
                    key={fx.id}
                    style={{
                      left: `${fx.c * stepPct + stepPct * 0.35}%`,
                      width: `${stepPct * 0.3}%`,
                    }}
                    className="absolute inset-y-1 rounded-full bg-gradient-to-b from-amber-300 via-white to-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.9)] animate-beam-y"
                  />
                );
              }
              return (
                <div
                  key={fx.id}
                  style={{
                    left: `${(fx.c + 0.5) * stepPct}%`,
                    top: `${(fx.r + 0.5) * stepPct}%`,
                  }}
                  className="absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-amber-300 bg-amber-200/30 animate-shockwave"
                />
              );
            })}
          </div>

          {/* Floating Resource Gain Popups */}
          {floatingGains.map((gain) => (
            <div
              key={gain.id}
              aria-hidden="true"
              style={{
                left: `${((gain.c + 0.5) / BOARD_SIZE) * 100}%`,
                top: `${((gain.r + 0.35) / BOARD_SIZE) * 100}%`,
              }}
              className={`pointer-events-none absolute z-40 -translate-x-1/2 rounded bg-white/90 px-1.5 py-0.5 font-mono text-xs font-bold shadow-sm animate-float-up whitespace-nowrap ${gain.colorClass}`}
            >
              {gain.label}
            </div>
          ))}
        </div>
      </div>

      {/* Compact Tile Legend & Status Notice */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          {(Object.keys(TILE_VISUALS) as ResourceType[]).map((key) => {
            const v = TILE_VISUALS[key];
            const Icon = v.Icon;
            const spriteUrl = tileSprites[key];
            return (
              <span key={key} className="inline-flex items-center gap-1.5">
                {spriteUrl ? (
                  <img
                    src={spriteUrl}
                    alt=""
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                    className="h-4 w-4 object-contain"
                  />
                ) : (
                  <Icon className={`h-3.5 w-3.5 ${v.iconColor}`} />
                )}
                <span>{v.label}</span>
              </span>
            );
          })}
        </div>

        {statusNotice && (
          <span className="font-semibold text-blue-700" role="status">
            {statusNotice}
          </span>
        )}
      </div>
    </section>
  );
}
