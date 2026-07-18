import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";

import { FREE_SUPPLEMENT_LIMIT } from "@/constants/limits";
import { scheduleSupplementNotifications } from "@/services/notifications";
import {
  refreshPremiumFromStore,
  watchPremiumEntitlement,
} from "@/utils/premium";

export type SupplementCategory =
  | "Vitamin"
  | "Mineral"
  | "Protein"
  | "Herb"
  | "Medication"
  | "Other";
export type FrequencyType =
  | "once_daily"
  | "twice_daily"
  | "custom_days"
  | "weekly"
  | "monthly";
export type MealTiming =
  | "with_food"
  | "before_food"
  | "after_food"
  | "anytime";
export type DoseStatus = "taken" | "skipped" | "missed";

export interface Supplement {
  id: string;
  name: string;
  brand?: string;
  category: SupplementCategory;
  dosage: string;
  unit: string;
  frequency: FrequencyType;
  customDays?: number[];
  times: string[];
  mealTiming: MealTiming;
  notes: string;
  startDate: string;
  endDate?: string;
  bottleQuantity?: number;
  remainingQuantity?: number;
  color: string;
  isActive: boolean;
  remindersEnabled?: boolean;
  nutrients?: Record<string, number>;
  createdAt: string;
  updatedAt?: string;
}

export interface DoseLog {
  id: string;
  supplementId: string;
  date: string;
  scheduledTime: string;
  status: DoseStatus;
  takenAt?: string;
}

export interface UserProfile {
  name?: string;
  goal?: string;
  ageRange?: string;
  gender?: string;
  onboardingComplete: boolean;
  streak: number;
  longestStreak: number;
  xpPoints: number;
  isPremium: boolean;
  lastActiveDate?: string;
  notificationsEnabled?: boolean;
  email?: string;
}

export interface ScheduledDose {
  supplement: Supplement;
  time: string;
  date: string;
  log?: DoseLog;
}

interface SupplementContextValue {
  supplements: Supplement[];
  doseLogs: DoseLog[];
  profile: UserProfile;
  isLoading: boolean;
  canAddSupplement: boolean;
  freeSupplementLimit: number;
  lowStockSupplements: Supplement[];
  addSupplement: (s: Omit<Supplement, "id" | "createdAt">) => Promise<void>;
  updateSupplement: (id: string, updates: Partial<Supplement>) => Promise<void>;
  deleteSupplement: (id: string) => Promise<void>;
  setSupplementActive: (id: string, isActive: boolean) => Promise<void>;
  logDose: (
    supplementId: string,
    date: string,
    time: string,
    status: DoseStatus
  ) => Promise<void>;
  getScheduledDoses: (date: string) => ScheduledDose[];
  getDayAdherence: (date: string) => number;
  getWeekAdherence: () => number[];
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  replaceAllData: (data: {
    supplements: Supplement[];
    doseLogs: DoseLog[];
    profile: UserProfile;
  }) => Promise<void>;
  resetAllData: () => Promise<void>;
}

const SupplementContext = createContext<SupplementContextValue | null>(null);

const STORAGE_KEYS = {
  supplements: "@suptracker:supplements",
  doseLogs: "@suptracker:doseLogs",
  profile: "@suptracker:profile",
};

const DEFAULT_PROFILE: UserProfile = {
  onboardingComplete: false,
  streak: 0,
  longestStreak: 0,
  xpPoints: 0,
  isPremium: false,
  notificationsEnabled: true,
};

const LOW_STOCK_THRESHOLD = 7;
const MISS_LOOKBACK_DAYS = 14;

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0]!;
}

export function isActiveOnDate(supplement: Supplement, dateStr: string): boolean {
  const date = new Date(dateStr + "T12:00:00");
  const start = new Date(supplement.startDate + "T12:00:00");
  if (date < start) return false;
  if (supplement.endDate) {
    const end = new Date(supplement.endDate + "T12:00:00");
    if (date > end) return false;
  }
  if (!supplement.isActive) return false;
  const dow = date.getDay();
  switch (supplement.frequency) {
    case "once_daily":
    case "twice_daily":
      return true;
    case "custom_days":
      return supplement.customDays?.includes(dow) ?? true;
    case "weekly":
      return dow === new Date(supplement.startDate + "T12:00:00").getDay();
    case "monthly":
      return date.getDate() === new Date(supplement.startDate + "T12:00:00").getDate();
    default:
      return true;
  }
}

