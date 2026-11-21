import type {
  BuildingType,
  CityLot,
  CityStats,
  ResourceCost,
  Resources,
} from "../types/game";

export const CITY_GRID_DIM = 15;
export const CITY_LOT_COUNT = CITY_GRID_DIM * CITY_GRID_DIM;
export const TOWN_HALL_LOT_INDEX = 112; // Row 7, Col 7 in 15x15
export const MAX_BUILDING_LEVEL = 8;

export const PAYDAY_INTERVAL = 2;

export interface BuildingDefinition {
  type: BuildingType;
  name: string;
  shortDesc: string;
  maxLevel: number;
  buildableFromPalette: boolean;
  costsByLevel: Record<number, ResourceCost>;
  effectSummaryByLevel: Record<number, string>;
}

export const BUILDING_DEFS: Record<BuildingType, BuildingDefinition> = {
  house: {
    type: "house",
    name: "Residence",
    shortDesc: "Adds citizens & Gold. +30 Pop per adjacent Park or School level.",
    maxLevel: 6,
    buildableFromPalette: true,
    costsByLevel: {
      1: { timber: 4, brick: 3, gold: 5, power: 1 },
      2: { timber: 8, brick: 6, gold: 10, power: 2 },
      3: { timber: 14, brick: 12, gold: 18, power: 3 },
      4: { timber: 22, brick: 20, gold: 28, power: 4 },
      5: { timber: 34, brick: 30, gold: 44, power: 6 },
      6: { timber: 50, brick: 44, gold: 65, power: 8 },
    },
    effectSummaryByLevel: {
      1: "+55 Pop · +8 Gold / payday",
      2: "+125 Pop · +18 Gold / payday",
      3: "+240 Pop · +32 Gold / payday",
      4: "+410 Pop · +52 Gold / payday",
      5: "+640 Pop · +78 Gold / payday",
      6: "+950 Pop · +112 Gold / payday",
    },
  },
  park: {
    type: "park",
    name: "City Park",
    shortDesc: "Boosts Happiness & adds +30 Pop per level to nearby Residences.",
    maxLevel: 6,
    buildableFromPalette: true,
    costsByLevel: {
      1: { timber: 3, brick: 2, gold: 4, power: 0 },
      2: { timber: 6, brick: 4, gold: 8, power: 0 },
      3: { timber: 10, brick: 8, gold: 14, power: 1 },
      4: { timber: 16, brick: 14, gold: 22, power: 1 },
      5: { timber: 24, brick: 22, gold: 34, power: 2 },
      6: { timber: 36, brick: 32, gold: 50, power: 3 },
    },
    effectSummaryByLevel: {
      1: "+12% Happiness · +30 Adj. Pop",
      2: "+24% Happiness · +60 Adj. Pop",
      3: "+38% Happiness · +90 Adj. Pop",
      4: "+54% Happiness · +120 Adj. Pop",
      5: "+72% Happiness · +150 Adj. Pop",
      6: "+95% Happiness · +180 Adj. Pop",
    },
  },
  market: {
    type: "market",
    name: "Market",
    shortDesc: "Bustling bazaar producing generous Gold every payday.",
    maxLevel: 6,
    buildableFromPalette: true,
    costsByLevel: {
      1: { timber: 4, brick: 4, gold: 4, power: 1 },
      2: { timber: 8, brick: 8, gold: 10, power: 2 },
      3: { timber: 14, brick: 14, gold: 18, power: 3 },
      4: { timber: 22, brick: 22, gold: 28, power: 4 },
      5: { timber: 34, brick: 34, gold: 42, power: 6 },
      6: { timber: 50, brick: 48, gold: 64, power: 8 },
    },
    effectSummaryByLevel: {
      1: "+25 Pop · +16 Gold / payday",
      2: "+60 Pop · +32 Gold / payday",
      3: "+110 Pop · +55 Gold / payday",
      4: "+185 Pop · +86 Gold / payday",
      5: "+290 Pop · +126 Gold / payday",
      6: "+430 Pop · +178 Gold / payday",
    },
  },
  mill: {
    type: "mill",
    name: "Lumber Mill",
    shortDesc: "Boosts Timber gained per match & produces Timber every payday.",
    maxLevel: 6,
    buildableFromPalette: true,
    costsByLevel: {
      1: { timber: 2, brick: 4, gold: 4, power: 1 },
      2: { timber: 5, brick: 8, gold: 9, power: 2 },
      3: { timber: 9, brick: 14, gold: 16, power: 3 },
      4: { timber: 15, brick: 22, gold: 26, power: 4 },
      5: { timber: 24, brick: 34, gold: 40, power: 6 },
      6: { timber: 36, brick: 50, gold: 60, power: 8 },
    },
    effectSummaryByLevel: {
      1: "+5 Timber / match · +6 / payday",
      2: "+10 Timber / match · +14 / payday",
      3: "+16 Timber / match · +24 / payday",
      4: "+24 Timber / match · +38 / payday",
      5: "+34 Timber / match · +56 / payday",
      6: "+46 Timber / match · +78 / payday",
    },
  },
  brickworks: {
    type: "brickworks",
    name: "Brickworks",
    shortDesc: "Boosts Brick gained per match & produces Brick every payday.",
    maxLevel: 6,
    buildableFromPalette: true,
    costsByLevel: {
      1: { timber: 4, brick: 2, gold: 4, power: 1 },
      2: { timber: 8, brick: 5, gold: 9, power: 2 },
      3: { timber: 14, brick: 9, gold: 16, power: 3 },
      4: { timber: 22, brick: 15, gold: 26, power: 4 },
      5: { timber: 34, brick: 24, gold: 40, power: 6 },
      6: { timber: 50, brick: 36, gold: 60, power: 8 },
    },
    effectSummaryByLevel: {
      1: "+5 Brick / match · +6 / payday",
      2: "+10 Brick / match · +14 / payday",
      3: "+16 Brick / match · +24 / payday",
      4: "+24 Brick / match · +38 / payday",
      5: "+34 Brick / match · +56 / payday",
      6: "+46 Brick / match · +78 / payday",
    },
  },
  solar: {
    type: "solar",
    name: "Solar Hub",
    shortDesc: "Generates clean Power every payday + instant Power on build.",
    maxLevel: 6,
    buildableFromPalette: true,
    costsByLevel: {
      1: { timber: 3, brick: 4, gold: 5, power: 0 },
      2: { timber: 6, brick: 8, gold: 10, power: 0 },
      3: { timber: 10, brick: 14, gold: 18, power: 0 },
      4: { timber: 16, brick: 22, gold: 28, power: 0 },
      5: { timber: 26, brick: 34, gold: 44, power: 0 },
      6: { timber: 38, brick: 50, gold: 66, power: 0 },
    },
    effectSummaryByLevel: {
      1: "+8 Power / payday (+6 instant)",
      2: "+16 Power / payday (+10 instant)",
      3: "+28 Power / payday (+16 instant)",
      4: "+44 Power / payday (+24 instant)",
      5: "+64 Power / payday (+34 instant)",
      6: "+90 Power / payday (+48 instant)",
    },
  },
  school: {
    type: "school",
    name: "Academy",
    shortDesc: "Educates citizens, lifts Happiness & boosts nearby Residences.",
    maxLevel: 6,
    buildableFromPalette: true,
    costsByLevel: {
      1: { timber: 5, brick: 5, gold: 6, power: 1 },
      2: { timber: 10, brick: 10, gold: 12, power: 2 },
      3: { timber: 16, brick: 16, gold: 20, power: 3 },
      4: { timber: 24, brick: 24, gold: 32, power: 5 },
      5: { timber: 36, brick: 36, gold: 48, power: 7 },
      6: { timber: 52, brick: 52, gold: 72, power: 9 },
    },
    effectSummaryByLevel: {
      1: "+65 Pop · +10% Happy · +30 Adj.",
      2: "+140 Pop · +20% Happy · +60 Adj.",
      3: "+240 Pop · +32% Happy · +90 Adj.",
      4: "+380 Pop · +46% Happy · +120 Adj.",
      5: "+560 Pop · +62% Happy · +150 Adj.",
      6: "+800 Pop · +82% Happy · +180 Adj.",
    },
  },
  station: {
    type: "station",
    name: "Transit Hub",
    shortDesc: "Connects commuters for high Population & steady Gold income.",
    maxLevel: 6,
    buildableFromPalette: true,
    costsByLevel: {
      1: { timber: 5, brick: 6, gold: 8, power: 2 },
      2: { timber: 10, brick: 12, gold: 16, power: 4 },
      3: { timber: 16, brick: 20, gold: 26, power: 6 },
      4: { timber: 26, brick: 30, gold: 40, power: 8 },
      5: { timber: 40, brick: 44, gold: 60, power: 11 },
      6: { timber: 58, brick: 64, gold: 88, power: 14 },
    },
    effectSummaryByLevel: {
      1: "+95 Pop · +12 Gold / payday",
      2: "+200 Pop · +25 Gold / payday",
      3: "+340 Pop · +42 Gold / payday",
      4: "+530 Pop · +66 Gold / payday",
      5: "+780 Pop · +98 Gold / payday",
      6: "+1100 Pop · +140 Gold / payday",
    },
  },
  observatory: {
    type: "observatory",
    name: "Observatory",
    shortDesc: "Grand landmark inspiring massive Population & city Happiness.",
    maxLevel: 6,
    buildableFromPalette: true,
    costsByLevel: {
      1: { timber: 6, brick: 8, gold: 10, power: 2 },
      2: { timber: 12, brick: 15, gold: 20, power: 4 },
      3: { timber: 20, brick: 24, gold: 32, power: 6 },
      4: { timber: 32, brick: 36, gold: 48, power: 9 },
      5: { timber: 46, brick: 54, gold: 72, power: 12 },
      6: { timber: 68, brick: 78, gold: 104, power: 16 },
    },
    effectSummaryByLevel: {
      1: "+140 Pop · +16% Happiness",
      2: "+290 Pop · +30% Happiness",
      3: "+500 Pop · +48% Happiness",
      4: "+780 Pop · +68% Happiness",
      5: "+1150 Pop · +92% Happiness",
      6: "+1650 Pop · +120% Happiness",
    },
  },
  townhall: {
    type: "townhall",
    name: "Town Hall",
    shortDesc: "The civic heart of TileTown. Upgrade to unlock prestige tiers.",
    maxLevel: 8,
    buildableFromPalette: false,
    costsByLevel: {
      1: { timber: 0, brick: 0, gold: 0, power: 0 },
      2: { timber: 10, brick: 10, gold: 14, power: 3 },
      3: { timber: 18, brick: 18, gold: 26, power: 5 },
      4: { timber: 28, brick: 28, gold: 42, power: 8 },
      5: { timber: 42, brick: 42, gold: 64, power: 11 },
      6: { timber: 62, brick: 62, gold: 94, power: 15 },
      7: { timber: 88, brick: 88, gold: 135, power: 20 },
      8: { timber: 125, brick: 125, gold: 190, power: 26 },
    },
    effectSummaryByLevel: {
      1: "+60 Pop · +8 Gold / payday",
      2: "+150 Pop · +18 Gold / payday",
      3: "+300 Pop · +32 Gold / payday",
      4: "+520 Pop · +55 Gold / payday",
      5: "+820 Pop · +85 Gold / payday",
      6: "+1220 Pop · +125 Gold / payday",
      7: "+1750 Pop · +178 Gold / payday",
      8: "+2500 Pop · +245 Gold / payday",
    },
  },
};

