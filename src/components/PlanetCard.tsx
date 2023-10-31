import { ShoppingCartIcon, X } from "lucide-react";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { ShoppingCartContext } from "~/context/ShoppingCartContext";
import { getBaseUrl, type RouterOutputs } from "~/utils/api";
import {
  formatLargeNumberToString,
  formatNumberToStringWithCommas,
} from "~/utils/utils";

export default function PlanetCard({
  planetData,
  variant,
}: {
  planetData: RouterOutputs["planet"]["getAllPurchasablePlanets"][number] &
    Partial<RouterOutputs["user"]["getUserProfile"]["planets"][number]>;
  variant: "listing" | "showcase";
}) {
  const shoppingCart = useContext(ShoppingCartContext);

  return (
    <div>
      {/** Planet image here */}
      <div
        className=" relative mb-4  aspect-square
       rounded-2xl bg-pbneutral-500"
      >
        {planetData.planet.listing?.id &&
        shoppingCart.isItemInCart(planetData.planet.listing.id) ? (
          <X
            className="absolute right-1 top-1  cursor-pointer rounded-full bg-pbneutral-400 p-1 transition-transform duration-75 hover:scale-110 hover:bg-red-500"
            width={32}
            height={32}
            onClick={() => {
              if (planetData.planet?.listing?.id) {
                shoppingCart.removeItemFromCart(planetData.planet.listing.id);
              }
            }}
          />
        ) : (
          <>
            <ShoppingCartIcon
              color="#494949"
              onClick={() => {
                // Add item to card if the listing assosciated with this planet has an id
                if (planetData) {
                  shoppingCart.addItemToCart(planetData);
                }
              }}
              className={`absolute 
             right-1 top-1 cursor-pointer transition-transform duration-75 hover:scale-110 `}
              width={32}
              height={32}
              fill="rgba(255,255,255,0.3)"
            />
          </>
        )}
      </div>
      <Link
        href={`${
          variant === "listing"
            ? `${getBaseUrl()}/listing/${planetData.planet?.listing?.id}`
            : `${getBaseUrl()}/planet/${planetData.planet?.id}`
        } `}
      >
        <div className="flex w-full  justify-between">
          <h2 className="text-[22px] font-semibold leading-6 tracking-tighter text-pbtext-700 ">
            {planetData.planet?.name}
          </h2>
          <h2
            className={`text-[22px] font-semibold leading-6 tracking-tighter 
            ${planetData.planet?.quality === "COMMON" ? "text-gray-500" : ""}
            ${planetData.planet?.quality === "UNIQUE" ? "text-green-600" : ""}
            ${planetData.planet?.quality === "RARE" ? "text-blue-600" : ""}
            ${
              planetData.planet?.quality === "OUTSTANDING"
                ? "text-purple-600"
                : ""
            }
            ${
              planetData.planet?.quality === "PHENOMENAL"
                ? "text-orange-600"
                : ""
            }
            `}
          >
            {planetData.planet?.quality}
          </h2>
        </div>

        <h3 className="text-[18px] tracking-tighter text-pbtext-500">
          {formatLargeNumberToString(planetData.planet?.surfaceArea ?? 0)}
          <sup>2</sup> km
        </h3>
        {variant === "listing" ?? (
          <h3 className="mt-0.5 text-[18px] tracking-tighter text-pbtext-700">
            ${formatNumberToStringWithCommas(planetData.listPrice ?? 0)}
          </h3>
        )}
      </Link>
    </div>
  );
}
