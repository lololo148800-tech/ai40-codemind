import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";

import { Ai40Card, IconAction, palette, PrimaryButton, ScreenTitle, SectionTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function MemoryScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const memories = trpc.agentRuntime.memory.useQuery(undefined, { enabled: isAuthenticated });
  const save = trpc.agentRuntime.saveMemory.useMutation({ onSuccess: () => { setKey(""); setValue(""); void memories.refetch(); } });
  const remove = trpc.agentRuntime.deleteMemory.useMutation({ onSuccess: () => void memories.refetch() });

  const saveMemory = () => {
    if (key.trim().length < 2 || value.trim().length < 2) return;
    void save.mutateAsync({ key: key.trim(), value: value.trim(), scope: "project" });
  };

  return <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]} containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><ScreenTitle eyebrow="AI40 EXPLICIT MEMORY" title="Память агента" action={<IconAction icon="close" label="Закрыть" onPress={() => router.back()} />} /><Text style={styles.lead}>Добавляйте только факты, которые разрешаете использовать в будущих задачах. Память ищется по ключевым словам, не заменяет policy и не даёт доступ к файлам или секретам.</Text>{!isAuthenticated ? <Ai40Card style={styles.card}><StatusPill label="Нужен вход" tone="warning" /><Text style={styles.title}>Память привязана к проектному аккаунту</Text><Text style={styles.text}>Войдите через «Ключи доступа», чтобы создать и использовать записи.</Text></Ai40Card> : <><Ai40Card style={styles.card}><Text style={styles.title}>Новая запись</Text><TextInput value={key} onChangeText={setKey} placeholder="Например: стек проекта" placeholderTextColor="#7886A8" style={styles.input} maxLength={120} /><TextInput value={value} onChangeText={setValue} placeholder="Например: Expo 54, TypeScript, Express, Vitest" placeholderTextColor="#7886A8" style={[styles.input, styles.value]} multiline maxLength={2000} textAlignVertical="top" /><PrimaryButton label={save.isPending ? "Сохраняю…" : "Сохранить явный факт"} icon="bookmark-add" onPress={saveMemory} disabled={save.isPending || key.trim().length < 2 || value.trim().length < 2} /></Ai40Card><View><SectionTitle title="Ваши записи" caption={memories.data ? String(memories.data.length) : "…"} />{memories.data?.map((memory) => <Ai40Card style={styles.memory} key={memory.id}><View style={styles.memoryHead}><Text style={styles.key}>{memory.memoryKey}</Text><Pressable accessibilityRole="button" onPress={() => Alert.alert("Удалить запись?", "Это действие удалит её из явной памяти агента.", [{ text: "Отмена", style: "cancel" }, { text: "Удалить", style: "destructive", onPress: () => void remove.mutateAsync({ memoryId: memory.id }) }])} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}><Text style={styles.removeText}>Удалить</Text></Pressable></View><Text style={styles.text}>{memory.value}</Text></Ai40Card>)}{memories.data?.length === 0 ? <Text style={styles.empty}>Пока нет записей. Агент будет использовать только цель и явно вставленный контекст.</Text> : null}</View></>}</ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 18, paddingTop: 16, paddingBottom: 30 }, lead: { color: palette.muted, fontSize: 13, lineHeight: 19 }, card: { gap: 10 }, title: { color: palette.ink, fontSize: 15, fontWeight: "800" }, text: { color: palette.muted, fontSize: 13, lineHeight: 19 }, input: { minHeight: 44, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: "#FAFAFC", color: palette.ink, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 }, value: { minHeight: 92 }, memory: { gap: 8, marginBottom: 8 }, memoryHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, key: { color: palette.ink, fontSize: 14, fontWeight: "800", flex: 1 }, remove: { paddingVertical: 6, paddingHorizontal: 8 }, removeText: { color: palette.danger, fontSize: 12, fontWeight: "800" }, pressed: { opacity: 0.7 }, empty: { color: palette.muted, fontSize: 12, lineHeight: 18, padding: 4 } });
