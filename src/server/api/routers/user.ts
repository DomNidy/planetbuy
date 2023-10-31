import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
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
      console.log("\n\nRemove item:");
      console.log("User obj", JSON.stringify(ctx.session.user));
      console.log("Listing id", listingId);
      console.log("\n\n");
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
