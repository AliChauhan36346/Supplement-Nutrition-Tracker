import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PremiumBackground } from "@/components/PremiumBackground";
import {
  SUPPLEMENT_CATALOG,
  catalogForGoal,
  type SupplementCatalogItem,
} from "@/data/supplementCatalog";
import { useSupplements } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";

interface CheckupChoice {
  id: string;
  label: string;
  detail: string;
  catalogIds: string[];
  caution?: string;
}

const CHOICES: CheckupChoice[] = [
  {
    id: "little-sun",
    label: "I get little regular sunlight",
    detail: "Indoor routine, covering clothing, or limited daylight exposure",
    catalogIds: ["vitamin-d"],
  },
  {
    id: "plant-based",
    label: "I eat mostly or fully plant-based",
    detail: "Few or no animal-derived foods",
    catalogIds: ["vitamin-b12", "iron", "omega-3"],
    caution: "Iron should be considered only after professional advice or testing.",
  },
  {
    id: "no-fish",
    label: "I rarely eat oily fish",
    detail: "Less than around two servings per week",
    catalogIds: ["omega-3"],
  },
  {
    id: "low-dairy",
    label: "I avoid dairy and fortified alternatives",
    detail: "Low intake of common calcium-rich foods",
    catalogIds: ["calcium", "vitamin-d"],
  },
  {
    id: "hard-training",
    label: "I train hard several times per week",
    detail: "Strength, sprint, or high-intensity exercise",
    catalogIds: ["protein", "creatine", "magnesium"],
  },
  {
    id: "low-variety",
    label: "My diet has limited variety",
    detail: "Few fruits, vegetables, legumes, nuts, or whole foods",
    catalogIds: ["multivitamin", "vitamin-c"],
  },
  {
    id: "digestive",
    label: "I want to review digestive habits",
    detail: "Diet regularity, fermented foods, or fiber habits",
    catalogIds: ["probiotic"],
  },
];

export default function WellnessCheckupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, supplements } = useSupplements();
  const [selected, setSelected] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const recommendations = useMemo(() => {
    const score = new Map<string, number>();
    for (const choice of CHOICES) {
      if (!selected.includes(choice.id)) continue;
      for (const id of choice.catalogIds) {
        score.set(id, (score.get(id) ?? 0) + 2);
      }
    }
    for (const item of catalogForGoal(profile.goal)) {
      score.set(item.id, (score.get(item.id) ?? 0) + 1);
    }
    const currentNames = supplements.map((s) => s.name.toLowerCase());
    return [...score.entries()]
      .map(([id, value]) => ({
        item: SUPPLEMENT_CATALOG.find((entry) => entry.id === id),
        score: value,
      }))
      .filter(
        (entry): entry is { item: SupplementCatalogItem; score: number } =>
          Boolean(entry.item)
      )
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => ({
        ...item,
        alreadyTracked: currentNames.some(
          (name) =>
            name.includes(item.name.toLowerCase()) ||
            item.aliases.some((alias) => name.includes(alias))
        ),
      }))
      .slice(0, 6);
  }, [profile.goal, selected, supplements]);

  const toggle = (id: string) => {
    setShowResults(false);
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PremiumBackground />
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            backgroundColor: colors.header,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Wellness Checkup
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Review possible dietary gaps—not diagnose deficiencies
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.warning,
            {
              backgroundColor: colors.warning + "14",
              borderColor: colors.warning + "40",
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="alert-triangle" size={18} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.foreground }]}>
            Symptoms and lifestyle answers cannot confirm a deficiency. Use
            results as questions for a clinician; blood tests may be needed.
          </Text>
        </View>

        {!showResults ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Which statements fit your routine?
            </Text>
            {CHOICES.map((choice) => {
              const active = selected.includes(choice.id);
              return (
                <TouchableOpacity
                  key={choice.id}
                  onPress={() => toggle(choice.id)}
                  style={[
                    styles.choice,
                    {
                      backgroundColor: active
                        ? colors.primary + "12"
                        : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <Feather
                    name={active ? "check-circle" : "circle"}
                    size={21}
                    color={active ? colors.primary : colors.mutedForeground}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.choiceLabel, { color: colors.foreground }]}>
                      {choice.label}
                    </Text>
                    <Text
                      style={[styles.choiceDetail, { color: colors.mutedForeground }]}
                    >
                      {choice.detail}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={() => setShowResults(true)}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                  opacity: selected.length ? 1 : 0.55,
                },
              ]}
              disabled={!selected.length}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: colors.primaryForeground },
                ]}
              >
                Review my results
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.resultHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Topics worth reviewing
                </Text>
                <Text style={[styles.resultSub, { color: colors.mutedForeground }]}>
                  Ranked by your diet, routine, and selected goal
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowResults(false)}>
                <Text style={[styles.editText, { color: colors.primary }]}>
                  Edit answers
                </Text>
              </TouchableOpacity>
            </View>

            {recommendations.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.resultCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <View style={styles.resultTitleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultTitle, { color: colors.foreground }]}>
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.resultBody, { color: colors.mutedForeground }]}
                    >
                      {item.summary}
                    </Text>
                  </View>
                  {item.alreadyTracked && (
                    <View
                      style={[
                        styles.trackedBadge,
                        { backgroundColor: colors.success + "18" },
                      ]}
                    >
                      <Text style={[styles.trackedText, { color: colors.success }]}>
                        Tracked
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.caution, { color: colors.warning }]}>
                  {item.caution}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/supplement-library",
                        params: { query: item.name },
                      })
                    }
                  >
                    <Text style={[styles.link, { color: colors.primary }]}>
                      Learn more
                    </Text>
                  </TouchableOpacity>
                  {!item.alreadyTracked && (
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/add-supplement",
                          params: { templateId: item.id },
                        })
                      }
                    >
                      <Text style={[styles.link, { color: colors.primary }]}>
                        Add to stack
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => router.push("/stack-planner")}
              style={[
                styles.secondaryButton,
                { borderColor: colors.border, borderRadius: colors.radius },
              ]}
            >
              <Feather name="clock" size={18} color={colors.primary} />
              <Text style={[styles.secondaryText, { color: colors.primary }]}>
                Optimize my current schedule
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 0,
    gap: 14,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  content: { padding: 16, gap: 12 },
  warning: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 13,
    borderWidth: 1,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    shadowColor: "#397B61",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  choiceLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  choiceDetail: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  primaryButton: { alignItems: "center", paddingVertical: 14, marginTop: 4 },
  primaryButtonText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  editText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  resultCard: { padding: 14, borderWidth: 1, gap: 8 },
  resultTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  resultTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  resultBody: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  caution: { fontSize: 11, lineHeight: 17, fontFamily: "Inter_500Medium" },
  trackedBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  trackedText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 20 },
  link: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingVertical: 13,
    gap: 8,
  },
  secondaryText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
