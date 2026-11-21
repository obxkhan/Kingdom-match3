import { useEffect, useState } from "react";
import type { ResourceType } from "../types/game";
import { loadSpriteSheetRegions, type NormalizedRegion } from "./spriteSheet";

export const TILE_SPRITE_SHEET_SRC =
  "/assets/aistudio/file_0000000029dc820bbe0d32afbdbb2d13_4b2dc70f.png";

export type TileSpriteMap = Partial<Record<ResourceType, string>>;

const SPRITE_REGIONS: Record<ResourceType, NormalizedRegion> = {
  timber: { x0: 0.0, y0: 0.0, x1: 0.35, y1: 0.47 },
  brick: { x0: 0.35, y0: 0.0, x1: 0.67, y1: 0.47 },
  gold: { x0: 0.67, y0: 0.0, x1: 1.0, y1: 0.47 },
  power: { x0: 0.0, y0: 0.48, x1: 0.49, y1: 1.0 },
  civic: { x0: 0.49, y0: 0.48, x1: 1.0, y1: 1.0 },
};

let cachedPromise: Promise<TileSpriteMap> | null = null;
let cachedResult: TileSpriteMap | null = null;

function loadTileSprites(): Promise<TileSpriteMap> {
  if (cachedResult) return Promise.resolve(cachedResult);
  if (cachedPromise) return cachedPromise;

  cachedPromise = loadSpriteSheetRegions(TILE_SPRITE_SHEET_SRC, SPRITE_REGIONS, {
    stripWhiteBackground: true,
    pad: 3,
  }).then((loaded) => {
    if (Object.keys(loaded).length > 0) {
      cachedResult = loaded;
    }
    return loaded;
  });

  return cachedPromise;
}

export function useTileSprites(): TileSpriteMap {
  const [sprites, setSprites] = useState<TileSpriteMap>(() => cachedResult ?? {});

  useEffect(() => {
    if (cachedResult) {
      setSprites(cachedResult);
      return;
    }
    let active = true;
    void loadTileSprites().then((loaded) => {
      if (active) setSprites(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  return sprites;
}
