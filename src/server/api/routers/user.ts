/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getBalance: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findFirst({
      where: { id: ctx.session.user.id },
      select: { balance: true },
    });
  }),
  checkoutCart: protectedProcedure
    .input(z.object({ planetIDS: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      // Object which maps each planet ID to the list price of the planet
      const listPriceMap: Record<string, number> = {};
      let cartTotal = 0;

      // Find the purchasable item which cooresponds to the planet id
      // Calculate price of all items
      for (const planetID of input.planetIDS) {
        const requestedPlanet = await ctx.db.cartItem.findUniqueOrThrow({
          where: {
            listingId: planetID,
            userId: ctx.session.user.id,
          },
          select: { listing: { select: { listPrice: true } } },
        });

        cartTotal += requestedPlanet.listing.listPrice;
        listPriceMap[planetID] = requestedPlanet.listing.listPrice;
      }

      // Get the user in order to check their balance
      const user = await ctx.db.user.findUnique({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          balance: true,
          id: true,
        },
      });

      // If the user has insufficient balance to purchase items return
      if (user?.balance && user.balance < cartTotal) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          cause: "Insufficient balance",
          message: "Your balance is too low to purchase these items!",
        });
      }

      // If the user attempts to purchase a planet owned by them already, throw an error

      // Decrement users balance by cart total

      // Update the owner of each planet in the cart to be owned by the user
      for (const planetID of input.planetIDS) {
        // Update the owner of the purchased planet to the user who bought it
        await ctx.db.planet.update({
          where: { id: planetID },
          data: { ownerId: user?.id },
        });

        // Decrement the buyers balance
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { balance: { decrement: listPriceMap[planetID] } },
        });
      }

      return "Successfully purchased items";
    }),
  getCartItems: protectedProcedure.query(async ({ ctx }) => {
    const itemQuery = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
      select: {
        cartItems: {
          select: { listing: { select: { listPrice: true, planet: true } } },
        },
      },
    });

    return itemQuery.cartItems;
  }),

  addItemToCart: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ input: { itemId }, ctx }) => {
      // Find the user id of the person selling this item
      // This is to ensure a user does not attempt to purchase their own item
      const userIdOfSeller = await ctx.db.listing.findUnique({
        where: { id: itemId },
        select: { planet: { select: { ownerId: true } } },
      });

      // Dont allow the user to add a planet they own to their cart
      if (
        userIdOfSeller &&
        userIdOfSeller.planet.ownerId === ctx.session.user.id
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot add an item you own to your own cart!",
        });
      }

      // Create a cart item, connect it to the user
      return await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          cartItems: { create: { listing: { connect: { id: itemId } } } },
        },
      });
    }),
  getUserProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.user.findUniqueOrThrow({
        where: { id: input.userId },
        select: { name: true, planets: true, image: true },
      });
    }),
  createPlanetListing: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(3, "Planet name must be at least 3 characters long")
          .max(48, "Planet name cannot exceed 48 characters"),
        listPrice: z.coerce
          .number()
          .min(100, "Listing price must be at least 100")
          .max(
            100_000_000_000_000,
            "Listing price cannot exceed 100,000,000,000,000",
          ),
        surfaceArea: z.coerce
          .number()
          .min(1, "Surface must be greater than 1 square km.")
          .max(
            100_000_000_000_000,
            "Maximum surface area size cannot exceed 100,000,000,000,000 square km.",
          ),
        discoveryDate: z.coerce.date().refine(
          (date) => {
            // If the discovery date is in the future, fail
            // (We are adding 100 seconds to the time here because we use the same schema on the serverside,
            //  and if we submit a request on the client, it might take a few extra seconds to process, causing the client
            //  side validation to succeeed, but the server side one to fail as there is latency which might cause
            //  the input date to be interpreted as being in the future, however at the time of submission it was not)
            if (Date.now() + 100000 < date.getTime()) {
              return false;
            }
            return true;
          },
          { message: "Date must not be in the future." },
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Create the planet object from input data
      const planet = await ctx.db.planet.create({
        data: {
          name: input.name,
          surfaceArea: input.surfaceArea,
          discoveryDate: input.discoveryDate,
          // Connect this planet to the owner
          owner: {
            connect: { id: ctx.session.user.id },
          },
        },
      });

      await ctx.db.listing.create({
        data: {
          planet: { connect: { id: planet.id } },
          listPrice: input.listPrice,
        },
      });
    }),
});
