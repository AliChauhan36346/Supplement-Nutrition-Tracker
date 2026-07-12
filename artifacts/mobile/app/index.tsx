import { Redirect } from "expo-router";
import React from "react";

import { AppLaunchScreen } from "@/components/AppLaunchScreen";
import { useSupplements } from "@/context/SupplementContext";

export default function Index() {
  const { profile, isLoading } = useSupplements();

  if (isLoading) {
    return <AppLaunchScreen />;
  }

  if (!profile.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
