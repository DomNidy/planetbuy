import { api } from "~/utils/api";
import PlanetCard from "~/components/PlanetCard";
import Hero from "~/components/Hero";
import SearchBar from "~/components/SearchBar";
import { useEffect } from "react";
import { isScrolledToBottom } from "~/utils/utils";
import PlanetCardSkeleton from "~/components/PlanetCardSkeleton";

export default function Home() {
  //* Planet listing infinite scroll code
  const allPlanets = api.planet.getAllPurchasablePlanets.useInfiniteQuery(
    {
      limit: 10,
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  useEffect(() => {
    function handleScroll() {
      if (isScrolledToBottom(150) && !allPlanets.isFetching) {
        console.log("fetching");
        void allPlanets.fetchNextPage();
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  return (
    <>
      <main className=" min-h-screen flex-row justify-center gap-4 bg-pbdark-800  ">
        <Hero />
        <div className="mt-[750px] flex w-full flex-col items-center justify-center">
          <SearchBar />
        </div>
        <div
          className="mt-[40px] grid w-full  grid-cols-1 items-stretch gap-8 p-10 
        sm:px-16 md:grid-cols-2 md:px-32 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5"
        >
          {allPlanets?.data?.pages ? (
            allPlanets.data.pages.map((page) =>
              page.items.map((planetData) => {
                return (
                  <PlanetCard
                    planetData={planetData}
                    variant="listing"
                    key={planetData.planet.id}
                  />
                );
              }),
            )
          ) : (
            <></>
          )}
          {allPlanets.isFetching && (
            <>
              <PlanetCardSkeleton />
              <PlanetCardSkeleton />
              <PlanetCardSkeleton />
              <PlanetCardSkeleton />
              <PlanetCardSkeleton />
            </>
          )}
        </div>
      </main>
    </>
  );
}
