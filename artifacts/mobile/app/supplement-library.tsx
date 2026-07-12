import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PremiumBackground } from "@/components/PremiumBackground";
import {
  SUPPLEMENT_CATALOG,
  type SupplementCatalogItem,
} from "@/data/supplementCatalog";
import { useColors } from "@/hooks/useColors";

const CATEGORIES = ["All", "Vitamin", "Mineral", "Protein", "Other"] as const;

export default function SupplementLibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ query?: string }>();
  const [query, setQuery] = useState(params.query ?? "");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SUPPLEMENT_CATALOG.filter((item) => {
      const categoryMatch = category === "All" || item.category === category;
      const queryMatch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.aliases.some((alias) => alias.includes(q)) ||
        item.benefits.some((benefit) => benefit.toLowerCase().includes(q));
      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  const openTemplate = (item: SupplementCatalogItem) => {
    router.push({
      pathname: "/add-supplement",
      params: { templateId: item.id },
    });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <PremiumBackground />
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            backgroundColor: colors.header,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Supplement Library
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Learn first, then personalize your schedule
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.search,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search supplements or benefits"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      category === item ? colors.primary : colors.card,
                    borderColor:
                      category === item ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        category === item
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.notice,
            {
              backgroundColor: colors.warning + "14",
              borderColor: colors.warning + "40",
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="info" size={17} color={colors.warning} />
          <Text style={[styles.noticeText, { color: colors.foreground }]}>
            Educational information only. Confirm dose and suitability with a
            qualified clinician, especially for iron, medications, pregnancy,
            or health conditions.
          </Text>
        </View>

        {results.map((item) => {
          const isExpanded = expanded === item.id;
          return (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => setExpanded(isExpanded ? null : item.id)}
                activeOpacity={0.75}
                style={styles.cardHeader}
              >
                <View
                  style={[
                    styles.icon,
                    { backgroundColor: colors.primary + "18" },
                  ]}
                >
                  <Feather name="book-open" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    {item.name}
                  </Text>
                  <Text
                    style={[styles.cardSummary, { color: colors.mutedForeground }]}
                  >
                    {item.summary}
                  </Text>
                </View>
                <Feather
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={[styles.details, { borderTopColor: colors.border }]}>
                  <Text style={[styles.detailLabel, { color: colors.foreground }]}>
                    Common uses
                  </Text>
                  <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                    {item.benefits.join(" · ")}
                  </Text>
                  <Text style={[styles.detailLabel, { color: colors.foreground }]}>
                    Food sources
                  </Text>
                  <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                    {item.foodSources.join(", ")}
                  </Text>
                  <Text style={[styles.detailLabel, { color: colors.foreground }]}>
                    Timing
                  </Text>
                  <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                    {item.timing}
                  </Text>
                  <Text style={[styles.caution, { color: colors.warning }]}>
                    {item.caution}
                  </Text>
                  <TouchableOpacity
                    onPress={() => openTemplate(item)}
                    style={[
                      styles.addButton,
                      {
                        backgroundColor: colors.primary,
                        borderRadius: colors.radius / 2,
                      },
                    ]}
                  >
                    <Feather
                      name="plus"
                      size={17}
                      color={colors.primaryForeground}
                    />
                    <Text
                      style={[
                        styles.addButtonText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      Add to my stack
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 0,
    gap: 14,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  content: { padding: 16, gap: 12 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  chips: { flexDirection: "row", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  card: {
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#397B61",
    shadowOpacity: 0.09,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  icon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardSummary: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  details: { borderTopWidth: 1, padding: 14, gap: 6 },
  detailLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  detailText: { fontSize: 12, lineHeight: 18, fontFamily: "Inter_400Regular" },
  caution: { fontSize: 12, lineHeight: 18, fontFamily: "Inter_500Medium", marginTop: 5 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    marginTop: 8,
  },
  addButtonText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
