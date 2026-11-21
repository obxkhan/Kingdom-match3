import { useState } from "react";
import {
  ArrowUpCircle,
  BrickWall,
  Coins,
  Pickaxe,
  Plus,
  Star,
  Trash2,
  Trees,
  Zap,
} from "lucide-react";
import type {
  BuildingType,
  CityLot,
  ResourceCost,
  Resources,
} from "../types/game";
import {
  BUILDING_DEFS,
  CITY_GRID_DIM,
  PALETTE_BUILDINGS,
  canAfford,
  getAdjacentParkBonusForLot,
  getRefundForLot,
} from "../utils/city";
import { BuildingSvg } from "./BuildingSvg";

const TERRAIN_TEXTURE_SRC =
  "/src/assets/images/texture_tabletop_map_1795188541912.jpg";

interface CityGridProps {
  lots: CityLot[];
  resources: Resources;
  selectedLotIndex: number | null;
  selectedBlueprint: BuildingType;
  lastBuiltLot: { index: number; token: number } | null;
  prestigeLevel: number;
  prestigeReady: boolean;
  onSelectBlueprint: (type: BuildingType) => void;
  onLotClick: (index: number) => void;
  onUpgradeLot: (index: number) => void;
  onDemolishLot: (index: number) => void;
  onOpenHarvest?: () => void;
  onOpenPrestige?: () => void;
}