export const SOLAR_INSTANT_POWER_BY_LEVEL = [0, 6, 10, 16, 24, 34, 48];

export const PALETTE_BUILDINGS: BuildingType[] = [
  "house",
  "park",
  "market",
  "mill",
  "brickworks",
  "solar",
  "school",
  "station",
  "observatory",
];

export function getPrestigeResourceMultiplier(prestigeLevel: number): number {
  return 1 + Math.max(0, prestigeLevel) * 0.25;
}

export function getPrestigePopulationMultiplier(prestigeLevel: number): number {
  return 1 + Math.max(0, prestigeLevel) * 0.15;
}

export function getPrestigeStartingResources(prestigeLevel: number): Resources {
  const tier = Math.max(0, prestigeLevel);
  return {
    timber: 50 + tier * 25,
    brick: 50 + tier * 25,
    gold: 70 + tier * 40,
    power: 25 + tier * 15,
  };
}

export function getPrestigeRequirements(prestigeLevel: number): {
  requiredPop: number;
  requiredHallLevel: number;
} {
  const tier = Math.max(0, prestigeLevel);
  return {
    requiredPop: 2500 + tier * 2500,
    requiredHallLevel: Math.min(8, 3 + tier),
  };
}

export function canPrestigeCity(
  stats: CityStats,
  prestigeLevel: number
): boolean {
  const req = getPrestigeRequirements(prestigeLevel);
  return (
    stats.population >= req.requiredPop &&
    stats.townHallLevel >= req.requiredHallLevel
  );
}

