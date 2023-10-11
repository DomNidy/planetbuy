import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getBalance: protectedProcedure.query(({ ctx }) => {
    return ctx.db.user.findFirst({
      where: { id: ctx.session.user.id },
      select: { balance: true },
    });
  }),
  addPlanetToCart: protectedProcedure
    .input(z.object({ planetID: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const requestedPlanet = await ctx.db.planet.findUnique({
        where: {
          id: input.planetID,
        },
      });

      if (requestedPlanet) {
        console.log(requestedPlanet.id, " found");
      } else {
        throw new Error("Could not find requested planet id");
      }
    }),
});

