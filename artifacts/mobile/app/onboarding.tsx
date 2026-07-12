import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedEntrance } from "@/components/AnimatedEntrance";
import { PremiumBackground } from "@/components/PremiumBackground";
import { useSupplements } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";

const GOALS = [
  { id: "energy", label: "Energy & Focus", icon: "zap" as const },
  { id: "fitness", label: "Fitness & Muscle", icon: "activity" as const },
  { id: "immunity", label: "Immunity & Health", icon: "shield" as const },
  { id: "general", label: "General Wellness", icon: "heart" as const },
  { id: "weight_loss", label: "Weight Management", icon: "trending-down" as const },
];

const AGE_RANGES = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateProfile } = useSupplements();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);

  const totalSteps = 4;

  async function finish() {
    if (!acceptedDisclaimer) return;
    await updateProfile({
      name: name.trim() || undefined,
      goal,
      ageRange,
      onboardingComplete: true,
    });
    router.replace("/(tabs)");
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: topPad + 20, paddingBottom: botPad + 20 },
      ]}
    >
      <PremiumBackground />
      <View style={styles.progressRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor: i <= step ? colors.primary : colors.border,
                flex: 1,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedEntrance key={step}>
        {step === 0 && (
          <View style={styles.stepContent}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Feather name="package" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Welcome to{"\n"}Supplement Tracker
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Build consistent supplement habits and never miss a dose.
            </Text>
            <View style={styles.nameRow}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                What should we call you?
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name (optional)"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                    borderRadius: colors.radius,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              What's your primary goal?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              We'll personalize your experience.
            </Text>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => setGoal(g.id)}
                style={[
                  styles.goalCard,
                  {
                    backgroundColor:
                      goal === g.id ? colors.primary + "15" : colors.card,
                    borderColor:
                      goal === g.id ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Feather
                  name={g.icon}
                  size={22}
                  color={goal === g.id ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.goalLabel,
                    { color: goal === g.id ? colors.primary : colors.foreground },
                  ]}
                >
                  {g.label}
                </Text>
                {goal === g.id && (
                  <Feather name="check-circle" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Your age range
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Helps us provide relevant insights.
            </Text>
            <View style={styles.ageGrid}>
              {AGE_RANGES.map((age) => (
                <TouchableOpacity
                  key={age}
                  onPress={() => setAgeRange(age)}
                  style={[
                    styles.ageCard,
                    {
                      backgroundColor:
                        ageRange === age ? colors.primary + "15" : colors.card,
                      borderColor:
                        ageRange === age ? colors.primary : colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.ageLabel,
                      { color: ageRange === age ? colors.primary : colors.foreground },
                    ]}
                  >
                    {age}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.warning + "20" },
              ]}
            >
              <Feather name="alert-triangle" size={36} color={colors.warning} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              Important disclaimer
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Supplement Tracker Pro is a personal habit and logging tool. It is
              not a medical device and does not provide medical advice,
              diagnosis, or treatment.
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Always follow product labels and consult a healthcare professional
              before changing supplements or medications.
            </Text>
            <TouchableOpacity
              onPress={() => setAcceptedDisclaimer((v) => !v)}
              style={[
                styles.disclaimerCheck,
                {
                  backgroundColor: acceptedDisclaimer
                    ? colors.primary + "15"
                    : colors.card,
                  borderColor: acceptedDisclaimer
                    ? colors.primary
                    : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
              activeOpacity={0.8}
            >
              <Feather
                name={acceptedDisclaimer ? "check-square" : "square"}
                size={22}
                color={
                  acceptedDisclaimer ? colors.primary : colors.mutedForeground
                }
              />
              <Text
                style={[styles.disclaimerCheckText, { color: colors.foreground }]}
              >
                I understand this app is for tracking only and is not medical
                advice.
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/disclaimer")}>
              <Text style={[styles.link, { color: colors.primary }]}>
                Read full medical disclaimer
              </Text>
            </TouchableOpacity>
          </View>
        )}
        </AnimatedEntrance>
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity
            onPress={() => setStep((s) => s - 1)}
            style={[
              styles.backBtn,
              { borderColor: colors.border, borderRadius: colors.radius },
            ]}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => {
            if (step < totalSteps - 1) setStep((s) => s + 1);
            else finish();
          }}
          disabled={step === totalSteps - 1 && !acceptedDisclaimer}
          style={[
            styles.nextBtn,
            {
              backgroundColor:
                step === totalSteps - 1 && !acceptedDisclaimer
                  ? colors.muted
                  : colors.primary,
              borderRadius: colors.radius,
              opacity: step === totalSteps - 1 && !acceptedDisclaimer ? 0.6 : 1,
            },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
            {step === totalSteps - 1 ? "Get Started" : "Continue"}
          </Text>
          <Feather name="arrow-right" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 32,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingBottom: 20,
  },
  stepContent: {
    gap: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 36,
  },
  stepSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 8,
  },
  nameRow: {
    gap: 10,
    marginTop: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  goalLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  ageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  ageCard: {
    width: "30%",
    minWidth: 90,
    alignItems: "center",
    paddingVertical: 14,
    borderWidth: 1.5,
    flexGrow: 1,
  },
  ageLabel: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
  disclaimerCheck: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
  },
  disclaimerCheckText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_500Medium",
  },
  link: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textDecorationLine: "underline",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  backBtn: {
    width: 52,
    height: 52,
    borderWidth: 1,
    shadowColor: "#397B61",
    shadowOpacity: 0.08,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