export function createInitialCityLots(): CityLot[] {
  const lots: CityLot[] = [];
  for (let i = 0; i < CITY_LOT_COUNT; i += 1) {
    if (i === TOWN_HALL_LOT_INDEX) {
      lots.push({ index: i, building: "townhall", level: 1 });
    } else {
      lots.push({ index: i, building: null, level: 0 });
    }
  }
  return lots;
}

export function createInitialResources(prestigeLevel = 0): Resources {
  return getPrestigeStartingResources(prestigeLevel);
}

export function canAfford(resources: Resources, cost: ResourceCost): boolean {
  return (
    resources.timber >= cost.timber &&
    resources.brick >= cost.brick &&
    resources.gold >= cost.gold &&
    resources.power >= cost.power
  );
}

export function subtractCost(
  resources: Resources,
  cost: ResourceCost
): Resources {
  return {
    timber: resources.timber - cost.timber,
    brick: resources.brick - cost.brick,
    gold: resources.gold - cost.gold,
    power: resources.power - cost.power,
  };
}

export function getRefundForLot(lot: CityLot): Resources {
  if (!lot.building || lot.level <= 0) {
    return { timber: 0, brick: 0, gold: 0, power: 0 };
  }
  const def = BUILDING_DEFS[lot.building];
  const cost = def.costsByLevel[lot.level] ?? {
    timber: 0,
    brick: 0,
    gold: 0,
    power: 0,
  };
  return {
    timber: Math.floor(cost.timber * 0.75),
    brick: Math.floor(cost.brick * 0.75),
    gold: Math.floor(cost.gold * 0.75),
    power: Math.floor(cost.power * 0.75),
  };
}

