import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import type {
  BuildingType,
  CityLot,
  MatchTile,
  Resources,
  ResourceType,
  TileSpecial,
} from './types/game';
import {
  CITY_LOT_COUNT,
  createInitialCityLots,
  MAX_BUILDING_LEVEL,
} from './utils/city';
import {
  BOARD_SIZE,
  createInitialBoard,
  nextTileId,
  RESOURCE_TYPES,
} from './utils/match3';

const app = initializeApp(firebaseConfig);

// Mandatory: target the provisioned named Firestore database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: Array<{
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }>;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export type SavePage = 'city' | 'harvest';

export interface SerializedBoardCell {
  r: number;
  c: number;
  type: ResourceType;
  special: TileSpecial;
}

export interface CitySavePayload {
  resources: Resources;
  civicPop: number;
  turnsPlayed: number;
  bestPopulation: number;
  prestigeLevel: number;
  activePage: SavePage;
  lots: CityLot[];
  board: MatchTile[][];
}

export interface LoadedCitySave {
  resources: Resources;
  civicPop: number;
  turnsPlayed: number;
  bestPopulation: number;
  prestigeLevel: number;
  activePage: SavePage;
  lots: CityLot[];
  board: MatchTile[][];
}

const VALID_BUILDINGS = new Set<BuildingType>([
  'house',
  'mill',
  'brickworks',
  'solar',
  'park',
  'market',
  'school',
  'station',
  'observatory',
  'townhall',
]);

const VALID_SPECIALS = new Set<TileSpecial>(['none', 'row', 'col', 'bomb']);

function clampNonNegInt(val: unknown, maxVal: number): number {
  const num = typeof val === 'number' && Number.isFinite(val) ? Math.floor(val) : 0;
  return Math.max(0, Math.min(maxVal, num));
}

function serializeLots(lots: CityLot[]): CityLot[] {
  const base = createInitialCityLots();
  return base.map((fallback, idx) => {
    const lot = lots[idx];
    if (!lot) return fallback;
    const validBuilding =
      lot.building && VALID_BUILDINGS.has(lot.building) ? lot.building : null;
    return {
      index: idx,
      building: validBuilding,
      level: validBuilding ? clampNonNegInt(lot.level, MAX_BUILDING_LEVEL) : 0,
    };
  });
}

function deserializeLots(raw: unknown): CityLot[] {
  const base = createInitialCityLots();
  if (!Array.isArray(raw)) {
    return base;
  }

  // Migrate legacy 8x8 (64-lot) saves centered into 15x15 (Town Hall 27 -> 112)
  if (raw.length === 64) {
    const migrated = base.map((lot) => ({ ...lot }));
    migrated[112] = { index: 112, building: null, level: 0 };
    for (let i = 0; i < 64; i += 1) {
      const entry = raw[i] as Partial<CityLot> | undefined;
      if (!entry || typeof entry !== 'object') continue;
      const oldR = Math.floor(i / 8);
      const oldC = i % 8;
      const newIdx = (oldR + 4) * 15 + (oldC + 4);
      const validBuilding =
        typeof entry.building === 'string' &&
        VALID_BUILDINGS.has(entry.building as BuildingType)
          ? (entry.building as BuildingType)
          : null;
      migrated[newIdx] = {
        index: newIdx,
        building: validBuilding,
        level: validBuilding
          ? Math.max(1, clampNonNegInt(entry.level, MAX_BUILDING_LEVEL))
          : 0,
      };
    }
    if (!migrated.some((l) => l.building === 'townhall')) {
      migrated[112] = { index: 112, building: 'townhall', level: 1 };
    }
    return migrated;
  }

  if (raw.length !== CITY_LOT_COUNT) {
    return base;
  }

  return base.map((fallback, idx) => {
    const entry = raw[idx] as Partial<CityLot> | undefined;
    if (!entry || typeof entry !== 'object') return fallback;
    const validBuilding =
      typeof entry.building === 'string' &&
      VALID_BUILDINGS.has(entry.building as BuildingType)
        ? (entry.building as BuildingType)
        : null;
    return {
      index: idx,
      building: validBuilding,
      level: validBuilding
        ? Math.max(1, clampNonNegInt(entry.level, MAX_BUILDING_LEVEL))
        : 0,
    };
  });
}

