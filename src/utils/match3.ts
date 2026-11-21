import type {
  BoardCoord,
  MatchTile,
  ResourceType,
  TileSpecial,
} from "../types/game";

export const BOARD_SIZE = 15;

export const RESOURCE_TYPES: ResourceType[] = [
  "timber",
  "brick",
  "gold",
  "power",
  "civic",
];

let tileSeq = 0;

export function nextTileId(): string {
  tileSeq += 1;
  return `t-${tileSeq}-${Math.random().toString(36).slice(2, 6)}`;
}

export function randomResourceType(exclude: ResourceType[] = []): ResourceType {
  const pool = RESOURCE_TYPES.filter((r) => !exclude.includes(r));
  const list = pool.length > 0 ? pool : RESOURCE_TYPES;
  return list[Math.floor(Math.random() * list.length)];
}

export function cloneBoard(board: MatchTile[][]): MatchTile[][] {
  return board.map((row) => row.map((tile) => ({ ...tile, isNew: false })));
}

export function areAdjacent(a: BoardCoord, b: BoardCoord): boolean {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

export function swapTiles(
  board: MatchTile[][],
  a: BoardCoord,
  b: BoardCoord
): MatchTile[][] {
  const next = cloneBoard(board);
  const temp = next[a.r][a.c];
  next[a.r][a.c] = next[b.r][b.c];
  next[b.r][b.c] = temp;
  return next;
}

export interface MatchResolution {
  clearedCoords: BoardCoord[];
  spawns: Array<{ coord: BoardCoord; type: ResourceType; special: TileSpecial }>;
  countsByType: Record<ResourceType, number>;
}

function coordKey(r: number, c: number): string {
  return `${r},${c}`;
}

export function findMatches(
  board: MatchTile[][],
  preferredCoords: BoardCoord[] = []
): MatchResolution {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  interface Run {
    coords: BoardCoord[];
    type: ResourceType;
    orientation: "h" | "v";
  }

  const runs: Run[] = [];

  // Horizontal runs
  for (let r = 0; r < rows; r += 1) {
    let c = 0;
    while (c < cols) {
      const type = board[r][c].type;
      let end = c + 1;
      while (end < cols && board[r][end].type === type) {
        end += 1;
      }
      if (end - c >= 3) {
        const coords: BoardCoord[] = [];
        for (let k = c; k < end; k += 1) coords.push({ r, c: k });
        runs.push({ coords, type, orientation: "h" });
      }
      c = end;
    }
  }

  // Vertical runs
  for (let c = 0; c < cols; c += 1) {
    let r = 0;
    while (r < rows) {
      const type = board[r][c].type;
      let end = r + 1;
      while (end < rows && board[end][c].type === type) {
        end += 1;
      }
      if (end - r >= 3) {
        const coords: BoardCoord[] = [];
        for (let k = r; k < end; k += 1) coords.push({ r: k, c });
        runs.push({ coords, type, orientation: "v" });
      }
      r = end;
    }
  }

  if (runs.length === 0) {
    return {
      clearedCoords: [],
      spawns: [],
      countsByType: { timber: 0, brick: 0, gold: 0, power: 0, civic: 0 },
    };
  }

  // Group intersecting runs of the same resource type
  const visited = new Array<boolean>(runs.length).fill(false);
  const spawns: Array<{
    coord: BoardCoord;
    type: ResourceType;
    special: TileSpecial;
  }> = [];
  const baseMatchedMap = new Map<string, BoardCoord>();

  for (let i = 0; i < runs.length; i += 1) {
    if (visited[i]) continue;
    visited[i] = true;
    const queue = [i];
    const clusterRuns: Run[] = [];

    while (queue.length > 0) {
      const currIdx = queue.shift()!;
      const curr = runs[currIdx];
      clusterRuns.push(curr);

      const currKeys = new Set(curr.coords.map((pt) => coordKey(pt.r, pt.c)));
      for (let j = 0; j < runs.length; j += 1) {
        if (visited[j] || runs[j].type !== curr.type) continue;
        const intersects = runs[j].coords.some((pt) =>
          currKeys.has(coordKey(pt.r, pt.c))
        );
        if (intersects) {
          visited[j] = true;
          queue.push(j);
        }
      }
    }

    const clusterCoordsMap = new Map<string, BoardCoord>();
    let maxRunLen = 0;
    let hasBothOrientations = false;
    let primaryOrientation: "h" | "v" = clusterRuns[0].orientation;

    for (const run of clusterRuns) {
      if (run.coords.length > maxRunLen) {
        maxRunLen = run.coords.length;
        primaryOrientation = run.orientation;
      }
      if (run.orientation !== clusterRuns[0].orientation) {
        hasBothOrientations = true;
      }
      for (const pt of run.coords) {
        const key = coordKey(pt.r, pt.c);
        clusterCoordsMap.set(key, pt);
        baseMatchedMap.set(key, pt);
      }
    }

    const clusterCoords = Array.from(clusterCoordsMap.values());
    let spawnSpecial: TileSpecial = "none";
    if (maxRunLen >= 5 || (hasBothOrientations && clusterCoords.length >= 5)) {
      spawnSpecial = "bomb";
    } else if (maxRunLen === 4) {
      spawnSpecial = primaryOrientation === "h" ? "col" : "row";
    }

    if (spawnSpecial !== "none") {
      const preferred =
        preferredCoords.find((p) => clusterCoordsMap.has(coordKey(p.r, p.c))) ??
        clusterCoords[Math.floor(clusterCoords.length / 2)];
      spawns.push({
        coord: preferred,
        type: clusterRuns[0].type,
        special: spawnSpecial,
      });
    }
  }

  // Expand special tiles recursively
  const finalCleared = expandSpecialCoords(board, Array.from(baseMatchedMap.values()));

  // Avoid clearing the coordinate where a new special tile is spawning
  const spawnKeySet = new Set(spawns.map((s) => coordKey(s.coord.r, s.coord.c)));
  const countsByType: Record<ResourceType, number> = {
    timber: 0,
    brick: 0,
    gold: 0,
    power: 0,
    civic: 0,
  };

  for (const pt of finalCleared) {
    const t = board[pt.r][pt.c].type;
    countsByType[t] += 1;
  }

  const clearedCoords = finalCleared.filter(
    (pt) => !spawnKeySet.has(coordKey(pt.r, pt.c))
  );

  return { clearedCoords, spawns, countsByType };
}

export function expandSpecialCoords(
  board: MatchTile[][],
  seedCoords: BoardCoord[]
): BoardCoord[] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const clearedMap = new Map<string, BoardCoord>();
  const triggered = new Set<string>();
  const queue: BoardCoord[] = [...seedCoords];

  for (const pt of seedCoords) {
    clearedMap.set(coordKey(pt.r, pt.c), pt);
  }

  while (queue.length > 0) {
    const pt = queue.shift()!;
    const key = coordKey(pt.r, pt.c);
    if (triggered.has(key)) continue;
    triggered.add(key);

    const tile = board[pt.r]?.[pt.c];
    if (!tile || tile.special === "none") continue;

    const extras: BoardCoord[] = [];
    if (tile.special === "row") {
      for (let c = 0; c < cols; c += 1) extras.push({ r: pt.r, c });
    } else if (tile.special === "col") {
      for (let r = 0; r < rows; r += 1) extras.push({ r, c: pt.c });
    } else if (tile.special === "bomb") {
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          const nr = pt.r + dr;
          const nc = pt.c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            extras.push({ r: nr, c: nc });
          }
        }
      }
    }

    for (const ex of extras) {
      const exKey = coordKey(ex.r, ex.c);
      if (!clearedMap.has(exKey)) {
        clearedMap.set(exKey, ex);
        queue.push(ex);
      }
    }
  }

  return Array.from(clearedMap.values());
}

