import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (str) => !str.includes("YOUR_MYSQL_URL_HERE"),
        "You forgot to change the default URL"
      ),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    GITHUB_SECRET: z.string(),
    GITHUB_ID: z.string(),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string() : z.string().url()
    ),
    DISCORD_SECRET: z.string(),
    DISCORD_ID: z.string(),
    MIN_LISTING_PRICE: z.number(),
    MAX_LISTING_PRICE: z.number(),
    MIN_SURFACE_AREA: z.number(),
    MAX_SURFACE_AREA: z.number()
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    GITHUB_ID: process.env.GITHUB_ID,
    DISCORD_ID: process.env.DISCORD_ID,
    DISCORD_SECRET: process.env.DISCORD_SECRET,

    // Store configuration

    // Minimum price an item can be listed for
    MIN_LISTING_PRICE: process.env.MIN_LISTING_PRICE ? parseFloat(process.env.MIN_LISTING_PRICE.replace(/_/g, '')) : 100,
    // Maximum price an item can be listing for
    MAX_LISTING_PRICE: process.env.MAX_LISTING_PRICE ? parseFloat(process.env.MAX_LISTING_PRICE.replace(/_/g, '')) : 100_000_000_000_000,
    // Minimum surface area of a planet
    MIN_SURFACE_AREA: process.env.MIN_SURFACE_AREA ? parseFloat(process.env.MIN_SURFACE_AREA.replace(/_/g, '')) : 1,
    // Maximum surface area of a planet
    MAX_SURFACE_AREA: process.env.MAX_SURFACE_AREA ? parseFloat(process.env.MAX_SURFACE_AREA.replace(/_/g, '')) : 100_000_000_000_000
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
