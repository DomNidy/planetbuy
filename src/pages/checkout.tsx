import { useContext } from "react";
import { Button } from "~/components/ui/button";
import { ShoppingCartContext } from "~/context/ShoppingCartContext";
import { api } from "~/utils/api";

export default function Checkout() {
  const shoppingCart = useContext(ShoppingCartContext);
  const checkoutCart = api.user.checkoutCart.useMutation();

  return (
    <main className="mt-8 flex min-h-screen flex-col items-center gap-4 ">
      <h1>Here are your items:</h1>
      <div className="flex flex-col gap-2">
        {shoppingCart?.cart?.map((cartItem) => (
          <div
            className="rounded-md bg-pbprimary-100 p-2 shadow-md"
            key={cartItem.listing.planet.name}
          >
            <h2 className="font-semibold">
              Planet:{" "}
              <span className="font-medium">
                {cartItem.listing.planet.name}
              </span>
            </h2>
            <h2 className="font-semibold">
              Price:{" "}
              <span className="font-medium">{cartItem.listing.listPrice}</span>
            </h2>
            <h2 className="font-semibold">
              Seller:{" "}
              <span className="font-medium">
                {cartItem.listing.planet.ownerId}
              </span>
            </h2>
            <Button
              variant={"destructive"}
              onClick={() =>
                shoppingCart.removeItemFromCart(cartItem.id)
              }
            >
              Remove from cart
            </Button>
          </div>
        ))}
      </div>
      <Button
        onClick={() => {
          if (shoppingCart.cart && shoppingCart.cart?.length > 0) {
            checkoutCart.mutate({
              listingIDS: shoppingCart?.cart.map((item) => item.listing.id),
            });
          }
        }}
      >
        Checkout
      </Button>
    </main>
  );
}
