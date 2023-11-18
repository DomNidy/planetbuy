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
      // The key in this map is the listingId
      const priceMap: Record<string, number> = {};

      // Sum of all prices in cart
      let cartTotal = 0;

      // Get all cart items for buyers' cart
      const buyer = await ctx.db.user.findUniqueOrThrow({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          cartItems: {
            include: { listing: { select: { listPrice: true } } },
          },
          balance: true,
          id: true,
          name: true,
          email: true,
        },
      });

      // Calculate price of all items in buyers cart
      buyer.cartItems.forEach((item) => {
        priceMap[item.listingId] = item.listing.listPrice;
        cartTotal += item.listing.listPrice;
      });

      // If the buyer has insufficient balance to purchase items return
      if (buyer.balance < cartTotal) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          cause: "Insufficient balance",
          message: "Your balance is too low to purchase these items!",
        });
      }

      // Create transaction entry
      const transaction = await ctx.db.transaction.create({
        data: {
          buyer: { connect: { id: buyer.id } },
          transactionTotal: 0,
        },
        select: { id: true },
      });

      // TODO: THIS PROCEDURE TAKES TOO LONG TO EXECUTE
      // TODO: LOOK INTO WAYS TO PERFORM OPERATIONS MORE EFFICIENTLY
      // Wrap entire procedure in a transaction to ensure atomicity
      return await ctx.db.$transaction(async () => {
        // Decrement buyers balance by each item in the cart
        // Update the owner of each planet in the cart to be owned by the user
        for (const listingID of input.listingIDS) {
          // Ensure that the listingID is present in the pricemap, and that it is defined
          if (!(listingID in priceMap) || !priceMap[listingID]) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              cause: `listingID '${listingID}' was not found in priceMap`,
              message: "Internal server error occured, please try again",
            });
          }

          // non null assertion here as we are certain priceMap[listingID] is defined (due to previous check)
          const planetPrice: number = priceMap[listingID]!;

          // Get the id of the planet we are currently transacting
          const currentPlanet = await ctx.db.listing.findUniqueOrThrow({
            where: { id: listingID },

            select: {
              planet: {
                select: {
                  owner: { select: { id: true, name: true, email: true } },
                  id: true,
                  name: true,
                },
              },
            },
          });

          // If there already exists a planetTransaction record connected related to Planet that we are purchasing
          // We should update that record (which should be the most recent transaction) and set the endDate property in it to current time
          // This represents that the user we are purchasing the planet from stopped owning the planet at this time
          // Find all planet transactions related to current planet
          const planetPriorTransaction =
            await ctx.db.planetTransaction.findFirst({
              where: { planetId: currentPlanet.planet.id },
              select: { id: true },
              orderBy: { startDate: "desc" },
              take: 1,
            });

          // TODO: This code is not working as expected, it is failing to run entirely
          console.log("Prior", planetPriorTransaction);

          // TODO: Test that this correctly updates the end time for the previous PlanetTransaction associated with this planet
          // If we found a prior transaction for the current planet, update its end date
          if (planetPriorTransaction?.id) {
            console.log(
              `Retrieved planet prior transaction`,
              planetPriorTransaction,
              "Attempting to update its end date",
            );

            // Update the end date of the planetPriorTransaction
            await ctx.db.planetTransaction.update({
              where: { id: planetPriorTransaction.id },
              data: {
                endDate: new Date(),
              },
            });
          }

          console.log(
            "Creating new planet transaction with",
            currentPlanet.planet.id,
            transaction.id,
          );

          console.log("\n\n===\nStarting transaction");
          await ctx.db.$transaction([
            // Create new PlanetTransaction
            ctx.db.planetTransaction.create({
              data: {
                snapshotOwnerName:
                  currentPlanet.planet.owner?.name ??
                  currentPlanet.planet.owner?.email ??
                  "unknown",
                snapshotListPrice: planetPrice,
                snapshotPlanetName: currentPlanet.planet.name,
                planet: { connect: { id: currentPlanet.planet.id } },
                transaction: { connect: { id: transaction.id } },
                startDate: new Date(),
              },
            }),

            // Decrement the buyers balance
            ctx.db.user.update({
              where: { id: ctx.session.user.id },
              data: { balance: { decrement: planetPrice } },
            }),

            // Update the purchased planets owner to reference the user who purchased it
            ctx.db.listing.update({
              where: { id: listingID },
              data: {
                planet: {
                  update: {
                    owner: { connect: { id: ctx.session.user.id } },
                  },
                },
              },
            }),

            // Create and or update Transaction to include this PlanetTransaction
            ctx.db.transaction.update({
              where: {
                id: transaction.id,
              },
              data: {
                // If we must create a transaction object, set transaction total equal to the value of this item
                // (It will be incremented by the remaining items in this loop- if there are any)
                transactionTotal: { increment: planetPrice },
              },
            }),

            // Delete the planet listing
            ctx.db.listing.delete({
              where: { id: listingID },
            }),
          ]);
        }

        return "Successfully purchased items";
      });
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
