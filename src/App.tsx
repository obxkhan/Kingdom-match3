import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  BrickWall,
  Building2,
  Coins,
  Crown,
  Footprints,
  Home,
  Map as MapIcon,
  Pickaxe,
  Play,
  RotateCcw,
  Smile,
  Sparkles,
  Star,
  Trees,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  AccountControls,
  type CloudSyncStatus,
} from "./components/AccountControls";
import { CityGrid } from "./components/CityGrid";
import { Match3Board } from "./components/Match3Board";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { PrestigeModal } from "./components/PrestigeModal";
import { PWAInstallButton } from "./components/PWAInstallButton";
import {
  auth,
  loadCloudSave,
  saveCloudGame,
  signInWithGoogle,
  signOutGoogle,
  syncUserProfile,
  type CitySavePayload,
} from "./firebase";
import type {
  BoardCoord,
  BuildingType,
  CityLot,
  ClearBurstEffect,
  FloatingGain,
  GameMode,
  GameState,
  MatchTile,
  Resources,
  ResourceType,
} from "./types/game";
import {
  BUILDING_DEFS,
  CITY_LOT_COUNT,
  PAYDAY_INTERVAL,
  SOLAR_INSTANT_POWER_BY_LEVEL,
  TOWN_HALL_LOT_INDEX,
  canAfford,
  canPrestigeCity,
  computeCityStats,
  computePaydayIncome,
  createInitialCityLots,
  createInitialResources,
  getPrestigeResourceMultiplier,
  getPrestigeStartingResources,
  getRefundForLot,
  subtractCost,
} from "./utils/city";
import {
  BOARD_SIZE,
  applyGravityAndRefill,
  areAdjacent,
  createInitialBoard,
  findMatches,
  findValidMove,
  nextTileId,
  reshuffleBoard,
  resolveBombColorSwap,
  swapTiles,
} from "./utils/match3";
import {
  playBuildSound,
  playInvalidSwapSound,
  playMatchSound,
  playSwapSound,
  playUpgradeSound,
  playWinSound,
} from "./utils/sound";

const BEST_SCORE_KEY = "tiletown.best.v1";
const LOCAL_SAVE_KEY = "tiletown.local_save.v1";
const TITLE_IMAGE_SRC = "/src/assets/images/title_city_diorama_1795188234869.jpg";

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

type ActivePage = "city" | "harvest";

function getInitialShortcutPage(): ActivePage | null {
  try {
    const param = new URLSearchParams(window.location.search).get("page");
    if (param === "harvest" || param === "city") return param;
  } catch {
    // Ignore URL parsing errors
  }
  return null;
}

interface LocalBackupData {
  resources: Resources;
  civicPop: number;
  turnsPlayed: number;
  bestPopulation: number;
  prestigeLevel?: number;
  activePage: ActivePage;
  lots: CityLot[];
  boardCells: Array<{ r: number; c: number; type: ResourceType; special: MatchTile["special"] }>;
}

