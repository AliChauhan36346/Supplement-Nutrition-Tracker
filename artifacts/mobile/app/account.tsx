import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlossyLoader } from "@/components/GlossyLoader";
import { PremiumBackground } from "@/components/PremiumBackground";
import { useSupplements } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";
import {
  getStoredSession,
  loginAccount,
  logoutAccount,
  pullSync,
  pushSync,
  registerAccount,
  type AuthSession,
} from "@/services/sync";

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { supplements, doseLogs, profile, replaceAllData, updateProfile } =
    useSupplements();

  const [session, setSession] = useState<AuthSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    void (async () => {
      const s = await getStoredSession();
      setSession(s);
      setLoadingSession(false);
    })();
  }, []);

  async function handleAuth() {
    if (!email.trim() || password.length < 6) {
      Alert.alert("Invalid", "Enter an email and a password (6+ characters).");
      return;
    }
    setBusy(true);
    try {
      const s =
        mode === "login"
          ? await loginAccount(email.trim(), password)
          : await registerAccount(email.trim(), password, profile.name);
      setSession(s);
      await updateProfile({ email: s.email });
      Alert.alert(
        "Signed in",
        "You can now sync this device with the cloud."
      );
    } catch (err) {
      Alert.alert(
        "Account error",
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePush() {
    setBusy(true);
    try {
      await pushSync({ supplements, doseLogs, profile });
      Alert.alert("Synced", "Your data was uploaded to the cloud.");
    } catch (err) {
      Alert.alert(
        "Sync failed",
        err instanceof Error
          ? err.message
          : "Is the API server running? Set EXPO_PUBLIC_API_URL if needed."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePull() {
    setBusy(true);
    try {
      const data = await pullSync();
      await replaceAllData({
        supplements: data.supplements ?? [],
        doseLogs: data.doseLogs ?? [],
        profile: { ...profile, ...data.profile },
      });
      Alert.alert("Restored", "Cloud data was downloaded to this device.");
    } catch (err) {
      Alert.alert(
        "Sync failed",
        err instanceof Error ? err.message : "Could not pull cloud data."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await logoutAccount();
      setSession(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PremiumBackground />
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
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Account & Sync
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: botPad + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {loadingSession ? (
          <View style={styles.loadingState}>
            <GlossyLoader label="Loading your account…" />
          </View>
        ) : session ? (
          <>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                Signed in as
              </Text>
              <Text style={[styles.email, { color: colors.foreground }]}>
                {session.email}
              </Text>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                Push uploads this device. Pull replaces local data with cloud.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handlePush}
              disabled={busy}
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary, borderRadius: colors.radius },
              ]}
            >
              <Text
                style={[styles.primaryBtnText, { color: colors.primaryForeground }]}
              >
                {busy ? "Working…" : "Push to cloud"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePull}
              disabled={busy}
              style={[
                styles.secondaryBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
                Pull from cloud
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogout} disabled={busy}>
              <Text style={[styles.logout, { color: colors.destructive }]}>
                Sign out
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[styles.intro, { color: colors.mutedForeground }]}>
              Create an account to back up supplements and dose history across
              devices. Requires the API server with DATABASE_URL.
            </Text>

            <View style={styles.modeRow}>
              <TouchableOpacity onPress={() => setMode("login")}>
                <Text
                  style={[
                    styles.mode,
                    {
                      color:
                        mode === "login" ? colors.primary : colors.mutedForeground,
                    },
                  ]}
                >
                  Sign in
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode("register")}>
                <Text
                  style={[
                    styles.mode,
                    {
                      color:
                        mode === "register"
                          ? colors.primary
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderRadius: colors.radius / 2,
                },
              ]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password (6+ characters)"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderRadius: colors.radius / 2,
                },
              ]}
            />

            <TouchableOpacity
              onPress={handleAuth}
              disabled={busy}
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.primary, borderRadius: colors.radius },
              ]}
            >
              <Text
                style={[styles.primaryBtnText, { color: colors.primaryForeground }]}
              >
                {busy
                  ? "Working…"
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  content: { padding: 20, gap: 14 },
  loadingState: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  modeRow: { flexDirection: "row", gap: 20 },
  mode: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  primaryBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  card: {
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  label: { fontSize: 12, fontFamily: "Inter_400Regular" },
  email: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  logout: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
