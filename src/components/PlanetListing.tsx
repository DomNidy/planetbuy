/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { type Planet } from "@prisma/client";
import { useContext } from "react";
import { ShoppingCartContext } from "~/context/ShoppingCartContext";
import { RouterOutputs } from "~/utils/api";

export default function PlanetListing(
  planetData: RouterOutputs["planet"]["getAllPurchasablePlanets"][number],
) {
  const shoppingCart = useContext(ShoppingCartContext);

  return (
    <div className="w-fit rounded-lg bg-slate-800 p-8">
      <h2 className="font-semibold">
        Planet: <span className="font-medium">{planetData.planet.name}</span>
      </h2>
      <h2 className="font-semibold">
        Price: <span className="font-medium">{planetData.listPrice}</span>
      </h2>
      <h2 className="font-semibold">
        List Date:{" "}
        <span className="font-medium">
          {planetData.planet.listing?.listDate.toISOString()}
        </span>
      </h2>{" "}
      <h2 className="font-semibold">
        Discovery Date:{" "}
        <span className="font-medium">
          {planetData.planet.discoveryDate.toISOString()}
        </span>
      </h2>
      <h2 className="font-semibold">
        Surface Area:{" "}
        <span className="font-medium">{planetData.planet.surfaceArea}</span>
      </h2>
      <button
        className=" rounded-md bg-white p-2 hover:bg-slate-200"
        onClick={() =>
          shoppingCart.addItemToCart(planetData.planet.listing!.id)
        }
      >
        Add to cart
      </button>
    </div>
  );
}
