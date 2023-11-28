import { createInnerTRPCContext } from "../trpc";
import { appRouter } from "../root";
import { env } from "~/env.mjs";
import { db } from "~/server/db";

describe("checkoutCart", () => {
  let userId = "";
  let ctx: ReturnType<typeof createInnerTRPCContext> | null = null;
  let caller: ReturnType<typeof appRouter.createCaller> | null = null;

  // Setup phase
  beforeAll(async () => {
    // Delete the user from the database if it exists already
    // This is to prevent the test from failing if it was not cleaned up properly
    await db.user.deleteMany({
      where: {
        id: "TEST_CHECKOUTCART",
      },
    });

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
        console.log("Resolving with ID:", userId);
      });

    console.log("Created test user with ID:", userId);

    // Mock the context object
    ctx = createInnerTRPCContext({
      session: {
        user: { id: userId, isGuest: false, email: "" },
        expires: new Date().toISOString(),
      },
    });

    // Create a caller for the appRouter
    caller = appRouter.createCaller(ctx);
  });

  // Teardown phase
  afterAll(async () => {
    // Delete the user from the database
    await db.user.delete({
      where: {
        id: userId,
      },
    });

    console.log("Deleted test user with ID:", userId);
  });

  it("should throw an error when given an empty cart", async () => {
    // Call the procedure
    await expect(caller?.user.checkoutCart()).rejects
      .toThrowErrorMatchingInlineSnapshot(`
"[
  {
    "code": "too_small",
    "minimum": 1,
    "type": "array",
    "inclusive": true,
    "exact": false,
    "message": "We could not find any items in your cart.",
    "path": [
      "listingIDS"
    ]
  }
]"
`);
  }, 5000);

  it("should throw an error when the maximum cart item count is exceeded", async () => {
    // Create an array of 11 listing IDs
    const listingIDS = Array.from(
      { length: env.NEXT_PUBLIC_MAX_CART_ITEMS },
      (_, i) => `listing${i}`,
    );

    // Call the procedure
    await expect(caller?.user.checkoutCart()).rejects
      .toThrowErrorMatchingInlineSnapshot(`
"[
  {
    "code": "too_big",
    "maximum": 10,
    "type": "array",
    "inclusive": true,
    "exact": false,
    "message": "Please limit transactions to 10 items at a time, thank you!",
    "path": [
      "listingIDS"
    ]
  }
]"
`);
  }, 5000);
});
