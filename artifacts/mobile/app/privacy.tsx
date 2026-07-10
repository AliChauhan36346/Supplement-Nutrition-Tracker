import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function PrivacyPolicyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

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
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Privacy Policy
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updated, { color: colors.mutedForeground }]}>
          Last updated: July 10, 2026
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Overview
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Supplement Tracker Pro ("the App") helps you track vitamins,
          supplements, and wellness products. This policy explains what data we
          store and how it is used.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Data we store
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          By default, your profile details (name, goal, age range), supplement
          list, dose history, streaks, and preferences are stored locally on
          your device using on-device storage. We do not operate a cloud account
          system in this version, so this data does not leave your device unless
          you choose features that require a network request.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Network features
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Barcode lookup may send the scanned product code to Open Food Facts (a
          third-party open database) to retrieve product name and brand. That
          request does not include your name or health profile. Camera access is
          used only for scanning and images are not uploaded by the App.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Notifications
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          If you grant permission, the App schedules local reminders on your
          device. Reminder content stays on-device and is not sent to our
          servers.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Analytics & advertising
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          This version does not include third-party analytics, advertising, or
          tracking SDKs.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Your controls
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          You can delete all local data at any time from Profile → Reset All
          Data. You can also revoke camera or notification permissions in your
          device settings.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Children
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          The App is not directed at children under 13. Do not use the App to
          store sensitive health information for a child without appropriate
          parental guidance.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Changes
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          We may update this policy as features evolve (for example, if cloud
          sync or accounts are added). Material changes will be reflected by an
          updated date in this screen.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Contact
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          For privacy questions, contact the developer through the App Store or
          Google Play listing support channel for Supplement Tracker Pro.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  content: { padding: 20, gap: 10 },
  updated: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  heading: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginTop: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
});
