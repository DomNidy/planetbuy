import { env } from "~/env.mjs";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import {
  clampNumber,
  generateRandomNumberWithStdDev,
  generateRandomPlanetListPrice,
  generateRandomPlanetName,
  getRandomPlanetQuality,
  getRandomPlanetTemperature,
  getRandomPlanetTerrain,
} from "~/utils/utils";
import {
  Planet,
  PlanetQuality,
  PlanetTemperatureRange,
  PlanetTerrain,
} from "@prisma/client";
import { tr } from "date-fns/locale";
import { c } from "vitest/dist/reporters-5f784f42";
import { TRPCClientError } from "@trpc/client";

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
  getPlanetListings: publicProcedure
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
            sortBy: z
              .object({
                property: z.enum([
                  "SURFACE_AREA",
                  "PRICE",
                  "QUALITY",
                  "LIST_DATE",
                ]),
                order: z.enum(["asc", "desc"]),
              })
              .optional(),
            planetTerrain: z.array(z.nativeEnum(PlanetTerrain)).optional(),
            planetQuality: z.array(z.nativeEnum(PlanetQuality)).optional(),
            priceRange: z
              .object({
                minPrice: z
                  .number()
                  .min(env.NEXT_PUBLIC_MIN_LISTING_PRICE)
                  .max(env.NEXT_PUBLIC_MAX_LISTING_PRICE),
                maxPrice: z
                  .number()
                  .min(env.NEXT_PUBLIC_MIN_LISTING_PRICE)
                  .max(env.NEXT_PUBLIC_MAX_LISTING_PRICE),
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
            surfaceAreaRange: z
              .object({
                minSurfaceArea: z
                  .number()
                  .min(env.NEXT_PUBLIC_MIN_SURFACE_AREA)
                  .max(env.NEXT_PUBLIC_MAX_SURFACE_AREA),
                maxSurfaceArea: z
                  .number()
                  .min(env.NEXT_PUBLIC_MIN_SURFACE_AREA)
                  .max(env.NEXT_PUBLIC_MAX_SURFACE_AREA),
              })
              .refine(
                (areas) => {
                  if (areas.minSurfaceArea > areas.maxSurfaceArea) {
                    return false;
                  }
                  return true;
                },
                {
                  message:
                    "Min surface area must be less than the max surface area.",
                },
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
        orderBy: [
          filters && filters?.sortBy?.property === "PRICE"
            ? {
                listPrice: filters?.sortBy?.order,
              }
            : {},

          filters && filters?.sortBy?.property === "QUALITY"
            ? {
                planet: { quality: filters?.sortBy?.order },
              }
            : {},

          filters && filters?.sortBy?.property === "SURFACE_AREA"
            ? {
                planet: { surfaceArea: filters?.sortBy?.order },
              }
            : {},

          filters && filters?.sortBy?.property === "LIST_DATE"
            ? {
                listDate: filters.sortBy.order,
              }
            : {},
        ],
        where: {
          listPrice: {
            gte: filters?.priceRange?.minPrice,
            lte: filters?.priceRange?.maxPrice,
          },
          planet: {
            surfaceArea: {
              gte: filters?.surfaceAreaRange?.minSurfaceArea,
              lte: filters?.surfaceAreaRange?.maxSurfaceArea,
            },
            name: { startsWith: filters?.planetName },
            // Only apply these filters if the associated filter array actually contains elements (properties to filter by)
            ...(filters?.planetQuality && filters?.planetQuality?.length > 0
              ? { quality: { in: filters?.planetQuality } }
              : {}),

            ...(filters?.planetTemperature &&
            filters?.planetTemperature?.length > 0
              ? { temperature: { in: filters?.planetTemperature } }
              : {}),

            ...(filters?.planetTerrain && filters?.planetTerrain?.length > 0
              ? { terrain: { in: filters?.planetTerrain } }
              : {}),
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
              planetImage: { select: { bucketPath: true } },
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
  getPlanetData: publicProcedure
    .input(
      z.object({
        planetId: z.string(),
      }),
    )
    .query(async ({ input: { planetId }, ctx }) => {
      const planetData = await ctx.db.planet.findUnique({
        where: { id: planetId },
        select: {
          id: true,
          discoveryDate: true,
          listing: true,
          name: true,
          owner: true,
          surfaceArea: true,
          quality: true,
          temperature: true,
          terrain: true,
          planetImage: {
            select: { bucketPath: true },
          },
        },
      });

      return planetData;
    }),
  getPlanetDataFromListingId: publicProcedure
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
              planetImage: {
                select: { bucketPath: true },
              },
            },
          },
        },
      });

      return listing;
    }),
  getPlanetTransactionHistory: publicProcedure
    .input(
      z.object({
        planetId: z.string(),
      }),
    )
    .query(async ({ input: { planetId }, ctx }) => {
      const planetTransactions = await ctx.db.planetTransaction.findMany({
        where: { planetId: planetId },
        orderBy: { startDate: "desc" },
      });

      return planetTransactions;
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
          valueStdDev: z
            .number()
            .min(env.NEXT_PUBLIC_MIN_LISTING_PRICE)
            .max(env.NEXT_PUBLIC_MAX_LISTING_PRICE),
          surfaceAreaStdDev: z
            .number()
            .min(env.NEXT_PUBLIC_MIN_SURFACE_AREA)
            .max(env.NEXT_PUBLIC_MAX_SURFACE_AREA),
        }),
        // The mean that the randomly generated planet stats will vary about
        meanPlanetStats: z.object({
          valueMean: z
            .number()
            .min(env.NEXT_PUBLIC_MIN_LISTING_PRICE)
            .max(env.NEXT_PUBLIC_MAX_LISTING_PRICE),
          surfaceAreaMean: z
            .number()
            .min(env.NEXT_PUBLIC_MIN_SURFACE_AREA)
            .max(env.NEXT_PUBLIC_MAX_SURFACE_AREA),
        }),
      }),
    )
    .mutation(
      async ({
        input: { meanPlanetStats, planetsToGenerate, stdDeviationPlanetStats },
        ctx,
      }) => {
        const planets: Planet[] = [];

        const createPlanet = async () => {
          try {
            const temperature = getRandomPlanetTemperature();
            const terrain = getRandomPlanetTerrain();
            const quality = getRandomPlanetQuality(0.7);
            const name = generateRandomPlanetName();
            const surfaceArea = clampNumber(
              Math.round(
                generateRandomNumberWithStdDev(
                  meanPlanetStats.surfaceAreaMean,
                  stdDeviationPlanetStats.surfaceAreaStdDev,
                ),
              ),
              env.NEXT_PUBLIC_MIN_SURFACE_AREA,
              env.NEXT_PUBLIC_MAX_SURFACE_AREA,
            );

            const listPrice = Math.round(
              generateRandomPlanetListPrice(
                quality,
                meanPlanetStats.valueMean,
                stdDeviationPlanetStats.valueStdDev,
              ),
            );

            // Get planet image with the correct temperature and terrain, and least amount of associated planets
            // If generated planet's quality is not phenomenal, look for a common quality image instead
            const planetImage = await ctx.db.planetImage.findFirst({
              where: {
                quality: {
                  equals: quality === "PHENOMENAL" ? "PHENOMENAL" : "COMMON",
                },
                temperature: { equals: temperature },
                terrain: { equals: terrain },
              },
              orderBy: { assosciatedPlanets: { _count: "asc" } },
              select: { id: true },
            });

            // Create the planet
            const createdPlanet = ctx.db.planet.create({
              data: {
                name: name,
                surfaceArea: surfaceArea,
                discoveryDate: new Date(),
                quality: quality,
                temperature: temperature,
                terrain: terrain,
                planetImage: { connect: { id: planetImage!.id } },
                listing: {
                  create: {
                    listPrice: listPrice,
                    listDate: new Date(),
                  },
                },
              },
            });

            return createdPlanet;
          } catch (err) {
            console.log(err);
            throw err;
          }
        };

        const createPlanets = Array.from(
          { length: planetsToGenerate },
          createPlanet,
        );

        await Promise.all(createPlanets).then((createdPlanets) => {
          planets.push(...createdPlanets);
        });

        return planets;
      },
    ),
});
