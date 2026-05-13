import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface CalendarGridProps {
  getDayAdherence: (date: string) => number;
  onDayPress: (date: string) => void;
  selectedDate?: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

function getDayColor(adherence: number, colors: { success: string; warning: string; error: string; border: string; muted: string }): string {
  if (adherence < 0) return colors.muted;
  if (adherence >= 0.8) return colors.success;
  if (adherence >= 0.5) return colors.warning;
  return colors.error;
}

export function CalendarGrid({ getDayAdherence, onDayPress, selectedDate }: CalendarGridProps) {
  const colors = useColors();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} hitSlop={12} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: colors.primary }]}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.foreground }]}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={12} style={styles.navBtn}>
          <Text style={[styles.navArrow, { color: colors.primary }]}>{">"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayHeaders}>
        {DAY_HEADERS.map((d, i) => (
          <Text key={i} style={[styles.dayHeader, { color: colors.mutedForeground }]}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (!day) {
            return <View key={`empty-${i}`} style={styles.cell} />;
          }
          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > todayStr;
          const adherence = isFuture ? -1 : getDayAdherence(dateStr);
          const dotColor = getDayColor(adherence, colors);

          return (
            <TouchableOpacity
              key={dateStr}
              onPress={() => !isFuture && onDayPress(dateStr)}
              style={[
                styles.cell,
                isSelected && {
                  backgroundColor: colors.primary + "30",
                  borderRadius: 8,
                },
              ]}
              activeOpacity={isFuture ? 1 : 0.7}
            >
              <Text
                style={[
                  styles.dayNum,
                  {
                    color: isFuture ? colors.border : isToday ? colors.primary : colors.foreground,
                    fontWeight: isToday ? "700" : "400",
                    fontFamily: isToday ? "Inter_700Bold" : "Inter_400Regular",
                  },
                ]}
              >
                {day}
              </Text>
              {!isFuture && adherence >= 0 && (
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: dotColor,
                    },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Full</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Partial</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Missed</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  navBtn: {
    padding: 4,
  },
  navArrow: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  dayHeaders: {
    flexDirection: "row",
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: "center",
    paddingVertical: 6,
    gap: 4,
  },
  dayNum: {
    fontSize: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
