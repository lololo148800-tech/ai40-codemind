import { z } from "zod";

import { askAssistant } from "./assistant";
import { createAgentRunbook } from "./agent-runbook";
import { importPublicGithubManifest } from "./github-manifest";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

const assistantModeSchema = z.enum(["question", "research", "code", "create"]);
const assistantHistorySchema = z.array(z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4_000),
})).max(10);

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
  }),
  github: router({
    importManifest: publicProcedure.input(z.object({
      repositoryUrl: z.string().trim().url().max(500),
    })).mutation(({ input }) => importPublicGithubManifest(input.repositoryUrl)),
  }),
});

export type AppRouter = typeof appRouter;
