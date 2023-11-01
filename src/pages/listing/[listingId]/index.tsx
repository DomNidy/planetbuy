import { ShoppingBasket, X } from "lucide-react";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { ShoppingCartContext } from "~/context/ShoppingCartContext";
import { api } from "~/utils/api";
import {
  formatLargeNumberToString,
  formatNumberToStringWithCommas,
} from "~/utils/utils";

export default function ListingPage() {
  const router = useRouter();
  const shoppingCart = useContext(ShoppingCartContext);

  const listingData = api.planet.getPlanetFromListingId.useQuery({
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
    <div className="bg-pbdark-800 flex min-h-screen w-full justify-center px-4  md:px-16 lg:px-44">
      <div className="mt-36 flex  h-fit  w-fit  flex-col rounded-lg border-2 border-border p-4">
        <div className="flex  flex-col gap-4  sm:flex-row">
          {/** Planet image here */}
          <div
            className=" relative mb-4  aspect-square h-[300px] w-[300px]
       rounded-2xl bg-pbneutral-500"
          ></div>

          <div className="flex flex-col">
            <div className="flex w-[17rem] flex-row  justify-start gap-2 md:w-80">
              <h2 className="basis-5/12 text-[18px]  font-medium leading-6 tracking-tighter   text-pbtext-700">
                Quality:
              </h2>
              <h2
                className={`text-[22px] font-semibold leading-6 tracking-tighter 
            ${
              listingData.data.planet.quality === "COMMON"
                ? "text-gray-500"
                : ""
            }
            ${
              listingData.data.planet.quality === "UNIQUE"
                ? "text-green-600"
                : ""
            }
            ${listingData.data.planet.quality === "RARE" ? "text-blue-600" : ""}
            ${
              listingData.data.planet.quality === "OUTSTANDING"
                ? "text-purple-600"
                : ""
            }
            ${
              listingData.data.planet.quality === "PHENOMENAL"
                ? "text-orange-600"
                : ""
            }
            `}
              >
                {listingData.data.planet.quality}
              </h2>
            </div>

            <div className="flex w-[17rem] flex-row justify-start gap-2 md:w-80">
              <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter   text-pbtext-700">
                Terrain:
              </h2>
              <h2
                className={`text-[22px] font-semibold leading-6 tracking-tighter 
            ${
              listingData.data.planet.terrain === "DESERTS"
                ? "text-yellow-400"
                : ""
            }
            ${
              listingData.data.planet.terrain === "FORESTS"
                ? "text-green-800"
                : ""
            }
            ${
              listingData.data.planet.terrain === "OCEANS"
                ? "text-blue-500"
                : ""
            }
            ${
              listingData.data.planet.terrain === "MOUNTAINS"
                ? "text-stone-600"
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

            <div className="flex w-[17rem] flex-row justify-start  gap-2 md:w-80">
              <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter  text-pbtext-700">
                Temperature:
              </h2>

              <h2
                className={`text-[22px] font-semibold leading-6 tracking-tighter  
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
                ? "text-stone-500"
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

            <div className="flex w-[17rem] flex-row justify-start  gap-2 md:w-80">
              <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter   text-pbtext-700">
                Surface Area:
              </h2>
              <h2 className="text-[20px] leading-6 tracking-tighter text-pbtext-500 ">
                {formatLargeNumberToString(listingData.data.planet.surfaceArea)}
                <sup>2</sup> km
              </h2>
            </div>

            <div className="flex w-[17rem] flex-row justify-start  gap-2 md:w-80">
              <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter   text-pbtext-700">
                List Price:
              </h2>
              <h2 className="mt-0.5 text-[20px] tracking-tighter text-pbtext-700">
                ${formatNumberToStringWithCommas(listingData.data.listPrice)}
              </h2>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-row justify-between">
          <h1 className="text-[28px] font-semibold leading-6 tracking-tighter text-pbtext-500 ">
            {listingData.data.planet.name}
          </h1>
        </div>
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
            }  group flex w-fit cursor-pointer items-center rounded-md bg-pbprimary-500 p-2 transition-all hover:bg-red-500 `}
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
            }  group flex w-fit cursor-pointer items-center rounded-md bg-pbprimary-500 p-2 transition-all hover:bg-red-500 `}
          >
            <p className="font-medium  text-white">Add to cart</p>
            <ShoppingBasket
              className="relative ml-1 cursor-pointer rounded-full p-1 transition-transform duration-75 group-hover:scale-110 "
              width={32}
              height={32}
              color="white"
            />
          </div>
        )}
      </div>
    </div>
  );
}
