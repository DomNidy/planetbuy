import { ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { useContext } from "react";
import { ShoppingCartContext } from "~/context/ShoppingCartContext";
import { getBaseUrl, type RouterOutputs } from "~/utils/api";
import {
  formatLargeNumberToString,
  formatNumberToStringWithCommas,
} from "~/utils/utils";

export default function PlanetCard(
  planetData: RouterOutputs["planet"]["getAllPurchasablePlanets"][number] & {
    variant: "listing" | "showcase";
  },
) {
  const shoppingCart = useContext(ShoppingCartContext);

  return (
    <div>
      {/** Planet image here */}
      <div
        className=" relative mb-4  aspect-square
       rounded-2xl bg-pbneutral-500"
      >
        {planetData.variant === "listing" ? (
          <ShoppingBagIcon
            onClick={() => {
              // Add item to card if the listing assosciated with this planet has an id
              if (planetData.planet.listing?.id) {
                shoppingCart.addItemToCart(planetData.planet.listing?.id);
              }
            }}
            className="absolute right-1 top-1 cursor-pointer invert"
            width={32}
            height={32}
            fill="rgba(255,255,255,0.6)"
          />
        ) : (
          <></>
        )}
      </div>
      <Link href={`${getBaseUrl()}/listing/${planetData.planet.listing?.id}`}>
        <div className="flex w-full  justify-between">
          <h2 className="text-[22px] font-semibold leading-6 tracking-tighter text-pbtext-700 ">
            {planetData.planet.name}
          </h2>
          <h2
            className={`text-[22px] font-semibold leading-6 tracking-tighter 
            ${planetData.planet.quality === "COMMON" ? "text-gray-500" : ""}
            ${planetData.planet.quality === "UNIQUE" ? "text-green-600" : ""}
            ${planetData.planet.quality === "RARE" ? "text-blue-600" : ""}
            ${
              planetData.planet.quality === "OUTSTANDING"
                ? "text-purple-600"
                : ""
            }
            ${
              planetData.planet.quality === "PHENOMENAL"
                ? "text-orange-600"
                : ""
            }
            `}
          >
            {planetData.planet.quality}
          </h2>
        </div>

        <h3 className="text-[18px] tracking-tighter text-pbtext-500">
          {formatLargeNumberToString(planetData.planet.surfaceArea)}
          <sup>2</sup> km
        </h3>
        <h3 className="mt-0.5 text-[18px] tracking-tighter text-pbtext-700">
          ${formatNumberToStringWithCommas(planetData.listPrice)}
        </h3>
      </Link>
    </div>
  );
}
