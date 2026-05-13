import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSupplements } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";

function SettingRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.settingRow,
        { borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.muted, borderRadius: 8 }]}>
        <Feather name={icon as any} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: colors.foreground }]}>{label}</Text>
      {value ? (
        <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>
      ) : null}
      {rightElement}
      {onPress && !rightElement && (
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}

const PREMIUM_FEATURES = [
  "Unlimited supplements",
  "Barcode scanner",
  "Advanced analytics",
  "Family mode",
  "Smart reminders",
  "Export PDF reports",
  "Cloud sync",
  "AI Supplement Coach",
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile, supplements, doseLogs } = useSupplements();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const goalLabels: Record<string, string> = {
    energy: "Energy & Focus",
    fitness: "Fitness & Muscle",
    immunity: "Immunity & Health",
    general: "General Wellness",
    weight_loss: "Weight Management",
  };

  function handleReset() {
    Alert.alert(
      "Reset Data",
      "This will delete all your supplements, logs, and settings. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () =>
            updateProfile({
              onboardingComplete: false,
              streak: 0,
              longestStreak: 0,
              xpPoints: 0,
              isPremium: false,
            }),
        },
      ]
    );
  }

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
        <Text style={[styles.title, { color: colors.foreground }]}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary + "20", borderRadius: 40 },
          ]}
        >
          <Feather name="user" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {profile.name ?? "Supplement Tracker User"}
        </Text>
        {profile.goal ? (
          <Text style={[styles.goal, { color: colors.mutedForeground }]}>
            Goal: {goalLabels[profile.goal] ?? profile.goal}
          </Text>
        ) : null}

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <Text style={[styles.statNum, { color: colors.primary }]}>
              {supplements.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Supplements
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <Text style={[styles.statNum, { color: colors.streak }]}>
              {profile.streak}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Day Streak
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
            ]}
          >
            <Text style={[styles.statNum, { color: colors.foreground }]}>
              {profile.xpPoints}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              XP
            </Text>
          </View>
        </View>

        {!profile.isPremium && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Supplement Tracker Pro",
                "Upgrade to access unlimited supplements, AI coaching, advanced analytics, and more.\n\nMonthly: $4.99\nYearly: $39.99 (save 33%)",
                [
                  { text: "Maybe Later", style: "cancel" },
                  {
                    text: "Start Free Trial",
                    onPress: () => updateProfile({ isPremium: true }),
                  },
                ]
              )
            }
            style={[
              styles.upgradeCard,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
              },
            ]}
            activeOpacity={0.88}
          >
            <View>
              <Text style={[styles.upgradeTitle, { color: colors.primaryForeground }]}>
                Unlock Premium
              </Text>
              <Text style={[styles.upgradeSub, { color: colors.primaryForeground + "CC" }]}>
                7-day free trial · No commitment
              </Text>
            </View>
            <View style={[styles.upgradeBadge, { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8 }]}>
              <Feather name="star" size={18} color={colors.primaryForeground} />
            </View>
          </TouchableOpacity>
        )}

        {profile.isPremium && (
          <View
            style={[
              styles.premiumBadge,
              {
                backgroundColor: colors.streak + "20",
                borderColor: colors.streak + "40",
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="star" size={18} color={colors.streak} />
            <Text style={[styles.premiumText, { color: colors.streak }]}>
              Premium Member
            </Text>
          </View>
        )}

        {!profile.isPremium && (
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
              Premium Features
            </Text>
            {PREMIUM_FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Feather name="check" size={14} color={colors.primary} />
                <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                  {f}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View
          style={[
            styles.settingsGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Settings
          </Text>
          <SettingRow
            icon="user"
            label="Name"
            value={profile.name ?? "Not set"}
          />
          <SettingRow
            icon="target"
            label="Goal"
            value={profile.goal ? goalLabels[profile.goal] : "Not set"}
          />
          <SettingRow
            icon="calendar"
            label="Age Range"
            value={profile.ageRange ?? "Not set"}
          />
          <SettingRow
            icon="trash-2"
            label="Reset All Data"
            onPress={handleReset}
          />
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
  scrollContent: {
    padding: 20,
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  goal: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  statNum: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  upgradeCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
  },
  upgradeTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  upgradeSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  upgradeBadge: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    width: "100%",
    justifyContent: "center",
  },
  premiumText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  settingsGroup: {
    width: "100%",
    padding: 16,
    borderWidth: 1,
    gap: 0,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  settingIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  settingValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
