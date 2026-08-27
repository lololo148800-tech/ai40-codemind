import crypto from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";

import { apiKeys } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb } from "./db";

export const API_KEY_SCOPE = "agent:run" as const;
const API_KEY_PREFIX = "ai40_live_";
const API_KEY_SECRET_BYTES = 32;

export type ApiKeyMetadata = {
  id: number;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

function apiKeyPepper() {
  if (!ENV.cookieSecret) throw new Error("Server signing secret is unavailable.");
  return ENV.cookieSecret;
}

export function createApiKeyMaterial() {
  const secret = `${API_KEY_PREFIX}${crypto.randomBytes(API_KEY_SECRET_BYTES).toString("base64url")}`;
  return { secret, prefix: secret.slice(0, API_KEY_PREFIX.length + 8) };
}

export function isApiKeyFormat(value: string) {
  return new RegExp(`^${API_KEY_PREFIX}[A-Za-z0-9_-]{${Math.ceil(API_KEY_SECRET_BYTES * 4 / 3)}}$`).test(value);
}

export function hashApiKey(secret: string, pepper: string) {
  return crypto.createHmac("sha256", pepper).update(secret).digest("hex");
}

function safeHashEquals(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function parseScopes(serialized: string) {
  try {
    const parsed = JSON.parse(serialized) as unknown;
    return Array.isArray(parsed) && parsed.every((scope) => typeof scope === "string") ? parsed : [];
  } catch {
    return [];
  }
}

function toMetadata(row: typeof apiKeys.$inferSelect): ApiKeyMetadata {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    scopes: parseScopes(row.scopes),
    createdAt: row.createdAt,
    lastUsedAt: row.lastUsedAt,
    revokedAt: row.revokedAt,
  };
}

export async function issueApiKey(input: { userId: number; name: string; scopes?: string[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable. API keys cannot be issued without durable storage.");
  const scopes = input.scopes?.length ? input.scopes : [API_KEY_SCOPE];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const material = createApiKeyMaterial();
    const keyHash = hashApiKey(material.secret, apiKeyPepper());
    try {
      const result = await db.insert(apiKeys).values({
        userId: input.userId,
        name: input.name.trim(),
        prefix: material.prefix,
        keyHash,
        scopes: JSON.stringify(scopes),
      });
      return {
        secret: material.secret,
        key: {
          id: Number(result[0].insertId),
          name: input.name.trim(),
          prefix: material.prefix,
          scopes,
        },
      };
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  throw new Error("Could not issue API key.");
}

export async function listApiKeys(userId: number): Promise<ApiKeyMetadata[]> {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const rows = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
  return rows.map(toMetadata);
}

export async function revokeApiKey(input: { userId: number; keyId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const rows = await db.select({ id: apiKeys.id }).from(apiKeys).where(and(eq(apiKeys.id, input.keyId), eq(apiKeys.userId, input.userId), isNull(apiKeys.revokedAt))).limit(1);
  if (!rows.length) return false;
  await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, input.keyId));
  return true;
}

export function extractApiKey(headers: unknown) {
  const headerRecord = headers && typeof headers === "object" ? headers as Record<string, unknown> : {};
  const direct = headerRecord["x-api-key"];
  const directValue = Array.isArray(direct) ? direct[0] : direct;
  if (directValue && isApiKeyFormat(directValue)) return directValue;
  const authorization = headerRecord.authorization;
  const authorizationValue = Array.isArray(authorization) ? authorization[0] : authorization;
  const bearer = authorizationValue?.match(/^Bearer\s+(ai40_live_[A-Za-z0-9_-]+)$/i)?.[1];
  return bearer && isApiKeyFormat(bearer) ? bearer : null;
}

export async function authenticateApiKey(secret: string) {
  if (!isApiKeyFormat(secret)) return null;
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable.");
  const prefix = secret.slice(0, API_KEY_PREFIX.length + 8);
  const rows = await db.select().from(apiKeys).where(and(eq(apiKeys.prefix, prefix), isNull(apiKeys.revokedAt))).limit(1);
  const row = rows[0];
  if (!row || !safeHashEquals(hashApiKey(secret, apiKeyPepper()), row.keyHash)) return null;
  const scopes = parseScopes(row.scopes);
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id));
  return { userId: row.userId, keyId: row.id, scopes };
}
