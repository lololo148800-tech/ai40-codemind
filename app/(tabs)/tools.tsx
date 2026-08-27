import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Ai40Card, palette, ScreenTitle, SectionTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { CAPABILITY_SECTIONS, getCapabilityById, QUICK_CAPABILITY_IDS, type CapabilityItem, type CapabilitySection } from "@/lib/capability-catalog";
import { EXECUTION_STATUS, type ExecutionStatus } from "@/lib/execution-status";

function stateTone(state: CapabilityItem["state"]): "ready" | "warning" | "neutral" {
  if (state === "ready") return "ready";
  if (state === "setup") return "warning";
  return "neutral";
}

export default function ToolsScreen() {
  const router = useRouter();
  const quickActions = QUICK_CAPABILITY_IDS.map(getCapabilityById).filter((item): item is CapabilityItem => Boolean(item));

  const openCapability = (item: CapabilityItem) => {
    if (item.route) {
      router.push(item.route as never);
      return;
    }
    Alert.alert(item.title, item.nextStep ?? "Эта возможность пока не подключена. AI40 не будет имитировать её работу.", [{ text: "Понятно" }]);
  };

  const renderSection = ({ item: section }: { item: CapabilitySection }) => (
    <View style={styles.section}>
      <SectionTitle title={section.title} caption={section.caption} />
      <View style={styles.items}>
        {section.items.map((capability) => (
          <Pressable key={capability.id} accessibilityRole="button" accessibilityLabel={`${capability.title}: ${capability.stateLabel}`} onPress={() => openCapability(capability)} style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}>
            <Ai40Card style={styles.capabilityCard}>
              <View style={[styles.iconWrap, { backgroundColor: `${capability.color}18` }]}>
                <MaterialIcons name={capability.icon} size={23} color={capability.color} />
              </View>
              <View style={styles.copy}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{capability.title}</Text>
                  <StatusPill label={capability.stateLabel} tone={stateTone(capability.state)} />
                </View>
                <Text style={styles.description}>{capability.description}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={palette.muted} />
            </Ai40Card>
          </Pressable>
        ))}
      </View>
    </View>
  );
  const renderExecutionStatus = ({ item }: { item: ExecutionStatus }) => (
    <Pressable accessibilityRole="button" onPress={() => item.route ? router.push(item.route as never) : undefined} style={({ pressed }) => [styles.statusPressable, pressed && styles.pressed]}>
      <Ai40Card style={styles.statusCard}>
        <View style={styles.statusRail} />
        <View style={styles.statusCopy}><View style={styles.titleRow}><Text style={styles.statusTitle}>{item.title}</Text><StatusPill label={item.label} tone={item.tone} /></View><Text style={styles.statusDetail}>{item.detail}</Text>{item.evidenceUrl ? <Text style={styles.evidenceText}>Evidence · GitHub Actions run #33077367454</Text> : null}</View>
        {item.route ? <MaterialIcons name="chevron-right" size={21} color={palette.muted} /> : null}
      </Ai40Card>
    </Pressable>
  );

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <FlatList
        data={CAPABILITY_SECTIONS}
        keyExtractor={(section) => section.id}
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={(
            <View style={styles.header}>
            <ScreenTitle eyebrow="AI40 CODEMIND" title="Возможности" />
            <Ai40Card style={styles.hero}>
              <View style={styles.heroTop}><View style={styles.heroMark}><MaterialIcons name="auto-awesome" size={23} color="#FFFFFF" /></View><StatusPill label="Только реальные статусы" tone="ready" /></View>
              <Text style={styles.heroTitle}>Что сделаем?</Text>
              <Text style={styles.heroText}>Выберите действие. Карточки ведут к рабочему разделу, подготовке задачи или честно объясняют, какое подключение ещё требуется.</Text>
              <View style={styles.quickRow}>
                {quickActions.map((item) => (
                  <Pressable key={item.id} accessibilityRole="button" onPress={() => openCapability(item)} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
                    <MaterialIcons name={item.icon} size={20} color={item.color} />
                    <Text style={styles.quickLabel} numberOfLines={2}>{item.title}</Text>
                  </Pressable>
                ))}
              </View>
            </Ai40Card>
            <View style={styles.boundary}><MaterialIcons name="verified-user" size={19} color={palette.teal} /><Text style={styles.boundaryText}>Планы, review и предложения доступны сразу. Внешние действия, сборки и фоновые процессы требуют отдельной настройки и подтверждения.</Text></View>
          </View>
        )}
        ListFooterComponent={(
          <View style={styles.executionSection}>
            <SectionTitle title="Статус исполнения" caption="Evidence-first" />
            <Text style={styles.executionLead}>AI40 не подменяет plan фактом выполнения. Статус «Подтверждено» появляется только при наличии независимого лога или CI evidence.</Text>
            <FlatList data={EXECUTION_STATUS} keyExtractor={(item) => item.id} renderItem={renderExecutionStatus} scrollEnabled={false} contentContainerStyle={styles.executionList} />
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 22, paddingTop: 16, paddingBottom: 28 },
  header: { gap: 16 },
  hero: { gap: 12, backgroundColor: "#F4F3FF", borderColor: "#DDD9FF" },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroMark: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: palette.indigo },
  heroTitle: { color: palette.ink, fontSize: 24, fontWeight: "900", letterSpacing: -0.45 },
  heroText: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  quickRow: { flexDirection: "row", gap: 8 },
  quickAction: { flex: 1, minHeight: 86, paddingHorizontal: 10, paddingVertical: 11, gap: 8, borderRadius: 15, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E2FF" },
  quickLabel: { color: palette.ink, fontWeight: "800", fontSize: 11, lineHeight: 15 },
  boundary: { flexDirection: "row", alignItems: "flex-start", gap: 9, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14, backgroundColor: "#F1FAF8", borderWidth: 1, borderColor: "#CFEDE7" },
  boundaryText: { flex: 1, color: palette.muted, fontSize: 12, lineHeight: 18 },
  section: { gap: 10 },
  items: { gap: 9 },
  cardPressable: { borderRadius: 18 },
  capabilityCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 5 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  title: { flex: 1, color: palette.ink, fontSize: 15, fontWeight: "800" },
  description: { color: palette.muted, fontSize: 12, lineHeight: 17 },
  executionSection: { gap: 9, paddingTop: 2 },
  executionLead: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  executionList: { gap: 8 },
  statusPressable: { borderRadius: 16 },
  statusCard: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  statusRail: { width: 4, alignSelf: "stretch", borderRadius: 4, backgroundColor: palette.indigo },
  statusCopy: { flex: 1, gap: 5 },
  statusTitle: { flex: 1, color: palette.ink, fontSize: 14, fontWeight: "800" },
  statusDetail: { color: palette.muted, fontSize: 12, lineHeight: 17 },
  evidenceText: { color: palette.teal, fontSize: 11, fontWeight: "800" },
  pressed: { opacity: 0.73, transform: [{ scale: 0.985 }] },
});
