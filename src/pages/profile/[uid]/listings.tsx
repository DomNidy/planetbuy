import { useRouter } from "next/router";
import CircleLoader from "react-spinners/CircleLoader";
import { api } from "~/utils/api";
import Image from "next/image";
import PlanetCard from "~/components/PlanetCard";

export default function ListingsPage() {
  const router = useRouter();

  const userPlanetsWithListings = api.user.getUserProfile.useQuery(
    {
      userId: router.query.uid as string,
    },
    {
      // TODO: Create an endpoint to return this data instead of filtering it here
      // Transform the response into a new object
      // This object will contain the users name and image, and a list of planets that have listings
      select(data) {
        return {
          user: { name: data?.name, image: data?.image },
          planetsWithListings:
            data?.planets?.filter((planet) => {
              if (planet.listing) return planet;
            }) ?? [],
        };
      },
    },
  );

  if (userPlanetsWithListings.isLoading)
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
            {userPlanetsWithListings.data?.user.image ? (
              <Image
                src={userPlanetsWithListings.data?.user.image}
                width={240}
                height={240}
                alt=""
                className="rounded-full object-fill"
              />
            ) : (
              <h2 className="flex h-[240px] w-[240px] items-center justify-center rounded-full bg-pbprimary-100 object-fill text-4xl">
                {userPlanetsWithListings.data?.user.name
                  ?.toUpperCase()
                  .slice(0, 3)}
              </h2>
            )}
          </div>

          <div className="relative bottom-10 mt-2 flex flex-col self-center">
            <h2 className=" text-2xl font-semibold text-pbtext-500">
              {userPlanetsWithListings.data?.user.name}
            </h2>
            <h3 className=" text-lg font-medium text-pbtext-700">
              Has {userPlanetsWithListings.data?.planetsWithListings.length}{" "}
              listing(s)
            </h3>
          </div>
        </div>

        <div className="mt-8 flex h-full flex-col rounded-lg  p-4">
          <h2 className="text-2xl font-semibold text-pbtext-500">
            {userPlanetsWithListings.data?.user.name}
            {"'s"} listings:
          </h2>
          {userPlanetsWithListings.data?.planetsWithListings &&
          userPlanetsWithListings.data.planetsWithListings.length > 0 ? (
            <div className="mt-2 grid h-full  w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  2xl:grid-cols-5">
              {/** Planet listing element here */}

              {userPlanetsWithListings.data.planetsWithListings.map(
                (planet) => (
                  <PlanetCard
                    variant="listing"
                    planetData={{
                      listPrice: planet.listing?.listPrice ?? 0,
                      planet: {
                        ...planet,
                        owner: { id: planet.owner?.id ?? "" },
                      },
                      id: "",
                    }}
                    key={planet.id}
                  />
                ),
              )}
            </div>
          ) : (
            <p className="text-pbtext-700">This user owns no planets.</p>
          )}
        </div>
      </div>
    </div>
  );
}
