import { api } from "~/utils/api";
import PlanetListing from "~/components/PlanetListing";

export default function Home() {
  const allPlanets = api.planet.getAllPurchasablePlanets.useQuery({
    limit: 5,
  });

  return (
    <>
      <main className="flex min-h-screen flex-row items-center justify-center gap-4  ">
        <div className="grid grid-cols-4 items-stretch gap-4 p-8">
          {" "}
          {allPlanets.data ? (
            allPlanets.data.map((planetData, idx) => (
              <PlanetListing
                id={planetData.id}
                listPrice={planetData.listPrice}
                planet={planetData.planet}
                planetId={planetData.planetId}
                seller={planetData.seller}
                sellerUserId={planetData.sellerUserId}
                key={planetData.id}
              />
            ))
          ) : (
            <>No planet data found.</>
          )}
        </div>
      </main>
    </>
  );
}
