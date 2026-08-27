import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { agentMemories, type InsertAgentMemory, InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listAgentMemories(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentMemories).where(eq(agentMemories.userId, userId)).orderBy(desc(agentMemories.updatedAt)).limit(limit);
}

export async function searchAgentMemories(userId: number, query: string, limit = 5) {
  const terms = query.toLocaleLowerCase("ru-RU").split(/\s+/).filter((term) => term.length >= 2).slice(0, 8);
  if (!terms.length) return [];
  const memories = await listAgentMemories(userId, 60);
  return memories
    .filter((memory) => {
      const haystack = `${memory.memoryKey} ${memory.value}`.toLocaleLowerCase("ru-RU");
      return terms.some((term) => haystack.includes(term));
    })
    .slice(0, limit);
}

export async function putAgentMemory(input: Pick<InsertAgentMemory, "userId" | "scope" | "memoryKey" | "value">) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна: явную память пока нельзя сохранить.");
  await db.insert(agentMemories).values(input).onDuplicateKeyUpdate({
    set: { value: input.value, updatedAt: new Date() },
  });
}

export async function deleteAgentMemory(userId: number, memoryId: number) {
  const db = await getDb();
  if (!db) throw new Error("База данных недоступна: явную память пока нельзя удалить.");
  await db.delete(agentMemories).where(and(eq(agentMemories.id, memoryId), eq(agentMemories.userId, userId)));
}
