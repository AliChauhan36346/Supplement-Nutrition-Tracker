import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CalendarGrid } from "@/components/CalendarGrid";
import { DoseItem } from "@/components/DoseItem";
import { PremiumBackground } from "@/components/PremiumBackground";
import { useSupplements } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getDayAdherence, getScheduledDoses, logDose } = useSupplements();
  const today = new Date().toISOString().split("T")[0]!;
  const [selectedDate, setSelectedDate] = useState(today);

  const doses = getScheduledDoses(selectedDate);
  const adherence = getDayAdherence(selectedDate);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  function formatSelected(dateStr: string): string {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
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
        <Text style={[styles.title, { color: colors.foreground }]}>
          History
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.calCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <CalendarGrid
            getDayAdherence={getDayAdherence}
            onDayPress={setSelectedDate}
            selectedDate={selectedDate}
          />
        </View>

        <View style={styles.dayDetail}>
          <View style={styles.dayHeader}>
            <Text style={[styles.dayTitle, { color: colors.foreground }]}>
              {formatSelected(selectedDate)}
            </Text>
            {adherence >= 0 && (
              <View
                style={[
                  styles.adherenceBadge,
                  {
                    backgroundColor:
                      adherence >= 0.8
                        ? colors.success + "20"
                        : adherence >= 0.5
                        ? colors.warning + "20"
                        : colors.error + "20",
                    borderRadius: 8,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.adherenceText,
                    {
                      color:
                        adherence >= 0.8
                          ? colors.success
                          : adherence >= 0.5
                          ? colors.warning
                          : colors.error,
                    },
                  ]}
                >
                  {Math.round(adherence * 100)}%
                </Text>
              </View>
            )}
          </View>

          {doses.length === 0 ? (
            <Text style={[styles.noDoses, { color: colors.mutedForeground }]}>
              No doses scheduled for this day.
            </Text>
          ) : (
            doses.map((dose) => (
              <DoseItem
                key={`${dose.supplement.id}-${dose.time}`}
                dose={dose}
                onTake={() =>
                  logDose(dose.supplement.id, selectedDate, dose.time, "taken")
                }
                onSkip={() =>
                  logDose(dose.supplement.id, selectedDate, dose.time, "skipped")
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  calCard: {
    padding: 18,
    borderWidth: 1,
    shadowColor: "#397B61",
    shadowOpacity: 0.11,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  dayDetail: {
    gap: 10,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  adherenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adherenceText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  noDoses: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 20,
  },
});
