import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SupplementCard } from "@/components/SupplementCard";
import { type SupplementCategory, useSupplements } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES: (SupplementCategory | "All")[] = [
  "All",
  "Vitamin",
  "Mineral",
  "Protein",
  "Herb",
  "Medication",
  "Other",
];

export default function SupplementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { supplements, deleteSupplement, getDayAdherence, doseLogs } = useSupplements();
  const [filter, setFilter] = useState<SupplementCategory | "All">("All");

  const filtered =
    filter === "All"
      ? supplements
      : supplements.filter((s) => s.category === filter);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  function getAdherence(supplementId: string): number {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0]!;
    });
    let taken = 0, total = 0;
    for (const date of last7) {
      const logs = doseLogs.filter((l) => l.supplementId === supplementId && l.date === date);
      total += logs.length;
      taken += logs.filter((l) => l.status === "taken").length;
    }
    return total === 0 ? -1 : taken / total;
  }

  function handleDelete(id: string, name: string) {
    Alert.alert(
      "Delete Supplement",
      `Remove ${name} from your tracker?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteSupplement(id),
        },
      ]
    );
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
        <Text style={[styles.title, { color: colors.foreground }]}>
          My Supplements
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/add-supplement")}
          style={[
            styles.addBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={18} color={colors.primaryForeground} />
          <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterScroll, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setFilter(cat)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === cat ? colors.primary : colors.card,
                borderColor:
                  filter === cat ? colors.primary : colors.border,
                borderRadius: 20,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    filter === cat
                      ? colors.primaryForeground
                      : colors.foreground,
                },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: botPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="package" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No supplements yet
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Tap Add to track your first supplement.
            </Text>
          </View>
        ) : (
          filtered.map((sup) => {
            const adh = getAdherence(sup.id);
            return (
              <SupplementCard
                key={sup.id}
                supplement={sup}
                adherence={adh >= 0 ? adh : undefined}
                onEdit={() =>
                  router.push({
                    pathname: "/add-supplement",
                    params: { id: sup.id },
                  })
                }
                onDelete={() => handleDelete(sup.id, sup.name)}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  filterScroll: {
    borderBottomWidth: 1,
    maxHeight: 56,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  list: { flex: 1 },
  listContent: { padding: 16 },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
