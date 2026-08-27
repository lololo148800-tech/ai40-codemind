import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Ai40Card, IconAction, palette, PrimaryButton, ScreenTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

export default function WebsiteAnalysisScreen() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const inspect = trpc.website.inspectPublic.useMutation();
  const start = () => {
    setError("");
    void inspect.mutateAsync({ url: url.trim() }).catch((value) => setError(value instanceof Error ? value.message : "Не удалось прочитать публичный сайт."));
  };
  return <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]} containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><ScreenTitle eyebrow="AI40 PUBLIC WEB" title="Анализ сайта" action={<IconAction icon="close" label="Закрыть" onPress={() => router.back()} />} /><Ai40Card style={styles.policy}><StatusPill label="Только публичный read-only" tone="ready" /><Text style={styles.title}>Краткий технический обзор</Text><Text style={styles.text}>Вставьте конечный HTTPS URL. AI40 читает только ограниченный HTML: title, description, язык и первые H1. Вход, cookies, JavaScript, формы и изменение сайта не выполняются.</Text></Ai40Card><Ai40Card style={styles.card}><Text style={styles.label}>Публичный HTTPS URL</Text><TextInput value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.input} placeholder="https://example.com" placeholderTextColor="#7886A8" editable={!inspect.isPending} /><PrimaryButton label={inspect.isPending ? "Читаю public HTML…" : "Проверить сайт"} icon="travel-explore" onPress={start} disabled={!url.trim() || inspect.isPending} /></Ai40Card>{error ? <Ai40Card style={styles.errorCard}><Text style={styles.error}>{error}</Text></Ai40Card> : null}{inspect.data ? <Ai40Card style={styles.card}><StatusPill label="Public HTML прочитан" tone="ready" /><Text style={styles.siteTitle}>{inspect.data.title ?? "Без title"}</Text><Text style={styles.meta}>{inspect.data.url}</Text><Text style={styles.text}>{inspect.data.description ?? "Meta description не найден."}</Text><View style={styles.divider} /><Text style={styles.label}>Язык: {inspect.data.language ?? "не указан"} · HTML: {Math.round(inspect.data.bytesRead / 1024)} KB</Text>{inspect.data.headings.map((heading) => <Text key={heading} style={styles.heading}>H1 · {heading}</Text>)}<Text style={styles.boundary}>{inspect.data.boundary}</Text></Ai40Card> : null}</ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 16, paddingTop: 16, paddingBottom: 30 }, policy: { gap: 9, backgroundColor: "#F1FAF8", borderColor: "#CFEDE7" }, card: { gap: 10 }, title: { color: palette.ink, fontSize: 15, fontWeight: "800" }, siteTitle: { color: palette.ink, fontSize: 18, lineHeight: 24, fontWeight: "900" }, text: { color: palette.muted, fontSize: 13, lineHeight: 19 }, label: { color: palette.ink, fontSize: 12, fontWeight: "800" }, meta: { color: "#3730A3", fontSize: 12, lineHeight: 18 }, input: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 12, color: palette.ink, backgroundColor: "#FAFAFC", fontSize: 13 }, divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line }, heading: { color: palette.ink, borderLeftWidth: 3, borderLeftColor: palette.teal, paddingLeft: 9, fontSize: 13, lineHeight: 18 }, boundary: { color: palette.muted, fontSize: 12, lineHeight: 18, paddingTop: 2 }, errorCard: { backgroundColor: "#FFF4F4", borderColor: "#FFD8D8" }, error: { color: palette.danger, fontSize: 13, lineHeight: 18 } });