function getScheduledDosesFromData(
  sups: Supplement[],
  logs: DoseLog[],
  dateStr: string
): ScheduledDose[] {
  const doses: ScheduledDose[] = [];
  for (const sup of sups) {
    if (!isActiveOnDate(sup, dateStr)) continue;
    for (const time of sup.times) {
      const log = logs.find(
        (l) =>
          l.supplementId === sup.id &&
          l.date === dateStr &&
          l.scheduledTime === time
      );
      doses.push({ supplement: sup, time, date: dateStr, log });
    }
  }
  doses.sort((a, b) => a.time.localeCompare(b.time));
  return doses;
}

function hasTimePassed(dateStr: string, time: string, graceMinutes = 30): boolean {
  const now = new Date();
  const [h, m] = time.split(":").map((x) => parseInt(x ?? "0", 10));
  const scheduled = new Date(`${dateStr}T00:00:00`);
  scheduled.setHours(h ?? 8, m ?? 0, 0, 0);
  scheduled.setMinutes(scheduled.getMinutes() + graceMinutes);
  return now > scheduled;
}

function autoMarkMissed(sups: Supplement[], logs: DoseLog[]): DoseLog[] {
  const byKey = new Map(
    logs.map((l) => [`${l.supplementId}|${l.date}|${l.scheduledTime}`, l])
  );
  let changed = false;
  const today = getTodayStr();

  for (let i = 0; i < MISS_LOOKBACK_DAYS; i++) {
    const dateStr = dateOffset(i);
    for (const dose of getScheduledDosesFromData(sups, logs, dateStr)) {
      const key = `${dose.supplement.id}|${dateStr}|${dose.time}`;
      if (byKey.has(key)) continue;
      if (!hasTimePassed(dateStr, dose.time)) continue;
      // Don't mark future days; today only if time passed
      if (dateStr > today) continue;
      const missed: DoseLog = {
        id: generateId(),
        supplementId: dose.supplement.id,
        date: dateStr,
        scheduledTime: dose.time,
        status: "missed",
      };
      byKey.set(key, missed);
      changed = true;
    }
  }

  return changed ? Array.from(byKey.values()) : logs;
}