export function resolveBombColorSwap(
  board: MatchTile[][],
  bombCoord: BoardCoord,
  targetCoord: BoardCoord
): BoardCoord[] {
  const targetType = board[targetCoord.r][targetCoord.c].type;
  const seeds: BoardCoord[] = [bombCoord];
  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < board[0].length; c += 1) {
      if (board[r][c].type === targetType) {
        seeds.push({ r, c });
      }
    }
  }
  return expandSpecialCoords(board, seeds);
}

export function applyGravityAndRefill(
  board: MatchTile[][],
  clearedCoords: BoardCoord[],
  spawns: Array<{ coord: BoardCoord; type: ResourceType; special: TileSpecial }>
): MatchTile[][] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const next = cloneBoard(board);

  // Place spawned special tiles first
  for (const sp of spawns) {
    next[sp.coord.r][sp.coord.c] = {
      id: nextTileId(),
      type: sp.type,
      special: sp.special,
      isNew: true,
    };
  }

  const clearedSet = new Set(clearedCoords.map((pt) => coordKey(pt.r, pt.c)));
  const spawnSet = new Set(spawns.map((s) => coordKey(s.coord.r, s.coord.c)));

  for (let c = 0; c < cols; c += 1) {
    const survivors: MatchTile[] = [];
    for (let r = rows - 1; r >= 0; r -= 1) {
      const key = coordKey(r, c);
      if (!clearedSet.has(key) || spawnSet.has(key)) {
        survivors.push(next[r][c]);
      }
    }

    let writeRow = rows - 1;
    for (const tile of survivors) {
      next[writeRow][c] = tile;
      writeRow -= 1;
    }

    while (writeRow >= 0) {
      next[writeRow][c] = {
        id: nextTileId(),
        type: randomResourceType(),
        special: "none",
        isNew: true,
      };
      writeRow -= 1;
    }
  }

  return next;
}

