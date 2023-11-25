import { c } from "@vercel/blob/dist/put-96a1f07e";
import Link from "next/link";
import { useEffect, useRef } from "react";
import PlanetCard from "~/components/PlanetCard";
import { api, getBaseUrl } from "~/utils/api";
import { isScrolledToBottom } from "~/utils/utils";

export default function CreateListing() {
  // TODO: Implement infinite scrolling here or a different system of fetching planets
  // TODO: Review this infinte scrolling implementation
  const userPlanets = api.user.getUsersPlanets.useInfiniteQuery(
    { limit: 15 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor, staleTime: 30000},
  );

  // Assign a ref to the last user planet element rendered
  const lastElementRef = useRef<HTMLDivElement>(null);

  // Add an intersection observer to the last user planet element rendered
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        console.log("Is intersecting! Fetching next page!");
        console.log(userPlanets.hasNextPage)
        void userPlanets.fetchNextPage();
      }
    });

    if (lastElementRef.current) {
      observer.observe(lastElementRef.current);
    }

    return () => observer.disconnect();
  }, [lastElementRef, userPlanets]);

  return (
    <div className="flex min-h-screen  flex-col items-center gap-4 bg-pbdark-800 pt-32 ">
      <div className="flex w-full flex-col gap-4 p-4 px-10 sm:w-[500px]">
        {userPlanets.data?.pages ? (
          userPlanets.data.pages.map((page) =>
            page.items.map((planet) => {
              if (planet.listing) {
                return;
              }
              return (
                <div
                  className="flex w-full flex-row items-stretch justify-between bg-pbdark-850 rounded-lg"
                  key={planet.id}
                  ref={lastElementRef}
                >
                  <PlanetCard
                    planetData={{
                      id: planet.id,
                      listPrice: 0,
                      planet: planet,
                    }}
                    variant="showcase"
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
