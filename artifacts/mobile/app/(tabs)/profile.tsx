import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
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

import { PREMIUM_FEATURES } from "@/constants/limits";
import { useSupplements } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";
import { showPremiumUpsell } from "@/utils/premium";

function SettingRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
    >
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: colors.muted, borderRadius: 8 },
        ]}
      >
        <Feather
          name={icon as any}
          size={18}
          color={danger ? colors.destructive : colors.primary}
        />
      </View>
      <Text
        style={[
          styles.settingLabel,
          { color: danger ? colors.destructive : colors.foreground },
        ]}
      >
        {label}
      </Text>
      {value ? (
        <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>
          {value}
        </Text>
      ) : null}
      {rightElement}
      {onPress && !rightElement && (
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    profile,
    updateProfile,
    supplements,
    resetAllData,
    freeSupplementLimit,
  } = useSupplements();

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
      "Reset All Data",
      "This permanently deletes all supplements, dose history, streaks, and settings on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            await resetAllData();
            router.replace("/onboarding");
          },
        },
      ]
    );
  }

  function handleUpgrade() {
    showPremiumUpsell(() => updateProfile({ isPremium: true }));
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
        {!profile.isPremium && (
          <Text style={[styles.planHint, { color: colors.mutedForeground }]}>
            Free plan · {supplements.length}/{freeSupplementLimit} supplements
          </Text>
        )}

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
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
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
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
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
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
            onPress={handleUpgrade}
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
              <Text
                style={[styles.upgradeTitle, { color: colors.primaryForeground }]}
              >
                Unlock Premium
              </Text>
              <Text
                style={[
                  styles.upgradeSub,
                  { color: colors.primaryForeground + "CC" },
                ]}
              >
                Unlimited tracking · Barcode scan · Beta unlock
              </Text>
            </View>
            <View
              style={[
                styles.upgradeBadge,
                { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8 },
              ]}
            >
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
              Premium (Beta)
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
                <Text
                  style={[styles.featureText, { color: colors.mutedForeground }]}
                >
                  {f}
                </Text>
              </View>
            ))}
            <Text style={[styles.betaNote, { color: colors.mutedForeground }]}>
              In-app purchases will replace beta unlock before store launch.
            </Text>
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
            onPress={() => router.push("/edit-profile")}
          />
          <SettingRow
            icon="target"
            label="Goal"
            value={profile.goal ? goalLabels[profile.goal] : "Not set"}
            onPress={() => router.push("/edit-profile")}
          />
          <SettingRow
            icon="calendar"
            label="Age Range"
            value={profile.ageRange ?? "Not set"}
            onPress={() => router.push("/edit-profile")}
          />
        </View>

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
            Legal
          </Text>
          <SettingRow
            icon="alert-triangle"
            label="Medical Disclaimer"
            onPress={() => router.push("/disclaimer")}
          />
          <SettingRow
            icon="shield"
            label="Privacy Policy"
            onPress={() => router.push("/privacy")}
          />
          <SettingRow
            icon="file-text"
            label="Terms of Service"
            onPress={() => router.push("/terms")}
          />
        </View>

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
          <SettingRow
            icon="trash-2"
            label="Reset All Data"
            onPress={handleReset}
            danger
          />
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Supplement Tracker Pro · v1.0.0
        </Text>
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
  planHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: -10,
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
  betaNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    lineHeight: 16,
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
    maxWidth: 120,
    textAlign: "right",
  },
  version: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
});
