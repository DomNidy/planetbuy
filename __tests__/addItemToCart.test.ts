import { expect, it, describe, beforeAll } from "vitest";
import { createInnerTRPCContext } from "src/server/api/trpc";
import { appRouter } from "src/server/api/root";
import {
  createTestListings,
  createTestPlanets,
  createTestUser,
  setTestUserBalance,
} from "./utils/planet-utils";
import { env } from "~/env.mjs";
import { db } from "~/server/db";

beforeAll(async () => {
  await db.planet.deleteMany({});
  await db.listing.deleteMany({});
  await db.planetTransaction.deleteMany({});
  await db.transaction.deleteMany({});
  await db.cartItem.deleteMany({});
  await db.user.deleteMany({});
});

describe.only("Add items to cart", () => {
  // This test contents will depend on the configuration of the environment variable NEXT_PUBLIC_ALLOW_GUEST_CHECKOUT
  // If the environment variable is set to true, then the test will check if guest users can add items to cart
  // If the environment variable is set to false, then the test will check if guest users cannot add items to cart
  it(`${
    env.NEXT_PUBLIC_ALLOW_GUEST_CHECKOUT === true ? "Allows" : "Does not allow"
  } guest users to add items to cart`, async () => {
    const guest = await createTestUser({
      email: "testguest@mail.com",
      isGuest: true,
      name: "Test Guest",
    });
    await setTestUserBalance(guest.id, 10000);

    // Create a caller for guest user
    const guestCaller = appRouter.createCaller(
      createInnerTRPCContext({
        session: {
          expires: new Date().toISOString(),
          user: { id: guest.id, isGuest: true, name: "TEST USER", email: "" },
        },
      }),
    );
    const listings = await createTestListings(
      await createTestPlanets(1),
      10000,
    );

    // Ensure listings were created successfully
    expect(listings).toHaveLength(1);

    if (env.NEXT_PUBLIC_ALLOW_GUEST_CHECKOUT === true) {
      await expect(
        guestCaller?.user.addItemToCart({ listingId: listings[0]!.id }),
      ).resolves.toMatchObject({ message: "Successfully added item to cart." });
    } else {
      await expect(
        guestCaller?.user.addItemToCart({ listingId: listings[0]!.id }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        '"You cannot purchase items as a guest."',
      );
    }
  });
});
