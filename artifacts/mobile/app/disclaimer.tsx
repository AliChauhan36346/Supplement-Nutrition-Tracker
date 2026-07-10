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

export default function MedicalDisclaimerScreen() {
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
          Medical Disclaimer
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.callout,
            {
              backgroundColor: colors.warning + "18",
              borderColor: colors.warning + "40",
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="alert-triangle" size={22} color={colors.warning} />
          <Text style={[styles.calloutText, { color: colors.foreground }]}>
            This app is for personal tracking and general wellness education
            only. It is not medical advice.
          </Text>
        </View>

        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Supplement Tracker Pro does not provide diagnosis, treatment plans, or
          prescriptions. Information in the App — including Supplement Coach
          tips, insights, and product lookup results — is general in nature and
          may not apply to your situation.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Always consult a professional
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Before starting, stopping, or changing any supplement or medication,
          consult a qualified healthcare provider — especially if you are
          pregnant, nursing, under 18, have a medical condition, or take
          prescription drugs.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Emergencies
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          If you experience a medical emergency, call your local emergency
          number immediately. Do not use this App for urgent care.
        </Text>

        <Text style={[styles.heading, { color: colors.foreground }]}>
          Product information
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Barcode results come from third-party databases and may be incomplete
          or incorrect. Always verify dosage and ingredients on the physical
          product label.
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
  content: { padding: 20, gap: 12 },
  callout: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    alignItems: "flex-start",
    marginBottom: 4,
  },
  calloutText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Inter_500Medium",
  },
  heading: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
});
