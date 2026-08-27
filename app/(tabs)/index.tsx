import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { IconAction, palette, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { buildOfflineResponse } from "@/lib/offline-assistant";
import { appendMessages, clearMessages, composeMaterialContext, getSettings, listMaterials, listMessages, type AssistantMode, type ChatMessage, type WorkspaceMaterial, type WorkspaceSettings } from "@/lib/workspace-storage";

const MODES: { id: AssistantMode; label: string; icon: React.ComponentProps<typeof MaterialIcons>["name"] }[] = [
  { id: "question", label: "Спросить", icon: "chat-bubble-outline" },
  { id: "code", label: "Код", icon: "code" },
  { id: "research", label: "Исследовать", icon: "travel-explore" },
  { id: "create", label: "Создать", icon: "auto-awesome" },
];

const STARTERS: Record<AssistantMode, string> = {
  question: "Объясни идею простыми словами",
  code: "Составь план безопасного изменения проекта",
  research: "Сделай сводку по выбранному контексту",
  create: "Преврати идею в этапы реализации",
};

const WORKBENCH = [
  { title: "Agent Runbook", detail: "План задач и роли", icon: "smart-toy" as const, color: "#6157EF", route: "/agent" },
  { title: "Test Lab", detail: "Тесты и evidence", icon: "fact-check" as const, color: "#009D88", route: "/test-lab" },
  { title: "AutoImprove", detail: "Review без авто-merge", icon: "auto-fix-high" as const, color: "#DD7A20", route: "/auto-improve" },
] as const;

function makeMessage(role: ChatMessage["role"], text: string, mode: AssistantMode, options?: Pick<ChatMessage, "model" | "profile" | "profileLabel" | "blocked">): ChatMessage {
  return { id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, text, mode, createdAt: new Date().toISOString(), ...options };
}

export default function AssistantScreen() {
  const params = useLocalSearchParams<{ mode?: AssistantMode }>();
  const router = useRouter();
  const [mode, setMode] = useState<AssistantMode>("question");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [materials, setMaterials] = useState<WorkspaceMaterial[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings>({ sendSelectedContext: false, compactReplies: false, offlineMode: false });
  const chatMutation = trpc.assistant.chat.useMutation();

  const refreshWorkspace = useCallback(async () => {
    try {
      const [savedMessages, savedMaterials, savedSettings] = await Promise.all([listMessages(), listMaterials(), getSettings()]);
      setMessages(savedMessages);
      setMaterials(savedMaterials);
      setSettings(savedSettings);
    } catch {
      setMessages([]);
      setMaterials([]);
      setSettings({ sendSelectedContext: false, compactReplies: false, offlineMode: true });
    }
  }, []);
  useFocusEffect(useCallback(() => { void refreshWorkspace(); }, [refreshWorkspace]));
  useEffect(() => { if (params.mode && MODES.some((item) => item.id === params.mode)) setMode(params.mode); }, [params.mode]);

  const selectedContext = useMemo(() => composeMaterialContext(materials), [materials]);
  const selectedMaterialCount = materials.filter((material) => material.useAsContext && material.contentPreview).length;

  const submit = async () => {
    const message = draft.trim();
    if (!message || chatMutation.isPending) return;
    if (selectedContext && !settings.sendSelectedContext && !settings.offlineMode) {
      Alert.alert("Нужно разрешение", "Вы отметили материалы для контекста. Включите передачу выбранного контекста в настройках, чтобы отправить их вместе с запросом.", [{ text: "Отмена", style: "cancel" }, { text: "Настройки", onPress: () => router.push("/settings" as never) }]);
      return;
    }
    const userMessage = makeMessage("user", message, mode);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    try {
      if (settings.offlineMode) {
        const assistantMessage = makeMessage("assistant", buildOfflineResponse({ message, mode, selectedMaterialCount, cause: "manual" }), mode, { model: "AI40 Offline", blocked: false });
        setMessages(await appendMessages([userMessage, assistantMessage]));
        return;
      }
      const result = await chatMutation.mutateAsync({ mode, message, history: nextMessages.slice(-10).map((item) => ({ role: item.role, content: item.text })), context: settings.sendSelectedContext && selectedContext ? selectedContext : undefined });
      const assistantMessage = makeMessage("assistant", result.content, mode, { model: result.model, profile: result.profile, profileLabel: result.profileLabel, blocked: result.blocked });
      setMessages(await appendMessages([userMessage, assistantMessage]));
    } catch {
      const fallbackMessage = makeMessage("assistant", buildOfflineResponse({ message, mode, selectedMaterialCount, cause: "network" }), mode, { model: "AI40 Offline", blocked: false });
      setMessages(await appendMessages([userMessage, fallbackMessage]));
    }
  };

  const resetConversation = () => {
    if (!messages.length) return;
    Alert.alert("Очистить диалог?", "История чата будет удалена только с этого устройства.", [{ text: "Отмена", style: "cancel" }, { text: "Очистить", style: "destructive", onPress: () => { void clearMessages().then(() => setMessages([])); } }]);
  };

  const welcome = (
    <View style={styles.welcome}>
      <View style={styles.hero}>
        <View style={styles.heroAuraOne} /><View style={styles.heroAuraTwo} />
        <View style={styles.heroTop}><View style={styles.heroMark}><MaterialIcons name="smart-toy" size={24} color="#151625" /></View><StatusPill label={settings.offlineMode ? "Локально" : "Готов к задаче"} tone="ready" /></View>
        <Text style={styles.heroEyebrow}>AI40 CODEMIND</Text>
        <Text style={styles.heroTitle}>Код. Проверка.{"\n"}Доказательства.</Text>
        <Text style={styles.heroText}>Не просто чат: спланируй изменение, проверь риски, собери evidence и передай в GitHub CI, когда сам решишь.</Text>
        <View style={styles.signalRow}><View style={styles.signal}><MaterialIcons name="verified" size={15} color="#46D6C6" /><Text style={styles.signalText}>Evidence-first</Text></View><View style={styles.signal}><MaterialIcons name="shield" size={15} color="#B8B3FF" /><Text style={styles.signalText}>Owner control</Text></View></View>
      </View>
      <View style={styles.modeGrid}>{MODES.map((item) => <Pressable key={item.id} accessibilityRole="button" onPress={() => { setMode(item.id); setDraft(STARTERS[item.id]); }} style={({ pressed }) => [styles.modeCard, mode === item.id && styles.modeCardActive, pressed && styles.pressed]}><View style={[styles.modeIcon, { backgroundColor: mode === item.id ? "#5B52EE" : "#F0F0FF" }]}><MaterialIcons name={item.icon} size={20} color={mode === item.id ? "#FFFFFF" : palette.indigo} /></View><Text style={[styles.modeCardTitle, mode === item.id && styles.modeCardTitleActive]}>{item.label}</Text><Text style={[styles.modeCardDetail, mode === item.id && styles.modeCardDetailActive]}>{STARTERS[item.id]}</Text></Pressable>)}</View>
      <View style={styles.workbenchHead}><Text style={styles.workbenchTitle}>Рабочая среда</Text><Text style={styles.workbenchHint}>По твоему контролю</Text></View>
      <View style={styles.workbench}>{WORKBENCH.map((item) => <Pressable key={item.title} accessibilityRole="button" onPress={() => router.push(item.route as never)} style={({ pressed }) => [styles.workbenchItem, pressed && styles.pressed]}><View style={[styles.workbenchIcon, { backgroundColor: `${item.color}16` }]}><MaterialIcons name={item.icon} size={19} color={item.color} /></View><View style={styles.workbenchCopy}><Text style={styles.workbenchItemTitle}>{item.title}</Text><Text style={styles.workbenchItemDetail}>{item.detail}</Text></View><MaterialIcons name="chevron-right" size={20} color={palette.muted} /></Pressable>)}</View>
    </View>
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.root}>
        <FlatList
          data={messages}
          keyExtractor={(message) => message.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<View style={styles.headerContent}><View style={styles.titleRow}><View style={styles.titleCopy}><Text style={styles.eyebrow}>AI40 / COMMAND CENTER</Text><Text style={styles.title}>Ассистент</Text></View><View style={styles.headerActions}><IconAction icon="delete-sweep" label="Очистить диалог" onPress={resetConversation} /><IconAction icon="settings" label="Открыть настройки" onPress={() => router.push("/settings" as never)} /></View></View><View style={styles.contextCard}><View style={styles.contextIcon}><MaterialIcons name={settings.offlineMode ? "cloud-off" : "shield"} size={18} color={palette.teal} /></View><View style={styles.contextCopy}><Text style={styles.contextTitle}>{settings.offlineMode ? "Офлайн-режим активен" : selectedMaterialCount ? `Контекст: ${selectedMaterialCount} материал(а)` : "Контекст под контролем"}</Text><Text style={styles.contextText}>{settings.offlineMode ? "Ответ, история и review остаются на устройстве." : selectedMaterialCount ? (settings.sendSelectedContext ? "Текст добавится к следующему запросу." : "Передача отключена до твоего разрешения.") : "Задай цель — AI40 начнёт с плана и критериев качества."}</Text></View><StatusPill label={settings.offlineMode ? "Офлайн" : "Защищено"} tone="ready" /></View></View>}
          ListEmptyComponent={welcome}
          renderItem={({ item }) => <View style={[styles.messageWrap, item.role === "user" ? styles.userWrap : styles.assistantWrap]}><View style={[styles.messageBubble, item.role === "user" ? styles.userBubble : styles.assistantBubble, item.blocked && styles.blockedBubble]}><Text style={[styles.messageText, item.role === "user" ? styles.userText : styles.assistantText]}>{item.text}</Text>{item.role === "assistant" && item.model ? <Text style={styles.messageMeta}>{item.blocked ? "Политика" : `${item.model}${item.profileLabel ? ` · ${item.profileLabel}` : ""}`}</Text> : null}</View></View>}
          ListFooterComponent={chatMutation.isPending ? <View style={styles.pendingRow}><MaterialIcons name="more-horiz" size={24} color={palette.indigo} /><Text style={styles.pendingText}>AI40 готовит ответ…</Text></View> : null}
        />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8} style={styles.composerWrap}><View style={styles.composer}><TextInput value={draft} onChangeText={setDraft} placeholder="Поставь задачу AI40…" placeholderTextColor="#878DA3" multiline maxLength={6000} returnKeyType="send" onSubmitEditing={() => { void submit(); }} style={styles.input} editable={!chatMutation.isPending} /><Pressable accessibilityRole="button" accessibilityLabel="Отправить запрос" onPress={() => { void submit(); }} disabled={!draft.trim() || chatMutation.isPending} style={({ pressed }) => [styles.sendButton, (!draft.trim() || chatMutation.isPending) && styles.sendButtonDisabled, pressed && draft.trim() && !chatMutation.isPending && styles.sendPressed]}><MaterialIcons name="arrow-upward" size={22} color="#FFFFFF" /></Pressable></View><Text style={styles.composerHint}>{settings.offlineMode ? "Офлайн: внешние действия и сервер отключены." : "Внешние действия — только после твоего подтверждения."}</Text></KeyboardAvoidingView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, gap: 14, flexGrow: 1 }, headerContent: { gap: 13, marginBottom: 2 }, titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, titleCopy: { gap: 3, flex: 1 }, eyebrow: { color: palette.teal, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }, title: { color: palette.ink, fontSize: 29, lineHeight: 34, fontWeight: "900", letterSpacing: -0.8 }, headerActions: { flexDirection: "row", gap: 7 }, contextCard: { backgroundColor: "#F1FAF8", borderColor: "#CDEBE5", padding: 12, flexDirection: "row", alignItems: "center", gap: 9 }, contextIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#DDF4EF", alignItems: "center", justifyContent: "center" }, contextCopy: { flex: 1, gap: 2 }, contextTitle: { color: palette.ink, fontSize: 12, fontWeight: "900" }, contextText: { color: palette.muted, fontSize: 11, lineHeight: 15 }, welcome: { gap: 16, paddingTop: 2, paddingBottom: 6 }, hero: { overflow: "hidden", gap: 10, padding: 18, borderRadius: 23, backgroundColor: "#171928", minHeight: 265 }, heroAuraOne: { position: "absolute", width: 190, height: 190, borderRadius: 95, backgroundColor: "#5B52EE", opacity: 0.24, top: -80, right: -65 }, heroAuraTwo: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "#00BDA7", opacity: 0.15, bottom: -94, left: -44 }, heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, heroMark: { width: 43, height: 43, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FFFFFF" }, heroEyebrow: { color: "#7FE5DA", fontSize: 10, fontWeight: "900", letterSpacing: 1.25, marginTop: 4 }, heroTitle: { color: "#FFFFFF", fontSize: 28, lineHeight: 32, fontWeight: "900", letterSpacing: -0.8 }, heroText: { maxWidth: 310, color: "#CBD0E2", fontSize: 13, lineHeight: 19 }, signalRow: { flexDirection: "row", gap: 8, paddingTop: 3 }, signal: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: "#24283A" }, signalText: { color: "#E5E6F3", fontSize: 10, fontWeight: "800" }, modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, modeCard: { width: "48.5%", minHeight: 131, gap: 8, padding: 12, borderRadius: 18, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line }, modeCardActive: { backgroundColor: "#F3F2FF", borderColor: "#9A94F4" }, modeIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12 }, modeCardTitle: { color: palette.ink, fontSize: 14, fontWeight: "900" }, modeCardTitleActive: { color: palette.indigo }, modeCardDetail: { color: palette.muted, fontSize: 11, lineHeight: 15 }, modeCardDetailActive: { color: "#595687" }, workbenchHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingHorizontal: 2 }, workbenchTitle: { color: palette.ink, fontSize: 16, fontWeight: "900" }, workbenchHint: { color: palette.muted, fontSize: 11, fontWeight: "700" }, workbench: { gap: 8 }, workbenchItem: { flexDirection: "row", alignItems: "center", gap: 11, minHeight: 64, padding: 10, borderRadius: 17, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line }, workbenchIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 13 }, workbenchCopy: { flex: 1, gap: 2 }, workbenchItemTitle: { color: palette.ink, fontSize: 13, fontWeight: "900" }, workbenchItemDetail: { color: palette.muted, fontSize: 11, lineHeight: 15 }, messageWrap: { flexDirection: "row" }, userWrap: { justifyContent: "flex-end" }, assistantWrap: { justifyContent: "flex-start" }, messageBubble: { maxWidth: "89%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, gap: 6 }, userBubble: { backgroundColor: palette.indigo, borderBottomRightRadius: 5 }, assistantBubble: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, borderBottomLeftRadius: 5 }, blockedBubble: { backgroundColor: "#FFF4F4", borderColor: "#F5D3D3" }, messageText: { fontSize: 14, lineHeight: 20 }, userText: { color: "#FFFFFF" }, assistantText: { color: palette.ink }, messageMeta: { color: palette.muted, fontSize: 10, fontWeight: "700" }, pendingRow: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 4 }, pendingText: { color: palette.muted, fontSize: 12, fontWeight: "700" }, composerWrap: { borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: "#F7F7FB", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 }, composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, borderWidth: 1, borderColor: "#DCE0EB", backgroundColor: "#FFFFFF", borderRadius: 18, paddingLeft: 13, paddingRight: 5, paddingVertical: 5 }, input: { flex: 1, color: palette.ink, fontSize: 14, lineHeight: 20, maxHeight: 96, minHeight: 38, paddingVertical: 8 }, sendButton: { width: 39, height: 39, borderRadius: 13, backgroundColor: palette.indigo, alignItems: "center", justifyContent: "center" }, sendButtonDisabled: { backgroundColor: "#B9BDCB" }, sendPressed: { transform: [{ scale: 0.96 }], opacity: 0.86 }, composerHint: { color: palette.muted, textAlign: "center", fontSize: 10, marginTop: 6 }, pressed: { opacity: 0.73, transform: [{ scale: 0.985 }] },
});
