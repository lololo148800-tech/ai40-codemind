import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";

import { Ai40Card, IconAction, palette, PrimaryButton, ScreenTitle, StatusPill } from "@/components/ai40-ui";
import { ScreenContainer } from "@/components/screen-container";
import { addPickedMaterial, listMaterials, removeMaterial, setMaterialContext, type WorkspaceMaterial } from "@/lib/workspace-storage";

function formatSize(size?: number) {
  if (!size) return "Размер неизвестен";
  if (size < 1_000_000) return `${Math.ceil(size / 1_000)} КБ`;
  return `${(size / 1_000_000).toFixed(1)} МБ`;
}

export default function MaterialsScreen() {
  const [materials, setMaterials] = useState<WorkspaceMaterial[]>([]);
  const [importing, setImporting] = useState(false);

  const refresh = useCallback(async () => setMaterials(await listMaterials()), []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const importMaterial = async () => {
    try {
      setImporting(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/*", "application/json", "application/pdf", "application/zip", "application/x-zip-compressed"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      await addPickedMaterial(result.assets[0]);
      await refresh();
    } catch (error) {
      Alert.alert("Не удалось добавить материал", error instanceof Error ? error.message : "Повторите попытку позже.");
    } finally {
      setImporting(false);
    }
  };

  const toggleContext = async (material: WorkspaceMaterial) => {
    if (material.contextStatus !== "ready") {
      Alert.alert("Контекст пока недоступен", "Для первой версии в контекст добавляются только небольшие текстовые файлы. Документ сохранён локально и не отправляется на сервер.");
      return;
    }
    setMaterials(await setMaterialContext(material.id, !material.useAsContext));
  };

  const confirmDelete = (material: WorkspaceMaterial) => {
    Alert.alert("Удалить материал?", `${material.name} будет удалён из локальной библиотеки.`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => { void removeMaterial(material.id).then(setMaterials); },
      },
    ]);
  };

  return (
    <ScreenContainer className="px-4" containerClassName="bg-background">
      <FlatList
        data={materials}
        keyExtractor={(material) => material.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View style={styles.header}>
            <ScreenTitle eyebrow="ЛОКАЛЬНО" title="Материалы" />
            <Ai40Card style={styles.importCard}>
              <View style={styles.importTop}>
                <View style={styles.importIcon}><MaterialIcons name="folder-open" size={23} color={palette.indigo} /></View>
                <View style={styles.importCopy}>
                  <Text style={styles.importTitle}>Ваш контекст на устройстве</Text>
                  <Text style={styles.importText}>Файлы остаются локально. Текст отправляется ИИ только после выбора материала и подтверждения разрешения в настройках.</Text>
                </View>
              </View>
              <PrimaryButton label={importing ? "Добавляю…" : "Добавить файл"} icon="add" onPress={() => { void importMaterial(); }} disabled={importing} />
            </Ai40Card>
            {materials.length ? <Text style={styles.listLabel}>В библиотеке · {materials.length}</Text> : null}
          </View>
        )}
        ListEmptyComponent={(
          <Ai40Card style={styles.emptyCard}>
            <MaterialIcons name="description" size={28} color={palette.muted} />
            <Text style={styles.emptyTitle}>Пока нет материалов</Text>
            <Text style={styles.emptyText}>Добавьте заметку, текстовый файл, PDF или архив. Небольшой текстовый файл можно отдельно разрешить как контекст для ассистента.</Text>
          </Ai40Card>
        )}
        renderItem={({ item }) => (
          <Ai40Card style={styles.materialCard}>
            <View style={styles.materialMain}>
              <View style={[styles.fileIcon, { backgroundColor: item.contextStatus === "ready" ? "#E5F7F3" : "#EEF0F6" }]}>
                <MaterialIcons name={item.contextStatus === "ready" ? "article" : "attachment"} size={20} color={item.contextStatus === "ready" ? palette.success : palette.muted} />
              </View>
              <View style={styles.materialCopy}>
                <Text style={styles.materialName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.materialMeta}>{formatSize(item.size)} · {item.contextStatus === "ready" ? "текст доступен" : "только локальные метаданные"}</Text>
              </View>
              <IconAction icon="delete-outline" label={`Удалить ${item.name}`} onPress={() => confirmDelete(item)} />
            </View>
            <View style={styles.materialFooter}>
              <StatusPill label={item.useAsContext ? "В контексте" : item.contextStatus === "ready" ? "Можно выбрать" : "Не отправляется"} tone={item.useAsContext ? "ready" : item.contextStatus === "ready" ? "neutral" : "warning"} />
              {item.contextStatus === "ready" ? (
                <PrimaryButton label={item.useAsContext ? "Убрать" : "В контекст"} tone="soft" icon={item.useAsContext ? "remove" : "add"} onPress={() => { void toggleContext(item); }} style={styles.contextButton} />
              ) : null}
            </View>
          </Ai40Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingTop: 16, paddingBottom: 28 },
  header: { gap: 15, marginBottom: 1 },
  importCard: { gap: 15, backgroundColor: "#F5F6FF", borderColor: "#DADDFF" },
  importTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  importIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: "#E5E7FF", alignItems: "center", justifyContent: "center" },
  importCopy: { flex: 1, gap: 4 },
  importTitle: { color: palette.ink, fontSize: 15, fontWeight: "800" },
  importText: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  listLabel: { color: palette.muted, fontSize: 12, fontWeight: "700", marginTop: 2 },
  emptyCard: { alignItems: "center", paddingVertical: 34, gap: 10 },
  emptyTitle: { color: palette.ink, fontSize: 16, fontWeight: "800" },
  emptyText: { color: palette.muted, textAlign: "center", fontSize: 13, lineHeight: 19, maxWidth: 290 },
  materialCard: { gap: 14 },
  materialMain: { flexDirection: "row", alignItems: "center", gap: 10 },
  fileIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  materialCopy: { flex: 1, gap: 4 },
  materialName: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  materialMeta: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  materialFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  contextButton: { minHeight: 36, borderRadius: 11, paddingHorizontal: 11 },
});
