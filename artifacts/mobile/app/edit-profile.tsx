import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
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

import { useSupplements } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";

const GOALS = [
  { id: "energy", label: "Energy & Focus" },
  { id: "fitness", label: "Fitness & Muscle" },
  { id: "immunity", label: "Immunity & Health" },
  { id: "general", label: "General Wellness" },
  { id: "weight_loss", label: "Weight Management" },
];

const AGE_RANGES = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"];

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useSupplements();

  const [name, setName] = useState(profile.name ?? "");
  const [goal, setGoal] = useState(profile.goal ?? "");
  const [ageRange, setAgeRange] = useState(profile.ageRange ?? "");
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim() || undefined,
        goal: goal || undefined,
        ageRange: ageRange || undefined,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

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
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Edit Profile
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.saveBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
          activeOpacity={0.85}
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
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

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Goal</Text>
        <View style={styles.chipWrap}>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g.id}
              onPress={() => setGoal(g.id)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    goal === g.id ? colors.primary : colors.card,
                  borderColor: goal === g.id ? colors.primary : colors.border,
                  borderRadius: 20,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      goal === g.id
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          Age range
        </Text>
        <View style={styles.chipWrap}>
          {AGE_RANGES.map((age) => (
            <TouchableOpacity
              key={age}
              onPress={() => setAgeRange(age)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    ageRange === age ? colors.primary : colors.card,
                  borderColor:
                    ageRange === age ? colors.primary : colors.border,
                  borderRadius: 20,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      ageRange === age
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {age}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  content: { padding: 20, gap: 10 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
