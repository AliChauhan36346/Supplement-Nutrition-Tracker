import { type DoseLog, type Supplement } from "@/context/SupplementContext";

export type NutrientKey =
  | "Vitamin D"
  | "Vitamin C"
  | "Vitamin B12"
  | "Calcium"
  | "Iron"
  | "Magnesium"
  | "Zinc"
  | "Omega-3"
  | "Protein";

export const NUTRIENT_OPTIONS: NutrientKey[] = [
  "Vitamin D",
  "Vitamin C",
  "Vitamin B12",
  "Calcium",
  "Iron",
  "Magnesium",
  "Zinc",
  "Omega-3",
  "Protein",
];

/** Rough adult daily reference values for display only (not medical advice). */
export const DAILY_TARGETS: Partial<Record<NutrientKey, { amount: number; unit: string }>> = {
  "Vitamin D": { amount: 20, unit: "mcg" },
  "Vitamin C": { amount: 90, unit: "mg" },
  "Vitamin B12": { amount: 2.4, unit: "mcg" },
  Calcium: { amount: 1000, unit: "mg" },
  Iron: { amount: 18, unit: "mg" },
  Magnesium: { amount: 400, unit: "mg" },
  Zinc: { amount: 11, unit: "mg" },
  "Omega-3": { amount: 250, unit: "mg" },
  Protein: { amount: 50, unit: "g" },
};

export function sumNutrientsForDate(
  supplements: Supplement[],
  doseLogs: DoseLog[],
  date: string
): Record<string, number> {
  const takenIds = new Set(
    doseLogs
      .filter((l) => l.date === date && l.status === "taken")
      .map((l) => l.supplementId)
  );
  const totals: Record<string, number> = {};
  for (const sup of supplements) {
    if (!takenIds.has(sup.id) || !sup.nutrients) continue;
    for (const [key, amount] of Object.entries(sup.nutrients)) {
      if (typeof amount !== "number" || Number.isNaN(amount)) continue;
      totals[key] = (totals[key] ?? 0) + amount;
    }
  }
  return totals;
}

export interface InteractionTip {
  id: string;
  title: string;
  body: string;
}

/** Stack-based tips — educational only, not medical advice. */
export function getInteractionTips(supplements: Supplement[]): InteractionTip[] {
  const active = supplements.filter((s) => s.isActive);
  const names = active.map((s) => s.name.toLowerCase());
  const cats = new Set(active.map((s) => s.category));
  const nutrientKeys = new Set(
    active.flatMap((s) => Object.keys(s.nutrients ?? {}))
  );
  const tips: InteractionTip[] = [];

  const has = (re: RegExp) => names.some((n) => re.test(n));
  const hasNutrient = (...keys: string[]) =>
    keys.some((k) => nutrientKeys.has(k));

  if (
    (has(/calcium/) || hasNutrient("Calcium")) &&
    (has(/iron/) || hasNutrient("Iron"))
  ) {
    tips.push({
      id: "ca-fe",
      title: "Calcium & Iron",
      body: "Separate calcium and iron by 2+ hours — they can reduce each other's absorption.",
    });
  }

  if (
    (has(/magnesium/) || hasNutrient("Magnesium")) &&
    (has(/calcium/) || hasNutrient("Calcium"))
  ) {
    tips.push({
      id: "mg-ca",
      title: "Magnesium & Calcium",
      body: "High doses together may compete for absorption. Consider splitting morning/evening.",
    });
  }

  if (has(/zinc/) || hasNutrient("Zinc")) {
    tips.push({
      id: "zn-food",
      title: "Zinc with food",
      body: "Zinc on an empty stomach can cause nausea — take with a meal if sensitive.",
    });
  }

  if (
    (has(/vitamin\s*d|d3|d2/) || hasNutrient("Vitamin D")) &&
    (has(/magnesium/) || hasNutrient("Magnesium") || cats.has("Mineral"))
  ) {
    tips.push({
      id: "vd-mg",
      title: "Vitamin D & Magnesium",
      body: "Magnesium helps activate vitamin D. Taking both (as directed) often works well together.",
    });
  }

  if (has(/omega|fish oil/) || hasNutrient("Omega-3")) {
    tips.push({
      id: "omega-food",
      title: "Omega-3 timing",
      body: "Take omega-3 with a meal that includes fat for better absorption.",
    });
  }

  if (cats.has("Medication") && active.length > 1) {
    tips.push({
      id: "med-space",
      title: "Medications",
      body: "Space supplements from prescription meds unless your clinician says otherwise.",
    });
  }

  return tips.slice(0, 4);
}
