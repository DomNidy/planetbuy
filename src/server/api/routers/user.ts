import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";

export const userRouter = createTRPCRouter({
  getBalance: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findFirst({
      where: { id: ctx.session.user.id },
      select: { balance: true },
    });
  }),
  checkoutCart: protectedProcedure
    .input(z.object({ listingIDS: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      // Object which maps each planet ID to the list price of the planet
      let cartTotal = 0;

      // Find cart items for user
      // Calculate price of all items
      const requestedPlanet = await ctx.db.user.findUniqueOrThrow({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          cartItems: { include: { listing: { select: { listPrice: true } } } },
        },
      });

      // increment the cart total by the value of all items in the users cart
      requestedPlanet.cartItems.forEach((item) => {
        cartTotal += item.listing.listPrice;
      });

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

      // Decrement users balance by cart total
      // Update the owner of each planet in the cart to be owned by the user
      for (const listingID of input.listingIDS) {
        // Decrement the buyers balance
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { balance: { decrement: cartTotal } },
        });

        // Update the purchased planets owner to reference the user who purchased it
        await ctx.db.listing.update({
          where: { id: listingID },
          data: {
            planet: {
              update: { owner: { connect: { id: ctx.session.user.id } } },
            },
          },
        });

        // Delete the planet listing
        await ctx.db.listing.delete({
          where: { id: listingID },
        });
      }

      return "Successfully purchased items";
    }),
  getCartItems: protectedProcedure.query(async ({ ctx }) => {
    const itemQuery = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
      select: {
        cartItems: {
          select: {
            id: true,
            listing: { select: { listPrice: true, planet: true, id: true } },
          },
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
  removeItemFromCart: protectedProcedure
    .input(z.object({ cartItemId: z.string() }))
    .mutation(async ({ input: { cartItemId }, ctx }) => {
      // Delete the cart item with the cooresponding listingId and userId
      await ctx.db.cartItem.delete({
        where: {
          id: cartItemId,
          AND: { userId: ctx.session.user.id },
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
  createPlanetCard: protectedProcedure
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
