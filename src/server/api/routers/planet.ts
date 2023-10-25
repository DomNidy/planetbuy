import { env } from "~/env.mjs";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { generateRandomNumberWithStdDev } from "~/utils/utils";

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
              quality: true,
              temperature: true,
              terrain: true,
              listing: { select: { listDate: true, id: true } },
            },
          },
        },
      });

      return purchasables;
    }),
  getPlanetFromListingId: publicProcedure
    .input(
      z.object({
        listingId: z.string(),
      }),
    )
    .query(async ({ input: { listingId }, ctx }) => {
      const listing = await ctx.db.listing.findUnique({
        where: { id: listingId },
        include: { planet: true },
      });

      return listing;
    }),
  generateRandomPlanets: publicProcedure
    .input(
      z.object({
        planetsToGenerate: z
          .number()
          .min(1, "Must generate at least 1 planet")
          .max(100, "Cannot generate more than 100 planets at a time"),
        // The std deviation that the randomly generated planets stats will conform to
        // If the user provides parameters which produce results that exceed the maximum value for a field
        // (ex: std dev of 10000 for value produces a planet value of 234_000_000_000_000, which exceeds value cap)
        // The stats of this planet will be scaled down accordingly
        stdDeviationPlanetStats: z.object({
          valueStdDev: z.number().min(0).max(env.MAX_LISTING_PRICE),
          surfaceAreaStdDev: z.number().min(0).max(env.MAX_SURFACE_AREA),
        }),
        // The mean that the randomly generated planet stats will vary about
        meanPlanetStats: z.object({
          valueMean: z
            .number()
            .min(env.MIN_LISTING_PRICE)
            .max(env.MAX_LISTING_PRICE),
          surfaceAreaMean: z
            .number()
            .min(env.MIN_SURFACE_AREA)
            .max(env.MAX_SURFACE_AREA),
        }),
      }),
    )
    .mutation(
      async ({
        input: { meanPlanetStats, planetsToGenerate, stdDeviationPlanetStats },
        ctx,
      }) => {
        // Randomly generate planet data and create listings for them
        for (let i = 0; i < planetsToGenerate; i++) {
          await ctx.db.planet.create({
            data: {
              name: `A Planet ${i}`,
              surfaceArea: Math.round(
                generateRandomNumberWithStdDev(
                  meanPlanetStats.surfaceAreaMean,
                  stdDeviationPlanetStats.surfaceAreaStdDev,
                ),
              ),
              discoveryDate: new Date(),
              quality: "UNIQUE",
              temperature: "TEMPERATE",
              terrain: "FORESTS",
              listing: {
                create: {
                  listPrice: Math.round(
                    generateRandomNumberWithStdDev(
                      meanPlanetStats.valueMean,
                      stdDeviationPlanetStats.valueStdDev,
                    ),
                  ),
                  listDate: new Date(),
                },
              },
            },
          });
        }
      },
    ),
});
