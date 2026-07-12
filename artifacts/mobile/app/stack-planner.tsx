import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
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
  type SupplementCatalogItem,
} from "@/data/supplementCatalog";
import { type Supplement, useSupplements } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";
import { getInteractionTips } from "@/utils/nutrients";

type TimeSlot = "Morning" | "Midday" | "Evening";

function slotForTime(time: string): TimeSlot {
  const hour = Number(time.split(":")[0] ?? 8);
  if (hour < 11) return "Morning";
  if (hour < 17) return "Midday";
  return "Evening";
}

function catalogMatch(supplement: Supplement): SupplementCatalogItem | undefined {
  const name = supplement.name.toLowerCase();
  return SUPPLEMENT_CATALOG.find(
    (item) =>
      name.includes(item.name.toLowerCase()) ||
      item.aliases.some((alias) => name.includes(alias))
  );
}

function recommendedTime(supplement: Supplement): string {
  return catalogMatch(supplement)?.defaultTime ?? supplement.times[0] ?? "08:00";
}

function formatTime(time: string): string {
  const [rawHour, rawMinute] = time.split(":").map(Number);
  const hour = rawHour ?? 0;
  const minute = rawMinute ?? 0;
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${
    hour >= 12 ? "PM" : "AM"
  }`;
}

export default function StackPlannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { supplements, updateSupplement } = useSupplements();
  const active = supplements.filter((item) => item.isActive);
  const interactionTips = useMemo(() => getInteractionTips(active), [active]);

  const plan = useMemo(() => {
    const groups: Record<TimeSlot, Supplement[]> = {
      Morning: [],
      Midday: [],
      Evening: [],
    };
    for (const supplement of active) {
      groups[slotForTime(recommendedTime(supplement))].push(supplement);
    }
    return groups;
  }, [active]);

  const changes = useMemo(
    () =>
      active.filter(
        (supplement) =>
          supplement.frequency !== "twice_daily" &&
          supplement.times[0] !== recommendedTime(supplement)
      ),
    [active]
  );

  const applyPlan = () => {
    if (!changes.length) {
      Alert.alert("Schedule looks good", "No timing changes are suggested.");
      return;
    }
    Alert.alert(
      "Apply suggested times?",
      `This will update ${changes.length} reminder ${
        changes.length === 1 ? "time" : "times"
      }. Review recommendations with a clinician when medications are involved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: async () => {
            await Promise.all(
              changes.map((supplement) =>
                updateSupplement(supplement.id, {
                  times: [recommendedTime(supplement)],
                })
              )
            );
            Alert.alert("Schedule updated", "Reminder times were optimized.");
          },
        },
      ]
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
            Stack Planner
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Review timing, meals, and common nutrient conflicts
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {active.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="clock" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Add supplements first
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Your timing plan will appear here once your stack has active items.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/supplement-library")}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary, borderRadius: colors.radius },
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: colors.primaryForeground },
                ]}
              >
                Browse library
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.notice,
                {
                  backgroundColor: colors.primary + "10",
                  borderColor: colors.primary + "35",
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather name="info" size={17} color={colors.primary} />
              <Text style={[styles.noticeText, { color: colors.foreground }]}>
                Suggested times improve routine and avoid common competition.
                They do not replace label directions or medication advice.
              </Text>
            </View>

            {(["Morning", "Midday", "Evening"] as TimeSlot[]).map((slot) => (
              <View key={slot} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.slotIcon,
                      { backgroundColor: colors.primary + "18" },
                    ]}
                  >
                    <Feather
                      name={
                        slot === "Morning"
                          ? "sunrise"
                          : slot === "Midday"
                            ? "sun"
                            : "moon"
                      }
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {slot}
                  </Text>
                </View>

                {plan[slot].length === 0 ? (
                  <Text style={[styles.noItems, { color: colors.mutedForeground }]}>
                    No items suggested here
                  </Text>
                ) : (
                  plan[slot].map((supplement) => {
                    const catalog = catalogMatch(supplement);
                    const time = recommendedTime(supplement);
                    const changesTime =
                      supplement.frequency !== "twice_daily" &&
                      supplement.times[0] !== time;
                    return (
                      <TouchableOpacity
                        key={supplement.id}
                        onPress={() =>
                          router.push({
                            pathname: "/add-supplement",
                            params: { id: supplement.id },
                          })
                        }
                        style={[
                          styles.item,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            borderRadius: colors.radius,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: supplement.color },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <View style={styles.itemTitleRow}>
                            <Text
                              style={[styles.itemTitle, { color: colors.foreground }]}
                            >
                              {supplement.name}
                            </Text>
                            {changesTime && (
                              <View
                                style={[
                                  styles.changeBadge,
                                  { backgroundColor: colors.warning + "18" },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.changeText,
                                    { color: colors.warning },
                                  ]}
                                >
                                  Change
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            style={[
                              styles.itemMeta,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            {formatTime(time)}
                            {catalog ? ` · ${catalog.timing}` : ""}
                          </Text>
                        </View>
                        <Feather
                          name="chevron-right"
                          size={17}
                          color={colors.mutedForeground}
                        />
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ))}

            {interactionTips.length > 0 && (
              <View
                style={[
                  styles.conflicts,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Stack notes
                </Text>
                {interactionTips.map((tip) => (
                  <View key={tip.id} style={styles.tip}>
                    <Feather
                      name="alert-circle"
                      size={16}
                      color={colors.warning}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tipTitle, { color: colors.foreground }]}>
                        {tip.title}
                      </Text>
                      <Text
                        style={[styles.tipBody, { color: colors.mutedForeground }]}
                      >
                        {tip.body}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              onPress={applyPlan}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                  opacity: changes.length ? 1 : 0.6,
                },
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: colors.primaryForeground },
                ]}
              >
                {changes.length
                  ? `Apply ${changes.length} suggested ${
                      changes.length === 1 ? "change" : "changes"
                    }`
                  : "Schedule is optimized"}
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
  content: { padding: 16, gap: 16 },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 13,
    borderWidth: 1,
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  section: { gap: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 9 },
  slotIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  noItems: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingVertical: 8,
    paddingLeft: 43,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 13,
    borderWidth: 1,
    shadowColor: "#397B61",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  dot: { width: 9, height: 36, borderRadius: 5 },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  itemTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  itemMeta: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  changeBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  changeText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  conflicts: { padding: 14, borderWidth: 1, gap: 12 },
  tip: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  tipTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tipBody: {
    fontSize: 11,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  primaryButton: { alignItems: "center", paddingVertical: 14 },
  primaryButtonText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  empty: {
    alignItems: "center",
    padding: 28,
    borderWidth: 1,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyBody: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
});
