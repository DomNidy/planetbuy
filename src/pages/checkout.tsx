import { Planet } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useContext } from "react";
import { ShoppingCartContext } from "~/context/ShoppingCartContext";

export default function Checkout() {
  const shoppingCart = useContext(ShoppingCartContext);

  return (
    <main className="flex min-h-screen flex-row items-center justify-center gap-4  bg-slate-900">
      <h1>Here are your items:</h1>
      <div className="flex flex-col gap-2">
        {shoppingCart?.cart?.map((cartItem, idx) => (
          <div
            className="rounded-md bg-slate-800 p-2"
            key={cartItem.planet.name}
          >
            <h2 className="font-semibold">
              Planet:{" "}
              <span className="font-medium">{cartItem.planet.name}</span>
            </h2>
            <h2 className="font-semibold">
              Price: <span className="font-medium">{cartItem.listPrice}</span>
            </h2>
            <h2 className="font-semibold">
              Seller:{" "}
              <span className="font-medium">{cartItem.planet.owner?.name}</span>
            </h2>
          </div>
        ))}
      </div>
    </main>
  );
}