export function getAdjacentIndices(index: number): number[] {
  const r = Math.floor(index / CITY_GRID_DIM);
  const c = index % CITY_GRID_DIM;
  const out: number[] = [];
  if (r > 0) out.push((r - 1) * CITY_GRID_DIM + c);
  if (r < CITY_GRID_DIM - 1) out.push((r + 1) * CITY_GRID_DIM + c);
  if (c > 0) out.push(r * CITY_GRID_DIM + (c - 1));
  if (c < CITY_GRID_DIM - 1) out.push(r * CITY_GRID_DIM + (c + 1));
  return out;
}

export function getAdjacentParkBonusForLot(
  lots: CityLot[],
  index: number
): number {
  const lot = lots[index];
  if (!lot || lot.building !== "house") return 0;
  let bonus = 0;
  for (const adjIdx of getAdjacentIndices(index)) {
    const adj = lots[adjIdx];
    if (adj?.building === "park" || adj?.building === "school") {
      bonus += adj.level * 30;
    }
  }
  return bonus;
}

export function computePaydayIncome(
  lots: CityLot[],
  prestigeLevel = 0
): Resources {
  const income: Resources = { timber: 0, brick: 0, gold: 0, power: 0 };
  const houseGold = [0, 8, 18, 32, 52, 78, 112];
  const marketGold = [0, 16, 32, 55, 86, 126, 178];
  const stationGold = [0, 12, 25, 42, 66, 98, 140];
  const townhallGold = [0, 8, 18, 32, 55, 85, 125, 178, 245];
  const factoryProd = [0, 6, 14, 24, 38, 56, 78];
  const solarProd = [0, 8, 16, 28, 44, 64, 90];

  for (const lot of lots) {
    if (!lot.building || lot.level <= 0) continue;
    if (lot.building === "house") {
      income.gold += houseGold[lot.level] ?? 0;
    } else if (lot.building === "market") {
      income.gold += marketGold[lot.level] ?? 0;
    } else if (lot.building === "station") {
      income.gold += stationGold[lot.level] ?? 0;
    } else if (lot.building === "townhall") {
      income.gold += townhallGold[lot.level] ?? 0;
    } else if (lot.building === "mill") {
      income.timber += factoryProd[lot.level] ?? 0;
    } else if (lot.building === "brickworks") {
      income.brick += factoryProd[lot.level] ?? 0;
    } else if (lot.building === "solar") {
      income.power += solarProd[lot.level] ?? 0;
    }
  }

  const mult = getPrestigeResourceMultiplier(prestigeLevel);
  if (mult === 1) return income;

  return {
    timber: Math.round(income.timber * mult),
    brick: Math.round(income.brick * mult),
    gold: Math.round(income.gold * mult),
    power: Math.round(income.power * mult),
  };
}

