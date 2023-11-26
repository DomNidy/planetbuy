import { api } from "~/utils/api";
import PlanetCard from "~/components/PlanetCard";
import Hero from "~/components/Hero";
import SearchBar from "~/components/SearchBar";
import { useEffect, useRef, useState } from "react";
import { isScrolledToBottom } from "~/utils/utils";
import PlanetCardSkeleton from "~/components/PlanetCardSkeleton";
import { type RouterInputs } from "~/utils/api";
import { now } from "next-auth/client/_utils";
import { useDebounce } from "@uidotdev/usehooks";
import SearchFilterProvider from "~/context/SearchFilterContext";

export default function Home() {
  const [filters, setFilters] = useState<
    RouterInputs["planet"]["getPlanetListings"]["filters"]
  >({ sortBy: { order: "desc", property: "LIST_DATE" } });

  const debouncedFilters = useDebounce(filters, 500);

  //* Planet listing infinite scroll code
  const allPlanets = api.planet.getPlanetListings.useInfiniteQuery(
    {
      limit: 25,
      filters: debouncedFilters,
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor, staleTime: 30000 },
  );

  // Assign a ref to the last planet listing element rendered
  const lastElementRef = useRef<HTMLDivElement>(null);

  // Add an intersection observer to the last user planet element rendered
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (
        entries[0]?.isIntersecting &&
        allPlanets.hasNextPage &&
        !allPlanets.isFetching
      ) {
        console.log("Is intersecting! Fetching next page!");
        console.log(allPlanets.hasNextPage);
        void allPlanets.fetchNextPage();
      }
    });

    if (lastElementRef.current) {
      observer.observe(lastElementRef.current);
    }

    return () => observer.disconnect();
  }, [lastElementRef, allPlanets]);

  return (
    <>
      <main className="min-h-screen flex-row justify-center gap-4 bg-pbdark-800">
        <Hero />
        <div className="mt-[750px] flex w-full flex-row items-center justify-center">
          <SearchFilterProvider>
            <SearchBar filters={filters} setFilters={setFilters} />
          </SearchFilterProvider>
          <div className=""></div>
        </div>
        <div
          className="gap- mt-[40px] grid w-full grid-cols-1 items-stretch p-10 
        sm:px-16 md:grid-cols-2 md:px-32 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5"
        >
          {allPlanets?.data?.pages ? (
            allPlanets.data.pages.map((page) =>
              page.items.map((planetData) => {
                return (
                  <div
                    className="p-4"
                    ref={lastElementRef}
                    key={planetData.planet.id}
                  >
                    <PlanetCard planetData={planetData} variant="listing" />
                  </div>
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
              <div className="p-4">
                <PlanetCardSkeleton />
              </div>
              <div className="p-4">
                <PlanetCardSkeleton />
              </div>
              <div className="p-4">
                <PlanetCardSkeleton />
              </div>
              <div className="p-4">
                <PlanetCardSkeleton />
              </div>
              <div className="p-4">
                <PlanetCardSkeleton />
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
