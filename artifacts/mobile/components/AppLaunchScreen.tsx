import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export function AppLaunchScreen() {
  const pulse = useRef(new Animated.Value(0.92)).current;
  const shimmer = useRef(new Animated.Value(-110)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.92,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 110,
        duration: 1300,
        useNativeDriver: true,
      })
    );
    pulseLoop.start();
    shimmerLoop.start();
    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
    };
  }, [pulse, shimmer]);

  return (
    <LinearGradient
      colors={["#FBFEFC", "#ECF9F1", "#F8FBEF"]}
      style={styles.container}
    >
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />
      <Animated.View style={[styles.logo, { transform: [{ scale: pulse }] }]}>
        <LinearGradient
          colors={["#2FC48A", "#9DDC55"]}
          style={styles.logoGradient}
        >
          <Feather name="activity" size={34} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.logoGloss} />
      </Animated.View>
      <Text style={styles.brand}>Supplement Tracker</Text>
      <Text style={styles.tagline}>Your daily supplement ritual</Text>
      <View style={styles.loadingTrack}>
        <Animated.View
          style={[styles.loadingShimmer, { transform: [{ translateX: shimmer }] }]}
        />
      </View>
      <Text style={styles.loadingLabel}>Preparing your wellness plan…</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  orbOne: {
    position: "absolute",
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: "rgba(174,235,195,0.38)",
    top: -170,
    right: -130,
  },
  orbTwo: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(223,240,165,0.26)",
    bottom: -150,
    left: -100,
  },
  logo: {
    width: 92,
    height: 92,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#198A61",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  logoGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoGloss: {
    position: "absolute",
    width: 80,
    height: 34,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.28)",
    top: -12,
    left: -8,
    transform: [{ rotate: "-12deg" }],
  },
  brand: {
    marginTop: 24,
    color: "#173B2D",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1.1,
  },
  tagline: {
    marginTop: 5,
    color: "#718279",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  loadingTrack: {
    width: 150,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(32,168,117,0.12)",
    overflow: "hidden",
    marginTop: 44,
  },
  loadingShimmer: {
    width: 68,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#20A875",
  },
  loadingLabel: {
    marginTop: 12,
    color: "#8A9991",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
