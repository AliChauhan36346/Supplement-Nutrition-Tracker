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

export default function TermsOfServiceScreen() {
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
          Terms of Service
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
          Acceptance
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          By using Supplement Tracker Pro, you agree to these Terms and the
          in-app Medical Disclaimer. If you do not agree, do not use the App.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          What the App provides
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          The App is a personal organization and habit tool for logging
          supplements, setting reminders, and viewing adherence insights. It is
          not a medical device and does not diagnose, treat, cure, or prevent
          any disease.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Your responsibilities
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          You are responsible for the accuracy of information you enter, for
          following product labels and clinician guidance, and for managing
          device permissions (camera, notifications). Do not rely on the App as
          a substitute for professional medical advice.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Free and Premium
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          The free plan limits the number of tracked supplements. Premium
          features (such as unlimited supplements and barcode scanning) may be
          offered. Until App Store / Play billing is connected, any Premium
          unlock in beta is for testing and may change when paid subscriptions
          launch.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Coach tips
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Supplement Coach provides general wellness tips from a built-in
          knowledge base. Responses are not personalized medical advice and may
          be incomplete or outdated.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Data & availability
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Data is stored locally on your device in this version. Uninstalling
          the App or using Reset All Data permanently deletes that information.
          We do not guarantee uninterrupted availability.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Limitation of liability
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          To the fullest extent permitted by law, the App and its developers are
          not liable for any health outcomes, missed doses, product interactions,
          or damages arising from use of the App or reliance on its content.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Changes
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          We may update these Terms as the product evolves. Continued use after
          changes means you accept the updated Terms.
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
