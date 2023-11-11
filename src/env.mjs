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
    CRON_SECRET: z.string().min(44, "Secret is too short"),
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

  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_BUCKET_URL: z.string(),

    //* Store configuration vars
    NEXT_PUBLIC_MIN_LISTING_PRICE: z.number(),
    NEXT_PUBLIC_MAX_LISTING_PRICE: z.number(),
    NEXT_PUBLIC_MIN_SURFACE_AREA: z.number(),
    NEXT_PUBLIC_MAX_SURFACE_AREA: z.number(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    CRON_SECRET: process.env.CRON_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    GITHUB_ID: process.env.GITHUB_ID,
    DISCORD_ID: process.env.DISCORD_ID,
    DISCORD_SECRET: process.env.DISCORD_SECRET,

    // Url to image bucket
    NEXT_PUBLIC_BUCKET_URL: process.env.NEXT_PUBLIC_BUCKET_URL,


    //* Store configuration

    // Minimum price an item can be listed for
    NEXT_PUBLIC_MIN_LISTING_PRICE: process.env.NEXT_PUBLIC_MIN_LISTING_PRICE ? parseFloat(process.env.NEXT_PUBLIC_MIN_LISTING_PRICE.replace(/_/g, '')) : 100,
    // Maximum price an item can be listing for
    NEXT_PUBLIC_MAX_LISTING_PRICE: process.env.NEXT_PUBLIC_MAX_LISTING_PRICE ? parseFloat(process.env.NEXT_PUBLIC_MAX_LISTING_PRICE.replace(/_/g, '')) : 100_000_000_000_000,
    // Minimum surface area of a planet
    NEXT_PUBLIC_MIN_SURFACE_AREA: process.env.NEXT_PUBLIC_MIN_SURFACE_AREA ? parseFloat(process.env.NEXT_PUBLIC_MIN_SURFACE_AREA.replace(/_/g, '')) : 1,
    // Maximum surface area of a planet
    NEXT_PUBLIC_MAX_SURFACE_AREA: process.env.NEXT_PUBLIC_MAX_SURFACE_AREA ? parseFloat(process.env.NEXT_PUBLIC_MAX_SURFACE_AREA.replace(/_/g, '')) : 100_000_000_000_000
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