export function findValidMove(
  board: MatchTile[][]
): [BoardCoord, BoardCoord] | null {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (board[r][c].special === "bomb") {
        if (c + 1 < cols) return [{ r, c }, { r, c: c + 1 }];
        if (r + 1 < rows) return [{ r, c }, { r: r + 1, c }];
      }

      if (c + 1 < cols) {
        const swapped = swapTiles(board, { r, c }, { r, c: c + 1 });
        if (findMatches(swapped).clearedCoords.length > 0) {
          return [{ r, c }, { r, c: c + 1 }];
        }
      }

      if (r + 1 < rows) {
        const swapped = swapTiles(board, { r, c }, { r: r + 1, c });
        if (findMatches(swapped).clearedCoords.length > 0) {
          return [{ r, c }, { r: r + 1, c }];
        }
      }
    }
  }
  return null;
}

export function createInitialBoard(
  rows = BOARD_SIZE,
  cols = BOARD_SIZE
): MatchTile[][] {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const board: MatchTile[][] = [];
    for (let r = 0; r < rows; r += 1) {
      const row: MatchTile[] = [];
      for (let c = 0; c < cols; c += 1) {
        const exclude: ResourceType[] = [];
        if (c >= 2 && row[c - 1].type === row[c - 2].type) {
          exclude.push(row[c - 1].type);
        }
        if (r >= 2 && board[r - 1][c].type === board[r - 2][c].type) {
          exclude.push(board[r - 1][c].type);
        }
        row.push({
          id: nextTileId(),
          type: randomResourceType(exclude),
          special: "none",
        });
      }
      board.push(row);
    }
    if (findValidMove(board)) {
      return board;
    }
  }
  return createInitialBoard(rows, cols);
}

export function reshuffleBoard(board: MatchTile[][]): MatchTile[][] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const fresh = createInitialBoard(rows, cols);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      fresh[r][c].isNew = true;
    }
  }
  return fresh;
}
