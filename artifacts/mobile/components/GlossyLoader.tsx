import React, { useEffect, useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export function GlossyLoader({
  label = "Loading…",
  light = false,
}: {
  label?: string;
  light?: boolean;
}) {
  const values = useMemo(
    () => [new Animated.Value(0.35), new Animated.Value(0.35), new Animated.Value(0.35)],
    []
  );

  useEffect(() => {
    const animations = values.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 150),
          Animated.timing(value, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.35,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay((values.length - index) * 150),
        ])
      )
    );
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [values]);

  const color = light ? "#FFFFFF" : "#20A875";

  return (
    <View style={styles.container}>
      <View style={styles.dots}>
        {values.map((value, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: color,
                opacity: value,
                transform: [{ scale: value }],
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: light ? "#FFFFFF" : "#718279" }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", gap: 10 },
  dots: { flexDirection: "row", alignItems: "center", gap: 7 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
