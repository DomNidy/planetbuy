import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

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
    .input(z.object({ listingId: z.string() }))
    .mutation(async ({ input: { listingId }, ctx }) => {
      console.log("User obj", JSON.stringify(ctx.session.user));
      try {
        // Find the user id of the person selling this item
        // This is to ensure a user does not attempt to purchase their own item
        const userIdOfSeller = await ctx.db.listing.findUnique({
          where: { id: listingId },
          select: { planet: { select: { ownerId: true } } },
        });

        // Dont allow the user to add a planet they own to their cart
        if (
          userIdOfSeller &&
          userIdOfSeller.planet.ownerId === ctx.session.user.id
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You own this item, you cannot add it to your cart.",
          });
        }

        // Create a cart item, connect it to the user
        try {
          await ctx.db.user.update({
            where: { id: ctx.session.user.id },
            data: {
              cartItems: {
                create: { listing: { connect: { id: listingId } } },
              },
            },
          });
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError) {
            // P2002 is the error code prisma uses for a unique constraint violation
            // https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
            if (err.code === "P2002") {
              throw new TRPCError({
                code: "CONFLICT",
                message:
                  "This item is in your cart already, you cannot add duplicate copies.",
              });
            }
          }
        }
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "An unknown error occured while trying to add this item to your cart, please try again.",
        });
      }
    }),
  // itemId: Is the listing id of the item to remove from the users' cart
  removeItemFromCart: protectedProcedure
    .input(z.object({ listingId: z.string() }))
    .mutation(async ({ input: { listingId }, ctx }) => {
      try {
        // Delete the cart item with the cooresponding listingId and userId
        await ctx.db.cartItem.delete({
          where: {
            userId_listingId: {
              userId: ctx.session.user.id,
              listingId: listingId,
            },
          },
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "An unknown error occured while trying to remove this item from your cart, please try again.",
        });
      }
    }),
  getUserProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.user.findUniqueOrThrow({
        where: { id: input.userId },
        select: {
          name: true,
          planets: {
            orderBy: { quality: "desc" },
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
          image: true,
        },
      });
    }),
});
