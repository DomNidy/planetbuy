import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { env } from "~/env.mjs";
import { createPlanetListingSchema } from "~/utils/schemas";

export const userRouter = createTRPCRouter({
  getBalance: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findFirst({
      where: { id: ctx.session.user.id },
      select: { balance: true },
    });
  }),

  checkoutCart: protectedProcedure.mutation(async ({ ctx }) => {
    console.log("\n\nStarting checkout mutation\n\n", ctx);
    // Object which maps each planet ID to properties of the planet
    // The key in this map is the listingId
    // This is used so we dont have to send out multiple queries to gather data, we can just get all data we need here
    const planetDataMap: Record<
      string,
      {
        listPrice: number;
        listingId: string;
        planet: {
          id: string;
          name: string;
          ownerId?: string;
          ownerName?: string;
          ownerEmail?: string;
        };
      }
    > = {};
    // Sum of all prices in cart
    let cartTotal = 0;

    // Get all cart items for buyers' cart
    const buyer = await ctx.db.user.findUniqueOrThrow({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        cartItems: {
          include: {
            listing: {
              select: {
                listPrice: true,
                id: true,
                planet: {
                  select: {
                    id: true,
                    name: true,
                    owner: { select: { id: true, name: true, email: true } },
                  },
                },
              },
            },
          },
        },
        balance: true,
        id: true,
        name: true,
        email: true,
      },
    });

    // Calculate price of all items in buyers cart
    buyer.cartItems.forEach((item) => {
      planetDataMap[item.listingId] = {
        listingId: item.listingId,
        listPrice: item.listing.listPrice,
        planet: {
          id: item.listing.planet.id,
          name: item.listing.planet.name,
          ownerEmail: item.listing.planet.owner?.email ?? undefined,
          ownerId: item.listing.planet.owner?.id,
          ownerName: item.listing.planet.owner?.name ?? undefined,
        },
      };
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
        transactionTotal: cartTotal,
      },
      select: { id: true },
    });

    // Store the amount to increment each sellers balance by
    const userIdToIncrementMap: Record<string, number> = {};
    for (const planetData of Object.values(planetDataMap)) {
      if (planetData.planet.ownerId) {
        userIdToIncrementMap[planetData.planet.ownerId] =
          (userIdToIncrementMap[planetData.planet.ownerId] ?? 0) +
          planetData.listPrice;
      }
    }

    console.log("Updating user array:", userIdToIncrementMap);

    // Wrap entire procedure in a transaction to ensure atomicity
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [createPlanetTransactions, findRecentPlanetTransactions] =
      await ctx.db.$transaction([
        // 1. Create planet transaction objects, these should be connected to the
        // planets they are assosciated with, and the current transaction
        ctx.db.planetTransaction.createMany({
          data: Object.values(planetDataMap).map((data) => {
            return {
              snapshotOwnerName:
                data.planet.ownerName ?? data.planet.ownerEmail ?? "unknown",
              snapshotListPrice: data.listPrice,
              snapshotPlanetName: data.planet.name,
              planetId: data.planet.id,
              transactionId: transaction.id,
              buyerId: ctx.session.user.id,
              startDate: new Date(),
            };
          }),
          skipDuplicates: true,
        }),

        // 2. Find the most recent planet transactions(besides the one we created) associated with each planet we are purchasing, and return their ids
        // We will update the "endTime" prop of each of these prior transactions (if they exist).
        // Note: planetTransaction entries can be thought of as storing a planets "transaction history" because of this,
        // we store the start and endtime in this planet transaction to store how long a user owned something for, or who owned a planet at X time
        ctx.db.planetTransaction.findMany({
          where: {
            planetId: {
              in: Object.values(planetDataMap).map(
                (planetData) => planetData.planet.id,
              ),
            },
            endDate: null ?? undefined,
          },
          select: { id: true },
          orderBy: { startDate: "desc" },
          // TODO: The take parameter here seems to not be working as intended
          // TODO: The take parameter was intended to take the first item from each of the returned related planetTransaction sets
          // TODO: However, it is only returning the most recent transaction from the combined result set of all related planet transactions
          take: 1,
        }),

        // 3. Decrement the users balance by the cart total
        ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { balance: { decrement: cartTotal } },
        }),

        // 4. Increment the balance of the sellers for each planet (if the planet had a seller)
        ...Object.entries(userIdToIncrementMap).map(([userId, amount]) => {
          console.log("Incrementing user:", userId, "by", amount);
          return ctx.db.user.update({
            where: { id: userId },
            data: { balance: { increment: amount } },
          });
        }),

        // 5. Set the owner field of each purchased planet to the user who just bought them
        ctx.db.planet.updateMany({
          where: {
            id: {
              in: Object.values(planetDataMap).map(
                (planetData) => planetData.planet.id,
              ),
            },
          },
          data: { ownerId: ctx.session.user.id },
        }),

        // 6. Delete planet listings for the planets we purchased
        ctx.db.listing.deleteMany({
          where: {
            id: {
              in: Object.values(planetDataMap).map((pd) => pd.listingId),
            },
          },
        }),
      ]);

    // TODO: PROBLEM: This code updates the endDate of planetTransaction records that we just created through the checkout procedure
    // TODO: This is incorrect behavior, we should only be updating the endDate of records that did not previously exist
    // TODO: This is likely due to the findRecentPlanetTransactions query returning incorrect records, (review that query)
    // If we found planetTransactions that need updated
    if (findRecentPlanetTransactions.length > 0) {
      // Update the endTime prop of each previously existing planetTransaction to the current time
      await ctx.db.planetTransaction.updateMany({
        where: {
          id: { in: findRecentPlanetTransactions.map((tx) => tx.id) },
        },
        data: {
          endDate: new Date(),
        },
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

  // Return planets owned by the user who requested the endpoint (support pagination with this)
  getUsersPlanets: protectedProcedure
    .input(
      z.object({
        cursor: z.object({ planetId: z.string() }).nullish(),
        limit: z.number().min(1, "Cannot return less than 1 result").optional(),
        returnPlanetsWithListings: z.boolean().optional().default(true),
      }),
    )
    .query(
      async ({
        input: { cursor, limit = 10, returnPlanetsWithListings },
        ctx,
      }) => {
        const items = await ctx.db.planet.findMany({
          where: {
            ownerId: ctx.session.user.id,
            ...(!returnPlanetsWithListings
              ? {
                  listing: null,
                }
              : {}),
          },
          cursor: cursor ? { id: cursor.planetId } : undefined,
          take: limit,
          include: { planetImage: true, listing: true, owner: true },
        });

        let nextCursor: typeof cursor | undefined = undefined;
        if (items.length === limit) {
          const nextItem = items.pop();
          nextCursor = { planetId: nextItem!.id };
        }
        return { items, nextCursor };
      },
    ),

  // Return a users listings (specified by the user id) the endpoint (support pagination with this)
  // * getUsersListings: publicProcedure.query(async ({ctx, input}) => {})

  // Return transaction history of the user who requested the endpoint (support pagination with this)
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1, "Cannot fetch less than 1 item").optional(),
        cursor: z
          .object({
            transactionId: z.string(),
          })
          .nullish(),
      }),
    )
    .query(async ({ input: { cursor, limit = 10 }, ctx }) => {
      return await ctx.db.transaction.findMany({
        where: { buyerId: ctx.session.user.id },
        take: limit,
        orderBy: { timestamp: "desc" },
        // Using a cursor over composite index
        cursor: cursor
          ? {
              id_buyerId: {
                id: ctx.session.user.id,
                buyerId: cursor.transactionId,
              },
            }
          : undefined,
        select: {
          transactionTotal: true,
          timestamp: true,
          id: true,
          purchasedItems: {
            select: {
              snapshotPlanetName: true,
              snapshotOwnerName: true,
              snapshotListPrice: true,
            },
          },
        },
      });
    }),

  // Create a planet listing for a user (this user must own the planet)
  createPlanetListing: protectedProcedure
    .input(createPlanetListingSchema)
    .mutation(async ({ ctx, input }) => {
      // Lookup the planet via planetId and sure the owner is the same as the user who requested the endpoint
      const planet = await ctx.db.planet.findUnique({
        where: {
          id: input.planetId,
          ownerId: ctx.session.user.id,
        },
        select: { id: true, listing: true },
      });

      if (!planet) {
        throw new TRPCError({
          code: "NOT_FOUND",
          cause: "User does not own a planet with the requested planet id",
          message: "This planet does not belong to you, or does not exist.",
        });
      }

      if (planet.listing) {
        throw new TRPCError({
          code: "CONFLICT",
          cause: "User already has a listing for this planet",
          message: "You already have a listing for this planet.",
        });
      }

      // Create the listing for the planet
      const newListing = await ctx.db.listing.create({
        data: {
          listPrice: input.listPrice,
          listDate: new Date(),
          planetId: planet.id,
        },
        select: { id: true },
      });

      return newListing;
    }),

  // Update a planet listing for a user (this user must own the planet the listing is associated with, and the user ids must match)
  // * updatePlanetListing: protectedProcedure.mutation(async ({ctx, input}) => {})

  // Delete a planet listing for a user (this user must own the planet the listing is asssociated with, and the user ids must match)
  // * deletePlanetListing: protectedProcedure.mutation(async ({ctx, input}) => {})

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
