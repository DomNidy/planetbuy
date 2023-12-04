import { ShoppingBasket, X } from "lucide-react";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { ShoppingCartContext } from "~/context/ShoppingCartContext";
import { api } from "~/utils/api";
import Image from "next/image";
import {
  formatLargeNumberToString,
  formatNumberToStringWithCommas,
} from "~/utils/utils";
import { env } from "~/env.mjs";
import { useSession } from "next-auth/react";


export default function ListingPage() {
  const router = useRouter();
  const session = useSession();
  const shoppingCart = useContext(ShoppingCartContext);

  const listingData = api.planet.getPlanetDataFromListingId.useQuery({
    listingId: router.query.listingId as string,
  });

  // Whether or not this planet card is in an optimistic state (if it is showing optimistic data while an outbound request is processing)
  const [isOptimistic, setIsOptimistic] = useState<boolean>(false);

  if (!listingData.data) {
    return (
      <div className="flex min-h-screen w-full bg-pbdark-800">
        Listing could not be found...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full justify-center bg-pbdark-800 px-4  md:px-16 lg:px-44">
      <div className="mt-36 flex  h-fit  w-fit  flex-col rounded-lg  p-4">
        <div className="flex  flex-col gap-4  lg:flex-row">
          <div
            className=" relative mb-4  aspect-square rounded-2xl 
       md:h-[600px] md:w-[600px]"
          >
            {listingData?.data.planet.planetImage && (
              <Image
                src={`${env.NEXT_PUBLIC_BUCKET_URL}/${listingData?.data.planet.planetImage.bucketPath}`}
                placeholder="blur"
                blurDataURL={`${env.NEXT_PUBLIC_BUCKET_URL}/${listingData?.data.planet.planetImage.bucketPath}`}
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
              listingData.data.planet.temperature === "EXTREME_COLD"
                ? "from-cyan-400/40"
                : ""
            }
            ${
              listingData.data.planet.temperature === "COLD"
                ? "from-cyan-500/50"
                : ""
            }
            ${
              listingData.data.planet.temperature === "TEMPERATE"
                ? "from-stone-500"
                : ""
            }
            ${
              listingData.data.planet.temperature === "WARM"
                ? "from-orange-300"
                : ""
            }
            ${
              listingData.data.planet.temperature === "HOT"
                ? "from-orange-800"
                : ""
            } ${
              listingData.data.planet.temperature === "EXTREME_HOT"
                ? "from-red-600/40"
                : ""
            }`}
          >
            <div className="flex h-fit flex-row p-1">
              <h1 className="text-[28px] font-semibold leading-6 tracking-tighter text-pbtext-500 ">
                {listingData.data.planet.name}
              </h1>
              <h2 className="w-full self-end text-end text-[24px] font-semibold leading-6 tracking-tighter text-pbtext-500">
                ${formatNumberToStringWithCommas(listingData.data.listPrice)}
              </h2>
            </div>

            <div className="mt-2 flex w-full flex-row justify-start  gap-2 px-1 ">
              <h2 className="basis-5/12 text-[18px]   font-medium leading-6 tracking-tighter   text-pbtext-700">
                Quality:
              </h2>
              <h2
                className={`basis-7/12 text-end text-[22px] font-semibold leading-6 tracking-tighter 
            ${
              listingData.data.planet.quality === "COMMON"
                ? "text-pbaccent-common"
                : ""
            }
            ${
              listingData.data.planet.quality === "UNIQUE"
                ? "text-pbaccent-uncommon"
                : ""
            }
            ${
              listingData.data.planet.quality === "RARE"
                ? "text-pbaccent-rare"
                : ""
            }
            ${
              listingData.data.planet.quality === "OUTSTANDING"
                ? "text-pbaccent-outstanding"
                : ""
            }
            ${
              listingData.data.planet.quality === "PHENOMENAL"
                ? "text-pbaccent-phenomenal"
                : ""
            }
            `}
              >
                {listingData.data.planet.quality}
              </h2>
            </div>

            <div className="flex w-full flex-row justify-start gap-2 px-1 ">
              <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter    text-pbtext-700">
                Terrain:
              </h2>
              <h2
                className={`basis-7/12 text-end text-[22px] font-semibold leading-6 tracking-tighter 
            ${
              listingData.data.planet.terrain === "DESERTS"
                ? "text-yellow-400"
                : ""
            }
            ${
              listingData.data.planet.terrain === "PLAINS"
                ? "text-green-400"
                : ""
            }
            ${
              listingData.data.planet.terrain === "FORESTS"
                ? "text-green-500"
                : ""
            }
            ${
              listingData.data.planet.terrain === "OCEANS"
                ? "text-blue-500"
                : ""
            }
            ${
              listingData.data.planet.terrain === "MOUNTAINS"
                ? "text-stone-300"
                : ""
            }
            ${
              listingData.data.planet.terrain === "OTHER" ? "text-gray-400" : ""
            }
            `}
              >
                {listingData.data.planet.terrain}
              </h2>
            </div>

            <div className="flex w-full flex-row justify-start gap-2 px-1 ">
              <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter  text-pbtext-700">
                Temperature:
              </h2>

              <h2
                className={`basis-7/12 text-end text-[22px] font-semibold leading-6 tracking-tighter  
            ${
              listingData.data.planet.temperature === "EXTREME_COLD"
                ? "text-cyan-400"
                : ""
            }
            ${
              listingData.data.planet.temperature === "COLD"
                ? "text-cyan-500"
                : ""
            }
            ${
              listingData.data.planet.temperature === "TEMPERATE"
                ? "text-stone-300"
                : ""
            }
            ${
              listingData.data.planet.temperature === "WARM"
                ? "text-orange-300"
                : ""
            }
            ${
              listingData.data.planet.temperature === "HOT"
                ? "text-orange-500"
                : ""
            } ${
              listingData.data.planet.temperature === "EXTREME_HOT"
                ? "text-red-600"
                : ""
            }
            `}
              >
                {listingData.data.planet.temperature
                  .replace("_", " ")
                  .replace("EXTREME", "EXTREMELY")}
              </h2>
            </div>

            <div className="flex w-full flex-row justify-start gap-2 px-1 ">
              <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter text-pbtext-700">
                Surface Area:
              </h2>
              <h2 className="basis-7/12 text-end text-[20px] leading-6 tracking-tighter text-pbtext-500 ">
                {formatLargeNumberToString(listingData.data.planet.surfaceArea)}
                <sup>2</sup> km
              </h2>
            </div>
            {listingData.data.planet.owner?.id !== session.data?.user.id ? (
              // If the user is not the owner of this listing, show the add to / remove from cart button
              <>
                <div className="flex w-[17rem] flex-row justify-start gap-2  px-1 md:w-80"></div>
                {listingData.data.id &&
                shoppingCart.isItemInCart(listingData.data.id) ? (
                  <div
                    onClick={() => {
                      if (listingData.data?.id && !isOptimistic) {
                        setIsOptimistic(true);
                        shoppingCart.removeItemFromCart(
                          listingData.data.id,
                          setIsOptimistic,
                        );
                      }
                    }}
                    className={`${
                      isOptimistic
                        ? "pointer-events-none opacity-80"
                        : "pointer-events-auto opacity-100"
                    }  group mt-2 flex w-fit cursor-pointer items-center rounded-md bg-red-400 p-2 transition-all hover:bg-red-500 `}
                  >
                    <p className="font-medium  text-white">Remove from cart</p>
                    <X
                      className="relative cursor-pointer rounded-full p-1 transition-transform duration-75 group-hover:scale-110 "
                      width={32}
                      height={32}
                      color="white"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (listingData.data?.id && !isOptimistic) {
                        setIsOptimistic(true);
                        shoppingCart.addItemToCart(
                          {
                            planet: listingData.data.planet,
                            listPrice: listingData.data.listPrice,
                            id: listingData.data.id,
                          },
                          setIsOptimistic,
                        );
                      }
                    }}
                    className={`${
                      isOptimistic
                        ? "pointer-events-none opacity-80"
                        : "pointer-events-auto opacity-100"
                    }  group mt-2 flex w-fit cursor-pointer items-center rounded-md bg-neutral-100 p-2 transition-all hover:bg-neutral-300`}
                  >
                    <p className="font-medium  text-pbdark-800">Add to cart</p>
                    <ShoppingBasket
                      className="relative ml-1 cursor-pointer rounded-full p-1 text-pbdark-800 transition-transform duration-75 group-hover:scale-110 "
                      width={32}
                      height={32}
                    />
                  </div>
                )}
              </>
            ) : (
              // If the user does own this listing, show the edit button
              // TODO: Create an edit listing form and display it in a dialog
              // TODO: This edit listing component should allow the user to send an edit listing request and
              // TODO: display a loading spinner while the request is processing
              <>
                {/**  
                 <Dialog>
                  <DialogTrigger asChild>
                    <Button className="relative rounded-lg border-2 bg-pbtext-500 text-pbdark-850 hover:bg-pbtext-500 hover:bg-opacity-95 ">
                      <p className="text-base">Edit Listing</p>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                  </DialogContent>
                </Dialog>
                */}
              </>
            )}
          </div>
        </div>
        <div className="flex w-full flex-row justify-between">
          <h1 className="text-[28px] font-semibold leading-6 tracking-tighter text-pbtext-500 ">
            {listingData.data.planet.name}
          </h1>
        </div>
      </div>
    </div>
  );
}
