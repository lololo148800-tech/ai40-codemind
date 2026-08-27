import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Ai40Card, palette, ScreenTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import type { AssistantMode } from "@/lib/workspace-storage";

const TOOLS: {
  mode: AssistantMode;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  color: string;
}[] = [
  { mode: "code", title: "Код", description: "Объяснить фрагмент, составить план изменений или провести доказательное ревью.", icon: "code", color: "#4F46E5" },
  { mode: "research", title: "Исследование", description: "Собрать выводы только из добавленного вами контекста и отметить пробелы в данных.", icon: "travel-explore", color: "#0F9E88" },
  { mode: "create", title: "Создать", description: "Превратить идею в архитектуру, этапы, риски и список проверок.", icon: "auto-awesome", color: "#A049C5" },
  { mode: "question", title: "Спросить", description: "Получить прямое объяснение, сравнение вариантов или рабочий черновик текста.", icon: "chat-bubble-outline", color: "#2563EB" },
];

export default function ToolsScreen() {
  const router = useRouter();

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <FlatList
        data={TOOLS}
        keyExtractor={(tool) => tool.mode}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View style={styles.header}>
            <ScreenTitle eyebrow="МОДУЛИ" title="Инструменты" />
            <Ai40Card style={styles.notice}>
              <View style={styles.noticeRow}>
                <MaterialIcons name="verified-user" size={22} color={palette.teal} />
                <View style={styles.noticeCopy}>
                  <Text style={styles.noticeTitle}>Контролируемые возможности</Text>
                  <Text style={styles.noticeText}>Каждый режим генерирует ответ или предложение. Приложение не запускает код, не меняет файлы и не отправляет данные без вашего действия.</Text>
                </View>
              </View>
            </Ai40Card>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/agent" as never)}
              style={({ pressed }) => [styles.agentEntry, pressed && styles.pressed]}
            >
              <View style={styles.agentIcon}>
                <MaterialIcons name="hub" size={23} color="#FFFFFF" />
              </View>
              <View style={styles.toolCopy}>
                <View style={styles.toolTitleRow}>
                  <Text style={styles.toolTitle}>Многоагентный coding workflow</Text>
                  <StatusPill label="10 ролей" tone="ready" />
                </View>
                <Text style={styles.toolDescription}>Параллельный review, баг-анализ, архитектура, тест-план и подготовка APK без автоматического запуска кода.</Text>
              </View>
              <MaterialIcons name="chevron-right" size={23} color={palette.muted} />
            </Pressable>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(`/?mode=${item.mode}`)}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Ai40Card style={styles.toolCard}>
              <View style={[styles.toolIcon, { backgroundColor: `${item.color}18` }]}>
                <MaterialIcons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.toolCopy}>
                <View style={styles.toolTitleRow}>
                  <Text style={styles.toolTitle}>{item.title}</Text>
                  <StatusPill label="Открыть" tone="ready" />
                </View>
                <Text style={styles.toolDescription}>{item.description}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={23} color={palette.muted} />
            </Ai40Card>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingTop: 16, paddingBottom: 28 },
  header: { gap: 16, marginBottom: 4 },
  notice: { backgroundColor: "#F1FAF8", borderColor: "#CFEDE7" },
  noticeRow: { flexDirection: "row", gap: 11, alignItems: "flex-start" },
  noticeCopy: { flex: 1, gap: 4 },
  noticeTitle: { color: palette.ink, fontWeight: "800", fontSize: 14 },
  noticeText: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  agentEntry: { flexDirection: "row", alignItems: "center", gap: 13, padding: 14, borderRadius: 18, backgroundColor: "#F4F3FF", borderWidth: 1, borderColor: "#DDD9FF" },
  agentIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: palette.indigo },
  toolCard: { flexDirection: "row", gap: 13, alignItems: "center" },
  toolIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  toolCopy: { flex: 1, gap: 5 },
  toolTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  toolTitle: { color: palette.ink, fontSize: 16, fontWeight: "800" },
  toolDescription: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.72 },
});
