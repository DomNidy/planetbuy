import Image from "next/image";
import { useRouter } from "next/router";
import CircleLoader from "react-spinners/CircleLoader";
import PlanetCard from "~/components/PlanetCard";
import { api } from "~/utils/api";

export default function ListingsPage() {
  const router = useRouter();

  const userProfile = api.user.getUserProfile.useQuery(
    {
      userId: router.query.uid as string,
    },
    {
      retry(failureCount, error) {
        if (error.data?.httpStatus === 404) return false;
        return true;
      },
    },
  );

  if (userProfile.isLoading)
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-pbdark-800">
        {" "}
        <div className="flex flex-row items-center">
          <CircleLoader color="white" />
        </div>
      </div>
    );

  if (!userProfile.data) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-pbdark-800">
        <h1 className="text-3xl text-pbtext-500">Failed to find user.</h1>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full justify-center bg-pbdark-800 px-4 ">
      <div className="mb-4 mt-12 flex w-full flex-col rounded-lg  p-4 sm:mt-36 sm:px-20">
        <div className="flex h-fit gap-4">
          <div className="h-60 w-60">
            {userProfile.data?.image ? (
              <Image
                src={userProfile.data?.image}
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
              Owns {userProfile.data?.planets.length} planet(s)
            </h3>
          </div>
        </div>

        <div className="mt-8 flex h-full flex-col rounded-lg  p-4">
          <h2 className="text-2xl font-semibold text-pbtext-500">
            {userProfile.data?.name}
            {"'s"} planets:
          </h2>
          {userProfile.data?.planets?.length > 0 ? (
            <div className="mt-2 grid h-full  w-full grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  2xl:grid-cols-5">
              {/** Planet listing element here */}

              {userProfile.data.planets.map((planet) => (
                <PlanetCard
                  variant="showcase"
                  planetData={{
                    planet: { ...planet, listing: null, owner: null },
                    listPrice: 0,
                    id: "",
                  }}
                  key={planet.id}
                />
              ))}
            </div>
          ) : (
            <p className="text-pbtext-700">This user owns no planets.</p>
          )}
        </div>
      </div>
    </div>
  );
}
