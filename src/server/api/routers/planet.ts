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
        orderBy: [{ discoveryDate: "desc" }],
        select: {
          discoveryDate: true,
          id: true,
          owner: { select: { name: true } },
          surfaceArea: true,
          name: true,
        },
      });
    }),
  getAllPurchasablePlanets: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        cursor: z.object({ id: z.string() }).optional(),
      }),
    )
    .query(async ({ input: { limit = 10, cursor }, ctx }) => {
      const purchasables = await ctx.db.listing.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor.id } : undefined,

        select: {
          listPrice: true,
          planet: {
            select: {
              discoveryDate: true,
              id: true,
              name: true,
              owner: true,
              surfaceArea: true,
              listing: { select: { listDate: true, id: true } },
            },
          },
        },
      });

      return purchasables;
    }),
});
