import { expect, it, beforeAll, describe } from "vitest";
import { createInnerTRPCContext } from "src/server/api/trpc";
import { db } from "src/server/db";
import { appRouter } from "src/server/api/root";
import { env } from "~/env.mjs";
import {
  type SellerPlanet,
  clearTestCartItemsForUser,
  clearTestListingsForUser,
  createTestCartItemsForUser,
  createTestListings,
  createTestPlanets,
  createTestUser,
  deleteTestUserPlanets,
  generateTestPlanetData,
  setTestUserBalance,
} from "./utils/planet-utils";
import { randomInt, randomUUID } from "crypto";

let userId = "";
let ctx: ReturnType<typeof createInnerTRPCContext> | null = null;
let caller: ReturnType<typeof appRouter.createCaller> | null = null;

beforeAll(async () => {
  // Ensure we are running in the test environment
  expect(env.NODE_ENV).toBe("test");

  // Delete all relevant data from the database before running the tests
  // This is to prevent the test from failing if it was not cleaned up properly
  await db.planet.deleteMany({});
  await db.listing.deleteMany({});
  await db.planetTransaction.deleteMany({});
  await db.transaction.deleteMany({});
  await db.cartItem.deleteMany({});
  await db.user.deleteMany({});

  // Create a user in the database for this test
  await db.user
    .create({
      data: {
        id: "TEST_CHECKOUTCART",
        email: "testcheckoutcart@mail.com",
        isGuest: false,
        name: "Test Checkoutcart",
      },
      select: {
        id: true,
      },
    })
    .then((res) => {
      userId = res.id;
      console.log("Successfully created test user with ID:", userId);
    });

  ctx = createInnerTRPCContext({
    session: {
      user: {
        id: userId,
        isGuest: false,
        name: "TEST USER",
        email: "TESTUSER@MAIL.COM",
      },
      expires: new Date().toISOString(),
    },
  });

  caller = appRouter.createCaller(ctx);
});

describe("Rejects invalid requests", () => {
  it("Fails upon checkout with empty cart", async () => {
    // Remove all items from the cart to ensure its empty
    await db.cartItem.deleteMany({
      where: {
        userId: userId,
      },
    });

    // Ensure the cart is empty
    await expect(caller?.user.getCartItems()).resolves.toHaveLength(0);

    // Attempt to checkout the cart
    await expect(
      caller?.user.checkoutCart(),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Your cart is empty, please add items to it before checking out."',
    );
  });

  it(`Fails to checkout a cart when user has insufficient balance`, async () => {
    await clearTestCartItemsForUser(userId);
    await setTestUserBalance(userId, 0);

    const planets = await createTestPlanets(1);
    const listings = await createTestListings(
      planets,
      env.NEXT_PUBLIC_MAX_LISTING_PRICE,
    );

    await createTestCartItemsForUser(listings, userId);

    await expect(caller?.user.getCartItems()).resolves.toHaveLength(1);

    await expect(caller?.user.getBalance()).resolves.toMatchInlineSnapshot(`
      {
        "balance": 0,
      }
    `);

    await expect(
      caller?.user.checkoutCart(),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '"Insufficient funds to purchase items in cart. Please add more funds to your account and try again."',
    );
  });

  it(`Rejects transactions containing more than ${env.NEXT_PUBLIC_MAX_CART_ITEMS} items`, async () => {
    await clearTestCartItemsForUser(userId);
    // Create some planets for the listings
    const planets = await createTestPlanets(env.NEXT_PUBLIC_MAX_CART_ITEMS + 1);

    // Create some listings for the planets
    const listings = await createTestListings(
      planets,
      env.NEXT_PUBLIC_MAX_LISTING_PRICE,
    );

    // Add some items to the test user's cart
    await createTestCartItemsForUser(listings, userId);

    // Ensure the cart has the correct number of items
    await expect(caller?.user.getCartItems()).resolves.toHaveLength(
      env.NEXT_PUBLIC_MAX_CART_ITEMS + 1,
    );

    // Attempt to checkout the cart
    await expect(
      caller?.user.checkoutCart(),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Your cart has too many items, please remove some and try again. The maximum amount of items you can have in your cart is ${env.NEXT_PUBLIC_MAX_CART_ITEMS}."`,
    );
  });
});

