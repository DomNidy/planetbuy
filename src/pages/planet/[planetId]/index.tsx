import { useRouter } from "next/router";
import { env } from "~/env.mjs";
import { api, getBaseUrl } from "~/utils/api";
import Image from "next/image";
import { formatLargeNumberToString } from "~/utils/utils";
import Link from "next/link";

export default function PlanetPage() {
  const router = useRouter();

  const planetData = api.planet.getPlanetData.useQuery({
    planetId: router.query.planetId as string,
  });

  const transactionHistory = api.planet.getPlanetTransactionHistory.useQuery({
    planetId: router.query.planetId as string,
  });

  if (planetData.status === "loading") {
    return (
      <div className="flex min-h-screen w-full justify-center bg-pbdark-800 px-4  md:px-16 lg:px-44">
        <div className="mt-36 flex  h-fit  w-fit  flex-col rounded-lg  p-4">
          <div className="flex  flex-col gap-4  lg:flex-row">
            <div
              className=" relative mb-4 aspect-square h-[320px] w-[320px]  animate-pulse rounded-2xl bg-white/20
   sm:h-[600px] sm:w-[600px]"
            >
              {" "}
            </div>
            <div
              className={`flex h-fit w-full flex-col gap-4 rounded-md md:min-w-[336px]`}
            >
              <h1 className="h-[28px] animate-pulse rounded-lg bg-white/20 " />
              <h1 className="h-[28px] animate-pulse rounded-lg bg-white/20 " />
              <h1 className="h-[28px] animate-pulse rounded-lg bg-white/20 " />
              <h1 className="h-[28px] animate-pulse rounded-lg bg-white/20 " />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!planetData.data) {
    return (
      <div className="flex min-h-screen w-full bg-pbdark-800">
        Planet could not be found...
      </div>
    );
  }

  console.log(transactionHistory.data);

  return (
    <div className="flex min-h-screen w-full justify-center bg-pbdark-800 px-4  md:px-16 lg:px-44">
      <div className="mt-36 flex  h-fit  w-fit  flex-col rounded-lg  p-4">
        <div className="flex  flex-col gap-4  lg:flex-row">
          <div
            className=" relative mb-4  aspect-square  rounded-2xl bg-white/20
   md:h-[600px] md:w-[600px]"
          >
            {planetData?.data.planetImage && (
              <Image
                src={`${env.NEXT_PUBLIC_BUCKET_URL}/${planetData?.data.planetImage.bucketPath}`}
                placeholder="blur"
                blurDataURL={`${env.NEXT_PUBLIC_BUCKET_URL}/${planetData?.data.planetImage.bucketPath}`}
                alt=""
                width={1024}
                height={1024}
                className="rounded-lg object-cover"
                quality={100}
                priority
              />
            )}
          </div>

          <div
            className={`flex h-fit w-full flex-col rounded-md bg-pbdark-850 bg-gradient-to-b from-pbdark-700 to-pbdark-800 p-2 ${
              planetData.data.temperature === "EXTREME_COLD"
                ? "from-cyan-400/40"
                : ""
            }
        ${planetData.data.temperature === "COLD" ? "from-cyan-500/50" : ""}
        ${planetData.data.temperature === "TEMPERATE" ? "from-stone-500" : ""}
        ${planetData.data.temperature === "WARM" ? "from-orange-300" : ""}
        ${planetData.data.temperature === "HOT" ? "from-orange-500" : ""} ${
          planetData.data.temperature === "EXTREME_HOT" ? "from-red-600/40" : ""
        }`}
          >
            <div className="flex h-fit flex-row p-1">
              <h1 className="text-[28px] font-semibold leading-6 tracking-tighter text-pbtext-500 ">
                {planetData.data.name}
              </h1>
            </div>

            <div className="mt-2 flex w-full flex-row justify-start  gap-2 px-1">
              <h2 className="basis-5/12 text-[18px]  font-medium leading-6 tracking-tighter   text-pbtext-700">
                Owner:
              </h2>
              <Link
                href={`${getBaseUrl()}/profile/${planetData.data.owner?.id}`}
                className={`basis-7/12 cursor-pointer  text-end text-[22px] font-medium leading-6 tracking-tighter text-pbtext-500 
    `}
              >
                {planetData.data.owner?.name}
              </Link>
            </div>

            <div className=" flex w-full flex-row justify-start  gap-2 px-1 ">
              <h2 className="basis-5/12 text-[18px]  font-medium leading-6 tracking-tighter   text-pbtext-700">
                Quality:
              </h2>
              <h2
                className={`basis-7/12 text-end text-[22px] font-semibold leading-6 tracking-tighter 
        ${planetData.data.quality === "COMMON" ? "text-gray-500" : ""}
        ${planetData.data.quality === "UNIQUE" ? "text-green-600" : ""}
        ${planetData.data.quality === "RARE" ? "text-blue-600" : ""}
        ${planetData.data.quality === "OUTSTANDING" ? "text-purple-600" : ""}
        ${planetData.data.quality === "PHENOMENAL" ? "text-orange-600" : ""}
        `}
              >
                {planetData.data.quality}
              </h2>
            </div>

            <div className="flex w-full flex-row justify-start gap-2 px-1 ">
              <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter   text-pbtext-700">
                Terrain:
              </h2>
              <h2
                className={`basis-7/12 text-end text-[22px] font-semibold leading-6 tracking-tighter 
        ${planetData.data.terrain === "DESERTS" ? "text-yellow-400" : ""}
        ${planetData.data.terrain === "PLAINS" ? "text-green-300" : ""}
        ${planetData.data.terrain === "FORESTS" ? "text-green-800" : ""}
        ${planetData.data.terrain === "OCEANS" ? "text-blue-500" : ""}
        ${planetData.data.terrain === "MOUNTAINS" ? "text-stone-600" : ""}
        ${planetData.data.terrain === "OTHER" ? "text-gray-400" : ""}
        `}
              >
                {planetData.data.terrain}
              </h2>
            </div>

            <div className="flex w-full flex-row justify-start gap-2 px-1 ">
              <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter  text-pbtext-700">
                Temperature:
              </h2>

              <h2
                className={`basis-7/12 text-end text-[22px] font-semibold leading-6 tracking-tighter  
        ${planetData.data.temperature === "EXTREME_COLD" ? "text-cyan-400" : ""}
        ${planetData.data.temperature === "COLD" ? "text-cyan-500" : ""}
        ${planetData.data.temperature === "TEMPERATE" ? "text-stone-500" : ""}
        ${planetData.data.temperature === "WARM" ? "text-orange-300" : ""}
        ${planetData.data.temperature === "HOT" ? "text-orange-500" : ""} ${
          planetData.data.temperature === "EXTREME_HOT" ? "text-red-600" : ""
        }
        `}
              >
                {planetData.data.temperature
                  .replace("_", " ")
                  .replace("EXTREME", "EXTREMELY")}
              </h2>
            </div>
            <div className="flex w-[17rem] flex-row justify-start gap-2  px-1 md:w-80"></div>

            <div className="flex w-full flex-row justify-start gap-2 px-1 ">
              <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter text-pbtext-700">
                Surface Area:
              </h2>
              <h2 className="basis-7/12 text-end text-[20px] leading-6 tracking-tighter text-pbtext-500 ">
                {formatLargeNumberToString(planetData.data.surfaceArea)}
                <sup>2</sup> km
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
