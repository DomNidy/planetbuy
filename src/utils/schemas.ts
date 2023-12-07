import {
  PlanetQuality,
  PlanetTemperatureRange,
  PlanetTerrain,
} from "@prisma/client";
import { z } from "zod";
import { env } from "~/env.mjs";

export const guestNameSchema = z
  .string()
  .min(5, "Must be at least 5 characters long")
  .max(16, "Guest names cannot exceed 16 characters in length");

export const planetImagePropertiesSchema = z.object({
  planetTemperature: z.nativeEnum(PlanetTemperatureRange),
  planetTerrain: z.nativeEnum(PlanetTerrain),
  planetQuality: z.nativeEnum(PlanetQuality),
});

export const createPlanetListingSchema = z.object({
  planetId: z.string(),
  listPrice: z.coerce
    .number()
    .min(env.NEXT_PUBLIC_MIN_LISTING_PRICE)
    .max(env.NEXT_PUBLIC_MAX_LISTING_PRICE),
});

export const updatePlanetListingSchema = z.object({
  listingId: z.string(),
  listPrice: z.coerce
    .number()
    .min(
      env.NEXT_PUBLIC_MIN_LISTING_PRICE,
      `Cannot list for less than $${env.NEXT_PUBLIC_MIN_LISTING_PRICE}`,
    )
    .max(
      env.NEXT_PUBLIC_MAX_LISTING_PRICE,
      `Cannot list for more than $${env.NEXT_PUBLIC_MAX_LISTING_PRICE}`,
    ),
});
