/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ShoppingCartIcon, Star, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { ShoppingCartContext } from "~/context/ShoppingCartContext";
import { env } from "~/env.mjs";

import { getBaseUrl, type RouterOutputs } from "~/utils/api";
import {
  formatLargeNumberToString,
  formatNumberToStringWithCommas,
} from "~/utils/utils";

export default function PlanetCard({
  planetData,
  variant,
}: {
  planetData: RouterOutputs["planet"]["getPlanetListings"]["items"][number];
  variant: "listing" | "showcase";
}) {
  const router = useRouter();
  const shoppingCart = useContext(ShoppingCartContext);
  const session = useSession();
  // Whether or not this planet card is in an optimistic state (if it is showing optimistic data while an outbound request is processing)
  const [isOptimistic, setIsOptimistic] = useState<boolean>(false);

  // Whether or not the user owns the planet assosciated with this card
  const [isUserOwner] = useState<boolean>(
    planetData.planet.owner?.id === session.data?.user.id &&
      !!session.data?.user,
  );

  return (
    <div>
      {/** Planet image here */}

      <div
        className="relative mb-4 aspect-square
       rounded-2xl "
      >
        {planetData?.planet?.planetImage.bucketPath && (
          <Image
            src={`${env.NEXT_PUBLIC_BUCKET_URL}/${planetData?.planet?.planetImage.bucketPath}`}
            alt=""
            priority
            onClick={() =>
              router.push(
                `${
                  variant === "listing"
                    ? `${getBaseUrl()}/listing/${planetData.planet?.listing
                        ?.id}`
                    : `${getBaseUrl()}/planet/${planetData.planet?.id}`
                } `,
              )
            }
            quality={75}
            blurDataURL={`${env.NEXT_PUBLIC_BUCKET_URL}/${planetData?.planet?.planetImage.bucketPath}`}
            placeholder="blur"
            fill
            className="cursor-pointer rounded-lg"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        {planetData.planet.listing?.id &&
        variant === "listing" &&
        shoppingCart.isItemInCart(planetData.planet.listing.id) ? (
          <div
            onClick={() => {
              if (planetData.planet?.listing?.id && !isOptimistic) {
                setIsOptimistic(true);
                shoppingCart.removeItemFromCart(
                  planetData.planet.listing.id,
                  setIsOptimistic,
                );
              }
            }}
            className={`${
              isOptimistic
                ? "pointer-events-none opacity-70"
                : "pointer-events-auto opacity-100"
            } w-42 group absolute right-1 top-1 flex cursor-pointer items-center rounded-md bg-pbdark-850 p-2 transition-all hover:bg-red-500 `}
          >
            <p className="font-medium text-white">In cart</p>
            <X
              className="relative cursor-pointer rounded-full p-1 transition-transform duration-75 group-hover:scale-110 "
              width={32}
              height={32}
              color="white"
            />
          </div>
        ) : (
          <>
            {!isUserOwner && variant === "listing" && (
              <>
                <ShoppingCartIcon
                  color="white"
                  onClick={() => {
                    // Add item to card if the listing assosciated with this planet has an id
                    if (planetData && !isOptimistic) {
                      setIsOptimistic(true);
                      shoppingCart.addItemToCart(planetData, setIsOptimistic);
                    }
                  }}
                  className={`${
                    isOptimistic
                      ? "pointer-events-none opacity-80"
                      : "pointer-events-auto opacity-100"
                  } absolute 
             right-1 top-1 cursor-pointer transition-transform duration-75 hover:scale-110 `}
                  width={32}
                  height={32}
                  fill="rgba(255,255,255,0.3)"
                />
              </>
            )}
            {isUserOwner &&
              variant === "listing" &&
              planetData.planet.listing?.id && (
                <Link
                  className="absolute right-1 top-1 cursor-pointer rounded-lg bg-pbdark-850 p-3 text-center font-semibold  text-pbtext-500 transition-all hover:bg-pbtext-500 hover:text-pbdark-850"
                  href={`${getBaseUrl()}/listing/${planetData.planet?.listing
                    ?.id}`}
                >
                  Edit listing
                </Link>
              )}
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
        <div className="flex w-full justify-between ">
          <h2 className=" text-[22px] font-semibold leading-6 tracking-tighter text-pbtext-500 ">
            {planetData.planet?.name}
          </h2>

          <div className="flex basis-6 items-start justify-end">
            <Star
              width={20}
              height={20}
              className={` ${
                planetData.planet.quality === "COMMON" &&
                "fill-pbaccent-common stroke-pbaccent-common"
              }
              ${
                planetData.planet.quality === "UNIQUE" &&
                "fill-pbaccent-uncommon stroke-pbaccent-uncommon"
              }
              ${
                planetData.planet.quality === "RARE" &&
                "fill-pbaccent-rare stroke-pbaccent-rare"
              }
              ${
                planetData.planet.quality === "OUTSTANDING" &&
                "fill-pbaccent-outstanding stroke-pbaccent-outstanding"
              }
              ${
                planetData.planet.quality === "PHENOMENAL" &&
                "fill-pbaccent-phenomenal stroke-pbaccent-phenomenal"
              }`}
            />
          </div>
        </div>

        <h3 className="text-[18px] tracking-tighter text-pbtext-700">
          {formatLargeNumberToString(planetData.planet?.surfaceArea ?? 0)}
          <sup>2</sup> km
        </h3>
        {variant === "listing" && (
          <h3 className="mt-0.5 text-[18px] font-bold tracking-tighter text-pbtext-500">
            $
            {formatNumberToStringWithCommas(
              Math.round(planetData.listPrice ?? 0),
            )}
          </h3>
        )}
      </Link>
    </div>
  );
}
