import { env } from "~/env.mjs";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import {
  generateRandomNumberWithStdDev,
  generateRandomPlanetName,
} from "~/utils/utils";
import {
  PlanetQuality,
  PlanetTemperatureRange,
  PlanetTerrain,
} from "@prisma/client";
import { list } from "@vercel/blob";

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
        cursor: z.object({ id: z.string() }).nullish(),
        filters: z
          .object({
            planetName: z.string().max(48, "Search string too long").optional(),
            planetTemperature: z
              .array(z.nativeEnum(PlanetTemperatureRange))
              .optional(),
            planetQuality: z.array(z.nativeEnum(PlanetQuality)).optional(),
            priceRange: z
              .object({
                minPrice: z
                  .number()
                  .min(env.MIN_LISTING_PRICE)
                  .max(env.MAX_LISTING_PRICE),
                maxPrice: z
                  .number()
                  .min(env.MIN_LISTING_PRICE)
                  .max(env.MAX_LISTING_PRICE),
              })
              .refine(
                (prices) => {
                  if (prices.minPrice > prices.maxPrice) {
                    return false;
                  }
                  return true;
                },
                { message: "Min price must be less than the max price" },
              )
              .optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ input: { limit = 10, cursor, filters }, ctx }) => {
      const items = await ctx.db.listing.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor.id } : undefined,
        orderBy: { listDate: "desc" },
        where: {
          listPrice: {
            gte: filters?.priceRange?.minPrice,
            lte: filters?.priceRange?.maxPrice,
          },
          planet: {
            quality: { in: filters?.planetQuality },
            temperature: { in: filters?.planetTemperature },
            name: { startsWith: filters?.planetName },
          },
        },
        select: {
          listPrice: true,
          id: true,
          planet: {
            select: {
              discoveryDate: true,
              id: true,
              name: true,
              owner: { select: { id: true } },
              surfaceArea: true,
              quality: true,
              temperature: true,
              terrain: true,
              listing: { select: { listDate: true, id: true } },
              imageURL: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = { id: nextItem!.id };
      }

      return { items, nextCursor };
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
        select: {
          id: true,
          listDate: true,
          listPrice: true,
          planet: {
            select: {
              id: true,
              discoveryDate: true,
              listing: true,
              name: true,
              owner: true,
              quality: true,
              surfaceArea: true,
              temperature: true,
              terrain: true,
              imageURL: true,
            },
          },
        },
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
          // Generate random planet metadata
          const temperatureArray = Object.values(PlanetTemperatureRange);
          const temperature =
            temperatureArray[
              Math.floor(Math.random() * temperatureArray.length)
            ];

          const terrainArray = Object.values(PlanetTerrain);
          const terrain =
            terrainArray[Math.floor(Math.random() * terrainArray.length)];

          // Randomly generated numbers must be greater than qualityProbability in order to increment planet quality
          // Increasing qualityProbability will decrease the probability of higher quality planets being chosen
          const qualityProbability = 0.75;
          const qualityArray = Object.values(PlanetQuality);
          let qualityIdx = 0;
          while (Math.random() > qualityProbability && qualityIdx < 4) {
            qualityIdx += 1;
          }
          const quality = qualityArray[qualityIdx];

          // The path which we should look for blobs (images) in
          let blobPath = `${temperature}/${terrain}`;

          // If we generated a phenomenal planet, we should look for images in the phenomenal folder
          if (quality === "PHENOMENAL") {
            blobPath = `${PlanetQuality.PHENOMENAL}/${temperature}/${terrain}`;
          }

          // Get all images in the blob path
          // These images all match the properties of the planet (temperature and terrain)
          const { blobs } = await list({
            prefix: `${blobPath}`,
          });

          console.log("Returned blobs", blobs);

          await ctx.db.planet.create({
            data: {
              name: generateRandomPlanetName(),
              surfaceArea: Math.round(
                generateRandomNumberWithStdDev(
                  meanPlanetStats.surfaceAreaMean,
                  stdDeviationPlanetStats.surfaceAreaStdDev,
                ),
              ),
              discoveryDate: new Date(),
              quality: quality,
              temperature: temperature,
              terrain: terrain,
              imageURL: blobs[Math.floor(Math.random() * blobs.length)]?.url,
              listing: {
                create: {
                  listPrice: Math.round(
                    generateRandomNumberWithStdDev(
                      meanPlanetStats.valueMean,
                      stdDeviationPlanetStats.valueStdDev,
                    ) *
                      (qualityIdx + 1),
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
