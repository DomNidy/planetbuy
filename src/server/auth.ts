import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { env } from "~/env.mjs";
import { db } from "~/server/db";
import { log } from "console";
import { randomUUID } from "crypto";
import { guestNameSchema } from "~/utils/schemas";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      isGuest: boolean;
      // ...other properties
      // role: UserRole;
    };
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: async ({ session, token, user, newSession, trigger }) => {
      console.log("-- Session callback --");
      console.log("session", session);
      console.log("token", token);
      console.log("user", user);
      console.log("new session", newSession);
      console.log("trigger", trigger);

      // Lookup if the user is a guest
      // If the user is a guest, add it to their session
      const userData = await db.user.findUnique({
        where: { id: token.sub },
        select: { isGuest: true },
      });

      const isUserGuest = !!userData?.isGuest;

      return {
        user: {
          id: token.sub,
          email: token.email,
          name: token.name,
          isGuest: isUserGuest,
        },
        expires: session.expires,
      };
    },
    signIn(params) {
      console.log("\n-- Sign in callback --");
      console.log("params", params);
      return true;
    },
    jwt(params) {
      console.log("\n-- JWT callback--");
      console.log("params", params);
      return params.token;
    },
  },
  session: {
    strategy: "jwt",
    generateSessionToken() {
      return randomUUID();
    },
  },
  adapter: PrismaAdapter(db),
  logger: {
    error(code, metadata) {
      log(code, metadata);
    },
    warn(code) {
      log(code);
    },
    debug(code, metadata) {
      log(code, metadata);
    },
  },
  pages: {signIn: '/auth/signin'},

  providers: [
    GitHubProvider({
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
      authorization: {
        params: {
          redirect_uri:
            env.NODE_ENV === "development"
              ? "http://localhost:3000/api/auth/callback/github"
              : "https://planetbuy.vercel.app/api/auth/callback/github",
        },
      },
    }),
    DiscordProvider({
      clientId: env.DISCORD_ID,
      clientSecret: env.DISCORD_SECRET,
      authorization: {
        params: {
          redirect_uri:
            env.NODE_ENV === "development"
              ? "http://localhost:3000/api/auth/callback/discord"
              : "https://planetbuy.vercel.app/api/auth/callback/discord",
        },
      },
    }),

    CredentialsProvider({
      name: "Guest Account",
      type: "credentials",
      credentials: {
        guestName: {
          label: "Guest name",
          placeholder: "johndoe",
          type: "text",
        },
      },
      // This callback is only triggered for the credentials provider
      async authorize(credentials, req) {
        console.log("\n-- AUTHORIZE CALLBACK --");
        const guestName = await guestNameSchema.parseAsync(
          credentials?.guestName,
        );

        // Find the user in the database
        const user = await db.user.findUnique({
          where: { name: guestName, email: guestName, isGuest: true },
          select: {
            id: true,
            email: true,
            image: true,
            name: true,
            isGuest: true,
          },
        });

        // If we could not find a matching guest user, create one
        if (!user) {
          const newGuest = await db.user.create({
            data: {
              name: guestName,
              email: guestName,
              balance: 125000,
              isGuest: true,
            },
            select: {
              name: true,
              email: true,
              id: true,
            },
          });

          // Return the newly created user data
          return newGuest;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),

    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
