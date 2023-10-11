/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";

export const planetRouter = createTRPCRouter({
  getAllPlanets: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        cursor: z.object({ id: z.string(), createdAt: z.date() }).optional(),
      }),
    )
    .query(async ({ input: { limit = 10, cursor }, ctx }) => {
      return await ctx.db.planet.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor.id } : undefined,
        orderBy: [{ postedDate: "desc" }],
        select: {
          discoveryDate: true,
          listPrice: true,
          postedDate: true,
          User: {
            select: {
              name: true,
            },
          },
          surfaceArea: true,
          name: true,
        },
      });
    }),
  createPlanetListing: publicProcedure
    .input(
      z.object({
        name: z.string(),
        listPrice: z.number().min(100),
        surfaceArea: z.number().min(100),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return ctx.db.planet.create({
        data: {
          ...input,
        },
      });
    }),
});
