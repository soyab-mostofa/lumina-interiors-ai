import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateNewImage } from "~/server/services/geminiService";

export const imageGenerationRouter = createTRPCRouter({
  createNew: publicProcedure
    .input(
      z.object({
        prompt: z.string().min(1, "Prompt cannot be empty"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const resultImage = await generateNewImage(input.prompt);

      // Save to database
      const generation = await ctx.db.generation.create({
        data: {
          prompt: input.prompt,
          resultImage: resultImage,
        },
      });

      return { resultImage, id: generation.id };
    }),

  // Get generation history
  getHistory: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.generation.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }),

  // Get a specific generation
  getGeneration: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.generation.findUnique({
        where: { id: input.id },
      });
    }),
});
