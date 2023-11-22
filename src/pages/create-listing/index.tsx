import Link from "next/link";
import PlanetCard from "~/components/PlanetCard";
import { api, getBaseUrl } from "~/utils/api";

export default function CreateListing() {
  // TODO: Implement infinite scrolling here or a different system of fetching planets
  const userPlanets = api.user.getUsersPlanets.useInfiniteQuery({ limit: 6 });

  return (
    <div className="flex min-h-screen  flex-col items-center gap-4 bg-pbdark-800 pt-32 ">
      <div className="flex w-full flex-col gap-8 px-10 sm:w-[500px]">
        {userPlanets.data?.pages ? (
          userPlanets.data.pages.map((page) =>
            page.map((planet) => {
              if (planet.listing) {
                return <></>;
              }
              return (
                <div
                  className="flex w-full flex-row items-stretch justify-between "
                  key={page[0]?.id ?? Math.random().toString()}
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
