import {
  type MealTiming,
  type SupplementCategory,
} from "@/context/SupplementContext";
import { type NutrientKey } from "@/utils/nutrients";

export type WellnessGoal =
  | "energy"
  | "fitness"
  | "immunity"
  | "general"
  | "weight_loss"
  | "sleep"
  | "stress";

export interface SupplementCatalogItem {
  id: string;
  name: string;
  aliases: string[];
  category: SupplementCategory;
  summary: string;
  benefits: string[];
  foodSources: string[];
  timing: string;
  caution: string;
  defaultUnit: string;
  defaultTime: string;
  mealTiming: MealTiming;
  nutrients?: Partial<Record<NutrientKey, number>>;
  goals: WellnessGoal[];
}

export const SUPPLEMENT_CATALOG: SupplementCatalogItem[] = [
  {
    id: "vitamin-d",
    name: "Vitamin D3",
    aliases: ["vitamin d", "d3", "cholecalciferol"],
    category: "Vitamin",
    summary: "Supports normal bones, muscles, and immune function.",
    benefits: ["Bone health", "Normal immune function", "Muscle function"],
    foodSources: ["Oily fish", "Egg yolks", "Fortified foods", "Sun exposure"],
    timing: "Take with a meal containing fat, usually earlier in the day.",
    caution: "High doses can be harmful. A blood test is the best way to assess status.",
    defaultUnit: "IU",
    defaultTime: "08:00",
    mealTiming: "with_food",
    goals: ["immunity", "general", "fitness"],
  },
  {
    id: "magnesium",
    name: "Magnesium",
    aliases: ["magnesium glycinate", "magnesium citrate"],
    category: "Mineral",
    summary: "Contributes to normal muscle, nerve, and energy metabolism.",
    benefits: ["Muscle function", "Nervous system support", "Energy metabolism"],
    foodSources: ["Nuts", "Seeds", "Beans", "Leafy greens"],
    timing: "Often taken in the evening; separate from some medicines.",
    caution: "May cause diarrhea. Ask a clinician first if you have kidney disease.",
    defaultUnit: "mg",
    defaultTime: "20:00",
    mealTiming: "with_food",
    goals: ["fitness", "sleep", "stress", "general"],
  },
  {
    id: "omega-3",
    name: "Omega-3",
    aliases: ["fish oil", "epa", "dha"],
    category: "Other",
    summary: "Provides EPA and DHA fats that support normal heart function.",
    benefits: ["Heart support", "EPA/DHA intake", "General wellness"],
    foodSources: ["Salmon", "Sardines", "Mackerel", "Algae"],
    timing: "Take with a meal containing fat to improve absorption and reduce aftertaste.",
    caution: "Discuss with a clinician if you use blood thinners or have surgery planned.",
    defaultUnit: "mg",
    defaultTime: "12:00",
    mealTiming: "with_food",
    goals: ["general", "fitness"],
  },
  {
    id: "vitamin-b12",
    name: "Vitamin B12",
    aliases: ["b12", "cobalamin", "methylcobalamin"],
    category: "Vitamin",
    summary: "Supports normal red blood cell formation and energy metabolism.",
    benefits: ["Energy metabolism", "Nervous system", "Red blood cells"],
    foodSources: ["Meat", "Fish", "Eggs", "Fortified plant foods"],
    timing: "Usually taken in the morning, with or without food.",
    caution: "Fatigue has many causes; supplementation should not replace medical assessment.",
    defaultUnit: "mcg",
    defaultTime: "08:00",
    mealTiming: "anytime",
    goals: ["energy", "general"],
  },
  {
    id: "vitamin-c",
    name: "Vitamin C",
    aliases: ["ascorbic acid"],
    category: "Vitamin",
    summary: "Supports normal immune function and helps with iron absorption.",
    benefits: ["Immune function", "Collagen formation", "Iron absorption"],
    foodSources: ["Citrus", "Peppers", "Kiwi", "Broccoli"],
    timing: "Take with food if it upsets your stomach.",
    caution: "Large doses may cause stomach upset and can affect some lab tests.",
    defaultUnit: "mg",
    defaultTime: "08:00",
    mealTiming: "with_food",
    goals: ["immunity", "general"],
  },
  {
    id: "iron",
    name: "Iron",
    aliases: ["ferrous sulfate", "ferrous fumarate"],
    category: "Mineral",
    summary: "Needed for normal red blood cells and oxygen transport.",
    benefits: ["Red blood cells", "Oxygen transport", "Energy metabolism"],
    foodSources: ["Red meat", "Lentils", "Beans", "Fortified cereals"],
    timing: "Absorbs best away from calcium, tea, and coffee; vitamin C can help.",
    caution: "Only supplement after professional advice or confirmed need; excess iron is dangerous.",
    defaultUnit: "mg",
    defaultTime: "10:00",
    mealTiming: "before_food",
    goals: ["energy"],
  },
  {
    id: "calcium",
    name: "Calcium",
    aliases: ["calcium citrate", "calcium carbonate"],
    category: "Mineral",
    summary: "Supports normal bones, teeth, muscles, and nerve signaling.",
    benefits: ["Bone health", "Muscle function", "Teeth"],
    foodSources: ["Dairy", "Fortified plant milks", "Tofu", "Leafy greens"],
    timing: "Split larger amounts and separate from iron by at least two hours.",
    caution: "Check total dietary intake first; excess can cause problems.",
    defaultUnit: "mg",
    defaultTime: "18:00",
    mealTiming: "with_food",
    goals: ["general", "fitness"],
  },
  {
    id: "zinc",
    name: "Zinc",
    aliases: ["zinc picolinate", "zinc gluconate"],
    category: "Mineral",
    summary: "Supports normal immune function, skin, and wound healing.",
    benefits: ["Immune function", "Skin", "Normal fertility"],
    foodSources: ["Oysters", "Meat", "Dairy", "Pumpkin seeds"],
    timing: "Take with food if it causes nausea; separate from iron when possible.",
    caution: "Long-term high doses can cause copper deficiency.",
    defaultUnit: "mg",
    defaultTime: "18:00",
    mealTiming: "with_food",
    goals: ["immunity", "general"],
  },
  {
    id: "creatine",
    name: "Creatine Monohydrate",
    aliases: ["creatine"],
    category: "Other",
    summary: "Supports repeated high-intensity exercise performance.",
    benefits: ["Strength training", "High-intensity performance", "Recovery routines"],
    foodSources: ["Meat", "Fish"],
    timing: "Consistency matters more than timing; take at a convenient daily time.",
    caution: "Ask a clinician before use if you have kidney disease or are pregnant.",
    defaultUnit: "g",
    defaultTime: "12:00",
    mealTiming: "anytime",
    goals: ["fitness"],
  },
  {
    id: "protein",
    name: "Protein Powder",
    aliases: ["whey", "casein", "plant protein"],
    category: "Protein",
    summary: "Conveniently helps meet daily protein needs when food intake is insufficient.",
    benefits: ["Muscle maintenance", "Recovery", "Dietary protein"],
    foodSources: ["Meat", "Fish", "Dairy", "Legumes", "Soy"],
    timing: "Use when convenient to help reach your daily protein target.",
    caution: "Food-first is usually preferable; check allergens and total calorie needs.",
    defaultUnit: "g",
    defaultTime: "12:00",
    mealTiming: "anytime",
    goals: ["fitness", "weight_loss"],
  },
  {
    id: "multivitamin",
    name: "Multivitamin",
    aliases: ["multi", "daily vitamin"],
    category: "Vitamin",
    summary: "Provides multiple vitamins and minerals as a dietary safety net.",
    benefits: ["General micronutrient coverage", "Convenience"],
    foodSources: ["A varied diet of whole foods"],
    timing: "Take with a meal; avoid duplicating nutrients from other products.",
    caution: "Check the label to prevent excessive combined doses, especially vitamin A and iron.",
    defaultUnit: "tablet",
    defaultTime: "08:00",
    mealTiming: "with_food",
    goals: ["general", "immunity"],
  },
  {
    id: "probiotic",
    name: "Probiotic",
    aliases: ["probiotics", "lactobacillus", "bifidobacterium"],
    category: "Other",
    summary: "Some specific strains may support digestive health.",
    benefits: ["Digestive routine", "Microbiome support"],
    foodSources: ["Yogurt", "Kefir", "Fermented foods"],
    timing: "Follow the product label because recommendations vary by strain.",
    caution: "Benefits are strain-specific. Immunocompromised users should ask a clinician.",
    defaultUnit: "capsule",
    defaultTime: "08:00",
    mealTiming: "anytime",
    goals: ["general", "immunity"],
  },
];

export function getCatalogItem(id?: string): SupplementCatalogItem | undefined {
  return SUPPLEMENT_CATALOG.find((item) => item.id === id);
}

export function catalogForGoal(goal?: string): SupplementCatalogItem[] {
  if (!goal) return [];
  return SUPPLEMENT_CATALOG.filter((item) =>
    item.goals.includes(goal as WellnessGoal)
  );
}
