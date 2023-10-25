import Image from "next/image";
import { useRouter } from "next/router";
import PlanetCard from "~/components/PlanetCard";
import { api } from "~/utils/api";

export default function ListingsPage() {
  const router = useRouter();

  const userProfile = api.user.getUserProfile.useQuery({
    userId: router.query.uid as string,
  });

  if (!userProfile.data) {
    return <div className="flex min-h-screen w-full"></div>;
  }

  return (
    <div className="mb-4 mt-4 flex min-h-screen w-full justify-center px-4 sm:mt-36 sm:px-20">
      <div className="flex w-full flex-col rounded-lg border-2 border-border p-4">
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
              <h2 className="bg-blue-200 object-fill text-4xl">
                {userProfile.data.name?.toUpperCase().slice(0, 3)}
              </h2>
            )}
          </div>
          <div className="relative bottom-10 mt-2 flex flex-col self-center">
            <h2 className=" text-2xl font-semibold text-pbtext-700">
              {userProfile.data.name}
            </h2>
            <h3 className=" text-lg font-medium text-pbtext-700">
              Owns {userProfile.data.planets.length} planet(s)
            </h3>
            <button className="mt-2 rounded-lg bg-pbprimary-500 py-2  text-lg font-semibold tracking-tight text-white hover:bg-pbprimary-700">
              Follow
            </button>
          </div>
        </div>

        <div className="mt-16 flex h-full flex-col rounded-lg border border-border p-4">
          <h2 className="text-2xl font-semibold text-pbtext-700">
            {userProfile.data.name}
            {"'s"} planets:
          </h2>
          <div className="mt-2 grid h-full  w-full grid-cols-1 gap-8 overflow-x-scroll md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  2xl:grid-cols-5">
            {/** Planet listing element here */}

            {userProfile.data.planets.map((planet) => (
              <PlanetCard
                variant="showcase"
                planetData={{
                  planet: { ...planet, listing: null, owner: null },
                }}
                key={planet.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
