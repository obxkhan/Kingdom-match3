import { ArrowUpRight, CheckCircle2, Crown, Sparkles, Star, Trees, Users, X } from "lucide-react";
import type { CityStats } from "../types/game";
import {
  canPrestigeCity,
  getPrestigePopulationMultiplier,
  getPrestigeRequirements,
  getPrestigeResourceMultiplier,
  getPrestigeStartingResources,
} from "../utils/city";

interface PrestigeModalProps {
  open: boolean;
  prestigeLevel: number;
  stats: CityStats;
  bestPopulation: number;
  onClose: () => void;
  onPrestige: () => void;
}

export function PrestigeModal({
  open,
  prestigeLevel,
  stats,
  bestPopulation,
  onClose,
  onPrestige,
}: PrestigeModalProps) {
  if (!open) return null;

  const { requiredPop, requiredHallLevel } = getPrestigeRequirements(prestigeLevel);
  const ready = canPrestigeCity(stats, prestigeLevel);

  const curResPct = Math.round((getPrestigeResourceMultiplier(prestigeLevel) - 1) * 100);
  const curPopPct = Math.round((getPrestigePopulationMultiplier(prestigeLevel) - 1) * 100);
  const curVault = getPrestigeStartingResources(prestigeLevel);

  const nextLevel = prestigeLevel + 1;
  const nextResPct = Math.round((getPrestigeResourceMultiplier(nextLevel) - 1) * 100);
  const nextPopPct = Math.round((getPrestigePopulationMultiplier(nextLevel) - 1) * 100);
  const nextVault = getPrestigeStartingResources(nextLevel);

  const popProgress = Math.min(100, Math.round((stats.population / requiredPop) * 100));
  const hallProgress = Math.min(
    100,
    Math.round((stats.townHallLevel / requiredHallLevel) * 100)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prestige-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-[#D4CBB8] bg-[#FAF7F0] p-6 text-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-300 bg-amber-100 text-amber-700">
              <Star className="h-5 w-5 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="prestige-modal-title"
                  className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-slate-900"
                >
                  City Prestige
                </h2>
                <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-xs font-bold text-amber-900">
                  Tier {prestigeLevel}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Ascend your metropolis to earn permanent resource, population, and vault bonuses.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close prestige modal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#DDD5C7] bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Active vs Next Tier Perks */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[#DDD5C7] bg-white p-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Current Perks (Tier {prestigeLevel})
            </div>
            <ul className="mt-2.5 space-y-2 text-xs text-slate-700">
              <li className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <Trees className="h-3.5 w-3.5 text-emerald-700" />
                  Resource Yield
                </span>
                <strong className="font-mono text-slate-900">
                  +{curResPct}%
                </strong>
              </li>
              <li className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-rose-700" />
                  Population Boost
                </span>
                <strong className="font-mono text-slate-900">
                  +{curPopPct}%
                </strong>
              </li>
              <li className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  Starting Vault
                </span>
                <strong className="font-mono text-[11px] text-slate-900">
                  {curVault.timber}/{curVault.brick}/{curVault.gold}/{curVault.power}
                </strong>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-amber-900">
                Next Tier (Tier {nextLevel})
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-amber-700" />
            </div>
            <ul className="mt-2.5 space-y-2 text-xs text-amber-950">
              <li className="flex items-center justify-between">
                <span>Resource Yield</span>
                <strong className="font-mono text-emerald-800">
                  +{nextResPct}%
                </strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Population Boost</span>
                <strong className="font-mono text-emerald-800">
                  +{nextPopPct}%
                </strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Starting Vault</span>
                <strong className="font-mono text-[11px] text-amber-950">
                  {nextVault.timber}/{nextVault.brick}/{nextVault.gold}/{nextVault.power}
                </strong>
              </li>
            </ul>
          </div>
        </div>

        {/* Ascension Requirements */}
        <div className="mt-4 rounded-xl border border-[#DDD5C7] bg-white p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wide text-slate-700">
              Requirements for Tier {nextLevel}
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              All-time Best Pop: {bestPopulation.toLocaleString()}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <Users className="h-3.5 w-3.5 text-rose-700" />
                  City Population
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums">
                  {stats.population >= requiredPop && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                  <span
                    className={
                      stats.population >= requiredPop
                        ? "text-emerald-700"
                        : "text-slate-800"
                    }
                  >
                    {stats.population.toLocaleString()} / {requiredPop.toLocaleString()}
                  </span>
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${popProgress}%` }}
                  className={`h-full transition-all duration-300 ${
                    stats.population >= requiredPop
                      ? "bg-emerald-600"
                      : "bg-blue-600"
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <Crown className="h-3.5 w-3.5 text-blue-700" />
                  Town Hall Level
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums">
                  {stats.townHallLevel >= requiredHallLevel && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                  <span
                    className={
                      stats.townHallLevel >= requiredHallLevel
                        ? "text-emerald-700"
                        : "text-slate-800"
                    }
                  >
                    Lv.{stats.townHallLevel} / Lv.{requiredHallLevel}
                  </span>
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: `${hallProgress}%` }}
                  className={`h-full transition-all duration-300 ${
                    stats.townHallLevel >= requiredHallLevel
                      ? "bg-emerald-600"
                      : "bg-amber-500"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer & Action */}
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#E4DDD0] pt-4">
          <p className="text-[11px] leading-relaxed text-slate-600">
            Ascending resets your city plots, resources, and turn counter to rebuild stronger, while keeping your Prestige Tier and Best Population forever.
          </p>

          <button
            type="button"
            disabled={!ready}
            onClick={onPrestige}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 whitespace-nowrap ${
              ready
                ? "bg-amber-600 text-white shadow-sm hover:bg-amber-700"
                : "cursor-not-allowed bg-slate-200 text-slate-500"
            }`}
          >
            <Star className="h-4 w-4 fill-current" />
            <span>{ready ? `Ascend to Tier ${nextLevel}` : "Requirements Not Met"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
