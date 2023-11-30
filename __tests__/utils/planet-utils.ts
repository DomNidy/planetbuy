import { type Listing, type User, type Planet } from "@prisma/client";
import { randomInt, randomUUID } from "crypto";
import { db } from "~/server/db";

/**
 * Returns an array of data which can be passed to prisma to seed the database with fake test planets
 * @param {any} count: The amount of planet data objects to this method will return
 * @returns {any}
 */
export function generateTestPlanetData(
  count: number,
): Omit<Planet, "ownerId">[] {
  const planets: Omit<Planet, "ownerId">[] = [];

  for (let i = 0; i < count; i++) {
    planets.push({
      name: `Test Planet ${i} ${randomUUID()}`,
      discoveryDate: new Date(),
      surfaceArea: randomInt(1000, 100000),
      planetImageId: "test planet, no image",
      quality: "COMMON",
      temperature: "COLD",
      terrain: "DESERTS",
      id: randomUUID(),
    });
  }

  return planets;
}

export type SellerPlanet = {
  id: string;
  name: string;
  surfaceArea: number;
  planetImageId: string;
};

// Helper function to set a users balance
export async function setTestUserBalance(userId: string, balance: number) {
  await db.user.update({
    where: {
      id: userId,
    },
    data: {
      balance: balance,
    },
  });
}

// Helper function to create a test user
export async function createTestUser(
  userData: Pick<User, "name" | "email" | "isGuest">,
  planetData?: SellerPlanet[],
) {
  return await db.user.create({
    data: {
      ...userData,
      ...(planetData && { planets: { createMany: { data: planetData } } }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      isGuest: true,
      planets: true,
    },
  });
}

// Helper function to delete all planets associated with a user
export async function deleteTestUserPlanets(userId: string) {
  await db.planet.deleteMany({
    where: {
      ownerId: userId,
    },
  });
}

// Helper function to generate and create planets
export async function createTestPlanets(
  count: number,
): Promise<Omit<Planet, "ownerId">[]> {
  const planetData = generateTestPlanetData(count);
  await db.planet.createMany({ data: planetData });
  return planetData;
}

// Helper function to generate and create listings
export async function createTestListings(
  planetData: Omit<Planet, "ownerId">[],
  listPrice: number,
) {
  const listings = await Promise.all(
    planetData.map((planet) =>
      db.listing.create({
        data: {
          listPrice: listPrice,
          planetId: planet.id,
        },
      }),
    ),
  );
  return listings;
}

// Helper function to generate and create cart items
export async function createTestCartItemsForUser(
  listings: Listing[],
  userId: string,
) {
  await db.cartItem.createMany({
    data: listings.map((listing) => ({
      listingId: listing.id,
      userId: userId,
    })),
  });
}

// Helper function to clear a users cart items
export async function clearTestCartItemsForUser(userId: string) {
  await db.cartItem.deleteMany({
    where: {
      userId: userId,
    },
  });
}

// Helper function to delete listings for a user
export async function clearTestListingsForUser(userId: string) {
  await db.listing.deleteMany({
    where: {
      planet: {
        ownerId: userId,
      },
    },
  });
}
