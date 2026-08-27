import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Server-side API credentials. Raw key material is never stored. */
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  prefix: varchar("prefix", { length: 32 }).notNull().unique(),
  keyHash: varchar("keyHash", { length: 64 }).notNull().unique(),
  scopes: text("scopes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  revokedAt: timestamp("revokedAt"),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/** Explicit, user-owned facts that may be selected by the bounded AI40 runtime. */
export const agentMemories = mysqlTable("agentMemories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scope: varchar("scope", { length: 32 }).notNull(),
  memoryKey: varchar("memoryKey", { length: 120 }).notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("agent_memories_user_scope_key_unique").on(table.userId, table.scope, table.memoryKey),
  index("agent_memories_user_updated_idx").on(table.userId, table.updatedAt),
]);

export type AgentMemory = typeof agentMemories.$inferSelect;
export type InsertAgentMemory = typeof agentMemories.$inferInsert;
