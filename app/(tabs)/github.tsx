import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as WebBrowser from "expo-web-browser";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { Ai40Card, palette, PrimaryButton, ScreenTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";

const SOURCES = [
  {
    id: "gemini-cli",
    title: "Google Gemini CLI",
    owner: "google-gemini/gemini-cli",
    url: "https://github.com/google-gemini/gemini-cli",
    description: "Публичный open-source проект для терминального ИИ-агента. Добавлен как справочный источник после аудита материалов.",
    license: "Apache-2.0",
  },
  {
    id: "copilot",
    title: "GitHub Copilot",
    owner: "Официальная страница",
    url: "https://github.com/features/copilot",
    description: "Официальное описание возможностей GitHub Copilot. Это внешняя справочная страница, а не исходный код для импорта.",
    license: "Справочный ресурс",
  },
];

export default function GithubScreen() {
  const openSource = (url: string) => {
    void WebBrowser.openBrowserAsync(url, {
      toolbarColor: palette.indigo,
      controlsColor: "#FFFFFF",
      showTitle: true,
      enableDefaultShareMenuItem: true,
    });
  };

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <FlatList
        data={SOURCES}
        keyExtractor={(source) => source.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View style={styles.header}>
            <ScreenTitle eyebrow="ПРОВЕРЕННЫЕ ССЫЛКИ" title="GitHub" />
            <Ai40Card style={styles.policyCard}>
              <View style={styles.policyRow}>
                <MaterialIcons name="policy" size={22} color={palette.warning} />
                <View style={styles.policyCopy}>
                  <Text style={styles.policyTitle}>Прозрачный импорт</Text>
                  <Text style={styles.policyText}>Каталог создан по вашим материалам. Репозитории с предполагаемыми утечками или неподтверждёнными правами не добавлены. Содержимое по ссылкам не запускается и не копируется автоматически.</Text>
                </View>
              </View>
            </Ai40Card>
            <Text style={styles.listLabel}>Доступные источники · {SOURCES.length}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Ai40Card style={styles.sourceCard}>
            <View style={styles.sourceTop}>
              <View style={styles.sourceIcon}><MaterialIcons name="code" size={22} color={palette.indigo} /></View>
              <View style={styles.sourceCopy}>
                <Text style={styles.sourceTitle}>{item.title}</Text>
                <Text style={styles.sourceOwner}>{item.owner}</Text>
              </View>
              <StatusPill label="Публичный" tone="ready" />
            </View>
            <Text style={styles.sourceDescription}>{item.description}</Text>
            <View style={styles.sourceFooter}>
              <Text style={styles.license}>{item.license}</Text>
              <PrimaryButton label="Открыть" icon="open-in-new" tone="soft" onPress={() => openSource(item.url)} style={styles.openButton} />
            </View>
          </Ai40Card>
        )}
        ListFooterComponent={(
          <Text style={styles.footer}>Ограничение первой версии: приложение открывает только проверенные внешние ссылки. Чтение манифеста публичного репозитория и выбор файлов будут добавлены отдельным подтверждаемым модулем.</Text>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingTop: 16, paddingBottom: 28 },
  header: { gap: 15, marginBottom: 1 },
  policyCard: { backgroundColor: "#FFF9ED", borderColor: "#F6E4B6" },
  policyRow: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  policyCopy: { flex: 1, gap: 4 },
  policyTitle: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  policyText: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  listLabel: { color: palette.muted, fontSize: 12, fontWeight: "700" },
  sourceCard: { gap: 14 },
  sourceTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  sourceIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.indigoSoft, alignItems: "center", justifyContent: "center" },
  sourceCopy: { flex: 1, gap: 3 },
  sourceTitle: { color: palette.ink, fontSize: 15, fontWeight: "800" },
  sourceOwner: { color: palette.muted, fontSize: 12 },
  sourceDescription: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  sourceFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  license: { color: palette.muted, fontWeight: "700", fontSize: 11 },
  openButton: { minHeight: 36, borderRadius: 11, paddingHorizontal: 12 },
  footer: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 4, paddingHorizontal: 4 },
});
