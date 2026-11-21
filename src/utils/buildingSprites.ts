import { useEffect, useState } from "react";
import townhallSpriteSrc from "../assets/images/townhall_sprite_1795219018876.jpg";
import type { BuildingType } from "../types/game";
import { loadSpriteSheetRegions, type NormalizedRegion } from "./spriteSheet";

export const BUILDING_SPRITE_SHEET_SRC =
  "/assets/aistudio/file_000000000fa8820bbe767cb07257e8f5_9f774962.png";

export type BuildingSpriteMap = Partial<Record<BuildingType, string>>;

const BUILDING_SPRITE_REGIONS: Partial<Record<BuildingType, NormalizedRegion>> = {
  house: { x0: 0.04, y0: 0.0, x1: 0.35, y1: 0.332 },
  park: { x0: 0.35, y0: 0.0, x1: 0.658, y1: 0.33 },
  market: { x0: 0.658, y0: 0.0, x1: 0.96, y1: 0.328 },
  mill: { x0: 0.04, y0: 0.332, x1: 0.35, y1: 0.645 },
  brickworks: { x0: 0.35, y0: 0.33, x1: 0.658, y1: 0.67 },
  solar: { x0: 0.658, y0: 0.328, x1: 0.96, y1: 0.658 },
  school: { x0: 0.04, y0: 0.645, x1: 0.35, y1: 1.0 },
  station: { x0: 0.35, y0: 0.67, x1: 0.658, y1: 1.0 },
  observatory: { x0: 0.658, y0: 0.658, x1: 0.96, y1: 1.0 },
};

const TOWN_HALL_REGION: Partial<Record<BuildingType, NormalizedRegion>> = {
  townhall: { x0: 0.0, y0: 0.0, x1: 1.0, y1: 1.0 },
};

let cachedPromise: Promise<BuildingSpriteMap> | null = null;
let cachedResult: BuildingSpriteMap | null = null;

function loadBuildingSprites(): Promise<BuildingSpriteMap> {
  if (cachedResult) return Promise.resolve(cachedResult);
  if (cachedPromise) return cachedPromise;

  cachedPromise = Promise.all([
    loadSpriteSheetRegions(BUILDING_SPRITE_SHEET_SRC, BUILDING_SPRITE_REGIONS, {
      stripWhiteBackground: false,
      pad: 4,
    }),
    loadSpriteSheetRegions(townhallSpriteSrc, TOWN_HALL_REGION, {
      stripWhiteBackground: true,
      pad: 4,
    }),
  ]).then(([sheetSprites, townHallSprites]) => {
    const merged: BuildingSpriteMap = {
      ...sheetSprites,
      ...townHallSprites,
    };
    if (Object.keys(merged).length > 0) {
      cachedResult = merged;
    }
    return merged;
  });

  return cachedPromise;
}

export function useBuildingSprites(): BuildingSpriteMap {
  const [sprites, setSprites] = useState<BuildingSpriteMap>(
    () => cachedResult ?? {}
  );

  useEffect(() => {
    if (cachedResult) {
      setSprites(cachedResult);
      return;
    }
    let active = true;
    void loadBuildingSprites().then((loaded) => {
      if (active) setSprites(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  return sprites;
}
