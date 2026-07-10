import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { FREE_SUPPLEMENT_LIMIT } from "@/constants/limits";
import { scheduleSupplementNotifications } from "@/services/notifications";

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
  createdAt: string;
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
  addSupplement: (s: Omit<Supplement, "id" | "createdAt">) => Promise<void>;
  updateSupplement: (id: string, updates: Partial<Supplement>) => Promise<void>;
  deleteSupplement: (id: string) => Promise<void>;
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
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getTodayStr(): string {
  return new Date().toISOString().split("T")[0]!;
}

function isActiveOnDate(supplement: Supplement, dateStr: string): boolean {
  const date = new Date(dateStr);
  const start = new Date(supplement.startDate);
  start.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  if (date < start) return false;
  if (supplement.endDate) {
    const end = new Date(supplement.endDate);
    end.setHours(0, 0, 0, 0);
    if (date > end) return false;
  }
  if (!supplement.isActive) return false;
  const dow = new Date(dateStr).getDay();
  switch (supplement.frequency) {
    case "once_daily":
    case "twice_daily":
      return true;
    case "custom_days":
      return supplement.customDays?.includes(dow) ?? true;
    case "weekly":
      return dow === new Date(supplement.startDate).getDay();
    case "monthly":
      return (
        new Date(dateStr).getDate() === new Date(supplement.startDate).getDate()
      );
    default:
      return true;
  }
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

  useEffect(() => {
    if (!isLoading) {
      scheduleSupplementNotifications(supplements);
    }
  }, [supplements, isLoading]);

  useEffect(() => {
    async function load() {
      try {
        const [supsRaw, logsRaw, profileRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.supplements),
          AsyncStorage.getItem(STORAGE_KEYS.doseLogs),
          AsyncStorage.getItem(STORAGE_KEYS.profile),
        ]);
        if (supsRaw) setSupplements(JSON.parse(supsRaw));
        if (logsRaw) setDoseLogs(JSON.parse(logsRaw));
        if (profileRaw)
          setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(profileRaw) });
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

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
    profile.isPremium || supplements.length < FREE_SUPPLEMENT_LIMIT;

  const addSupplement = useCallback(
    async (s: Omit<Supplement, "id" | "createdAt">) => {
      if (!profile.isPremium && supplements.length >= FREE_SUPPLEMENT_LIMIT) {
        throw new Error(
          `Free plan allows up to ${FREE_SUPPLEMENT_LIMIT} supplements. Upgrade to Premium for unlimited tracking.`
        );
      }
      const newSup: Supplement = {
        ...s,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      await saveSupplements([...supplements, newSup]);
    },
    [supplements, saveSupplements, profile.isPremium]
  );

  const updateSupplement = useCallback(
    async (id: string, updates: Partial<Supplement>) => {
      const updated = supplements.map((s) =>
        s.id === id ? { ...s, ...updates } : s
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
              if (profile.lastActiveDate === yStr || profile.lastActiveDate === today) {
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
      }
    },
    [doseLogs, supplements, profile, saveDoseLogs, saveProfile]
  );

  const getScheduledDosesFromData = (
    sups: Supplement[],
    logs: DoseLog[],
    dateStr: string
  ): ScheduledDose[] => {
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
  };

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
    try {
      await scheduleSupplementNotifications([]);
    } catch {
      // ignore notification cleanup failures
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
      addSupplement,
      updateSupplement,
      deleteSupplement,
      logDose,
      getScheduledDoses,
      getDayAdherence,
      getWeekAdherence,
      updateProfile,
      resetAllData,
    }),
    [
      supplements,
      doseLogs,
      profile,
      isLoading,
      canAddSupplement,
      addSupplement,
      updateSupplement,
      deleteSupplement,
      logDose,
      getScheduledDoses,
      getDayAdherence,
      getWeekAdherence,
      updateProfile,
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
  if (!ctx) throw new Error("useSupplements must be used within SupplementProvider");
  return ctx;
}
