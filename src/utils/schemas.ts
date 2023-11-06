import { PlanetTemperatureRange, PlanetTerrain } from "@prisma/client";
import { z } from "zod";

export const guestNameSchema = z
  .string()
  .min(5, "Must be at least 5 characters long")
  .max(16, "Guest names cannot exceed 16 characters in length");

export const planetImagePropertiesSchema = z.object({
  planetTemperature: z.nativeEnum(PlanetTemperatureRange),
  planetTerrain: z.nativeEnum(PlanetTerrain),
});