describe("Adjusts balances properly", () => {
  it("Increments the sellers balance when they sell a planet", async () => {
    await clearTestCartItemsForUser(userId);
    await clearTestListingsForUser(userId);
    await setTestUserBalance(userId, 1000000);

    const planetsToBeSold = 3;
    const pricePerPlanet = env.NEXT_PUBLIC_MIN_LISTING_PRICE;
    const amountToBeIncremented = pricePerPlanet * planetsToBeSold;

    // Create a seller with some planets to sell
    const seller = await createTestUser(
      {
        email: "testincrement@mail.com",
        isGuest: false,
        name: "Test Increment",
      },
      generateTestPlanetData(planetsToBeSold),
    );
    await setTestUserBalance(seller.id, 0);

    // Create listings for the sellers planets
    const listings = await createTestListings(seller.planets, pricePerPlanet);

    // Add the listings to the test users cart
    await createTestCartItemsForUser(listings, userId);

    // Ensure transaction succeeds
    await expect(caller?.user.checkoutCart()).resolves.toMatchObject({
      message: "Successfully purchased items",
      transactionId: expect.any(String) as StringConstructor,
    });

    // Ensure the sellers balance has been incremented by the correct amount
    await expect(
      db.user.findUnique({
        where: { id: seller.id },
        select: { balance: true },
      }),
    ).resolves.toMatchObject({
      balance: amountToBeIncremented,
    });
  });

  it("Deducts the correct amount from the buyers balance upon checkout", async () => {
    // Clear users cart and add balance before running the test
    const initialBalance = randomInt(50000, 1000000);
    await setTestUserBalance(userId, initialBalance);
    await clearTestCartItemsForUser(userId);

    const planets = await createTestPlanets(5);
    const listings = await createTestListings(
      planets,
      env.NEXT_PUBLIC_MIN_LISTING_PRICE,
    );

    await createTestCartItemsForUser(listings, userId);
    const amountToBeDeducted = listings.reduce(
      (acc, listing) => acc + listing.listPrice,
      0,
    );

    await expect(caller?.user.getCartItems()).resolves.toHaveLength(5);

    await expect(caller?.user.checkoutCart()).resolves.toMatchObject({
      message: "Successfully purchased items",
      transactionId: expect.any(String) as StringConstructor,
    });

    await expect(caller?.user.getBalance()).resolves.toMatchInlineSnapshot(`
      {
        "balance": ${initialBalance - amountToBeDeducted},
      }
    `);
  });
});

describe("Successfully performs transactions with valid carts", () => {
  it("Successfully checks out a cart with a single item", async () => {
    await setTestUserBalance(userId, 250000);
    // Clear users cart before running the test
    await clearTestCartItemsForUser(userId);

    // Create some planets for the listings
    const planets = await createTestPlanets(1);

    // Create some listings for the planets

    const listings = await createTestListings(
      planets,
      env.NEXT_PUBLIC_MIN_LISTING_PRICE,
    );

    // Add some items to the test user's cart
    await createTestCartItemsForUser(listings, userId);

    // Ensure the cart has the correct number of items
    await expect(caller?.user.getCartItems()).resolves.toHaveLength(1);

    // Attempt to checkout the cart
    await expect(caller?.user.checkoutCart()).resolves.toMatchObject({
      message: "Successfully purchased items",
      transactionId: expect.any(String) as StringConstructor,
    });
  });

  it(`Successfully checks out a cart with many (${env.NEXT_PUBLIC_MAX_CART_ITEMS}) items`, async () => {
    await clearTestCartItemsForUser(userId);

    const planets = await createTestPlanets(env.NEXT_PUBLIC_MAX_CART_ITEMS);

    const listings = await createTestListings(
      planets,
      env.NEXT_PUBLIC_MIN_LISTING_PRICE,
    );

    await createTestCartItemsForUser(listings, userId);

    await expect(caller?.user.getCartItems()).resolves.toHaveLength(
      env.NEXT_PUBLIC_MAX_CART_ITEMS,
    );

    await expect(caller?.user.checkoutCart()).resolves.toMatchObject({
      message: "Successfully purchased items",
      transactionId: expect.any(String) as StringConstructor,
    });
  });
});

