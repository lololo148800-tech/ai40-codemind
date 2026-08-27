import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createSlidingWindowLimiter, requestIdentity } from "./analysis-guard";
import { AI40_API_KEY_SCOPES, API_KEY_SCOPE, authenticateApiKey, extractApiKey, issueApiKey, listApiKeys, revokeApiKey } from "./api-keys";
import { askAssistant } from "./assistant";
import { createAgentRunbook } from "./agent-runbook";
import { AGENT_OUTPUT_FORMATS, runBoundedAgent } from "./agent-runtime";
import * as db from "./db";
import { importPublicGithubManifest } from "./github-manifest";
import { IMPORTED_ARCHIVES, IMPORTED_PROFILE_REFERENCE, PANEL_ROLE_DEFINITIONS, runMultiAgentPanel } from "./multi-agent";
import { resolveAI40InferenceRuntime } from "./_core/llm";
import { getTelegramIntegrationStatus } from "./telegram-ready";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const assistantModeSchema = z.enum(["question", "research", "code", "create"]);
const assistantHistorySchema = z.array(z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4_000),
})).max(10);
const agentIntentSchema = z.enum(["code_review", "bug_hunt", "architecture", "test_plan", "apk_plan"]);
const multiAgentLimiter = createSlidingWindowLimiter({ maxRequests: 3, windowMs: 60_000 });

async function resolveAgentPrincipal(input: { userId?: number; headers: unknown }) {
  if (input.userId) return { userId: input.userId, limiterKey: `session:${input.userId}` };
  const rawKey = extractApiKey(input.headers);
  if (!rawKey) throw new TRPCError({ code: "UNAUTHORIZED", message: "Нужен проектный сеанс или API-ключ AI40." });
  const principal = await authenticateApiKey(rawKey);
  if (!principal || !principal.scopes.includes(API_KEY_SCOPE)) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "API-ключ недействителен, отозван или не имеет scope agent:run." });
  }
  return { userId: principal.userId, limiterKey: `key:${principal.keyId}` };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  apiKeys: router({
    list: protectedProcedure.query(({ ctx }) => listApiKeys(ctx.user.id)),
    issue: protectedProcedure.input(z.object({
      name: z.string().trim().min(2).max(80),
      scopes: z.array(z.enum(AI40_API_KEY_SCOPES)).min(1).max(AI40_API_KEY_SCOPES.length).optional(),
    })).mutation(({ ctx, input }) => issueApiKey({ userId: ctx.user.id, name: input.name, scopes: input.scopes })),
    supportedScopes: protectedProcedure.query(() => AI40_API_KEY_SCOPES),
    revoke: protectedProcedure.input(z.object({
      keyId: z.number().int().positive(),
    })).mutation(({ ctx, input }) => revokeApiKey({ userId: ctx.user.id, keyId: input.keyId })),
  }),
  agentRuntime: router({
    memory: protectedProcedure.query(({ ctx }) => db.listAgentMemories(ctx.user.id)),
    saveMemory: protectedProcedure.input(z.object({
      scope: z.enum(["personal", "project"]).default("project"),
      key: z.string().trim().min(2).max(120),
      value: z.string().trim().min(2).max(2_000),
    })).mutation(async ({ ctx, input }) => {
      await db.putAgentMemory({ userId: ctx.user.id, scope: input.scope, memoryKey: input.key, value: input.value });
      return { ok: true };
    }),
    deleteMemory: protectedProcedure.input(z.object({ memoryId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await db.deleteAgentMemory(ctx.user.id, input.memoryId);
      return { ok: true };
    }),
    run: protectedProcedure.input(z.object({
      goal: z.string().trim().min(3).max(6_000),
      context: z.string().trim().max(12_000).optional(),
      outputFormat: z.enum(AGENT_OUTPUT_FORMATS).optional(),
    })).mutation(({ ctx, input }) => runBoundedAgent({ userId: ctx.user.id, ...input })),
  }),
  infrastructure: router({
    status: protectedProcedure.query(() => {
      const inference = resolveAI40InferenceRuntime();
      return {
        inference: { mode: inference.mode, requiresClientProviderKey: false },
        telegram: getTelegramIntegrationStatus(),
      };
    }),
  }),
  assistant: router({
    chat: publicProcedure.input(z.object({
      mode: assistantModeSchema,
      message: z.string().trim().min(1).max(6_000),
      history: assistantHistorySchema.optional(),
      context: z.string().max(12_000).optional(),
    })).mutation(({ input }) => askAssistant(input)),
  }),
  agent: router({
    createRunbook: publicProcedure.input(z.object({
      goal: z.string().trim().min(3).max(12_000),
    })).mutation(({ input }) => ({ runbook: createAgentRunbook(input.goal) })),
    runPanel: publicProcedure.input(z.object({
      goal: z.string().trim().min(3).max(6_000),
      intent: agentIntentSchema,
      context: z.string().max(12_000).optional(),
    })).mutation(async ({ input, ctx }) => {
      const identity = await resolveAgentPrincipal({ userId: ctx.user?.id, headers: ctx.req.headers });
      const budget = multiAgentLimiter.consume(identity.limiterKey || requestIdentity(ctx.req.headers));
      if (!budget.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Панель из 10 ролей временно ограничена. Повторите через ${budget.retryAfterSeconds} с.`,
        });
      }
      return runMultiAgentPanel(input);
    }),
    capabilities: publicProcedure.query(() => ({
      importedReference: IMPORTED_PROFILE_REFERENCE,
      importedArchives: IMPORTED_ARCHIVES,
      roles: PANEL_ROLE_DEFINITIONS.map(({ id, title, focus }) => ({ id, title, focus })),
      execution: "analysis_only" as const,
    })),
  }),
  github: router({
    importManifest: publicProcedure.input(z.object({
      repositoryUrl: z.string().trim().url().max(500),
    })).mutation(({ input }) => importPublicGithubManifest(input.repositoryUrl)),
  }),
});

export type AppRouter = typeof appRouter;