function CostChips({
  cost,
  resources,
  compact = false,
}: {
  cost: ResourceCost;
  resources: Resources;
  compact?: boolean;
}) {
  const items = [
    { key: "timber", value: cost.timber, have: resources.timber, Icon: Trees, color: "text-emerald-700" },
    { key: "brick", value: cost.brick, have: resources.brick, Icon: BrickWall, color: "text-orange-700" },
    { key: "gold", value: cost.gold, have: resources.gold, Icon: Coins, color: "text-amber-700" },
    { key: "power", value: cost.power, have: resources.power, Icon: Zap, color: "text-sky-700" },
  ].filter((i) => i.value > 0);

  return (
    <div
      className={
        compact
          ? "grid w-full grid-cols-2 gap-x-1.5 gap-y-0.5 text-[10px] font-mono tabular-nums"
          : "flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-mono tabular-nums"
      }
    >
      {items.map(({ key, value, have, Icon, color }) => {
        const enough = have >= value;
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-0.5 ${
              enough ? color : "text-rose-600 font-semibold"
            }`}
          >
            <Icon className="h-2.5 w-2.5 shrink-0" />
            <span>{value}</span>
          </span>
        );
      })}
    </div>
  );
}

function PineTreeMarker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="14" r="7" fill="#14532D" opacity="0.35" />
      <polygon points="12,3 5,15 19,15" fill="#15803D" stroke="#052E16" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points="12,1 7,10 17,10" fill="#22C55E" stroke="#14532D" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export function CityGrid({
  lots,
  resources,
  selectedLotIndex,
  selectedBlueprint,
  lastBuiltLot,
  prestigeLevel,
  prestigeReady,
  onSelectBlueprint,
  onLotClick,
  onUpgradeLot,
  onDemolishLot,
  onOpenHarvest,
  onOpenPrestige,
}: CityGridProps) {
  const [terrainFailed, setTerrainFailed] = useState(false);

  const selectedLot =
    selectedLotIndex !== null ? lots[selectedLotIndex] ?? null : null;
  const blueprintDef = BUILDING_DEFS[selectedBlueprint];
  const blueprintCost = blueprintDef.costsByLevel[1];
  const canAffordBlueprint = canAfford(resources, blueprintCost);

  const selectedDef =
    selectedLot?.building ? BUILDING_DEFS[selectedLot.building] : null;
  const nextLevel = selectedLot ? selectedLot.level + 1 : 0;
  const upgradeCost =
    selectedDef && nextLevel <= selectedDef.maxLevel
      ? selectedDef.costsByLevel[nextLevel]
      : null;
  const canUpgradeSelected = upgradeCost
    ? canAfford(resources, upgradeCost)
    : false;
  const adjacentParkBonus =
    selectedLot?.building === "house"
      ? getAdjacentParkBonusForLot(lots, selectedLot.index)
      : 0;
  const refund = selectedLot ? getRefundForLot(selectedLot) : null;

  return (
    <section
      aria-label="City map and construction"
      className="flex flex-col gap-3.5"
    >
      {/* Top Dock: Selected Building Inspector + Construction Blueprints */}
      <aside className="flex items-stretch gap-3.5 rounded-2xl border border-[#D4CBB8] bg-[#FAF7F0] p-3.5 shadow-sm">
        {/* Selected Building Inspector */}
        {selectedLot && selectedDef ? (
          <div className="flex w-[310px] shrink-0 flex-col justify-between rounded-xl border border-[#DDD5C7] bg-white p-3">
            <div className="flex items-start gap-2.5">
              <BuildingSvg
                type={selectedLot.building!}
                level={selectedLot.level}
                className="h-11 w-11 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-sm font-bold text-slate-900">
                    {selectedDef.name}
                  </h3>
                  <span className="shrink-0 font-mono text-xs text-slate-500 tabular-nums">
                    Lv.{selectedLot.level}/{selectedDef.maxLevel}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
                  {selectedDef.effectSummaryByLevel[selectedLot.level]}
                  {adjacentParkBonus > 0 && ` · +${adjacentParkBonus} Adj.`}
                </p>
                {upgradeCost && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-medium text-slate-500">
                      Upgrade:
                    </span>
                    <CostChips cost={upgradeCost} resources={resources} />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-2 border-t border-slate-100 pt-2">
              {upgradeCost ? (
                <button
                  type="button"
                  disabled={!canUpgradeSelected}
                  onClick={() => onUpgradeLot(selectedLot.index)}
                  className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
                >
                  <ArrowUpCircle className="h-3.5 w-3.5" />
                  <span>Upgrade</span>
                </button>
              ) : (
                <span className="flex-1 font-mono text-xs font-semibold text-emerald-700">
                  Max Level Reached
                </span>
              )}

              {selectedLot.building !== "townhall" && refund && (
                <button
                  type="button"
                  onClick={() => onDemolishLot(selectedLot.index)}
                  title={`Demolish (refunds ${refund.timber}T ${refund.brick}B ${refund.gold}G)`}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 whitespace-nowrap shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex w-[310px] shrink-0 items-center rounded-xl border border-dashed border-[#D4CBB8] bg-white/70 p-3.5 text-xs leading-relaxed text-slate-600">
            Select any building on the City Map to view its stats or upgrade it.
          </div>
        )}

        {/* Construction Blueprints Strip */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-baseline gap-2.5">
              <h3 className="shrink-0 text-xs font-bold uppercase tracking-wide text-slate-700">
                Construction Blueprints
              </h3>
              <p className="truncate text-xs text-slate-600">
                {blueprintDef.shortDesc}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-slate-500">
              {PALETTE_BUILDINGS.length} types
            </span>
          </div>

          <div className="grid grid-cols-9 gap-1.5">
            {PALETTE_BUILDINGS.map((bType) => {
              const def = BUILDING_DEFS[bType];
              const cost = def.costsByLevel[1];
              const affordable = canAfford(resources, cost);
              const active = selectedBlueprint === bType;

              return (
                <button
                  key={bType}
                  type="button"
                  onClick={() => onSelectBlueprint(bType)}
                  className={`flex flex-col items-start justify-between rounded-xl border p-2 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 active:scale-[0.98] ${
                    active
                      ? "border-blue-600 bg-white ring-1 ring-blue-600 shadow-xs"
                      : affordable
                        ? "border-[#DDD5C7] bg-white hover:border-slate-400"
                        : "border-[#E6E0D5] bg-[#F4F0E8] opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-1">
                    <BuildingSvg
                      type={bType}
                      level={1}
                      className="h-7 w-7 shrink-0"
                    />
                    <span
                      className={`font-mono text-[9px] font-semibold leading-none ${
                        affordable ? "text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      {affordable ? "Ready" : "Need"}
                    </span>
                  </div>
                  <span className="mt-1 w-full truncate text-[11px] font-semibold text-slate-900">
                    {def.name}
                  </span>
                  <div className="mt-1 w-full">
                    <CostChips cost={cost} resources={resources} compact />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main: Full-Width Screen-Fitted 15x15 Scenic Tabletop City Map */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#D4CBB8] bg-[#FAF7F0] p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-slate-900">
              City Map
            </h2>
            <p className="text-xs text-slate-600">
              Tap an empty grassy plot to build{" "}
              <strong className="font-semibold text-slate-900">
                {blueprintDef.name}
              </strong>
              , or select any building to inspect and upgrade.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums whitespace-nowrap">
              {lots.filter((l) => l.building !== null).length} / {lots.length}{" "}
              plots
            </span>

            {onOpenPrestige && (
              <button
                type="button"
                onClick={onOpenPrestige}
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 whitespace-nowrap shrink-0 ${
                  prestigeReady
                    ? "bg-amber-600 text-white shadow-xs hover:bg-amber-700"
                    : "border border-[#D4CBB8] bg-white text-slate-800 hover:bg-amber-50"
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${prestigeReady ? "fill-white" : "fill-amber-400 text-amber-600"}`} />
                <span>
                  {prestigeReady ? "Prestige Ready" : `Prestige ★${prestigeLevel}`}
                </span>
              </button>
            )}

            {onOpenHarvest && (
              <button
                type="button"
                onClick={onOpenHarvest}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-700 px-3.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 whitespace-nowrap shrink-0"
              >
                <Pickaxe className="h-3.5 w-3.5" />
                <span>Harvest Resources</span>
              </button>
            )}
          </div>
        </div>

        {/* Screen-Fitted Scenic Tabletop Map Canvas */}
        <div
          style={{ maxWidth: "var(--city-map-max, 760px)" }}
          className="relative mx-auto w-full overflow-hidden rounded-2xl border-2 border-[#7C6F5B] bg-[#5C7E46] p-6 pb-9 shadow-inner"
        >
          {!terrainFailed && (
            <img
              src={TERRAIN_TEXTURE_SRC}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              onError={() => setTerrainFailed(true)}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-85"
            />
          )}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-950/15 via-transparent to-amber-950/20"
            aria-hidden="true"
          />

          {/* Scenic Canal / River along bottom edge */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6 border-t border-sky-900/40 bg-gradient-to-b from-sky-500/85 to-sky-700/90"
          >
            <div className="flex h-full items-center justify-around px-8">
              <span className="h-0.5 w-12 rounded-full bg-sky-100/70 animate-water-shimmer" />
              <span className="h-0.5 w-16 rounded-full bg-sky-100/60 animate-water-shimmer" />
              <span className="h-0.5 w-12 rounded-full bg-sky-100/70 animate-water-shimmer" />
              <span className="h-0.5 w-14 rounded-full bg-sky-100/60 animate-water-shimmer" />
            </div>
            {/* Stone Footbridge across the river */}
            <div className="absolute inset-y-0 left-1/2 w-14 -translate-x-1/2 border-x-2 border-stone-700 bg-stone-300 shadow-xs" />
          </div>

          {/* Outskirt Pine Groves Framing the City */}
          <PineTreeMarker className="pointer-events-none absolute top-2 left-2 h-6 w-6" />
          <PineTreeMarker className="pointer-events-none absolute top-2 left-9 h-5 w-5" />
          <PineTreeMarker className="pointer-events-none absolute top-2 right-2 h-6 w-6" />
          <PineTreeMarker className="pointer-events-none absolute top-2 right-9 h-5 w-5" />
          <PineTreeMarker className="pointer-events-none absolute bottom-7 left-2 h-6 w-6" />
          <PineTreeMarker className="pointer-events-none absolute bottom-7 right-2 h-6 w-6" />

          {/* Subtle Drifting Cloud Shadow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 left-0 h-32 w-56 rounded-full bg-slate-900/10 blur-xl animate-cloud-drift"
          />

          {/* Paved Asphalt Avenue Network surrounding the 15x15 city blocks */}
          <div className="relative z-10 rounded-xl border-2 border-stone-500/90 bg-[#3B4252] p-2.5 shadow-md">
            <div className="w-full">
              {/* Top Perimeter Avenue with Animated Commuter Car */}
              <div
                aria-hidden="true"
                className="pointer-events-none relative mb-2 h-2.5 w-full overflow-hidden rounded bg-[#2E3440]"
              >
                <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-amber-300/70" />
                <div
                  style={{ animation: "car-cruise-h 12s linear infinite" }}
                  className="absolute top-0.5 h-1.5 w-3.5 rounded-xs bg-amber-400 shadow-xs"
                />
              </div>

              <div
                style={{
                  gridTemplateColumns: `repeat(${CITY_GRID_DIM}, minmax(0, 1fr))`,
                }}
                className="grid gap-1"
              >
                {lots.map((lot) => {
                  const isSelected = selectedLotIndex === lot.index;
                  const isEmpty = lot.building === null;
                  const parkBonus =
                    lot.building === "house"
                      ? getAdjacentParkBonusForLot(lots, lot.index)
                      : 0;
                  const justBuilt = lastBuiltLot?.index === lot.index;

                  return (
                    <button
                      key={lot.index}
                      type="button"
                      onClick={() => onLotClick(lot.index)}
                      aria-label={
                        lot.building
                          ? `${BUILDING_DEFS[lot.building].name} Level ${lot.level} at plot ${lot.index + 1}`
                          : `Empty plot ${lot.index + 1}, click to build ${blueprintDef.name}`
                      }
                      className={`group relative flex aspect-square flex-col items-center justify-center rounded-md border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.95] ${
                        isEmpty
                          ? canAffordBlueprint
                            ? "border-emerald-800/45 bg-gradient-to-b from-[#CCE5BE] to-[#B7D8A7] shadow-inner hover:border-emerald-900 hover:from-[#D7ECCB] hover:to-[#C1DFB2]"
                            : "border-emerald-900/30 bg-gradient-to-b from-[#D7E4CE] to-[#C8D8BE] shadow-inner hover:from-[#DFEBD6]"
                          : isSelected
                            ? "border-blue-600 bg-gradient-to-b from-[#FFFDF9] to-[#F3ECE0] ring-2 ring-blue-500/45 shadow-md"
                            : "border-stone-400/90 bg-gradient-to-b from-[#FAF6EE] to-[#ECE4D5] shadow-sm hover:border-stone-500"
                      }`}
                    >
                      {isEmpty ? (
                        <div className="flex flex-col items-center text-emerald-950/45 transition-transform duration-150 group-hover:scale-110 group-hover:text-emerald-950">
                          <Plus className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <>
                          {justBuilt && (
                            <span
                              key={`ring-${lastBuiltLot.token}`}
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-0.5 rounded-full border-2 border-amber-400 animate-dust-ring"
                            />
                          )}
                          <div
                            key={
                              justBuilt
                                ? `b-${lastBuiltLot.token}`
                                : `b-${lot.index}`
                            }
                            className={`flex h-full w-full items-center justify-center p-0.5 ${justBuilt ? "animate-build-drop" : ""}`}
                          >
                            <BuildingSvg
                              type={lot.building!}
                              level={lot.level}
                              className="h-[88%] w-[88%] drop-shadow-xs"
                            />
                          </div>
                          <span
                            className={`pointer-events-none absolute right-0.5 bottom-0.5 rounded-[3px] px-0.5 font-mono text-[9px] font-bold leading-none tabular-nums ${
                              lot.level >= 6
                                ? "bg-amber-500/30 text-amber-950"
                                : lot.level >= 4
                                  ? "bg-sky-600/20 text-sky-950"
                                  : "bg-stone-900/15 text-slate-900"
                            }`}
                          >
                            L{lot.level}
                          </span>
                          {parkBonus > 0 && (
                            <span className="pointer-events-none absolute top-0.5 right-0.5 rounded-[3px] bg-emerald-600/20 px-0.5 font-mono text-[8px] font-bold leading-none text-emerald-900 tabular-nums">
                              +{parkBonus}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Bottom Perimeter Avenue with Animated Car */}
              <div
                aria-hidden="true"
                className="pointer-events-none relative mt-2 h-2.5 w-full overflow-hidden rounded bg-[#2E3440]"
              >
                <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 border-t border-dashed border-amber-300/70" />
                <div
                  style={{ animation: "car-cruise-h-rev 15s linear infinite" }}
                  className="absolute top-0.5 h-1.5 w-3.5 rounded-xs bg-rose-400 shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