describe("Transfers planet ownership and updates transaction history properly", () => {
  it("Grants the buyer ownership when purchasing a planet from another user", async () => {
    await clearTestCartItemsForUser(userId);
    await setTestUserBalance(userId, 1000000);
    await deleteTestUserPlanets(userId);

    const sellerPlanetData: SellerPlanet[] = [
      {
        id: randomUUID(),
        name: `Seller planet 1 ${randomUUID()}`,
        surfaceArea: env.NEXT_PUBLIC_MIN_SURFACE_AREA,
        planetImageId: "none",
      },
      {
        id: randomUUID(),
        name: `Seller planet 2 ${randomUUID()}`,
        surfaceArea: env.NEXT_PUBLIC_MIN_SURFACE_AREA,
        planetImageId: "none",
      },
    ];
    const seller = await createTestUser(
      { email: "seller@mail.com", isGuest: false, name: "Seller" },
      sellerPlanetData,
    );

    // Create test listings owned by the seller
    const listings = await createTestListings(
      seller.planets,
      env.NEXT_PUBLIC_MIN_LISTING_PRICE,
    );
    // Add the sellers listings to the test users cart
    await createTestCartItemsForUser(listings, userId);

    // Ensure the buyer owns no planets before running the test
    await expect(
      db.planet.count({
        where: { ownerId: userId },
      }),
    ).resolves.toBe(0);

    // Ensure the seller has the correct number of listings
    await expect(
      db.listing.count({
        where: { planet: { ownerId: seller.id } },
      }),
    ).resolves.toBe(2);

    // Ensure the cart has the correct number of items
    await expect(caller?.user.getCartItems()).resolves.toHaveLength(2);

    // Attempt to checkout the cart
    await expect(caller?.user.checkoutCart()).resolves.toMatchObject({
      message: "Successfully purchased items",
      transactionId: expect.any(String) as StringConstructor,
    });

    // Ensure the buyer owns all the planets they purchased
    await expect(
      db.planet.count({
        where: { ownerId: userId, id: { in: seller.planets.map((p) => p.id) } },
      }),
    ).resolves.toBe(2);

    // Ensure the seller owns no planets
    await expect(
      db.planet.count({
        where: { ownerId: seller.id },
      }),
    ).resolves.toBe(0);

    // Ensure the seller has no listings left
    await expect(
      db.listing.count({
        where: { planet: { ownerId: seller.id } },
      }),
    ).resolves.toBe(0);
  });

  it(
    "Updates planet transaction history when purchasing a planet from another user",
    async () => {
      const sellerInitialBalance = 100000;
      const userInitialBalance = 100000;

      await clearTestCartItemsForUser(userId);
      await clearTestListingsForUser(userId);
      await setTestUserBalance(userId, userInitialBalance);
      await deleteTestUserPlanets(userId);

      type SellerPlanet = {
        id: string;
        name: string;
        surfaceArea: number;
        planetImageId: string;
      };

      const sellerPlanetData: SellerPlanet[] = [
        {
          id: randomUUID(),
          name: `PT planet 1 ${randomUUID()}`,
          surfaceArea: env.NEXT_PUBLIC_MIN_SURFACE_AREA,
          planetImageId: "none",
        },
        {
          id: randomUUID(),
          name: `PT planet 2 ${randomUUID()}`,
          surfaceArea: env.NEXT_PUBLIC_MIN_SURFACE_AREA,
          planetImageId: "none",
        },
      ];

      // Create another test user to buy planets from
      const seller = await createTestUser(
        {
          email: "ptseller@mail.com",
          isGuest: false,
          name: "PT Seller",
        },
        sellerPlanetData,
      );
      await setTestUserBalance(seller.id, sellerInitialBalance);

      // Create test listings owned by the seller
      const listings = await createTestListings(
        seller.planets,
        env.NEXT_PUBLIC_MIN_LISTING_PRICE,
      );

      // Calculate the amount to be deducted from the buyer
      const amountToBeDeducted = listings.reduce((acc, listing) => {
        return acc + listing.listPrice;
      }, 0);

      // Ensure the seller has the correct number of listings
      await expect(
        db.listing.count({
          where: { planet: { ownerId: seller.id } },
        }),
      ).resolves.toBe(2);

      // Ensure the created planets have no transaction history
      await expect(
        db.planetTransaction.count({
          where: {
            planetId: { in: seller.planets.map((p) => p.id) },
          },
        }),
      ).resolves.toBe(0);

      // Add the sellers listings to the test users cart
      await createTestCartItemsForUser(listings, userId);

      // Attempt to checkout the cart
      const checkoutResult = await caller?.user.checkoutCart();
      expect(checkoutResult).toMatchObject({
        message: "Successfully purchased items",
        transactionId: expect.any(String) as StringConstructor,
      });

      // Ensure the seller has their balance incremented by the correct amount
      await expect(
        db.user.findUnique({
          where: { id: seller.id },
          select: { balance: true },
        }),
      ).resolves.toMatchObject({
        balance: sellerInitialBalance + amountToBeDeducted,
      });

      const transaction = await db.transaction.findUnique({
        where: { id: checkoutResult?.transactionId },
        select: {
          purchasedItems: true,
          buyerId: true,
          transactionTotal: true,
          id: true,
        },
      });

      // Ensure the Transaction record was created
      expect(transaction).toBeTruthy();
      // Ensure the transaction record has the correct data
      expect(transaction?.buyerId).toBe(userId);
      expect(transaction?.transactionTotal).toBe(amountToBeDeducted);
      // Ensure each planet purchased in this transaction has a PlanetTransaction record
      expect(transaction?.purchasedItems).toHaveLength(sellerPlanetData.length);
      // Ensure all the PlanetTransactions are referring to the correct planets (by ID)
      expect(
        transaction?.purchasedItems.every((item) =>
          sellerPlanetData.find((p) => p.id === item.planetId),
        ),
      ).toBeTruthy();
      // Ensure all of the planet transactions have a start date
      expect(
        transaction?.purchasedItems.every((item) => item.startDate),
      ).toBeTruthy();

      // The user who purchased these planets should now create listings for them
      await Promise.all(
        transaction?.purchasedItems.map(
          (item) =>
            caller?.user.createPlanetListing({
              listPrice: env.NEXT_PUBLIC_MIN_LISTING_PRICE,
              planetId: item.planetId!,
            }),
        ) ?? [],
      );

      const newUserListings = await db.listing.findMany({
        where: { planet: { ownerId: userId } },
      });

      // Ensure the user now has the correct number of listings
      expect(newUserListings).toHaveLength(sellerPlanetData.length);

      // Create a caller for the initial seller (to purchase items from the user)
      const sellerCaller = appRouter.createCaller(
        createInnerTRPCContext({
          session: {
            user: {
              id: seller.id,
              isGuest: false,
              name: "TEST USER",
              email: "",
            },
            expires: Date.now().toString(),
          },
        }),
      );

      // Add the new listings to the sellers cart
      await Promise.all(
        newUserListings.map(
          (listing) =>
            sellerCaller?.user.addItemToCart({ listingId: listing.id }),
        ),
      );

      // Ensure the sellers cart has the correct number of items
      await expect(sellerCaller?.user.getCartItems()).resolves.toHaveLength(
        sellerPlanetData.length,
      );

      // Attempt to checkout the sellers cart
      const secondCheckoutResult = await sellerCaller?.user.checkoutCart();
      expect(secondCheckoutResult).toMatchObject({
        message: "Successfully purchased items",
        transactionId: expect.any(String) as StringConstructor,
      });

      const secondTransaction = await db.transaction.findUniqueOrThrow({
        where: { id: checkoutResult?.transactionId },
        select: {
          purchasedItems: {
            select: {
              planetId: true,
              startDate: true,
              endDate: true,
              id: true,
              transactionId: true,
            },
          },
          buyerId: true,
          transactionTotal: true,
          id: true,
        },
      });

      // Ensure the purchased planets now have two PlanetTransaction records each
      await expect(
        db.planetTransaction.count({
          where: {
            planetId: {
              in: secondTransaction.purchasedItems.map((pt) => pt.planetId!),
            },
          },
        }),
      ).resolves.toBe(sellerPlanetData.length * 2);

      // Ensure all of the transaction start dates are set
      expect(
        secondTransaction.purchasedItems.every((pt) => pt.startDate),
      ).toBeTruthy();

      // Ensure the correct planet transaction had its end date updated
      // All planet transactions for a specific planet id should only have one entry where the end date is null
      // That entry should be the one with the latest start date
      const planetTransactions = await db.planetTransaction
        .findMany({
          where: {
            planetId: { in: seller.planets.map((p) => p.id) },
          },
          select: {
            id: true,
            planetId: true,
            startDate: true,
            endDate: true,
            transactionId: true,
          },
        })
        // Group planet transactions by planet id
        .then((res) => {
          return res.reduce(
            (acc, pt) => {
              if (!acc[pt.planetId!]) {
                acc[pt.planetId!] = [];
              }

              acc[pt.planetId!]!.push(pt);
              return acc;
            },
            {} as Record<string, typeof secondTransaction.purchasedItems>,
          );
        });

      for (const planetId in planetTransactions) {
        const planetTxs = planetTransactions[planetId]!;
        planetTxs.sort(
          (a, b) => a.startDate!.getTime() - b.startDate!.getTime(),
        );

        // Now that the planet transactions are sorted by start date (in descending order),
        // The last entry in each array will be the most recent one, and should have a null end date
        const mostRecentPlanetTx = planetTxs[planetTxs.length - 1]!;

        // The most recent planet transaction should have a null end date
        expect(mostRecentPlanetTx.endDate).toBeNull();

        // Every other entry should have a non-null end date
        expect(
          planetTxs
            .slice(0, planetTxs.length - 1)
            .every((pt) => pt.endDate !== null),
        ).toBeTruthy();
      }
    },
    { timeout: 200000 },
  );
});
