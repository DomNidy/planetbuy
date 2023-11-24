import Link from "next/link";
import { useEffect } from "react";
import PlanetCard from "~/components/PlanetCard";
import { api, getBaseUrl } from "~/utils/api";
import { isScrolledToBottom } from "~/utils/utils";

export default function CreateListing() {
  // TODO: Implement infinite scrolling here or a different system of fetching planets
  // TODO: Review this infinte scrolling implementation
  const userPlanets = api.user.getUsersPlanets.useInfiniteQuery(
    { limit: 10 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor, staleTime: 30000 },
  );

  useEffect(() => {
    // TODO: Review this and ensure it is properly working
    function handleScroll() {
      if (
        isScrolledToBottom(150) === true &&
        userPlanets.isFetchingNextPage === false &&
        userPlanets.hasNextPage === true
      ) {
        console.log("Fetching next page");
        void userPlanets.fetchNextPage();
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  });

  // TODO: Review duplicate key issue (planet.id is being used twice)
  return (
    <div className="flex min-h-screen  flex-col items-center gap-4 bg-pbdark-800 pt-32 ">
      <div className="flex w-full flex-col gap-8 px-10 sm:w-[500px]">
        {userPlanets.data?.pages ? (
          userPlanets.data.pages.map((page) =>
            page.items.map((planet) => {
              if (planet.listing) {
                return <></>;
              }
              return (
                <div
                  className="flex w-full flex-row items-stretch justify-between "
                  key={planet.id}
                >
                  <PlanetCard
                    planetData={{
                      id: planet.id,
                      listPrice: 0,
                      planet: planet,
                    }}
                    variant="showcase"
                    key={planet.id}
                  />
                  {/* TODO: STYLE THIS LINK*/}
                  <Link
                    className="h-fit w-fit rounded-lg bg-white p-2 text-center hover:bg-white/80"
                    href={`${getBaseUrl()}/create-listing/${planet.id}`}
                  >
                    Create Listing
                  </Link>
                </div>
              );
            }),
          )
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