function serializeBoard(board: MatchTile[][]): SerializedBoardCell[] {
  const cells: SerializedBoardCell[] = [];
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      const tile = board[r]?.[c];
      const type =
        tile && RESOURCE_TYPES.includes(tile.type) ? tile.type : 'timber';
      const special =
        tile && VALID_SPECIALS.has(tile.special) ? tile.special : 'none';
      cells.push({ r, c, type, special });
    }
  }
  return cells;
}

function deserializeBoard(raw: unknown): MatchTile[][] {
  if (!Array.isArray(raw) || raw.length !== BOARD_SIZE * BOARD_SIZE) {
    return createInitialBoard();
  }
  const board: MatchTile[][] = Array.from({ length: BOARD_SIZE }, () =>
    new Array<MatchTile>(BOARD_SIZE)
  );
  for (let i = 0; i < raw.length; i += 1) {
    const cell = raw[i] as Partial<SerializedBoardCell> | undefined;
    const r = Math.floor(i / BOARD_SIZE);
    const c = i % BOARD_SIZE;
    const type =
      cell?.type && RESOURCE_TYPES.includes(cell.type)
        ? cell.type
        : RESOURCE_TYPES[(r + c) % RESOURCE_TYPES.length];
    const special =
      cell?.special && VALID_SPECIALS.has(cell.special) ? cell.special : 'none';
    board[r][c] = {
      id: nextTileId(),
      type,
      special,
      isNew: false,
    };
  }
  return board;
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutGoogle(): Promise<void> {
  await signOut(auth);
}

export async function syncUserProfile(user: User): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  const email = (user.email ?? '').slice(0, 256);
  const displayName = (user.displayName ?? 'Mayor').slice(0, 120);
  const photoURL = (user.photoURL ?? '').slice(0, 512);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        email,
        displayName,
        photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        email,
        displayName,
        photoURL,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadCloudSave(uid: string): Promise<LoadedCitySave | null> {
  const path = `users/${uid}/gameState/primary`;
  const ref = doc(db, 'users', uid, 'gameState', 'primary');
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      resources: {
        timber: clampNonNegInt(data.timber, 10000000),
        brick: clampNonNegInt(data.brick, 10000000),
        gold: clampNonNegInt(data.gold, 10000000),
        power: clampNonNegInt(data.power, 10000000),
      },
      civicPop: clampNonNegInt(data.civicPop, 10000000),
      turnsPlayed: clampNonNegInt(data.turnsPlayed, 10000000),
      bestPopulation: clampNonNegInt(data.bestPopulation, 100000000),
      prestigeLevel: clampNonNegInt(data.prestigeLevel, 1000),
      activePage: data.activePage === 'harvest' ? 'harvest' : 'city',
      lots: deserializeLots(data.lots),
      board: deserializeBoard(data.boardCells),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveCloudGame(
  uid: string,
  payload: CitySavePayload,
  alreadyExists?: boolean
): Promise<void> {
  const path = `users/${uid}/gameState/primary`;
  const ref = doc(db, 'users', uid, 'gameState', 'primary');
  const fields = {
    timber: clampNonNegInt(payload.resources.timber, 10000000),
    brick: clampNonNegInt(payload.resources.brick, 10000000),
    gold: clampNonNegInt(payload.resources.gold, 10000000),
    power: clampNonNegInt(payload.resources.power, 10000000),
    civicPop: clampNonNegInt(payload.civicPop, 10000000),
    turnsPlayed: clampNonNegInt(payload.turnsPlayed, 10000000),
    bestPopulation: clampNonNegInt(payload.bestPopulation, 100000000),
    prestigeLevel: clampNonNegInt(payload.prestigeLevel, 1000),
    activePage: payload.activePage,
    lots: serializeLots(payload.lots),
    boardCells: serializeBoard(payload.board),
    updatedAt: serverTimestamp(),
  };

  try {
    let exists = alreadyExists;
    if (exists === undefined) {
      const snap = await getDoc(ref);
      exists = snap.exists();
    }

    if (!exists) {
      await setDoc(ref, {
        ownerId: uid,
        ...fields,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, fields);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
