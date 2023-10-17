import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { api, getBaseUrl } from "~/utils/api";

export default function ListingsPage() {
  const router = useRouter();

  const userListings = api.user.getUserProfile.useQuery({
    userId: router.query.uid as string,
  });

  if (!userListings.data) {
    return <div className="flex min-h-screen w-full"></div>;
  }

  return (
    <div className="mb-4 mt-4 flex min-h-screen w-full justify-center px-4 sm:mt-36 sm:px-20">
      <div className="flex w-full flex-col rounded-lg border-2 border-border p-4">
        <div className="flex h-fit gap-4">
          <div className="h-60 w-60">
            {userListings.data?.image ? (
              <Image
                src={userListings.data?.image}
                width={240}
                height={240}
                alt=""
                className="rounded-full object-fill"
              />
            ) : (
              <h2 className="bg-blue-200 object-fill text-4xl">
                {userListings.data.name?.toUpperCase().slice(0, 3)}
              </h2>
            )}
          </div>
          <div className="relative bottom-10 mt-2 flex flex-col self-center">
            <h2 className=" text-2xl font-semibold text-pbtext-700">
              {userListings.data.name}
            </h2>
            <h3 className=" text-lg font-medium text-pbtext-700">
              Owns {userListings.data.planets.length} planet(s)
            </h3>
            <button className="mt-2 rounded-lg bg-pbprimary-500 py-2  text-lg font-semibold tracking-tight text-white hover:bg-pbprimary-700">
              Follow
            </button>
          </div>
        </div>

        <div className="mt-16 flex h-full flex-col rounded-lg border border-border p-4">
          <h2 className="text-2xl font-semibold text-pbtext-700">
            {userListings.data.name}
            {"'s"} listings:
          </h2>
          <div className="mt-2 grid h-full  w-full grid-cols-1 gap-8 overflow-x-scroll md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  2xl:grid-cols-5">
            {/** Planet listing element here */}
            <Link
              href={`${getBaseUrl()}/listing/LISTING-ID-HERE`}
              className="cursor-pointer"
            >
              {/** Planet image here */}
              <div className="mb-4 aspect-square rounded-2xl bg-pbneutral-500" />
              <div className="flex w-full justify-between">
                {" "}
                <h2 className="text-[22px] font-semibold leading-6 tracking-tighter text-pbtext-700">
                  Planet Name Here
                </h2>
                <h2 className="text-[22px] font-semibold leading-6 tracking-tighter text-blue-600">
                  Rare
                </h2>
              </div>

              <h3 className="text-[18px] tracking-tighter text-pbtext-500">
                105 million square km
              </h3>
              <h3 className="mt-0.5 text-[18px] tracking-tighter text-pbtext-700">
                $15,000
              </h3>
            </Link>

            <div className="aspect-square rounded-2xl bg-pbneutral-500"></div>
            <div className="aspect-square rounded-2xl bg-pbneutral-500"></div>
            <div className="aspect-square rounded-2xl bg-pbneutral-500"></div>
            <div className="aspect-square rounded-2xl bg-pbneutral-500"></div>
            <div className="aspect-square rounded-2xl bg-pbneutral-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
