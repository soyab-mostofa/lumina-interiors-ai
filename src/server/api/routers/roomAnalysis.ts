import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  analyzeRoomImage,
  redesignRoomImage,
  getDesignerChatResponse,
} from "~/server/services/geminiService";

export const roomAnalysisRouter = createTRPCRouter({
  analyze: publicProcedure
    .input(
      z.object({
        base64Image: z.string(),
        contextHint: z.enum(["Residential", "Commercial"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await analyzeRoomImage(input.base64Image, input.contextHint);
    }),

  redesign: publicProcedure
    .input(
      z.object({
        base64Original: z.string(),
        promptDescription: z.string(),
        projectId: z.string().optional(), // For saving to database
        styleId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const resultImage = await redesignRoomImage(
        input.base64Original,
        input.promptDescription
      );

      // Optionally save to database if projectId is provided
      if (input.projectId) {
        await ctx.db.redesign.create({
          data: {
            projectId: input.projectId,
            styleId: input.styleId,
            customPrompt: input.promptDescription,
            resultImage: resultImage,
          },
        });
      }

      return { resultImage };
    }),

  chatRefine: publicProcedure
    .input(
      z.object({
        history: z.array(
          z.object({
            id: z.string(),
            role: z.enum(["user", "ai"]),
            text: z.string(),
            isSystemMessage: z.boolean().optional(),
          })
        ),
        currentImageBase64: z.string(),
        originalImageBase64: z.string(),
        analysis: z
          .object({
            roomType: z.string(),
            architecturalFeatures: z.array(z.string()),
            designIssues: z.array(z.string()),
            decorSuggestions: z.array(z.string()),
            suggestedPrompts: z.array(
              z.object({
                title: z.string(),
                description: z.string(),
                prompt: z.string(),
              })
            ),
          })
          .nullable(),
        userMessage: z.string(),
        roomContext: z.enum(["Residential", "Commercial"]).default("Residential"),
      })
    )
    .mutation(async ({ input }) => {
      return await getDesignerChatResponse(
        input.history,
        input.currentImageBase64,
        input.originalImageBase64,
        input.analysis,
        input.userMessage,
        input.roomContext
      );
    }),

  // Get project history
  getHistory: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.project.findMany({
      include: {
        redesigns: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }),

  // Create a new project
  createProject: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        roomContext: z.enum(["Residential", "Commercial"]),
        originalImage: z.string(),
        analysis: z.any(), // JSON field
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.project.create({
        data: {
          name: input.name,
          description: input.description,
          roomContext: input.roomContext,
          originalImage: input.originalImage,
          analysis: input.analysis,
        },
      });
    }),

  // Get a specific project
  getProject: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.project.findUnique({
        where: { id: input.id },
        include: {
          redesigns: {
            orderBy: { createdAt: "desc" },
          },
          chatHistory: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),

  // Save chat message
  saveChatMessage: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        imagePrompt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.chatMessage.create({
        data: {
          projectId: input.projectId,
          role: input.role,
          content: input.content,
          imagePrompt: input.imagePrompt,
        },
      });
    }),
});
