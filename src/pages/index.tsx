import { api } from "~/utils/api";
import PlanetCard from "~/components/PlanetCard";

export default function Home() {
  const allPlanets = api.planet.getAllPurchasablePlanets.useQuery({
    limit: 5,
  });

  return (
    <>
      <main className="flex min-h-screen flex-row justify-center gap-4  ">
        <div className="grid w-full  grid-cols-1 items-stretch gap-4 p-8 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {" "}
          {allPlanets.data ? (
            allPlanets.data.map((planetData, idx) => (
              <PlanetCard
                variant="listing"
                planet={planetData.planet}
                listPrice={planetData.listPrice}
                key={planetData.planet.id}
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
