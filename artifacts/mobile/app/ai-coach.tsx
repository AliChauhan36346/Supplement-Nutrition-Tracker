import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSupplements } from "@/context/SupplementContext";
import { useColors } from "@/hooks/useColors";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const CANNED_RESPONSES: { pattern: RegExp; response: string }[] = [
  {
    pattern: /vitamin d/i,
    response:
      "Vitamin D is best taken with your largest meal of the day since it's fat-soluble. Morning or lunch works well. Many people take 2,000–5,000 IU daily. Pair it with Vitamin K2 for better absorption and to direct calcium to bones.",
  },
  {
    pattern: /creatine/i,
    response:
      "Creatine monohydrate is one of the most researched supplements. Take 3–5g daily at any time — consistency matters more than timing. No loading phase is necessary. Stay well hydrated. It works for anyone doing resistance training or high-intensity sport.",
  },
  {
    pattern: /protein/i,
    response:
      "Aim for 0.8–1g of protein per pound of bodyweight if you're active. Protein shakes are most useful when you struggle to hit that from food. Post-workout is a good time, but total daily intake matters most. Whey is fast-absorbing; casein is slower and good before bed.",
  },
  {
    pattern: /magnesium/i,
    response:
      "Magnesium glycinate or bisglycinate are gentler on the stomach and better absorbed than oxide. Take it in the evening — it can help with relaxation and sleep quality. 300–400mg elemental magnesium is a common dose.",
  },
  {
    pattern: /omega|fish oil/i,
    response:
      "Omega-3s (EPA/DHA) support heart, brain, and joint health. Take with a meal that contains fat for best absorption. Look for at least 1,000mg combined EPA+DHA per serving. Keep fish oil in the fridge to prevent oxidation.",
  },
  {
    pattern: /sleep|melatonin/i,
    response:
      "For sleep, low-dose melatonin (0.5–1mg) taken 30–60 minutes before bed is more effective than high doses. Magnesium glycinate and L-theanine can also support relaxation. Avoid blue light 1 hour before bed for best results.",
  },
  {
    pattern: /timing|when|schedule/i,
    response:
      "For most supplements, the best time is whenever you'll consistently remember to take them. A few general rules: fat-soluble vitamins (A, D, E, K) with meals; iron on an empty stomach (unless it causes nausea); magnesium in the evening; pre-workout 30–45 minutes before training.",
  },
  {
    pattern: /consistent|forget|remember/i,
    response:
      "The biggest predictor of supplement benefits is consistency. Try habit stacking — attach your supplement routine to an existing habit like morning coffee or brushing teeth. Use the reminder feature and aim to build a 30-day streak. Research shows habits form around 21–66 days of repetition.",
  },
  {
    pattern: /zinc/i,
    response:
      "Zinc supports immune function, testosterone levels, and wound healing. Take it with food to reduce nausea. Don't take zinc within 2 hours of copper or iron supplements as they compete for absorption. 15–30mg elemental zinc daily is a common range.",
  },
  {
    pattern: /pre.?workout|caffeine/i,
    response:
      "Pre-workout compounds are most effective 30–45 minutes before training. Caffeine tolerance builds quickly — consider cycling off for 1–2 weeks every 2–3 months. Creatine and beta-alanine don't need to be timed for the workout — daily consistency is what matters.",
  },
];

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your Supplement Coach — a built-in tips guide (not live AI). Ask about timing, dosing, combinations, or building a consistent routine.\n\nImportant: I provide general wellness information only. Always consult a healthcare professional for medical advice.",
  ts: Date.now(),
};

