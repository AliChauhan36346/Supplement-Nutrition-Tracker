import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

interface WeeklyChartProps {
  data: number[];
  height?: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDayLabels(): string[] {
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(DAY_LABELS[d.getDay()]!);
  }
  return labels;
}

export function WeeklyChart({ data, height = 160 }: WeeklyChartProps) {
  const colors = useColors();
  const chartHeight = height - 30;
  const labels = getDayLabels();

  return (
    <View style={styles.container}>
      <View style={styles.svgWrapper}>
        <Svg height={height} width="100%" viewBox={`0 0 350 ${height}`}>
          {data.map((value, index) => {
            const barWidth = 30;
            const gap = (350 - data.length * barWidth) / (data.length + 1);
            const x = gap + index * (barWidth + gap);
            const barH = Math.max(4, value * chartHeight);
            const y = chartHeight - barH;
            const barColor =
              value >= 0.8
                ? colors.success
                : value >= 0.5
                ? colors.warning
                : value > 0
                ? colors.error
                : colors.border;

            return (
              <React.Fragment key={index}>
                <Rect
                  x={x}
                  y={chartHeight}
                  width={barWidth}
                  height={0}
                  rx={6}
                  fill={colors.border}
                />
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={6}
                  fill={barColor}
                  opacity={0.9}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={height - 4}
                  fontSize={10}
                  fill={colors.mutedForeground}
                  textAnchor="middle"
                  fontFamily="Inter_400Regular"
                >
                  {labels[index]}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
            80%+
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.warning }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
            50%+
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.error }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
            Below 50%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  svgWrapper: {
    width: "100%",
  },
  legend: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
