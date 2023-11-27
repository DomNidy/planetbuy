import { createInnerTRPCContext } from "../trpc";
import { appRouter } from "../root";

describe("checkoutCart", () => {
  it("should throw an error when given an empty cart", async () => {
    // Mock the context object
    const ctx = createInnerTRPCContext({
      session: {
        user: { id: "a", isGuest: false, email: "a" },
        expires: new Date().toISOString(),
      },
    });

    const caller = appRouter.createCaller(ctx);

    // Call the procedure
    await expect(caller.user.checkoutCart({ listingIDS: [] })).rejects
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
  });

  it("should throw an error when given more than 10 items in the cart", async () => {
    // Mock the context object
    const ctx = createInnerTRPCContext({
      session: {
        user: { id: "a", isGuest: false, email: "a" },
        expires: new Date().toISOString(),
      },
    });

    const caller = appRouter.createCaller(ctx);

    // Create an array of 11 listing IDs
    const listingIDS = Array.from({ length: 11 }, (_, i) => `listing${i}`);

    // Call the procedure
    await expect(caller.user.checkoutCart({ listingIDS })).rejects
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
  });
});
