import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather, Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SupplementProvider } from "@/context/SupplementContext";
import { requestNotificationPermissions } from "@/services/notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-supplement"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="ai-coach"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="barcode-scanner"
        options={{ presentation: "fullScreenModal", headerShown: false }}
      />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="disclaimer" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [timedOut, setTimedOut] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Feather.font,
    ...Ionicons.font,
  });

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(
      colorScheme === "dark" ? "#0B1512" : "#F0FDF9"
    );
  }, [colorScheme]);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const ready = fontsLoaded || fontError || timedOut;
  if (!ready) return null;

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Supplement Tracker Pro</title>
        <meta
          name="description"
          content="Track your vitamins, supplements, and medications daily. Build healthy streaks, view your history, and stay consistent — all in one app."
        />
        <meta name="theme-color" content="#10B981" />
        <meta property="og:title" content="Supplement Tracker Pro" />
        <meta
          property="og:description"
          content="Track your vitamins, supplements, and medications daily. Build healthy streaks, view your history, and stay consistent — all in one app."
        />
        <meta property="og:type" content="website" />
      </Head>
      <SafeAreaProvider>
        <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SupplementProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </SupplementProvider>
        </QueryClientProvider>
      </ErrorBoundary>
      </SafeAreaProvider>
    </>
  );
}
