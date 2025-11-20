import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { roomAnalysisRouter } from "~/server/api/routers/roomAnalysis";
import { imageGenerationRouter } from "~/server/api/routers/imageGeneration";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  roomAnalysis: roomAnalysisRouter,
  imageGeneration: imageGenerationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