function readLocalBackup(): {
  board: MatchTile[][];
  lots: CityLot[];
  resources: Resources;
  civicPop: number;
  turnsPlayed: number;
  bestPopulation: number;
  prestigeLevel: number;
  activePage: ActivePage;
  hasData: boolean;
} | null {
  try {
    const raw = localStorage.getItem(LOCAL_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalBackupData>;
    if (
      !parsed ||
      !Array.isArray(parsed.lots) ||
      !Array.isArray(parsed.boardCells) ||
      !parsed.resources
    ) {
      return null;
    }

    let lots: CityLot[];
    if (parsed.lots.length === CITY_LOT_COUNT) {
      lots = parsed.lots;
    } else if (parsed.lots.length === 64) {
      lots = createInitialCityLots();
      lots[TOWN_HALL_LOT_INDEX] = {
        index: TOWN_HALL_LOT_INDEX,
        building: null,
        level: 0,
      };
      for (let i = 0; i < 64; i += 1) {
        const entry = parsed.lots[i];
        if (!entry) continue;
        const oldR = Math.floor(i / 8);
        const oldC = i % 8;
        const newIdx = (oldR + 4) * 15 + (oldC + 4);
        lots[newIdx] = {
          index: newIdx,
          building: entry.building ?? null,
          level: entry.building ? Math.max(1, entry.level || 1) : 0,
        };
      }
      if (!lots.some((l) => l.building === "townhall")) {
        lots[TOWN_HALL_LOT_INDEX] = {
          index: TOWN_HALL_LOT_INDEX,
          building: "townhall",
          level: 1,
        };
      }
    } else {
      return null;
    }

    const board: MatchTile[][] =
      parsed.boardCells.length === BOARD_SIZE * BOARD_SIZE
        ? Array.from({ length: BOARD_SIZE }, (_, r) =>
            Array.from({ length: BOARD_SIZE }, (_, c) => {
              const cell = parsed.boardCells?.[r * BOARD_SIZE + c];
              return {
                id: nextTileId(),
                type: cell?.type ?? "timber",
                special: cell?.special ?? "none",
                isNew: false,
              };
            })
          )
        : createInitialBoard();

    return {
      board,
      lots,
      resources: parsed.resources,
      civicPop: Math.max(0, Number(parsed.civicPop) || 0),
      turnsPlayed: Math.max(0, Number(parsed.turnsPlayed) || 0),
      bestPopulation: Math.max(0, Number(parsed.bestPopulation) || 0),
      prestigeLevel: Math.max(0, Math.floor(Number(parsed.prestigeLevel) || 0)),
      activePage: parsed.activePage === "harvest" ? "harvest" : "city",
      hasData: true,
    };
  } catch {
    return null;
  }
}

export default function App() {
  const initialShortcut = getInitialShortcutPage();
  const initialLocalBackup = useMemo(() => readLocalBackup(), []);

  const [gameState, setGameState] = useState<GameState>(() =>
    initialShortcut ? "PLAYING" : "TITLE_MENU"
  );
  const [activePage, setActivePage] = useState<ActivePage>(
    () => initialShortcut ?? initialLocalBackup?.activePage ?? "city"
  );
  const [gameMode, setGameMode] = useState<GameMode>("endless");
  const [muted, setMuted] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const [bestPopulation, setBestPopulation] = useState<number>(() => {
    try {
      const saved = Number(localStorage.getItem(BEST_SCORE_KEY) || "0");
      const fromBackup = initialLocalBackup?.bestPopulation ?? 0;
      return Math.max(Number.isFinite(saved) ? saved : 0, fromBackup);
    } catch {
      return initialLocalBackup?.bestPopulation ?? 0;
    }
  });

  // Active game state
  const [board, setBoard] = useState<MatchTile[][]>(
    () => initialLocalBackup?.board ?? createInitialBoard()
  );
  const [lots, setLots] = useState<CityLot[]>(
    () => initialLocalBackup?.lots ?? createInitialCityLots()
  );
  const [resources, setResources] = useState<Resources>(
    () => initialLocalBackup?.resources ?? createInitialResources()
  );
  const [civicPop, setCivicPop] = useState(
    () => initialLocalBackup?.civicPop ?? 0
  );
  const [turnsPlayed, setTurnsPlayed] = useState(
    () => initialLocalBackup?.turnsPlayed ?? 0
  );
  const [prestigeLevel, setPrestigeLevel] = useState(
    () => initialLocalBackup?.prestigeLevel ?? 0
  );
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const [currentCombo, setCurrentCombo] = useState(0);

  // Google Auth + Cloud Save state
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>("signed-out");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [hasCloudSave, setHasCloudSave] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const [selectedCoord, setSelectedCoord] = useState<BoardCoord | null>(null);
  const [hintPair, setHintPair] = useState<[BoardCoord, BoardCoord] | null>(null);
  const [clearingKeys, setClearingKeys] = useState<Set<string>>(() => new Set());
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(() => new Set());
  const [burstEffects, setBurstEffects] = useState<ClearBurstEffect[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const [floatingGains, setFloatingGains] = useState<FloatingGain[]>([]);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const [selectedLotIndex, setSelectedLotIndex] = useState<number | null>(
    TOWN_HALL_LOT_INDEX
  );
  const [selectedBlueprint, setSelectedBlueprint] =
    useState<BuildingType>("house");
  const [lastBuiltLot, setLastBuiltLot] = useState<{
    index: number;
    token: number;
  } | null>(null);

  // Generation counter to cancel async cascades cleanly on restart/menu
  const gameGenRef = useRef(0);
  const noticeTimerRef = useRef<number | null>(null);
  const lastRankRef = useRef<string>(
    computeCityStats(
      initialLocalBackup?.lots ?? createInitialCityLots(),
      initialLocalBackup?.civicPop ?? 0,
      initialLocalBackup?.prestigeLevel ?? 0
    ).cityRank
  );
  const hydratedUidRef = useRef<string | null>(null);
  const cloudExistsRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const latestPayloadRef = useRef<CitySavePayload>({
    resources,
    civicPop,
    turnsPlayed,
    bestPopulation,
    prestigeLevel,
    activePage,
    lots,
    board,
  });

  latestPayloadRef.current = {
    resources,
    civicPop,
    turnsPlayed,
    bestPopulation,
    prestigeLevel,
    activePage,
    lots,
    board,
  };

  const stats = useMemo(
    () => computeCityStats(lots, civicPop, prestigeLevel),
    [lots, civicPop, prestigeLevel]
  );

  const prestigeReady = useMemo(
    () => canPrestigeCity(stats, prestigeLevel),
    [stats, prestigeLevel]
  );

  const hasSavedProgress = useMemo(() => {
    if (hasCloudSave || prestigeLevel > 0 || turnsPlayed > 0 || civicPop > 0) return true;
    return lots.some((lot) => {
      if (lot.index === TOWN_HALL_LOT_INDEX) return lot.level > 1;
      return lot.building !== null;
    });
  }, [hasCloudSave, prestigeLevel, turnsPlayed, civicPop, lots]);

  // Track best population
  useEffect(() => {
    if (stats.population > bestPopulation) {
      setBestPopulation(stats.population);
      try {
        localStorage.setItem(BEST_SCORE_KEY, String(stats.population));
      } catch {
        // Ignore storage write errors
      }
    }
  }, [stats.population, bestPopulation]);

  // Listen to Firebase Google Auth state & hydrate/backup cloud save
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      setAuthMessage(null);

      if (!nextUser) {
        hydratedUidRef.current = null;
        cloudExistsRef.current = false;
        setHasCloudSave(false);
        setSyncStatus("signed-out");
        return;
      }

      setSyncStatus("loading");
      try {
        await syncUserProfile(nextUser);
        const cloudSave = await loadCloudSave(nextUser.uid);

        if (cloudSave) {
          gameGenRef.current += 1;
          setIsResolving(false);
          setSelectedCoord(null);
          setHintPair(null);
          setClearingKeys(new Set());
          setInvalidKeys(new Set());
          setBurstEffects([]);

          lastRankRef.current = computeCityStats(
            cloudSave.lots,
            cloudSave.civicPop,
            cloudSave.prestigeLevel
          ).cityRank;

          setLots(cloudSave.lots);
          setResources(cloudSave.resources);
          setCivicPop(cloudSave.civicPop);
          setTurnsPlayed(cloudSave.turnsPlayed);
          setPrestigeLevel(cloudSave.prestigeLevel);
          setBoard(cloudSave.board);
          setBestPopulation((prev) => Math.max(prev, cloudSave.bestPopulation));
          if (!initialShortcut) {
            setActivePage(cloudSave.activePage);
          }

          cloudExistsRef.current = true;
          hydratedUidRef.current = nextUser.uid;
          setHasCloudSave(true);
          setSyncStatus("saved");
          setAuthMessage("Saved city restored from your Google Account.");
          showNotice("Saved city restored from your Google Account.");
        } else {
          await saveCloudGame(nextUser.uid, latestPayloadRef.current, false);
          cloudExistsRef.current = true;
          hydratedUidRef.current = nextUser.uid;
          setHasCloudSave(true);
          setSyncStatus("saved");
          setAuthMessage("Your city is now safely backed up to Google Cloud.");
          showNotice("Your city is now safely backed up to Google Cloud.");
        }
      } catch (err) {
        console.error("Cloud sync error:", err);
        setSyncStatus("error");
        setAuthMessage("Could not sync with cloud right now. Local progress is kept safe.");
      }
    });

    return () => unsub();
  }, [initialShortcut]);

  // Persist local backup immediately & auto-save to Firestore when signed in
  useEffect(() => {
    if (isResolving) return;

    const boardCells = board.flatMap((row, r) =>
      row.map((tile, c) => ({
        r,
        c,
        type: tile.type,
        special: tile.special,
      }))
    );

    try {
      const localData: LocalBackupData = {
        resources,
        civicPop,
        turnsPlayed,
        bestPopulation,
        prestigeLevel,
        activePage,
        lots,
        boardCells,
      };
      localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(localData));
    } catch {
      // Ignore storage quota errors
    }

    if (!user || hydratedUidRef.current !== user.uid) return;

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    setSyncStatus("saving");
    const uid = user.uid;
    saveTimerRef.current = window.setTimeout(async () => {
      saveTimerRef.current = null;
      try {
        await saveCloudGame(uid, latestPayloadRef.current, cloudExistsRef.current);
        cloudExistsRef.current = true;
        setHasCloudSave(true);
        setSyncStatus("saved");
      } catch (err) {
        console.error("Auto-save failed:", err);
        setSyncStatus("error");
      }
    }, 650);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    user,
    isResolving,
    lots,
    resources,
    civicPop,
    turnsPlayed,
    bestPopulation,
    prestigeLevel,
    activePage,
    board,
  ]);

  // Flush any pending cloud save when backgrounding or leaving the tab
  useEffect(() => {
    const flushPendingSave = () => {
      if (!user || hydratedUidRef.current !== user.uid) return;
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        void saveCloudGame(
          user.uid,
          latestPayloadRef.current,
          cloudExistsRef.current
        )
          .then(() => {
            cloudExistsRef.current = true;
            setSyncStatus("saved");
          })
          .catch(() => {
            setSyncStatus("error");
          });
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushPendingSave();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", flushPendingSave);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", flushPendingSave);
    };
  }, [user]);

  // Celebrate City Rank milestones without ever ending the game
  useEffect(() => {
    if (gameState !== "PLAYING") {
      lastRankRef.current = stats.cityRank;
      return;
    }
    if (stats.cityRank !== lastRankRef.current) {
      lastRankRef.current = stats.cityRank;
      playWinSound(muted);
      showNotice(`City Rank Up: ${stats.cityRank}!`);
    }
  }, [gameState, stats.cityRank, muted]);

  const showNotice = (msg: string) => {
    setStatusNotice(msg);
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setStatusNotice(null);
    }, 2600);
  };

  const spawnFloatingGain = (
    label: string,
    colorClass: string,
    r: number,
    c: number
  ) => {
    const id = `fg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setFloatingGains((prev) => [...prev, { id, label, colorClass, r, c }]);
    window.setTimeout(() => {
      setFloatingGains((prev) => prev.filter((item) => item.id !== id));
    }, 950);
  };

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    setAuthMessage(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code)
          : "";
      if (code === "auth/popup-closed-by-user") {
        setAuthMessage("Sign-in canceled.");
      } else if (code === "auth/popup-blocked") {
        setAuthMessage("Please allow pop-ups to sign in with Google.");
      } else {
        setAuthMessage("Google sign-in could not complete. Please try again.");
      }
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleSignOut = async () => {
    setAuthBusy(true);
    try {
      if (user && hydratedUidRef.current === user.uid) {
        if (saveTimerRef.current !== null) {
          window.clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        await saveCloudGame(
          user.uid,
          latestPayloadRef.current,
          cloudExistsRef.current
        );
      }
      hydratedUidRef.current = null;
      await signOutGoogle();
      try {
        localStorage.removeItem(LOCAL_SAVE_KEY);
      } catch {
        // Ignore storage removal errors
      }
      gameGenRef.current += 1;
      setBoard(createInitialBoard());
      setLots(createInitialCityLots());
      setResources(createInitialResources(0));
      setCivicPop(0);
      setTurnsPlayed(0);
      setPrestigeLevel(0);
      setShowPrestigeModal(false);
      setCurrentCombo(0);
      setSelectedLotIndex(TOWN_HALL_LOT_INDEX);
      setConfirmReset(false);
      lastRankRef.current = "Hamlet";
      setGameState("TITLE_MENU");
      setAuthMessage("Signed out. Your cloud city stays saved on your Google Account.");
    } catch {
      setAuthMessage("Could not sign out cleanly. Please try again.");
    } finally {
      setAuthBusy(false);
    }
  };

  const continueSavedGame = () => {
    setConfirmReset(false);
    setGameState("PLAYING");
  };

  const startNewGame = (modeToStart: GameMode = gameMode) => {
    gameGenRef.current += 1;
    setConfirmReset(false);
    setShowPrestigeModal(false);
    setGameMode(modeToStart);
    setBoard(createInitialBoard());
    setLots(createInitialCityLots());
    setResources(createInitialResources(prestigeLevel));
    setCivicPop(0);
    setTurnsPlayed(0);
    setCurrentCombo(0);
    setSelectedCoord(null);
    setHintPair(null);
    setClearingKeys(new Set());
    setInvalidKeys(new Set());
    setBurstEffects([]);
    setIsResolving(false);
    setFloatingGains([]);
    setStatusNotice(null);
    setSelectedLotIndex(TOWN_HALL_LOT_INDEX);
    setSelectedBlueprint("house");
    setLastBuiltLot(null);
    lastRankRef.current = "Hamlet";
    setActivePage("city");
    setGameState("PLAYING");
  };

  const handlePrestige = () => {
    if (!canPrestigeCity(stats, prestigeLevel)) return;
    const nextPrestige = prestigeLevel + 1;
    gameGenRef.current += 1;
    setPrestigeLevel(nextPrestige);
    setShowPrestigeModal(false);
    setConfirmReset(false);
    setBoard(createInitialBoard());
    setLots(createInitialCityLots());
    setResources(getPrestigeStartingResources(nextPrestige));
    setCivicPop(0);
    setTurnsPlayed(0);
    setCurrentCombo(0);
    setSelectedCoord(null);
    setHintPair(null);
    setClearingKeys(new Set());
    setInvalidKeys(new Set());
    setBurstEffects([]);
    setIsResolving(false);
    setFloatingGains([]);
    setSelectedLotIndex(TOWN_HALL_LOT_INDEX);
    setSelectedBlueprint("house");
    setLastBuiltLot(null);
    lastRankRef.current = "Hamlet";
    setActivePage("city");
    playWinSound(muted);
  };

  const awardMatchResources = (
    counts: Record<ResourceType, number>,
    combo: number,
    anchor: BoardCoord
  ) => {
    const multiplier = combo === 1 ? 1 : 1 + (combo - 1) * 0.6;
    const resMult = getPrestigeResourceMultiplier(prestigeLevel);
    const timberGain =
      counts.timber > 0
        ? Math.round((counts.timber * 2 + stats.timberBonus) * multiplier * resMult)
        : 0;
    const brickGain =
      counts.brick > 0
        ? Math.round((counts.brick * 2 + stats.brickBonus) * multiplier * resMult)
        : 0;
    const goldGain =
      counts.gold > 0
        ? Math.round((counts.gold * 2.5 + (counts.gold >= 4 ? 5 : 0)) * multiplier * resMult)
        : 0;
    const powerGain =
      counts.power > 0
        ? Math.round((counts.power * 1.5 + (counts.power >= 4 ? 4 : 0)) * multiplier * resMult)
        : 0;
    const citizenGain =
      counts.civic > 0
        ? Math.round(counts.civic * 8 * (stats.happiness / 100) * multiplier)
        : 0;

    if (timberGain || brickGain || goldGain || powerGain) {
      setResources((prev) => ({
        timber: prev.timber + timberGain,
        brick: prev.brick + brickGain,
        gold: prev.gold + goldGain,
        power: prev.power + powerGain,
      }));
    }
    if (citizenGain > 0) {
      setCivicPop((prev) => prev + citizenGain);
    }

    const tags: Array<{ text: string; color: string }> = [];
    if (timberGain > 0) tags.push({ text: `+${timberGain} Timber`, color: "text-emerald-800" });
    if (brickGain > 0) tags.push({ text: `+${brickGain} Brick`, color: "text-orange-800" });
    if (goldGain > 0) tags.push({ text: `+${goldGain} Gold`, color: "text-amber-800" });
    if (powerGain > 0) tags.push({ text: `+${powerGain} Power`, color: "text-sky-800" });
    if (citizenGain > 0) tags.push({ text: `+${citizenGain} Citizens`, color: "text-rose-800" });

    tags.slice(0, 2).forEach((t, idx) => {
      spawnFloatingGain(
        t.text,
        t.color,
        Math.max(0, anchor.r - idx),
        anchor.c
      );
    });
  };

  const executeSwap = async (a: BoardCoord, b: BoardCoord) => {
    if (isResolving || gameState !== "PLAYING") return;
    if (!areAdjacent(a, b)) return;

    const activeGen = gameGenRef.current;
    setSelectedCoord(null);
    setHintPair(null);

    const tileA = board[a.r][a.c];
    const tileB = board[b.r][b.c];
    const isBombSwap = tileA.special === "bomb" || tileB.special === "bomb";

    let workingBoard = swapTiles(board, a, b);

    if (!isBombSwap) {
      const initialCheck = findMatches(workingBoard, [a, b]);
      if (initialCheck.clearedCoords.length === 0) {
        playInvalidSwapSound(muted);
        setInvalidKeys(new Set([`${a.r},${a.c}`, `${b.r},${b.c}`]));
        showNotice("Swap must match 3 or more");
        window.setTimeout(() => setInvalidKeys(new Set()), 280);
        return;
      }
    }

    const triggerSpecialBursts = (
      currentBoard: MatchTile[][],
      coords: BoardCoord[]
    ) => {
      const fxList: ClearBurstEffect[] = [];
      for (const pt of coords) {
        const sp = currentBoard[pt.r]?.[pt.c]?.special;
        if (sp && sp !== "none") {
          fxList.push({
            id: `fx-${Date.now()}-${pt.r}-${pt.c}-${Math.random().toString(36).slice(2, 5)}`,
            kind: sp,
            r: pt.r,
            c: pt.c,
          });
        }
      }
      if (fxList.length > 0) {
        setBurstEffects(fxList);
        window.setTimeout(() => setBurstEffects([]), 380);
      }
    };

    setIsResolving(true);
    playSwapSound(muted);
    setBoard(workingBoard);
    await sleep(175);
    if (gameGenRef.current !== activeGen) return;

    let combo = 0;

    if (isBombSwap) {
      combo = 1;
      setCurrentCombo(1);
      const bombCoord = tileA.special === "bomb" ? b : a;
      const targetCoord = tileA.special === "bomb" ? a : b;
      const cleared = resolveBombColorSwap(workingBoard, bombCoord, targetCoord);

      const counts: Record<ResourceType, number> = {
        timber: 0,
        brick: 0,
        gold: 0,
        power: 0,
        civic: 0,
      };
      for (const pt of cleared) {
        counts[workingBoard[pt.r][pt.c].type] += 1;
      }

      playMatchSound(muted, 2);
      setClearingKeys(new Set(cleared.map((pt) => `${pt.r},${pt.c}`)));
      triggerSpecialBursts(workingBoard, cleared);
      awardMatchResources(counts, 1.5, bombCoord);

      await sleep(200);
      if (gameGenRef.current !== activeGen) return;

      setClearingKeys(new Set());
      workingBoard = applyGravityAndRefill(workingBoard, cleared, []);
      setBoard(workingBoard);
      await sleep(230);
      if (gameGenRef.current !== activeGen) return;
    }

    // Cascade loop
    while (true) {
      const resolution = findMatches(workingBoard, combo === 0 ? [a, b] : []);
      if (resolution.clearedCoords.length === 0 && resolution.spawns.length === 0) {
        break;
      }

      combo += 1;
      setCurrentCombo(combo);
      playMatchSound(muted, combo);

      setClearingKeys(
        new Set(resolution.clearedCoords.map((pt) => `${pt.r},${pt.c}`))
      );
      triggerSpecialBursts(workingBoard, resolution.clearedCoords);

      const anchor = resolution.clearedCoords[0] ?? b;
      awardMatchResources(resolution.countsByType, combo, anchor);

      await sleep(200);
      if (gameGenRef.current !== activeGen) return;

      setClearingKeys(new Set());
      workingBoard = applyGravityAndRefill(
        workingBoard,
        resolution.clearedCoords,
        resolution.spawns
      );
      setBoard(workingBoard);

      await sleep(230);
      if (gameGenRef.current !== activeGen) return;
    }

    // Ensure board always has at least one valid move
    if (!findValidMove(workingBoard)) {
      workingBoard = reshuffleBoard(workingBoard);
      setBoard(workingBoard);
      showNotice("No moves left on board — reshuffled!");
    }

    const nextTurns = turnsPlayed + 1;
    setTurnsPlayed(nextTurns);

    // City Payday every PAYDAY_INTERVAL moves
    if (nextTurns % PAYDAY_INTERVAL === 0) {
      const income = computePaydayIncome(lots, prestigeLevel);
      if (income.timber || income.brick || income.gold || income.power) {
        setResources((prev) => ({
          timber: prev.timber + income.timber,
          brick: prev.brick + income.brick,
          gold: prev.gold + income.gold,
          power: prev.power + income.power,
        }));
        const parts: string[] = [];
        if (income.gold) parts.push(`+${income.gold}G`);
        if (income.timber) parts.push(`+${income.timber}T`);
        if (income.brick) parts.push(`+${income.brick}B`);
        if (income.power) parts.push(`+${income.power}P`);
        showNotice(`City Payday: ${parts.join(" · ")}`);
      }
    }

    setCurrentCombo(0);
    setIsResolving(false);
  };

  const handleTileClick = (coord: BoardCoord) => {
    if (isResolving || gameState !== "PLAYING") return;
    setHintPair(null);

    if (!selectedCoord) {
      setSelectedCoord(coord);
      return;
    }

    if (selectedCoord.r === coord.r && selectedCoord.c === coord.c) {
      setSelectedCoord(null);
      return;
    }

    if (areAdjacent(selectedCoord, coord)) {
      void executeSwap(selectedCoord, coord);
      return;
    }

    setSelectedCoord(coord);
  };

  const handleRequestHint = () => {
    if (isResolving) return;
    const move = findValidMove(board);
    if (move) {
      setHintPair(move);
    } else {
      setBoard((prev) => reshuffleBoard(prev));
      showNotice("Board reshuffled!");
    }
  };

  const handleManualReshuffle = () => {
    if (isResolving) return;
    setSelectedCoord(null);
    setHintPair(null);
    setBoard((prev) => reshuffleBoard(prev));
    showNotice("Board reshuffled");
  };

  const handleLotClick = (index: number) => {
    if (gameState !== "PLAYING") return;
    const lot = lots[index];
    if (!lot) return;

    // Built lot -> select it for inspection / upgrade
    if (lot.building !== null) {
      setSelectedLotIndex(index);
      return;
    }

    // Empty lot -> build selected blueprint
    const def = BUILDING_DEFS[selectedBlueprint];
    const cost = def.costsByLevel[1];
    if (!canAfford(resources, cost)) {
      playInvalidSwapSound(muted);
      showNotice(`Need more resources for ${def.name}`);
      return;
    }

    let nextRes = subtractCost(resources, cost);
    if (selectedBlueprint === "solar") {
      nextRes = { ...nextRes, power: nextRes.power + 6 };
    }

    setResources(nextRes);
    setLots((prev) =>
      prev.map((l) =>
        l.index === index
          ? { ...l, building: selectedBlueprint, level: 1 }
          : l
      )
    );
    setSelectedLotIndex(index);
    setLastBuiltLot({ index, token: Date.now() });
    playBuildSound(muted);
    showNotice(`Built ${def.name}`);
  };

  const handleUpgradeLot = (index: number) => {
    const lot = lots[index];
    if (!lot || !lot.building) return;
    const def = BUILDING_DEFS[lot.building];
    const nextLv = lot.level + 1;
    if (nextLv > def.maxLevel) return;

    const cost = def.costsByLevel[nextLv];
    if (!canAfford(resources, cost)) {
      playInvalidSwapSound(muted);
      return;
    }

    let nextRes = subtractCost(resources, cost);
    if (lot.building === "solar") {
      nextRes = {
        ...nextRes,
        power: nextRes.power + (SOLAR_INSTANT_POWER_BY_LEVEL[nextLv] ?? 6),
      };
    }

    setResources(nextRes);
    setLots((prev) =>
      prev.map((l) => (l.index === index ? { ...l, level: nextLv } : l))
    );
    setLastBuiltLot({ index, token: Date.now() });
    playUpgradeSound(muted);
    showNotice(`Upgraded ${def.name} to Lv.${nextLv}`);
  };

  const handleDemolishLot = (index: number) => {
    const lot = lots[index];
    if (!lot || !lot.building || lot.building === "townhall") return;
    const refund = getRefundForLot(lot);
    setResources((prev) => ({
      timber: prev.timber + refund.timber,
      brick: prev.brick + refund.brick,
      gold: prev.gold + refund.gold,
      power: prev.power + refund.power,
    }));
    setLots((prev) =>
      prev.map((l) =>
        l.index === index ? { ...l, building: null, level: 0 } : l
      )
    );
    setSelectedLotIndex(null);
    showNotice("Plot cleared (75% refunded)");
  };

  // TITLE MENU
  if (gameState === "TITLE_MENU") {
    return (
      <div className="min-h-dvh bg-[#F3EFE6] px-6 py-8 text-slate-900">
        <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-4xl flex-col justify-center">
          <div className="overflow-hidden rounded-2xl border border-[#D8CFC0] bg-[#FAF7F0] shadow-sm">
            {/* Hero Diorama Banner */}
            <div className="relative aspect-16/9 max-h-[340px] w-full overflow-hidden bg-slate-800">
              {!heroImgFailed ? (
                <img
                  src={TITLE_IMAGE_SRC}
                  alt="Sunlit isometric miniature town with brick townhouses, parks, and a central clocktower"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-800 via-slate-800 to-amber-900 text-white">
                  <Building2 className="h-16 w-16 opacity-80" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-balance">
                  TileTown
                </h1>
                <p className="mt-1.5 max-w-xl text-base leading-relaxed text-slate-200">
                  Match resources on a giant 15×15 board to expand a massive 225-plot city with 10 unique buildings—relaxed, endless, and built to grow forever.
                </p>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-[#E4DDD0] bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Trees className="h-4 w-4 text-emerald-700" />
                    <span>1. 15×15 Match Board</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    Swap or swipe tiles on a huge 15×15 board for big chain cascades and generous Timber, Brick, Gold, Power, and Citizens.
                  </p>
                </div>

                <div className="rounded-xl border border-[#E4DDD0] bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Home className="h-4 w-4 text-blue-700" />
                    <span>2. 225-Plot City Map</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    Place Residences, Parks, Markets, Academies, Transit Hubs, Observatories, and more across an expanded 15×15 city map.
                  </p>
                </div>

                <div className="rounded-xl border border-[#E4DDD0] bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Crown className="h-4 w-4 text-amber-600" />
                    <span>3. Upgrades &amp; Prestige</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    Upgrade buildings up to Lv.6 (Town Hall Lv.8), earn endless paydays every 2 moves, and Prestige for permanent yield &amp; population boosts.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-row items-center justify-between gap-4 border-t border-[#E4DDD0] pt-6">
                <div className="space-y-1">
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">
                      Endless Relaxed Mode
                    </span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>
                      {user
                        ? "Auto-saved to your Google Account"
                        : "Sign in with Google to save forever across devices"}
                    </span>
                  </div>
                  {authMessage && (
                    <p className="text-xs font-medium text-blue-800">
                      {authMessage}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {bestPopulation > 0 && (
                    <div className="text-right text-xs text-slate-600 tabular-nums">
                      <div className="font-medium text-slate-500">Best Pop</div>
                      <div className="font-mono font-semibold text-slate-900">
                        {bestPopulation}
                      </div>
                    </div>
                  )}

                  <AccountControls
                    user={user}
                    authReady={authReady}
                    syncStatus={syncStatus}
                    authBusy={authBusy}
                    variant="menu"
                    onSignIn={() => void handleGoogleSignIn()}
                    onSignOut={() => void handleGoogleSignOut()}
                  />

                  <PWAInstallButton variant="menu" />

                  {hasSavedProgress ? (
                    <>
                      {confirmReset ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startNewGame("endless")}
                            className="inline-flex h-12 items-center justify-center rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-rose-700 whitespace-nowrap shrink-0"
                          >
                            Confirm Fresh City
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmReset(false)}
                            className="inline-flex h-12 items-center justify-center rounded-xl border border-[#D4CBB8] bg-white px-4 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmReset(true)}
                          className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-[#D4CBB8] bg-white px-4 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>New City</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={continueSavedGame}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        <span>Continue City</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startNewGame("endless")}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 whitespace-nowrap shrink-0"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      <span>Start Building</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <OfflineIndicator />
      </div>
    );
  }

  const movesToPayday = PAYDAY_INTERVAL - (turnsPlayed % PAYDAY_INTERVAL);

  return (
    <div className="min-h-dvh bg-[#F3EFE6] text-slate-900">
      {/* Top HUD Bar */}
      <header className="border-b border-[#DDD5C7] bg-[#FAF7F0]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap">
              TileTown
            </span>
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
              {stats.cityRank} · Endless
            </span>
          </div>

          {/* Primary Page Switcher */}
          <nav aria-label="Game views" className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActivePage("city")}
              aria-current={activePage === "city" ? "page" : undefined}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0 ${
                activePage === "city"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "border border-[#DDD5C7] bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <MapIcon className="h-4 w-4" />
              <span>City Map</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePage("harvest")}
              aria-current={activePage === "harvest" ? "page" : undefined}
              className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 whitespace-nowrap shrink-0 ${
                activePage === "harvest"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "border border-[#DDD5C7] bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Pickaxe className="h-4 w-4" />
              <span>Resource Harvest</span>
            </button>
          </nav>

          {/* Core City Metrics */}
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div className="flex items-center gap-1.5 tabular-nums">
              <Users className="h-4 w-4 text-rose-700 shrink-0" />
              <span className="text-slate-600">Pop:</span>
              <strong className="font-mono text-sm text-slate-900">
                {stats.population}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 tabular-nums">
              <Crown className="h-4 w-4 text-blue-700 shrink-0" />
              <span className="text-slate-600">Hall:</span>
              <strong className="font-mono text-sm text-slate-900">
                Lv.{stats.townHallLevel}/8
              </strong>
            </div>

            <div className="flex items-center gap-1.5 tabular-nums">
              <Smile className="h-4 w-4 text-emerald-700 shrink-0" />
              <span className="text-slate-600">Happy:</span>
              <strong className="font-mono text-sm text-slate-900">
                {stats.happiness}%
              </strong>
            </div>

            <div className="flex items-center gap-1.5 tabular-nums">
              <Footprints className="h-4 w-4 text-amber-700 shrink-0" />
              <span className="text-slate-600">Turn:</span>
              <strong className="font-mono text-sm text-slate-900">
                {turnsPlayed}
              </strong>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">Payday in {movesToPayday}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowPrestigeModal(true)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                prestigeReady
                  ? "bg-amber-600 text-white shadow-xs hover:bg-amber-700"
                  : "border border-[#DDD5C7] bg-white text-slate-800 hover:bg-amber-50"
              }`}
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  prestigeReady ? "fill-white" : "fill-amber-400 text-amber-600"
                }`}
              />
              <span className="font-mono tabular-nums">★{prestigeLevel}</span>
              {prestigeReady && <span>Ascend</span>}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <AccountControls
              user={user}
              authReady={authReady}
              syncStatus={syncStatus}
              authBusy={authBusy}
              variant="header"
              onSignIn={() => void handleGoogleSignIn()}
              onSignOut={() => void handleGoogleSignOut()}
            />

            <PWAInstallButton variant="header" />

            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#DDD5C7] bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0"
            >
              {muted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              <span>{muted ? "Muted" : "Sound"}</span>
            </button>

            {confirmReset ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => startNewGame(gameMode)}
                  className="inline-flex h-10 items-center rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-rose-700 whitespace-nowrap shrink-0"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="inline-flex h-10 items-center rounded-lg border border-[#DDD5C7] bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#DDD5C7] bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                gameGenRef.current += 1;
                setConfirmReset(false);
                setGameState("TITLE_MENU");
              }}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-3.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap shrink-0"
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      {/* Main 1440px Dual-Arena Workspace */}
      <main className="mx-auto max-w-[1400px] px-6 py-3.5">
        {/* Resource Vault Strip */}
        <div className="mb-3.5 grid grid-cols-4 gap-3">
          <div className="flex items-center justify-between rounded-xl border border-[#DDD5C7] bg-[#FAF7F0] px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                <Trees className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600">Timber</div>
                <div className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {resources.timber}
                </div>
              </div>
            </div>
            {stats.timberBonus > 0 && (
              <span className="font-mono text-xs font-medium text-emerald-700 tabular-nums">
                +{stats.timberBonus}/match
              </span>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#DDD5C7] bg-[#FAF7F0] px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-800">
                <BrickWall className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600">Brick</div>
                <div className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {resources.brick}
                </div>
              </div>
            </div>
            {stats.brickBonus > 0 && (
              <span className="font-mono text-xs font-medium text-orange-700 tabular-nums">
                +{stats.brickBonus}/match
              </span>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#DDD5C7] bg-[#FAF7F0] px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <Coins className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600">Gold</div>
                <div className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {resources.gold}
                </div>
              </div>
            </div>
            <span className="font-mono text-xs font-medium text-amber-700 tabular-nums">
              +{stats.goldPerCycle}/payday
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#DDD5C7] bg-[#FAF7F0] px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-600">Power</div>
                <div className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {resources.power}
                </div>
              </div>
            </div>
            <span className="font-mono text-xs font-medium text-sky-700 tabular-nums">
              +{computePaydayIncome(lots, prestigeLevel).power}/payday
            </span>
          </div>
        </div>

        {/* Active Page View */}
        {activePage === "city" ? (
          <CityGrid
            lots={lots}
            resources={resources}
            selectedLotIndex={selectedLotIndex}
            selectedBlueprint={selectedBlueprint}
            lastBuiltLot={lastBuiltLot}
            prestigeLevel={prestigeLevel}
            prestigeReady={prestigeReady}
            onSelectBlueprint={setSelectedBlueprint}
            onLotClick={handleLotClick}
            onUpgradeLot={handleUpgradeLot}
            onDemolishLot={handleDemolishLot}
            onOpenHarvest={() => setActivePage("harvest")}
            onOpenPrestige={() => setShowPrestigeModal(true)}
          />
        ) : (
          <div className="mx-auto grid max-w-[1360px] grid-cols-12 items-start gap-5">
            <div className="col-span-8">
              <Match3Board
                board={board}
                selectedCoord={selectedCoord}
                hintPair={hintPair}
                clearingKeys={clearingKeys}
                invalidKeys={invalidKeys}
                burstEffects={burstEffects}
                isResolving={isResolving}
                comboCount={currentCombo}
                floatingGains={floatingGains}
                statusNotice={statusNotice}
                onTileClick={handleTileClick}
                onSwipeSwap={(a, b) => void executeSwap(a, b)}
                onRequestHint={handleRequestHint}
                onReshuffle={handleManualReshuffle}
                onOpenCityMap={() => setActivePage("city")}
              />
            </div>

            <aside className="col-span-4 flex flex-col gap-4 rounded-2xl border border-[#D4CBB8] bg-[#FAF7F0] p-5 shadow-sm">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-slate-900">
                  Harvest &amp; City Summary
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Every match feeds your city vault directly. Switch back to the City Map whenever you are ready to build or upgrade plots.
                </p>
              </div>

              <div className="rounded-xl border border-[#DDD5C7] bg-white p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Next City Payday
                  </span>
                  <span className="font-mono font-bold text-amber-700 tabular-nums">
                    In {movesToPayday} {movesToPayday === 1 ? "move" : "moves"}
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs font-mono tabular-nums text-slate-700">
                  <div className="rounded-lg bg-[#FAF7F0] px-3 py-2">
                    +{computePaydayIncome(lots, prestigeLevel).gold} Gold
                  </div>
                  <div className="rounded-lg bg-[#FAF7F0] px-3 py-2">
                    +{computePaydayIncome(lots, prestigeLevel).power} Power
                  </div>
                  <div className="rounded-lg bg-[#FAF7F0] px-3 py-2">
                    +{computePaydayIncome(lots, prestigeLevel).timber} Timber
                  </div>
                  <div className="rounded-lg bg-[#FAF7F0] px-3 py-2">
                    +{computePaydayIncome(lots, prestigeLevel).brick} Brick
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#DDD5C7] bg-white p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  Board Boosters
                </h3>
                <ul className="mt-2.5 space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <ArrowLeftRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-800" />
                    <span>
                      <strong className="text-slate-900">Match 4:</strong> Creates a Row or Column Crane that sweeps an entire line.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span>
                      <strong className="text-slate-900">Match 5:</strong> Creates a Color Blast Bomb—swap it with any tile to clear every matching resource on the 15×15 board.
                    </span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setActivePage("city")}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <MapIcon className="h-4 w-4" />
                <span>
                  Open City Map ({lots.filter((l) => l.building !== null).length}/
                  {lots.length} plots)
                </span>
              </button>
            </aside>
          </div>
        )}
      </main>
      <PrestigeModal
        open={showPrestigeModal}
        prestigeLevel={prestigeLevel}
        stats={stats}
        bestPopulation={bestPopulation}
        onClose={() => setShowPrestigeModal(false)}
        onPrestige={handlePrestige}
      />
      <OfflineIndicator />
    </div>
  );
}