function getResponse(input: string, supplements: { name: string }[]): string {
  for (const { pattern, response } of CANNED_RESPONSES) {
    if (pattern.test(input)) return response;
  }
  if (/how many|how much|dose|dosage/i.test(input)) {
    return "Dosage depends on your specific supplement and health goals. I recommend checking the product label and following manufacturer guidelines. For personalized medical dosing, consult with a healthcare provider or registered dietitian.";
  }
  if (/stack|combine|together/i.test(input)) {
    return "Some synergistic combinations: Vitamin D3 + K2, Magnesium + B6, Creatine + Beta-Alanine, Iron + Vitamin C. Avoid taking calcium with iron, zinc with copper, or fat-soluble vitamins without dietary fat. Spacing absorption-competing minerals 2 hours apart is a safe approach.";
  }
  if (/streak|motivation|habit/i.test(input)) {
    return `You're doing great by tracking your supplements! ${supplements.length > 0 ? `You have ${supplements.length} supplement${supplements.length !== 1 ? "s" : ""} in your tracker. ` : ""}Research shows just 21 days of consistent behavior starts building a strong habit. Keep your streak alive — even taking 1 supplement counts as a win for your routine.`;
  }
  return "That's a great question about supplements! Supplement science varies by individual — genetics, diet, and lifestyle all matter. For the most accurate guidance, I'd recommend consulting a registered dietitian or healthcare provider alongside using this tracker to build your consistency. Is there a specific supplement you'd like to know more about?";
}

export default function AICoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { supplements, profile } = useSupplements();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatRef = useRef<FlatList<Message>>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  React.useEffect(() => {
    if (!profile.isPremium) {
      router.replace("/(tabs)");
    }
  }, [profile.isPremium]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: text,
      ts: Date.now(),
    };
    setMessages((prev) => [userMsg, ...prev]);
    setIsTyping(true);

    setTimeout(() => {
      const reply = getResponse(text, supplements);
      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: reply,
        ts: Date.now(),
      };
      setMessages((prev) => [assistantMsg, ...prev]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  }, [input, isTyping, supplements]);

  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          {
            backgroundColor: isUser ? colors.primary : colors.card,
            borderRadius: colors.radius,
            borderColor: isUser ? "transparent" : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {item.content}
        </Text>
      </View>
    );
  };

  const SUGGESTIONS = [
    "When should I take Vitamin D?",
    "Help me build a routine",
    "Best time for creatine?",
    "What improves sleep?",
  ];

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
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Supplement Coach
          </Text>
          <View style={styles.onlineRow}>
            <View style={[styles.onlineDot, { backgroundColor: colors.mutedForeground }]} />
            <Text style={[styles.onlineText, { color: colors.mutedForeground }]}>
              Tips guide · Not medical advice
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.avatarSmall,
            { backgroundColor: colors.primary + "20", borderRadius: 20 },
          ]}
        >
          <Feather name="message-circle" size={20} color={colors.primary} />
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        inverted
        contentContainerStyle={[
          styles.messageList,
          { paddingBottom: 12 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          isTyping ? (
            <View
              style={[
                styles.bubble,
                styles.assistantBubble,
                {
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.typing, { color: colors.mutedForeground }]}>
                Thinking...
              </Text>
            </View>
          ) : null
        }
      />

      {messages.length === 1 && (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => {
                setInput(s);
              }}
              style={[
                styles.suggestion,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: 20,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.suggestionText, { color: colors.foreground }]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: botPad + 8,
          },
        ]}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask about supplements..."
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.foreground,
              borderRadius: 22,
            },
          ]}
          multiline
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!input.trim() || isTyping}
          style={[
            styles.sendBtn,
            {
              backgroundColor:
                input.trim() && !isTyping ? colors.primary : colors.border,
              borderRadius: 22,
            },
          ]}
          activeOpacity={0.85}
        >
          <Feather name="send" size={18} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
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
  headerInfo: { flex: 1, gap: 2 },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  avatarSmall: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  messageList: {
    padding: 16,
    gap: 10,
  },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  userBubble: {
    alignSelf: "flex-end",
  },
  assistantBubble: {
    alignSelf: "flex-start",
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  typing: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  suggestion: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
