import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { WeeklyChart } from "@/components/WeeklyChart";
import { useSupplements } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        statStyles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View
        style={[
          statStyles.iconWrap,
          { backgroundColor: color + "20", borderRadius: 10 },
        ]}
      >
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <Text style={[statStyles.value, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      {sub ? (
        <Text style={[statStyles.sub, { color: color }]}>{sub}</Text>
      ) : null}
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    gap: 4,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getWeekAdherence, profile, doseLogs, supplements } = useSupplements();

  const weekData = useMemo(() => getWeekAdherence(), [getWeekAdherence]);
  const weekAvg = weekData.length > 0
    ? Math.round((weekData.reduce((a, b) => a + b, 0) / weekData.length) * 100)
    : 0;

  const totalTaken = doseLogs.filter((l) => l.status === "taken").length;
  const totalMissed = doseLogs.filter((l) => l.status === "missed").length;

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, { total: number; taken: number }> = {};
    for (const sup of supplements) {
      const cat = sup.category;
      if (!counts[cat]) counts[cat] = { total: 0, taken: 0 };
      const logs = doseLogs.filter((l) => l.supplementId === sup.id);
      counts[cat]!.total += logs.length;
      counts[cat]!.taken += logs.filter((l) => l.status === "taken").length;
    }
    return Object.entries(counts).map(([cat, data]) => ({
      cat,
      pct: data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0,
    }));
  }, [supplements, doseLogs]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const CAT_COLORS: Record<string, string> = {
    Vitamin: "#3B82F6",
    Mineral: "#8B5CF6",
    Protein: "#F59E0B",
    Herb: "#10B981",
    Medication: "#EF4444",
    Other: "#6B7280",
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.title, { color: colors.foreground }]}>
          Insights
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statRow}>
          <StatCard
            icon="zap"
            label="Current Streak"
            value={`${profile.streak}d`}
            sub={`Best: ${profile.longestStreak}d`}
            color={colors.streak}
          />
          <StatCard
            icon="trending-up"
            label="Week Avg"
            value={`${weekAvg}%`}
            color={colors.primary}
          />
        </View>

        <View style={styles.statRow}>
          <StatCard
            icon="check-circle"
            label="Total Taken"
            value={String(totalTaken)}
            color={colors.success}
          />
          <StatCard
            icon="x-circle"
            label="Total Missed"
            value={String(totalMissed)}
            color={colors.error}
          />
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            7-Day Adherence
          </Text>
          <WeeklyChart data={weekData} />
        </View>

        {categoryBreakdown.length > 0 && (
          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              By Category
            </Text>
            {categoryBreakdown.map(({ cat, pct }) => (
              <View key={cat} style={styles.catRow}>
                <View
                  style={[
                    styles.catDot,
                    { backgroundColor: CAT_COLORS[cat] ?? colors.primary },
                  ]}
                />
                <Text style={[styles.catLabel, { color: colors.foreground }]}>
                  {cat}
                </Text>
                <View
                  style={[styles.catBar, { backgroundColor: colors.border }]}
                >
                  <View
                    style={[
                      styles.catFill,
                      {
                        width: `${pct}%` as `${number}%`,
                        backgroundColor: CAT_COLORS[cat] ?? colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.catPct, { color: colors.mutedForeground }]}>
                  {pct}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {profile.streak >= 7 && (
          <View
            style={[
              styles.milestoneCard,
              {
                backgroundColor: colors.streak + "15",
                borderColor: colors.streak + "40",
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="award" size={24} color={colors.streak} />
            <View style={styles.milestoneText}>
              <Text style={[styles.milestoneTitle, { color: colors.foreground }]}>
                7-Day Milestone
              </Text>
              <Text style={[styles.milestoneSub, { color: colors.mutedForeground }]}>
                You've kept a 7-day streak. Keep it up!
              </Text>
            </View>
          </View>
        )}

        <View
          style={[
            styles.tipCard,
            {
              backgroundColor: colors.primary + "10",
              borderColor: colors.primary + "30",
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="info" size={18} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.foreground }]}>
            {weekAvg >= 80
              ? "Excellent consistency! You're in the top tier of supplement adherence."
              : weekAvg >= 50
              ? "Good progress. Try setting reminders to boost your consistency above 80%."
              : "Consistency builds results. Start with just one supplement and build a habit."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  statRow: {
    flexDirection: "row",
    gap: 10,
  },
  section: {
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    width: 72,
  },
  catBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  catFill: {
    height: "100%",
    borderRadius: 3,
  },
  catPct: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 34,
    textAlign: "right",
  },
  milestoneCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  milestoneText: { flex: 1, gap: 2 },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  milestoneSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
