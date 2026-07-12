import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PremiumBackground } from "@/components/PremiumBackground";
import {
  type FrequencyType,
  type MealTiming,
  type Supplement,
  type SupplementCategory,
  useSupplements,
} from "@/context/SupplementContext";
import { getCatalogItem } from "@/data/supplementCatalog";
import { useColors } from "@/hooks/useColors";
import { promptFreeLimitReached, showPremiumUpsell } from "@/utils/premium";
import { consumeScanResult } from "@/utils/scanStore";
import { NUTRIENT_OPTIONS, type NutrientKey } from "@/utils/nutrients";

const CATEGORIES: SupplementCategory[] = [
  "Vitamin", "Mineral", "Protein", "Herb", "Medication", "Other",
];
const UNITS = ["mg", "mcg", "g", "capsule", "tablet", "scoop", "ml", "IU"];
const FREQUENCIES: { id: FrequencyType; label: string }[] = [
  { id: "once_daily", label: "Once daily" },
  { id: "twice_daily", label: "Twice daily" },
  { id: "custom_days", label: "Custom days" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];
const MEAL_TIMINGS: { id: MealTiming; label: string }[] = [
  { id: "with_food", label: "With food" },
  { id: "before_food", label: "Before food" },
  { id: "after_food", label: "After food" },
  { id: "anytime", label: "Anytime" },
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SUPPLEMENT_COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444",
  "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1",
];

function today(): string {
  return new Date().toISOString().split("T")[0]!;
}

function Picker<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[] | T[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  const colors = useColors();
  const opts: { id: T; label: string }[] =
    typeof options[0] === "string"
      ? (options as T[]).map((o) => ({ id: o, label: o }))
      : (options as { id: T; label: string }[]);

  return (
    <View style={styles.pickerGroup}>
      {label && (
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {opts.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => onChange(opt.id)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    value === opt.id ? colors.primary : colors.card,
                  borderColor:
                    value === opt.id ? colors.primary : colors.border,
                  borderRadius: 20,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      value === opt.id
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function AddSupplementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id, templateId } = useLocalSearchParams<{
    id?: string;
    templateId?: string;
  }>();
  const {
    supplements,
    addSupplement,
    updateSupplement,
    profile,
    canAddSupplement,
    updateProfile,
  } = useSupplements();
  const existing = supplements.find((s) => s.id === id);
  const template = !existing ? getCatalogItem(templateId) : undefined;

  const [name, setName] = useState(existing?.name ?? template?.name ?? "");
  const [brand, setBrand] = useState(existing?.brand ?? "");
  const [category, setCategory] = useState<SupplementCategory>(
    existing?.category ?? template?.category ?? "Vitamin"
  );
  const [dosage, setDosage] = useState(existing?.dosage ?? "");
  const [unit, setUnit] = useState(existing?.unit ?? template?.defaultUnit ?? "mg");
  const [frequency, setFrequency] = useState<FrequencyType>(existing?.frequency ?? "once_daily");
  const [customDays, setCustomDays] = useState<number[]>(existing?.customDays ?? [1, 2, 3, 4, 5]);
  const [times, setTimes] = useState<string[]>(
    existing?.times ?? [template?.defaultTime ?? "08:00"]
  );
  const [mealTiming, setMealTiming] = useState<MealTiming>(
    existing?.mealTiming ?? template?.mealTiming ?? "anytime"
  );
  const [notes, setNotes] = useState(
    existing?.notes ??
      (template
        ? `${template.timing}\n\nCaution: ${template.caution}`
        : "")
  );
  const [bottleQty, setBottleQty] = useState(String(existing?.bottleQuantity ?? ""));
  const [color, setColor] = useState(existing?.color ?? SUPPLEMENT_COLORS[0]!);
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [remindersEnabled, setRemindersEnabled] = useState(
    existing?.remindersEnabled ?? true
  );
  const [nutrients, setNutrients] = useState<Partial<Record<NutrientKey, string>>>(
    () => {
      const initial: Partial<Record<NutrientKey, string>> = {};
      const source = existing?.nutrients ?? template?.nutrients;
      if (source) {
        for (const [k, v] of Object.entries(source)) {
          initial[k as NutrientKey] = String(v);
        }
      }
      return initial;
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  useFocusEffect(
    useCallback(() => {
      const scanned = consumeScanResult();
      if (scanned) {
        if (scanned.name) setName(scanned.name);
        if (scanned.brand) setBrand(scanned.brand);
      }
    }, [])
  );

  function handleScanPress() {
    if (!profile.isPremium) {
      showPremiumUpsell(() => updateProfile({ isPremium: true }));
      return;
    }
    router.push("/barcode-scanner");
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!dosage.trim()) e.dosage = "Dosage is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (isSaving) return;
    if (!validate()) return;
    if (!existing && !canAddSupplement) {
      promptFreeLimitReached(() => updateProfile({ isPremium: true }));
      return;
    }
    setIsSaving(true);
    const getDefaultTimes = (): string[] => {
      if (frequency === "twice_daily") {
        return [
          times[0]?.trim() || "08:00",
          times[1]?.trim() || "20:00",
        ];
      }
      return [times[0]?.trim() || "08:00"];
    };
    const nutrientMap: Record<string, number> = {};
    for (const key of NUTRIENT_OPTIONS) {
      const raw = nutrients[key]?.trim();
      if (!raw) continue;
      const n = Number(raw);
      if (!Number.isNaN(n) && n > 0) nutrientMap[key] = n;
    }
    const data: Omit<Supplement, "id" | "createdAt"> = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      category,
      dosage: dosage.trim(),
      unit,
      frequency,
      customDays: frequency === "custom_days" ? customDays : undefined,
      times: getDefaultTimes(),
      mealTiming,
      notes: notes.trim(),
      startDate: existing?.startDate ?? today(),
      endDate: existing?.endDate,
      bottleQuantity: bottleQty ? Number(bottleQty) : undefined,
      remainingQuantity: bottleQty
        ? existing && existing.bottleQuantity === Number(bottleQty)
          ? existing.remainingQuantity
          : Number(bottleQty)
        : existing?.remainingQuantity,
      color,
      isActive,
      remindersEnabled,
      nutrients: Object.keys(nutrientMap).length ? nutrientMap : undefined,
    };
    try {
      if (existing) {
        await updateSupplement(existing.id, data);
      } else {
        await addSupplement(data);
      }
      router.back();
    } catch (err) {
      Alert.alert(
        "Could not save",
        err instanceof Error ? err.message : "Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function updateTime(index: number, value: string) {
    const updated = [...times];
    updated[index] = value;
    setTimes(updated);
  }

  function toggleDay(dow: number) {
    setCustomDays((prev) =>
      prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PremiumBackground />
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.header,
            paddingTop: topPad + 10,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {existing ? "Edit Supplement" : "Add Supplement"}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[
            styles.saveBtn,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              opacity: isSaving ? 0.75 : 1,
            },
          ]}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={handleScanPress}
          activeOpacity={0.85}
          style={[
            styles.scanBanner,
            {
              backgroundColor: profile.isPremium
                ? colors.primary + "15"
                : colors.card,
              borderColor: profile.isPremium ? colors.primary + "50" : colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View
            style={[
              styles.scanIconWrap,
              {
                backgroundColor: profile.isPremium
                  ? colors.primary + "20"
                  : colors.muted,
                borderRadius: 10,
              },
            ]}
          >
            <Feather
              name="camera"
              size={22}
              color={profile.isPremium ? colors.primary : colors.mutedForeground}
            />
          </View>
          <View style={styles.scanText}>
            <Text
              style={[
                styles.scanTitle,
                {
                  color: profile.isPremium
                    ? colors.primary
                    : colors.foreground,
                },
              ]}
            >
              Scan Barcode
            </Text>
            <Text style={[styles.scanSub, { color: colors.mutedForeground }]}>
              {profile.isPremium
                ? "Auto-fill details from the bottle"
                : "Premium · Tap to unlock"}
            </Text>
          </View>
          {profile.isPremium ? (
            <Feather name="chevron-right" size={18} color={colors.primary} />
          ) : (
            <View
              style={[
                styles.lockBadge,
                { backgroundColor: colors.warning + "20", borderRadius: 8 },
              ]}
            >
              <Feather name="lock" size={14} color={colors.warning} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Name *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Vitamin D3"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: errors.name ? colors.error : colors.border,
                color: colors.foreground,
                borderRadius: colors.radius / 2,
              },
            ]}
          />
          {errors.name && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.name}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Brand
          </Text>
          <TextInput
            value={brand}
            onChangeText={setBrand}
            placeholder="Optional"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: colors.radius / 2,
              },
            ]}
          />
        </View>

        <Picker
          label="Category"
          options={CATEGORIES}
          value={category}
          onChange={setCategory}
        />

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Dosage *
            </Text>
            <TextInput
              value={dosage}
              onChangeText={setDosage}
              placeholder="e.g. 1000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: errors.dosage ? colors.error : colors.border,
                  color: colors.foreground,
                  borderRadius: colors.radius / 2,
                },
              ]}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Picker
              label="Unit"
              options={UNITS}
              value={unit}
              onChange={setUnit}
            />
          </View>
        </View>

        <Picker
          label="Frequency"
          options={FREQUENCIES}
          value={frequency}
          onChange={setFrequency}
        />

        {frequency === "custom_days" && (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Days
            </Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {DAYS.map((day, i) => (
                <TouchableOpacity
                  key={day}
                  onPress={() => toggleDay(i)}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: customDays.includes(i)
                        ? colors.primary
                        : colors.card,
                      borderColor: customDays.includes(i)
                        ? colors.primary
                        : colors.border,
                      borderRadius: 8,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      {
                        color: customDays.includes(i)
                          ? colors.primaryForeground
                          : colors.foreground,
                      },
                    ]}
                  >
                    {day[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {frequency === "twice_daily" ? (
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Morning
              </Text>
              <TextInput
                value={times[0] ?? "08:00"}
                onChangeText={(v) => {
                  const next = [...times];
                  next[0] = v;
                  if (!next[1]) next[1] = "20:00";
                  setTimes(next);
                }}
                placeholder="08:00"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: colors.radius / 2,
                  },
                ]}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                Evening
              </Text>
              <TextInput
                value={times[1] ?? "20:00"}
                onChangeText={(v) => {
                  const next = [times[0] ?? "08:00", v];
                  setTimes(next);
                }}
                placeholder="20:00"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: colors.radius / 2,
                  },
                ]}
              />
            </View>
          </View>
        ) : (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Time
            </Text>
            <TextInput
              value={times[0] ?? "08:00"}
              onChangeText={(v) => updateTime(0, v)}
              placeholder="08:00"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderRadius: colors.radius / 2,
                },
              ]}
            />
          </View>
        )}

        <Picker
          label="Meal Timing"
          options={MEAL_TIMINGS}
          value={mealTiming}
          onChange={setMealTiming}
        />

        {existing && (
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
              Status
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setIsActive(true)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                    borderRadius: 20,
                    borderWidth: 1,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  },
                ]}
              >
                <Text
                  style={{
                    color: isActive
                      ? colors.primaryForeground
                      : colors.foreground,
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                  }}
                >
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsActive(false)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: !isActive ? colors.warning : colors.card,
                    borderColor: !isActive ? colors.warning : colors.border,
                    borderRadius: 20,
                    borderWidth: 1,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  },
                ]}
              >
                <Text
                  style={{
                    color: !isActive ? "#fff" : colors.foreground,
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                  }}
                >
                  Paused
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Reminders
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setRemindersEnabled(true)}
              style={[
                styles.chip,
                {
                  backgroundColor: remindersEnabled
                    ? colors.primary
                    : colors.card,
                  borderColor: remindersEnabled
                    ? colors.primary
                    : colors.border,
                  borderRadius: 20,
                  borderWidth: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                },
              ]}
            >
              <Text
                style={{
                  color: remindersEnabled
                    ? colors.primaryForeground
                    : colors.foreground,
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                }}
              >
                On
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRemindersEnabled(false)}
              style={[
                styles.chip,
                {
                  backgroundColor: !remindersEnabled
                    ? colors.muted
                    : colors.card,
                  borderColor: colors.border,
                  borderRadius: 20,
                  borderWidth: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                }}
              >
                Off
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Bottle Quantity (optional)
          </Text>
          <TextInput
            value={bottleQty}
            onChangeText={setBottleQty}
            placeholder="e.g. 60"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: colors.radius / 2,
              },
            ]}
          />
          {existing?.remainingQuantity != null && (
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>
              Remaining: {existing.remainingQuantity}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Nutrients (optional, for daily totals)
          </Text>
          {NUTRIENT_OPTIONS.map((key) => (
            <View key={key} style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Text
                style={{
                  width: 100,
                  fontSize: 12,
                  color: colors.mutedForeground,
                  fontFamily: "Inter_400Regular",
                }}
              >
                {key}
              </Text>
              <TextInput
                value={nutrients[key] ?? ""}
                onChangeText={(v) =>
                  setNutrients((prev) => ({ ...prev, [key]: v }))
                }
                placeholder="amount"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                style={[
                  styles.input,
                  {
                    flex: 1,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: colors.radius / 2,
                    paddingVertical: 8,
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Color
          </Text>
          <View style={styles.colorRow}>
            {SUPPLEMENT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorSwatch,
                  {
                    backgroundColor: c,
                    borderWidth: color === c ? 3 : 0,
                    borderColor: colors.foreground,
                    borderRadius: 16,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            Notes
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional notes..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            style={[
              styles.input,
              styles.textarea,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: colors.radius / 2,
              },
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  pickerGroup: { gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  dayChip: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
  },
  scanBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  scanIconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  scanText: {
    flex: 1,
    gap: 2,
  },
  scanTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  scanSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  lockBadge: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
