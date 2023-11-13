import { api } from "~/utils/api";
import PlanetCard from "~/components/PlanetCard";
import Hero from "~/components/Hero";
import SearchBar from "~/components/SearchBar";
import { useEffect, useState } from "react";
import { isScrolledToBottom } from "~/utils/utils";
import PlanetCardSkeleton from "~/components/PlanetCardSkeleton";
import { type RouterInputs } from "~/utils/api";
import { now } from "next-auth/client/_utils";
import { useDebounce } from "@uidotdev/usehooks";
import SearchFilterProvider from "~/context/SearchFilterContext";

export default function Home() {
  const [filters, setFilters] = useState<
    RouterInputs["planet"]["getPlanetListings"]["filters"]
  >({});

  //
  const debouncedFilters = useDebounce(filters, 500);

  //* Planet listing infinite scroll code
  const allPlanets = api.planet.getPlanetListings.useInfiniteQuery(
    {
      limit: 25,
      filters: debouncedFilters,
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor, staleTime: 30000 },
  );

  useEffect(() => {
    console.log("ran index eff");
    function handleScroll() {
      if (
        isScrolledToBottom(150) === true &&
        allPlanets.isFetchingNextPage === false &&
        allPlanets.hasNextPage === true
      ) {
        void allPlanets.fetchNextPage();
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  useEffect(() => console.log("Filters changed", filters, now()), [filters]);

  return (
    <>
      <main className="min-h-screen flex-row justify-center gap-4 bg-pbdark-800">
        <Hero />
        <div className="mt-[750px] flex w-full flex-col items-center justify-center">
          <SearchFilterProvider>
            <SearchBar filters={filters} setFilters={setFilters} />
          </SearchFilterProvider>
        </div>
        <div
          className="mt-[40px] grid w-full grid-cols-1 items-stretch gap-8 p-10 
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
            <> </>
          )}
          {/** If no page with items can be found, display "NO PLANETS FOUND" */}
          {allPlanets.data?.pages[0]?.items.length === 0 && (
            <p className="text-center text-2xl text-white">
              No planets found...
            </p>
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