export function SupplementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const lowStockAlerted = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoading) {
      scheduleSupplementNotifications(supplements, {
        enabled: profile.notificationsEnabled !== false,
      });
    }
  }, [supplements, isLoading, profile.notificationsEnabled]);

  useEffect(() => {
    if (isLoading) return;
    let mounted = true;
    const unsubscribe = watchPremiumEntitlement(async (isPremium) => {
      if (!mounted) return;
      setProfile((current) => {
        if (current.isPremium === isPremium) return current;
        const next = { ...current, isPremium };
        void AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(next));
        return next;
      });
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [isLoading]);

  useEffect(() => {
    async function load() {
      try {
        const [supsRaw, logsRaw, profileRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.supplements),
          AsyncStorage.getItem(STORAGE_KEYS.doseLogs),
          AsyncStorage.getItem(STORAGE_KEYS.profile),
        ]);
        const loadedSups: Supplement[] = supsRaw ? JSON.parse(supsRaw) : [];
        let loadedLogs: DoseLog[] = logsRaw ? JSON.parse(logsRaw) : [];
        const loadedProfile: UserProfile = profileRaw
          ? { ...DEFAULT_PROFILE, ...JSON.parse(profileRaw) }
          : DEFAULT_PROFILE;

        loadedLogs = autoMarkMissed(loadedSups, loadedLogs);
        setSupplements(loadedSups);
        setDoseLogs(loadedLogs);
        setProfile(loadedProfile);
        await AsyncStorage.setItem(
          STORAGE_KEYS.doseLogs,
          JSON.stringify(loadedLogs)
        );

        void refreshPremiumFromStore(async (isPremium) => {
          if (isPremium === loadedProfile.isPremium) return;
          const next = { ...loadedProfile, isPremium };
          setProfile(next);
          await AsyncStorage.setItem(
            STORAGE_KEYS.profile,
            JSON.stringify(next)
          );
        });
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Periodically mark missed doses while app is open
  useEffect(() => {
    if (isLoading) return;
    const tick = async () => {
      const next = autoMarkMissed(supplements, doseLogs);
      if (next !== doseLogs) {
        setDoseLogs(next);
        await AsyncStorage.setItem(STORAGE_KEYS.doseLogs, JSON.stringify(next));
      }
    };
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [supplements, doseLogs, isLoading]);

  const saveSupplements = useCallback(async (sups: Supplement[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.supplements, JSON.stringify(sups));
    setSupplements(sups);
  }, []);

  const saveDoseLogs = useCallback(async (logs: DoseLog[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.doseLogs, JSON.stringify(logs));
    setDoseLogs(logs);
  }, []);

  const saveProfile = useCallback(async (p: UserProfile) => {
    await AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(p));
    setProfile(p);
  }, []);

  const canAddSupplement =
    profile.isPremium ||
    supplements.filter((s) => s.isActive).length < FREE_SUPPLEMENT_LIMIT;

  const lowStockSupplements = useMemo(
    () =>
      supplements.filter(
        (s) =>
          s.isActive &&
          typeof s.remainingQuantity === "number" &&
          s.remainingQuantity <= LOW_STOCK_THRESHOLD
      ),
    [supplements]
  );

  const addSupplement = useCallback(
    async (s: Omit<Supplement, "id" | "createdAt">) => {
      const activeCount = supplements.filter((x) => x.isActive).length;
      if (!profile.isPremium && activeCount >= FREE_SUPPLEMENT_LIMIT) {
        throw new Error(
          `Free plan allows up to ${FREE_SUPPLEMENT_LIMIT} supplements. Upgrade to Premium for unlimited tracking.`
        );
      }
      const now = new Date().toISOString();
      const newSup: Supplement = {
        ...s,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        remindersEnabled: s.remindersEnabled ?? true,
      };
      await saveSupplements([...supplements, newSup]);
    },
    [supplements, saveSupplements, profile.isPremium]
  );

  const updateSupplement = useCallback(
    async (id: string, updates: Partial<Supplement>) => {
      const updated = supplements.map((s) =>
        s.id === id
          ? { ...s, ...updates, updatedAt: new Date().toISOString() }
          : s
      );
      await saveSupplements(updated);
    },
    [supplements, saveSupplements]
  );

  const deleteSupplement = useCallback(
    async (id: string) => {
      await saveSupplements(supplements.filter((s) => s.id !== id));
    },
    [supplements, saveSupplements]
  );

  const setSupplementActive = useCallback(
    async (id: string, isActive: boolean) => {
      await updateSupplement(id, { isActive });
    },
    [updateSupplement]
  );

  const logDose = useCallback(
    async (
      supplementId: string,
      date: string,
      time: string,
      status: DoseStatus
    ) => {
      const existingIdx = doseLogs.findIndex(
        (l) =>
          l.supplementId === supplementId &&
          l.date === date &&
          l.scheduledTime === time
      );
      let newLogs = [...doseLogs];
      if (existingIdx >= 0) {
        newLogs[existingIdx] = {
          ...newLogs[existingIdx]!,
          status,
          takenAt: status === "taken" ? new Date().toISOString() : undefined,
        };
      } else {
        newLogs.push({
          id: generateId(),
          supplementId,
          date,
          scheduledTime: time,
          status,
          takenAt: status === "taken" ? new Date().toISOString() : undefined,
        });
      }
      await saveDoseLogs(newLogs);

      if (status === "taken") {
        const today = getTodayStr();
        const newProfile = { ...profile };
        newProfile.xpPoints += 10;
        if (date === today) {
          const allToday = getScheduledDosesFromData(
            supplements,
            newLogs,
            today
          );
          const allTaken = allToday.every((d) => d.log?.status === "taken");
          if (allTaken) {
            if (profile.lastActiveDate) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yStr = yesterday.toISOString().split("T")[0]!;
              if (
                profile.lastActiveDate === yStr ||
                profile.lastActiveDate === today
              ) {
                newProfile.streak = profile.streak + 1;
              } else {
                newProfile.streak = 1;
              }
            } else {
              newProfile.streak = 1;
            }
            newProfile.longestStreak = Math.max(
              newProfile.streak,
              newProfile.longestStreak
            );
            newProfile.lastActiveDate = today;
          }
        }
        await saveProfile(newProfile);

        // Inventory depletion + low-stock alert
        const idx = supplements.findIndex((s) => s.id === supplementId);
        if (idx >= 0) {
          const sup = supplements[idx]!;
          if (typeof sup.remainingQuantity === "number") {
            const remaining = Math.max(0, sup.remainingQuantity - 1);
            const nextSups = [...supplements];
            nextSups[idx] = {
              ...sup,
              remainingQuantity: remaining,
              updatedAt: new Date().toISOString(),
            };
            await saveSupplements(nextSups);

            if (
              remaining <= LOW_STOCK_THRESHOLD &&
              !lowStockAlerted.current.has(sup.id)
            ) {
              lowStockAlerted.current.add(sup.id);
              Alert.alert(
                "Low stock",
                `${sup.name} has about ${remaining} dose${remaining === 1 ? "" : "s"} left. Time to refill?`
              );
            }
          }
        }
      }
    },
    [doseLogs, supplements, profile, saveDoseLogs, saveProfile, saveSupplements]
  );

  const getScheduledDoses = useCallback(
    (dateStr: string): ScheduledDose[] => {
      return getScheduledDosesFromData(supplements, doseLogs, dateStr);
    },
    [supplements, doseLogs]
  );

  const getDayAdherence = useCallback(
    (dateStr: string): number => {
      const scheduled = getScheduledDosesFromData(supplements, doseLogs, dateStr);
      if (scheduled.length === 0) return -1;
      const taken = scheduled.filter((d) => d.log?.status === "taken").length;
      return taken / scheduled.length;
    },
    [supplements, doseLogs]
  );

  const getWeekAdherence = useCallback((): number[] => {
    const result: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split("T")[0]!;
      const adh = getDayAdherence(str);
      result.push(adh < 0 ? 0 : adh);
    }
    return result;
  }, [getDayAdherence]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      await saveProfile({ ...profile, ...updates });
    },
    [profile, saveProfile]
  );

  const replaceAllData = useCallback(
    async (data: {
      supplements: Supplement[];
      doseLogs: DoseLog[];
      profile: UserProfile;
    }) => {
      const mergedProfile = { ...DEFAULT_PROFILE, ...data.profile };
      const logs = autoMarkMissed(data.supplements, data.doseLogs);
      await Promise.all([
        AsyncStorage.setItem(
          STORAGE_KEYS.supplements,
          JSON.stringify(data.supplements)
        ),
        AsyncStorage.setItem(STORAGE_KEYS.doseLogs, JSON.stringify(logs)),
        AsyncStorage.setItem(
          STORAGE_KEYS.profile,
          JSON.stringify(mergedProfile)
        ),
      ]);
      setSupplements(data.supplements);
      setDoseLogs(logs);
      setProfile(mergedProfile);
    },
    []
  );

  const resetAllData = useCallback(async () => {
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.supplements, JSON.stringify([])),
      AsyncStorage.setItem(STORAGE_KEYS.doseLogs, JSON.stringify([])),
      AsyncStorage.setItem(
        STORAGE_KEYS.profile,
        JSON.stringify(DEFAULT_PROFILE)
      ),
    ]);
    setSupplements([]);
    setDoseLogs([]);
    setProfile(DEFAULT_PROFILE);
    lowStockAlerted.current.clear();
    try {
      await scheduleSupplementNotifications([]);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<SupplementContextValue>(
    () => ({
      supplements,
      doseLogs,
      profile,
      isLoading,
      canAddSupplement,
      freeSupplementLimit: FREE_SUPPLEMENT_LIMIT,
      lowStockSupplements,
      addSupplement,
      updateSupplement,
      deleteSupplement,
      setSupplementActive,
      logDose,
      getScheduledDoses,
      getDayAdherence,
      getWeekAdherence,
      updateProfile,
      replaceAllData,
      resetAllData,
    }),
    [
      supplements,
      doseLogs,
      profile,
      isLoading,
      canAddSupplement,
      lowStockSupplements,
      addSupplement,
      updateSupplement,
      deleteSupplement,
      setSupplementActive,
      logDose,
      getScheduledDoses,
      getDayAdherence,
      getWeekAdherence,
      updateProfile,
      replaceAllData,
      resetAllData,
    ]
  );

  return (
    <SupplementContext.Provider value={value}>
      {children}
    </SupplementContext.Provider>
  );
}

export function useSupplements(): SupplementContextValue {
  const ctx = useContext(SupplementContext);
  if (!ctx)
    throw new Error("useSupplements must be used within SupplementProvider");
  return ctx;
}
