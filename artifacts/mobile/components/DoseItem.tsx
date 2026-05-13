import * as Haptics from "expo-haptics";
import React from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { type ScheduledDose } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";

interface DoseItemProps {
  dose: ScheduledDose;
  onTake: () => void;
  onSkip: () => void;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const hour = h ?? 0;
  const min = m ?? 0;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(min).padStart(2, "0")} ${period}`;
}

function mealLabel(timing: string): string {
  switch (timing) {
    case "with_food": return "With food";
    case "before_food": return "Before food";
    case "after_food": return "After food";
    default: return "";
  }
}

export function DoseItem({ dose, onTake, onSkip }: DoseItemProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleTake = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onTake();
  };

  const isTaken = dose.log?.status === "taken";
  const isSkipped = dose.log?.status === "skipped";
  const isDone = isTaken || isSkipped;

  const dotColor = isTaken
    ? colors.success
    : isSkipped
    ? colors.mutedForeground
    : dose.supplement.color;

  return (
    <Reanimated.View style={animStyle}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: isTaken ? colors.primary + "40" : colors.border,
            borderRadius: colors.radius,
            opacity: isSkipped ? 0.6 : 1,
          },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <View style={styles.info}>
          <Text
            style={[
              styles.name,
              {
                color: colors.foreground,
                textDecorationLine: isSkipped ? "line-through" : "none",
              },
            ]}
          >
            {dose.supplement.name}
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {dose.supplement.dosage} {dose.supplement.unit}
            {mealLabel(dose.supplement.mealTiming)
              ? ` · ${mealLabel(dose.supplement.mealTiming)}`
              : ""}
          </Text>
        </View>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {formatTime(dose.time)}
        </Text>
        {!isDone ? (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onSkip}
              style={[
                styles.skipBtn,
                { borderColor: colors.border, borderRadius: colors.radius / 2 },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
                Skip
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleTake}
              style={[
                styles.takeBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius / 2,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text style={[styles.takeBtnText, { color: colors.primaryForeground }]}>
                Take
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isTaken
                  ? colors.primary + "20"
                  : colors.muted,
                borderRadius: colors.radius / 2,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isTaken ? colors.primary : colors.mutedForeground },
              ]}
            >
              {isTaken ? "Taken" : "Skipped"}
            </Text>
          </View>
        )}
      </View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  meta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  actions: {
    flexDirection: "row",
    gap: 6,
  },
  skipBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  skipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  takeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  takeBtnText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
