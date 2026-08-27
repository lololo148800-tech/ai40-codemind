import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Ai40Card, IconAction, palette, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
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

function makeMessage(role: ChatMessage["role"], text: string, mode: AssistantMode, options?: Pick<ChatMessage, "model" | "blocked">): ChatMessage {
  return { id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, text, mode, createdAt: new Date().toISOString(), ...options };
}

export default function AssistantScreen() {
  const params = useLocalSearchParams<{ mode?: AssistantMode }>();
  const router = useRouter();
  const [mode, setMode] = useState<AssistantMode>("question");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [materials, setMaterials] = useState<WorkspaceMaterial[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings>({ sendSelectedContext: false, compactReplies: false });
  const chatMutation = trpc.assistant.chat.useMutation();

  const refreshWorkspace = useCallback(async () => {
    const [savedMessages, savedMaterials, savedSettings] = await Promise.all([listMessages(), listMaterials(), getSettings()]);
    setMessages(savedMessages);
    setMaterials(savedMaterials);
    setSettings(savedSettings);
  }, []);

  useFocusEffect(useCallback(() => { void refreshWorkspace(); }, [refreshWorkspace]));

  useEffect(() => {
    if (params.mode && MODES.some((item) => item.id === params.mode)) setMode(params.mode);
  }, [params.mode]);

  const selectedContext = useMemo(() => composeMaterialContext(materials), [materials]);
  const selectedMaterialCount = materials.filter((material) => material.useAsContext && material.contentPreview).length;

  const submit = async () => {
    const message = draft.trim();
    if (!message || chatMutation.isPending) return;
    if (selectedContext && !settings.sendSelectedContext) {
      Alert.alert("Нужно разрешение", "Вы отметили материалы для контекста. Включите передачу выбранного контекста в настройках, чтобы отправить их вместе с запросом.", [
        { text: "Отмена", style: "cancel" },
        { text: "Настройки", onPress: () => router.push("/settings" as never) },
      ]);
      return;
    }

    const userMessage = makeMessage("user", message, mode);
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");

    try {
      const result = await chatMutation.mutateAsync({
        mode,
        message,
        history: nextMessages.slice(-10).map((item) => ({ role: item.role, content: item.text })),
        context: settings.sendSelectedContext && selectedContext ? selectedContext : undefined,
      });
      const assistantMessage = makeMessage("assistant", result.content, mode, { model: result.model, blocked: result.blocked });
      const persisted = await appendMessages([userMessage, assistantMessage]);
      setMessages(persisted);
    } catch {
      const failedMessage = makeMessage("assistant", "Не удалось связаться с ИИ-сервисом. Проверьте интернет-соединение и повторите запрос.", mode, { blocked: false });
      const persisted = await appendMessages([userMessage, failedMessage]);
      setMessages(persisted);
    }
  };

  const resetConversation = () => {
    if (!messages.length) return;
    Alert.alert("Очистить диалог?", "История чата будет удалена только с этого устройства.", [
      { text: "Отмена", style: "cancel" },
      { text: "Очистить", style: "destructive", onPress: () => { void clearMessages().then(() => setMessages([])); } },
    ]);
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.root}>
        <FlatList
          data={messages}
          keyExtractor={(message) => message.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={(
            <View style={styles.headerContent}>
              <View style={styles.titleRow}>
                <View style={styles.titleCopy}>
                  <Text style={styles.eyebrow}>AI 4.0 UNIFIED</Text>
                  <Text style={styles.title}>Ассистент</Text>
                </View>
                <View style={styles.headerActions}>
                  <IconAction icon="delete-sweep" label="Очистить диалог" onPress={resetConversation} />
                  <IconAction icon="settings" label="Открыть настройки" onPress={() => router.push("/settings" as never)} />
                </View>
              </View>

              <View style={styles.modeRow}>
                {MODES.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => setMode(item.id)}
                    style={({ pressed }) => [styles.modeChip, mode === item.id && styles.modeChipActive, pressed && styles.modeChipPressed]}
                  >
                    <MaterialIcons name={item.icon} size={16} color={mode === item.id ? "#FFFFFF" : palette.muted} />
                    <Text style={[styles.modeLabel, mode === item.id && styles.modeLabelActive]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Ai40Card style={styles.contextCard}>
                <View style={styles.contextIcon}><MaterialIcons name="shield" size={19} color={palette.teal} /></View>
                <View style={styles.contextCopy}>
                  <Text style={styles.contextTitle}>{selectedMaterialCount ? `Выбрано материалов: ${selectedMaterialCount}` : "Контекст под контролем"}</Text>
                  <Text style={styles.contextText}>{selectedMaterialCount ? (settings.sendSelectedContext ? "Выбранный текст будет добавлен к следующему запросу." : "Передача материалов выключена в настройках.") : "Добавьте небольшие текстовые файлы в библиотеку, чтобы использовать их по вашему выбору."}</Text>
                </View>
                <StatusPill label={selectedMaterialCount && settings.sendSelectedContext ? "Разрешено" : "Локально"} tone={selectedMaterialCount && settings.sendSelectedContext ? "ready" : "neutral"} />
              </Ai40Card>
            </View>
          )}
          ListEmptyComponent={(
            <Ai40Card style={styles.emptyCard}>
              <View style={styles.emptyIcon}><MaterialIcons name="auto-awesome" size={25} color={palette.indigo} /></View>
              <Text style={styles.emptyTitle}>Начните с задачи</Text>
              <Text style={styles.emptyText}>Выберите режим, опишите цель или используйте стартовую подсказку. Ответы сохранятся только на этом устройстве.</Text>
              <Pressable accessibilityRole="button" onPress={() => setDraft(STARTERS[mode])} style={({ pressed }) => [styles.starterButton, pressed && styles.starterPressed]}>
                <MaterialIcons name="bolt" size={17} color={palette.indigo} />
                <Text style={styles.starterText}>{STARTERS[mode]}</Text>
              </Pressable>
            </Ai40Card>
          )}
          renderItem={({ item }) => (
            <View style={[styles.messageWrap, item.role === "user" ? styles.userWrap : styles.assistantWrap]}>
              <View style={[styles.messageBubble, item.role === "user" ? styles.userBubble : styles.assistantBubble, item.blocked && styles.blockedBubble]}>
                <Text style={[styles.messageText, item.role === "user" ? styles.userText : styles.assistantText]}>{item.text}</Text>
                {item.role === "assistant" && item.model ? <Text style={styles.messageMeta}>{item.blocked ? "Политика" : item.model}</Text> : null}
              </View>
            </View>
          )}
          ListFooterComponent={chatMutation.isPending ? (
            <View style={styles.pendingRow}><MaterialIcons name="more-horiz" size={24} color={palette.indigo} /><Text style={styles.pendingText}>Ассистент готовит ответ…</Text></View>
          ) : null}
        />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={8} style={styles.composerWrap}>
          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Опишите задачу…"
              placeholderTextColor="#9398AA"
              multiline
              maxLength={6000}
              returnKeyType="send"
              onSubmitEditing={() => { void submit(); }}
              style={styles.input}
              editable={!chatMutation.isPending}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Отправить запрос" onPress={() => { void submit(); }} disabled={!draft.trim() || chatMutation.isPending} style={({ pressed }) => [styles.sendButton, (!draft.trim() || chatMutation.isPending) && styles.sendButtonDisabled, pressed && draft.trim() && !chatMutation.isPending && styles.sendPressed]}>
              <MaterialIcons name="arrow-upward" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={styles.composerHint}>ИИ не выполняет внешние действия автоматически.</Text>
        </KeyboardAvoidingView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 12, flexGrow: 1 },
  headerContent: { gap: 14, marginBottom: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  titleCopy: { gap: 2, flex: 1 },
  eyebrow: { color: palette.teal, fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  title: { color: palette.ink, fontSize: 28, fontWeight: "800", letterSpacing: -0.6 },
  headerActions: { flexDirection: "row", gap: 7 },
  modeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  modeChip: { minHeight: 35, borderRadius: 12, paddingHorizontal: 11, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center", gap: 5 },
  modeChipActive: { backgroundColor: palette.indigo, borderColor: palette.indigo },
  modeChipPressed: { opacity: 0.78 },
  modeLabel: { color: palette.muted, fontSize: 12, fontWeight: "800" },
  modeLabelActive: { color: "#FFFFFF" },
  contextCard: { backgroundColor: "#F1FAF8", borderColor: "#CDEBE5", padding: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  contextIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#DDF4EF", alignItems: "center", justifyContent: "center" },
  contextCopy: { flex: 1, gap: 2 },
  contextTitle: { color: palette.ink, fontSize: 12, fontWeight: "800" },
  contextText: { color: palette.muted, fontSize: 11, lineHeight: 15 },
  emptyCard: { alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 28, marginTop: 4 },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: palette.indigoSoft, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: palette.ink, fontSize: 17, fontWeight: "800" },
  emptyText: { color: palette.muted, fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 290 },
  starterButton: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: palette.indigoSoft, minHeight: 38, paddingHorizontal: 12, borderRadius: 12, marginTop: 2 },
  starterPressed: { opacity: 0.7 },
  starterText: { color: palette.indigo, fontSize: 12, fontWeight: "800" },
  messageWrap: { flexDirection: "row" },
  userWrap: { justifyContent: "flex-end" },
  assistantWrap: { justifyContent: "flex-start" },
  messageBubble: { maxWidth: "89%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
  userBubble: { backgroundColor: palette.indigo, borderBottomRightRadius: 5 },
  assistantBubble: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, borderBottomLeftRadius: 5 },
  blockedBubble: { backgroundColor: "#FFF4F4", borderColor: "#F5D3D3" },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: "#FFFFFF" },
  assistantText: { color: palette.ink },
  messageMeta: { color: palette.muted, fontSize: 10, fontWeight: "700" },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 4 },
  pendingText: { color: palette.muted, fontSize: 12, fontWeight: "700" },
  composerWrap: { borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: "#F7F7FB", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, borderWidth: 1, borderColor: "#DCE0EB", backgroundColor: "#FFFFFF", borderRadius: 18, paddingLeft: 13, paddingRight: 5, paddingVertical: 5 },
  input: { flex: 1, color: palette.ink, fontSize: 14, lineHeight: 20, maxHeight: 96, minHeight: 38, paddingVertical: 8 },
  sendButton: { width: 39, height: 39, borderRadius: 13, backgroundColor: palette.indigo, alignItems: "center", justifyContent: "center" },
  sendButtonDisabled: { backgroundColor: "#B9BDCB" },
  sendPressed: { transform: [{ scale: 0.96 }], opacity: 0.86 },
  composerHint: { color: palette.muted, textAlign: "center", fontSize: 10, marginTop: 6 },
});
