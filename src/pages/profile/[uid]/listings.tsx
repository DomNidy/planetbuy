import { useRouter } from "next/router";
import CircleLoader from "react-spinners/CircleLoader";
import { api } from "~/utils/api";
import Image from "next/image";
import PlanetCard from "~/components/PlanetCard";
import { useEffect, useRef } from "react";
import PlanetCardSkeleton from "~/components/PlanetCardSkeleton";

export default function ListingsPage() {
  const router = useRouter();

  const userProfile = api.user.getUserProfile.useQuery({
    userId: router.query.uid as string,
  });

  const usersListings = api.user.getUsersListings.useInfiniteQuery(
    {
      userId: router.query.uid as string,
      limit: 25,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // Assign a ref to the last listing element rendered
  const lastElementRef = useRef<HTMLDivElement>(null);

  // Add an intersection observer to the last user planet element rendered
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (
        entries[0]?.isIntersecting &&
        usersListings.hasNextPage &&
        !usersListings.isFetching
      ) {
        console.log("Is intersecting! Fetching next page!");
        void usersListings.fetchNextPage();
      }
    });

    if (lastElementRef.current) {
      observer.observe(lastElementRef.current);
    }

    return () => observer.disconnect();
  }, [lastElementRef, usersListings]);

  // Handle user not found
  if (userProfile.isError) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-pbdark-800">
        <div className="flex flex-row items-center">
          <h2 className="text-2xl font-semibold text-pbtext-500">
            User not found
          </h2>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (usersListings.isLoading)
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-pbdark-800">
        {" "}
        <div className="flex flex-row items-center">
          <CircleLoader color="white" />
        </div>
      </div>
    );

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-pbdark-800">
      <div className="mb-4 mt-12 flex w-full flex-col rounded-lg  p-4 sm:mt-36 sm:px-20">
        <div className="flex h-fit w-full gap-4">
          <div className="h-60 w-60 ">
            {userProfile.data?.image ? (
              <Image
                src={userProfile.data.image}
                width={240}
                height={240}
                alt=""
                className="rounded-full object-fill"
              />
            ) : (
              <h2 className="flex h-[240px] w-[240px] items-center justify-center rounded-full bg-pbprimary-100 object-fill text-4xl">
                {userProfile.data?.name?.toUpperCase().slice(0, 3)}
              </h2>
            )}
          </div>

          <div className="relative bottom-10 mt-2 flex flex-col self-center">
            <h2 className=" text-2xl font-semibold text-pbtext-500">
              {userProfile.data?.name}
            </h2>
            <h3 className=" text-lg font-medium text-pbtext-700">
              Has{" "}
              {usersListings.data?.pages.reduce(
                (acc, page) => acc + page.listings.length,
                0,
              )}{" "}
              listing(s)
            </h3>
          </div>
        </div>

        <div className="mt-8 flex h-full flex-col rounded-lg  p-4">
          <h2 className="text-2xl font-semibold text-pbtext-500">
            {userProfile.data?.name}
            {"'s"} listings:
          </h2>
          <div className="mt-2 grid h-full  w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  2xl:grid-cols-5">
            {!!usersListings.data ? (
              usersListings.data?.pages.map((page) => {
                return page.listings.map((listing) => {
                  return (
                    <div key={listing.id} ref={lastElementRef}>
                      <PlanetCard
                        planetData={{
                          id: listing.planet.id,
                          listPrice: listing.listPrice,
                          planet: {
                            ...{ ...listing.planet },
                            owner: { id: listing.planet.ownerId ?? "" },
                            listing: listing,
                          },
                        }}
                        variant="listing"
                      />
                    </div>
                  );
                });
              })
            ) : (
              <p className="text-pbtext-700">This user owns no planets.</p>
            )}

            {usersListings.isFetching && (
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
        </div>
      </div>
    </div>
  );
}
