import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

import { composeMaterialContext } from "./context-utils";

export { composeMaterialContext } from "./context-utils";

export type AssistantMode = "question" | "research" | "code" | "create";
export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  mode: AssistantMode;
  createdAt: string;
  model?: string;
  blocked?: boolean;
};

export type WorkspaceMaterial = {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  uri: string;
  createdAt: string;
  useAsContext: boolean;
  contentPreview?: string;
  contextStatus: "ready" | "metadata_only";
};

export type WorkspaceSettings = {
  sendSelectedContext: boolean;
  compactReplies: boolean;
  offlineMode: boolean;
};

const KEYS = {
  messages: "ai40.workspace.messages.v1",
  materials: "ai40.workspace.materials.v1",
  settings: "ai40.workspace.settings.v1",
} as const;

const DEFAULT_SETTINGS: WorkspaceSettings = {
  sendSelectedContext: false,
  compactReplies: false,
  offlineMode: false,
};

const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown", "json", "js", "ts", "tsx", "jsx", "py", "java", "kt", "swift", "go", "rs", "css", "html", "yml", "yaml", "toml", "sql"]);
const MAX_FILE_BYTES = 3_000_000;
const MAX_TEXT_CONTEXT_BYTES = 120_000;
const MAX_MESSAGES = 60;

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeFileName(name: string) {
  const normalized = name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_");
  return normalized.slice(0, 120) || `material-${Date.now()}.txt`;
}

function extension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isReadableText(name: string, mimeType?: string | null) {
  return Boolean(mimeType?.startsWith("text/")) || TEXT_EXTENSIONS.has(extension(name));
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function listMessages() {
  return readJson<ChatMessage[]>(KEYS.messages, []);
}

export async function appendMessages(messages: ChatMessage[]) {
  const existing = await listMessages();
  const combined = [...existing, ...messages].slice(-MAX_MESSAGES);
  await AsyncStorage.setItem(KEYS.messages, JSON.stringify(combined));
  return combined;
}

export async function clearMessages() {
  await AsyncStorage.removeItem(KEYS.messages);
}

export async function listMaterials() {
  return readJson<WorkspaceMaterial[]>(KEYS.materials, []);
}

async function saveMaterials(materials: WorkspaceMaterial[]) {
  await AsyncStorage.setItem(KEYS.materials, JSON.stringify(materials));
  return materials;
}

export async function setMaterialContext(idToUpdate: string, useAsContext: boolean) {
  const materials = await listMaterials();
  return saveMaterials(materials.map((material) => (
    material.id === idToUpdate ? { ...material, useAsContext } : material
  )));
}

export async function addPickedMaterial(asset: {
  name: string;
  uri: string;
  mimeType?: string | null;
  size?: number;
}): Promise<WorkspaceMaterial> {
  if (asset.size && asset.size > MAX_FILE_BYTES) {
    throw new Error("Для локальной библиотеки выберите файл до 3 МБ.");
  }

  const readableText = isReadableText(asset.name, asset.mimeType);
  let storedUri = asset.uri;
  const directory = FileSystem.documentDirectory;

  if (Platform.OS !== "web" && directory) {
    const target = `${directory}${id("material")}-${safeFileName(asset.name)}`;
    await FileSystem.copyAsync({ from: asset.uri, to: target });
    storedUri = target;
  }

  let contentPreview: string | undefined;
  if (
    readableText &&
    Platform.OS !== "web" &&
    (!asset.size || asset.size <= MAX_TEXT_CONTEXT_BYTES)
  ) {
    try {
      const content = await FileSystem.readAsStringAsync(storedUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      contentPreview = content.replace(/\u0000/g, "").trim().slice(0, 12_000);
    } catch {
      contentPreview = undefined;
    }
  }

  const material: WorkspaceMaterial = {
    id: id("material"),
    name: asset.name.slice(0, 160),
    mimeType: asset.mimeType ?? "application/octet-stream",
    size: asset.size,
    uri: storedUri,
    createdAt: new Date().toISOString(),
    useAsContext: false,
    contentPreview,
    contextStatus: contentPreview ? "ready" : "metadata_only",
  };

  await saveMaterials([material, ...(await listMaterials())].slice(0, 40));
  return material;
}

export async function removeMaterial(idToRemove: string) {
  const materials = await listMaterials();
  const material = materials.find((item) => item.id === idToRemove);
  const documentDirectory = FileSystem.documentDirectory;
  if (material && documentDirectory && material.uri.startsWith(documentDirectory)) {
    await FileSystem.deleteAsync(material.uri, { idempotent: true }).catch(() => undefined);
  }
  return saveMaterials(materials.filter((item) => item.id !== idToRemove));
}

export async function getSettings() {
  const stored = await readJson<Partial<WorkspaceSettings>>(KEYS.settings, DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: WorkspaceSettings) {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
  return settings;
}

export async function clearWorkspaceData() {
  const materials = await listMaterials();
  const documentDirectory = FileSystem.documentDirectory;
  await Promise.all(materials.map(async (material) => {
    if (documentDirectory && material.uri.startsWith(documentDirectory)) {
      await FileSystem.deleteAsync(material.uri, { idempotent: true }).catch(() => undefined);
    }
  }));
  await AsyncStorage.multiRemove([KEYS.messages, KEYS.materials, KEYS.settings]);
}
