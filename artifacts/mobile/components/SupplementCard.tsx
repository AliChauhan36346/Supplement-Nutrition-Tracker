import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { type Supplement } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";

interface SupplementCardProps {
  supplement: Supplement;
  onEdit: () => void;
  onDelete: () => void;
  adherence?: number;
}

function frequencyLabel(freq: string): string {
  switch (freq) {
    case "once_daily": return "Once daily";
    case "twice_daily": return "Twice daily";
    case "custom_days": return "Custom days";
    case "weekly": return "Weekly";
    case "monthly": return "Monthly";
    default: return freq;
  }
}

export function SupplementCard({
  supplement,
  onEdit,
  onDelete,
  adherence,
}: SupplementCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onEdit}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View
        style={[
          styles.colorBar,
          { backgroundColor: supplement.color, borderRadius: colors.radius },
        ]}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>
              {supplement.name}
            </Text>
            {supplement.brand ? (
              <Text style={[styles.brand, { color: colors.mutedForeground }]}>
                {supplement.brand}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={8}>
            <Feather name="trash-2" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <View style={styles.metaRow}>
          <View
            style={[
              styles.badge,
              { backgroundColor: supplement.color + "20", borderRadius: 6 },
            ]}
          >
            <Text style={[styles.badgeText, { color: supplement.color }]}>
              {supplement.category}
            </Text>
          </View>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {supplement.dosage} {supplement.unit} · {frequencyLabel(supplement.frequency)}
          </Text>
        </View>
        {adherence !== undefined && (
          <View style={styles.adherenceRow}>
            <View
              style={[
                styles.adherenceBar,
                { backgroundColor: colors.border, borderRadius: 4 },
              ]}
            >
              <View
                style={[
                  styles.adherenceFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.round(adherence * 100)}%` as `${number}%`,
                    borderRadius: 4,
                  },
                ]}
              />
            </View>
            <Text style={[styles.adherencePct, { color: colors.mutedForeground }]}>
              {Math.round(adherence * 100)}%
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  colorBar: {
    width: 5,
    borderRadius: 0,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  titleRow: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  brand: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  deleteBtn: {
    padding: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  meta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  adherenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  adherenceBar: {
    flex: 1,
    height: 4,
    overflow: "hidden",
  },
  adherenceFill: {
    height: "100%",
  },
  adherencePct: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    width: 32,
    textAlign: "right",
  },
});
