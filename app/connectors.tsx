import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Ai40Card, IconAction, palette, ScreenTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";

const ICONS = { github: "code", browser: "language", google: "search", manus: "account-circle", telegram: "send", social: "groups" } as const;
const LABELS = { available: "Доступно", setup_required: "Нужна настройка", browser_required: "Нужен браузер" } as const;

export default function ConnectorsScreen() {
  const router = useRouter();
  const statuses = trpc.connectors.statuses.useQuery();
  const plan = trpc.connectors.accessPlan.useMutation();
  const [selected, setSelected] = useState<string | null>(null);
  const request = (provider: "github" | "browser" | "google" | "manus" | "telegram" | "social") => {
    setSelected(provider);
    void plan.mutateAsync({ provider, purpose: "Свежие данные и анализ по явной задаче" }).catch((error) => Alert.alert("Нужен вход", error instanceof Error ? error.message : "Войдите в проект перед запросом подключения.")).finally(() => setSelected(null));
  };
  return <ScreenContainer className="px-4" edges={["top", "bottom", "left", "right"]} containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content}><ScreenTitle eyebrow="AI40 CONNECTORS" title="Подключения" action={<IconAction icon="close" label="Закрыть" onPress={() => router.back()} />} /><Ai40Card style={styles.policy}><StatusPill label="Минимальный доступ" tone="ready" /><Text style={styles.title}>Свежие данные только с твоим разрешением</Text><Text style={styles.text}>AI40 не хранит чужие ключи в APK и не подключается сам. Нажми нужный сервис, чтобы увидеть минимальный scope и следующий безопасный шаг; никакая публикация или изменение данных не запускается.</Text></Ai40Card>{statuses.isLoading ? <Ai40Card style={styles.loading}><ActivityIndicator color={palette.indigo} /><Text style={styles.text}>Проверяю статусы…</Text></Ai40Card> : statuses.data?.map((item) => <Pressable key={item.provider} accessibilityRole="button" onPress={() => request(item.provider)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={styles.iconWrap}><MaterialIcons name={ICONS[item.provider]} color={palette.indigo} size={21} /></View><View style={styles.copy}><View style={styles.heading}><Text style={styles.itemTitle}>{item.title}</Text><StatusPill label={LABELS[item.status]} tone={item.status === "available" ? "ready" : "neutral"} /></View><Text style={styles.text}>{item.description}</Text></View>{selected === item.provider && plan.isPending ? <ActivityIndicator color={palette.indigo} /> : <MaterialIcons name="chevron-right" size={21} color="#95A0BA" />}</Pressable>)}{plan.data ? <Ai40Card style={styles.result}><StatusPill label={LABELS[plan.data.status]} tone="neutral" /><Text style={styles.itemTitle}>{plan.data.title}</Text><Text style={styles.text}>{plan.data.allowed}</Text><Text style={styles.boundary}>{plan.data.notAllowed}</Text><Text style={styles.next}>{plan.data.nextStep}</Text><Text style={styles.approval}>{plan.data.approval}</Text></Ai40Card> : null}</ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 14, paddingTop: 16, paddingBottom: 30 }, policy: { gap: 9, backgroundColor: "#F1FAF8", borderColor: "#CFEDE7" }, title: { color: palette.ink, fontSize: 16, fontWeight: "900" }, text: { color: palette.muted, fontSize: 12, lineHeight: 18 }, loading: { flexDirection: "row", alignItems: "center", gap: 10 }, row: { flexDirection: "row", gap: 11, alignItems: "center", borderWidth: 1, borderColor: palette.line, borderRadius: 16, backgroundColor: "#FFFFFF", padding: 13 }, iconWrap: { width: 39, height: 39, borderRadius: 13, backgroundColor: "#F0F0FF", justifyContent: "center", alignItems: "center" }, copy: { flex: 1, gap: 4 }, heading: { flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "space-between" }, itemTitle: { color: palette.ink, fontSize: 14, lineHeight: 19, fontWeight: "900" }, result: { gap: 9, backgroundColor: "#F8F8FF", borderColor: "#DEDCFF" }, boundary: { color: palette.danger, fontSize: 12, lineHeight: 18, fontWeight: "700" }, next: { color: palette.indigo, fontSize: 12, lineHeight: 18, fontWeight: "800" }, approval: { color: palette.muted, fontSize: 11, lineHeight: 16 }, pressed: { opacity: 0.68 } });
