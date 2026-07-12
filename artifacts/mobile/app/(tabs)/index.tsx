import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedEntrance } from "@/components/AnimatedEntrance";
import { DoseItem } from "@/components/DoseItem";
import { PremiumBackground } from "@/components/PremiumBackground";
import { ProgressRing } from "@/components/ProgressRing";
import { useSupplements } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";
import { promptFreeLimitReached, showPremiumUpsell } from "@/utils/premium";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { highlightId } = useLocalSearchParams<{ highlightId?: string }>();
  const [activeHighlight, setActiveHighlight] = useState<string | undefined>();
  const {
    getScheduledDoses,
    getDayAdherence,
    logDose,
    profile,
    supplements,
    canAddSupplement,
    updateProfile,
    lowStockSupplements,
  } = useSupplements();

  useEffect(() => {
    if (highlightId) {
      setActiveHighlight(highlightId);
      const t = setTimeout(() => setActiveHighlight(undefined), 8000);
      return () => clearTimeout(t);
    }
  }, [highlightId]);

  const today = new Date().toISOString().split("T")[0]!;
  const doses = useMemo(() => getScheduledDoses(today), [getScheduledDoses, today]);
  const adherence = getDayAdherence(today);
  const pct = adherence < 0 ? 0 : Math.round(adherence * 100);

  const pending = doses.filter((d) => !d.log);
  const completed = doses.filter((d) => d.log?.status === "taken");
  const skipped = doses.filter((d) => d.log?.status === "skipped");
  const missed = doses.filter((d) => d.log?.status === "missed");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  function openAddSupplement() {
    if (!canAddSupplement) {
      promptFreeLimitReached(() => updateProfile({ isPremium: true }));
      return;
    }
    router.push("/add-supplement");
  }

  function openCoach() {
    if (!profile.isPremium) {
      void showPremiumUpsell(() => updateProfile({ isPremium: true }));
      return;
    }
    router.push("/ai-coach");
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
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {getGreeting()}{profile.name ? `, ${profile.name}` : ""}
          </Text>
          <Text style={[styles.dateLabel, { color: colors.foreground }]}>
            Today's Schedule
          </Text>
        </View>
        <TouchableOpacity
          onPress={openCoach}
          style={[
            styles.coachBtn,
            {
              backgroundColor: colors.primary + "20",
              borderRadius: colors.radius,
            },
          ]}
          activeOpacity={0.8}
        >
          <Feather name="message-circle" size={20} color={colors.primary} />
          {!profile.isPremium && (
            <View
              style={[
                styles.coachLock,
                { backgroundColor: colors.warning },
              ]}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedEntrance>
          <LinearGradient
            colors={["#21AC79", "#84CF5B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroGloss} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>TODAY&apos;S BALANCE</Text>
              <Text style={styles.heroTitle}>
                {completed.length === doses.length && doses.length > 0
                  ? "Daily ritual complete"
                  : `${completed.length} of ${doses.length} doses complete`}
              </Text>
              <Text style={styles.heroSub}>
                {pending.length
                  ? `${pending.length} remaining · keep your momentum`
                  : "A consistent routine supports lasting progress"}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroPct}>{pct}%</Text>
              <Feather name="activity" size={15} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </AnimatedEntrance>

        {lowStockSupplements.length > 0 && (
          <View
            style={[
              styles.lowStockBanner,
              {
                backgroundColor: colors.warning + "18",
                borderColor: colors.warning + "50",
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="alert-circle" size={18} color={colors.warning} />
            <Text style={[styles.lowStockText, { color: colors.foreground }]}>
              Low stock:{" "}
              {lowStockSupplements.map((s) => s.name).join(", ")}
            </Text>
          </View>
        )}

        <AnimatedEntrance delay={70} style={styles.statsRow}>
          <View
            style={[
              styles.streakCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="zap" size={22} color={colors.streak} />
            <Text style={[styles.streakNum, { color: colors.foreground }]}>
              {profile.streak}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.mutedForeground }]}>
              Day Streak
            </Text>
          </View>

          <View
            style={[
              styles.ringCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <ProgressRing
              percentage={pct}
              size={90}
              strokeWidth={8}
              label={`${pct}%`}
              sublabel="today"
            />
          </View>

          <View
            style={[
              styles.xpCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="star" size={22} color={colors.primary} />
            <Text style={[styles.streakNum, { color: colors.foreground }]}>
              {profile.xpPoints}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.mutedForeground }]}>
              XP Points
            </Text>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={150} style={styles.doseCountRow}>
          <View
            style={[
              styles.doseCount,
              { backgroundColor: colors.primary + "15", borderRadius: 10 },
            ]}
          >
            <Text style={[styles.doseCountNum, { color: colors.primary }]}>
              {completed.length}
            </Text>
            <Text style={[styles.doseCountLabel, { color: colors.primary }]}>
              Taken
            </Text>
          </View>
          <View
            style={[
              styles.doseCount,
              { backgroundColor: colors.warning + "15", borderRadius: 10 },
            ]}
          >
            <Text style={[styles.doseCountNum, { color: colors.warning }]}>
              {pending.length}
            </Text>
            <Text style={[styles.doseCountLabel, { color: colors.warning }]}>
              Pending
            </Text>
          </View>
          <View
            style={[
              styles.doseCount,
              { backgroundColor: colors.muted, borderRadius: 10 },
            ]}
          >
            <Text style={[styles.doseCountNum, { color: colors.mutedForeground }]}>
              {skipped.length + missed.length}
            </Text>
            <Text style={[styles.doseCountLabel, { color: colors.mutedForeground }]}>
              Skipped/Missed
            </Text>
          </View>
        </AnimatedEntrance>

        {doses.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No doses scheduled today
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add your first supplement to get started.
            </Text>
            <TouchableOpacity
              onPress={openAddSupplement}
              style={[
                styles.addBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                },
              ]}
              activeOpacity={0.85}
            >
              <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>
                Add Supplement
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text
              style={[styles.sectionTitle, { color: colors.foreground }]}
            >
              Today's Doses
            </Text>
            {doses.map((dose) => (
              <DoseItem
                key={`${dose.supplement.id}-${dose.time}`}
                dose={dose}
                highlighted={activeHighlight === dose.supplement.id}
                onTake={() =>
                  logDose(dose.supplement.id, today, dose.time, "taken")
                }
                onSkip={() =>
                  logDose(dose.supplement.id, today, dose.time, "skipped")
                }
              />
            ))}
          </View>
        )}

        {supplements.length > 0 && doses.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/add-supplement")}
            style={[
              styles.addMoreBtn,
              { borderColor: colors.border, borderRadius: colors.radius },
            ]}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={18} color={colors.primary} />
            <Text style={[styles.addMoreText, { color: colors.primary }]}>
              Add supplement
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0,
  },
  headerLeft: { gap: 2 },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  dateLabel: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  coachBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  coachLock: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  heroCard: {
    minHeight: 144,
    borderRadius: 26,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#198A61",
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 11 },
    elevation: 8,
  },
  heroGloss: {
    position: "absolute",
    width: 230,
    height: 90,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.16)",
    top: -42,
    right: -30,
    transform: [{ rotate: "-10deg" }],
  },
  heroCopy: { flex: 1, gap: 6, paddingRight: 12 },
  heroEyebrow: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: "Inter_700Bold",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 27,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  heroSub: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
  },
  heroBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.36)",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  heroPct: { color: "#FFFFFF", fontSize: 20, fontFamily: "Inter_700Bold" },
  lowStockBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderWidth: 1,
  },
  lowStockText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  streakCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    gap: 4,
    shadowColor: "#397B61",
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  ringCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    shadowColor: "#397B61",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  xpCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    gap: 4,
    shadowColor: "#397B61",
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  streakNum: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  streakLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  doseCountRow: {
    flexDirection: "row",
    gap: 10,
  },
  doseCount: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
  },
  doseCountNum: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  doseCountLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  emptyCard: {
    alignItems: "center",
    padding: 32,
    borderWidth: 1,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  addBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 14,
    gap: 8,
  },
  addMoreText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