export function computeCityStats(
  lots: CityLot[],
  civicPopFromMatches: number,
  prestigeLevel = 0
): CityStats {
  let basePop = civicPopFromMatches;
  let happiness = 100;
  let powerUsed = 0;
  let powerCapacity = 6;
  let timberBonus = 0;
  let brickBonus = 0;
  let townHallLevel = 1;
  let buildingCount = 0;

  const housePop = [0, 55, 125, 240, 410, 640, 950];
  const marketPop = [0, 25, 60, 110, 185, 290, 430];
  const schoolPop = [0, 65, 140, 240, 380, 560, 800];
  const stationPop = [0, 95, 200, 340, 530, 780, 1100];
  const observatoryPop = [0, 140, 290, 500, 780, 1150, 1650];
  const townhallPop = [0, 60, 150, 300, 520, 820, 1220, 1750, 2500];

  const parkHappiness = [0, 12, 24, 38, 54, 72, 95];
  const schoolHappiness = [0, 10, 20, 32, 46, 62, 82];
  const obsHappiness = [0, 16, 30, 48, 68, 92, 120];
  const millMatchBonus = [0, 5, 10, 16, 24, 34, 46];
  const solarCap = [0, 8, 16, 28, 44, 64, 90];

  for (const lot of lots) {
    if (!lot.building || lot.level <= 0) continue;
    buildingCount += 1;

    switch (lot.building) {
      case "house": {
        basePop += housePop[lot.level] ?? 0;
        basePop += getAdjacentParkBonusForLot(lots, lot.index);
        powerUsed += lot.level;
        break;
      }
      case "park": {
        happiness += parkHappiness[lot.level] ?? 0;
        break;
      }
      case "market": {
        basePop += marketPop[lot.level] ?? 0;
        powerUsed += lot.level;
        break;
      }
      case "school": {
        basePop += schoolPop[lot.level] ?? 0;
        happiness += schoolHappiness[lot.level] ?? 0;
        powerUsed += lot.level;
        break;
      }
      case "station": {
        basePop += stationPop[lot.level] ?? 0;
        powerUsed += lot.level * 2;
        break;
      }
      case "observatory": {
        basePop += observatoryPop[lot.level] ?? 0;
        happiness += obsHappiness[lot.level] ?? 0;
        powerUsed += lot.level * 2;
        break;
      }
      case "mill": {
        timberBonus += millMatchBonus[lot.level] ?? 0;
        powerUsed += lot.level;
        break;
      }
      case "brickworks": {
        brickBonus += millMatchBonus[lot.level] ?? 0;
        powerUsed += lot.level;
        break;
      }
      case "solar": {
        powerCapacity += solarCap[lot.level] ?? 0;
        break;
      }
      case "townhall": {
        townHallLevel = lot.level;
        basePop += townhallPop[lot.level] ?? 0;
        powerUsed += lot.level;
        break;
      }
    }
  }

  const popMult = getPrestigePopulationMultiplier(prestigeLevel);
  const population = Math.round(basePop * (happiness / 100) * popMult);
  const income = computePaydayIncome(lots, prestigeLevel);

  let cityRank = "Hamlet";
  if (population >= 40000) {
    cityRank = "Celestial Empire";
  } else if (population >= 15000) {
    cityRank = "Grand Citadel";
  } else if (population >= 5000) {
    cityRank = "Utopia";
  } else if (population >= 2500) {
    cityRank = "Megacity";
  } else if (population >= 1000) {
    cityRank = "Metropolis";
  } else if (population >= 450) {
    cityRank = "Thriving City";
  } else if (population >= 200) {
    cityRank = "Market Town";
  } else if (population >= 90) {
    cityRank = "Village";
  }

  return {
    population,
    happiness,
    powerUsed,
    powerCapacity,
    goldPerCycle: income.gold,
    timberBonus,
    brickBonus,
    townHallLevel,
    buildingCount,
    cityRank,
  };
}
