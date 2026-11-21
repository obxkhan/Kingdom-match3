export type GameState = "TITLE_MENU" | "PLAYING" | "GAME_OVER";

export type GameMode = "challenge" | "endless";

export type ResourceType = "timber" | "brick" | "gold" | "power" | "civic";

export type TileSpecial = "none" | "row" | "col" | "bomb";

export interface MatchTile {
  id: string;
  type: ResourceType;
  special: TileSpecial;
  isNew?: boolean;
}

export interface BoardCoord {
  r: number;
  c: number;
}

export interface ClearBurstEffect {
  id: string;
  kind: "row" | "col" | "bomb";
  r: number;
  c: number;
}

export type BuildingType =
  | "house"
  | "mill"
  | "brickworks"
  | "solar"
  | "park"
  | "market"
  | "school"
  | "station"
  | "observatory"
  | "townhall";

export interface CityLot {
  index: number;
  building: BuildingType | null;
  level: number;
}

export interface ResourceCost {
  timber: number;
  brick: number;
  gold: number;
  power: number;
}

export interface Resources {
  timber: number;
  brick: number;
  gold: number;
  power: number;
}

export interface CityStats {
  population: number;
  happiness: number;
  powerUsed: number;
  powerCapacity: number;
  goldPerCycle: number;
  timberBonus: number;
  brickBonus: number;
  townHallLevel: number;
  buildingCount: number;
  cityRank: string;
}

export interface FloatingGain {
  id: string;
  label: string;
  colorClass: string;
  r: number;
  c: number;
}
