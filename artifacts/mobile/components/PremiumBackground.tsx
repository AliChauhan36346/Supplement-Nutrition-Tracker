import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

export function PremiumBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#FBFEFC", "#F3FAF6", "#F8FBF2"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(178,239,202,0.62)", "rgba(211,248,187,0.08)"]}
        style={[styles.orb, styles.orbTop]}
      />
      <LinearGradient
        colors={["rgba(211,238,255,0.50)", "rgba(255,255,255,0.04)"]}
        style={[styles.orb, styles.orbRight]}
      />
      <View style={styles.gloss} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  orbTop: {
    top: -145,
    left: -85,
  },
  orbRight: {
    top: 210,
    right: -180,
  },
  gloss: {
    position: "absolute",
    top: 22,
    right: 24,
    width: 90,
    height: 28,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.52)",
    transform: [{ rotate: "-16deg" }],
  },
});
