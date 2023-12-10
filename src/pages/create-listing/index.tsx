import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import PlanetCard from "~/components/PlanetCard";
import { Input } from "~/components/ui/input";
import { api, getBaseUrl } from "~/utils/api";

export default function CreateListing() {
  const userPlanets = api.user.getUsersPlanets.useInfiniteQuery(
    { limit: 15 },
    { getNextPageParam: (lastPage) => lastPage.nextCursor, staleTime: 30000 },
  );

  const [inputFieldValue, setInputFieldValue] = useState<string>("");

  // Assign a ref to the last user planet element rendered
  const lastElementRef = useRef<HTMLDivElement>(null);

  // Add an intersection observer to the last user planet element rendered
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (
        entries[0]?.isIntersecting &&
        userPlanets.hasNextPage &&
        !userPlanets.isFetching
      ) {
        console.log("Is intersecting! Fetching next page!");
        console.log(userPlanets.hasNextPage);
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
        <Input
          onInput={(e) => setInputFieldValue(e.currentTarget.value)}
          placeholder="Enter planet name"
        ></Input>
        {userPlanets.data?.pages ? (
          userPlanets.data.pages.map((page) =>
            page.items.map((planet) => {
              if (
                planet.listing ??
                (inputFieldValue &&
                  !planet.name
                    .toUpperCase()
                    .startsWith(inputFieldValue.toUpperCase()))
              ) {
                return;
              }
              return (
                <div
                  className="flex w-full flex-row items-stretch justify-between rounded-lg bg-pbdark-850"
                  key={planet.id}
                  ref={lastElementRef}
                >
                  <div className="w-[145px] max-w-[145px]">
                    <PlanetCard
                      planetData={{
                        id: planet.id,
                        listPrice: 0,
                        planet: planet,
                      }}
                      variant="showcase"
                    />
                  </div>

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
