import { useQueryClient } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { Check, ShoppingCart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { useToast } from "~/components/ui/use-toast";
import { ShoppingCartContext } from "~/context/ShoppingCartContext";
import { api, getBaseUrl } from "~/utils/api";
import { formatNumberToStringWithCommas } from "~/utils/utils";

export default function Checkout() {
  const session = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const shoppingCart = useContext(ShoppingCartContext);
  const queryClient = useQueryClient();
  const checkoutCart = api.user.checkoutCart.useMutation({
    onSuccess() {
      void queryClient.refetchQueries([
        ["user", "getCartItems"],
        { type: "query" },
      ]);
      void queryClient.refetchQueries([
        ["user", "getBalance"],
        { type: "query" },
      ]);
    },
    // TODO: Handle the error for when a user tries to checkout with an empty cart or cart is too large
    onError(err) {
      if (err instanceof TRPCClientError) {
        toast({
          title: "Failed to checkout",
          description: err.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to checkout",
          description: "Something went wrong, please try again later",
          variant: "destructive",
        });
      }
    },
  });

  // Redirect user to signin page if they are not signed in
  useEffect(() => {
    if (session.status !== "authenticated") {
      void router.replace(`${getBaseUrl()}/auth/signin`);
    }
  });

  return (
    <main className="flex min-h-screen  flex-col items-center gap-4 bg-pbdark-800 pt-32 ">
      <div className="flex flex-col gap-2">
        {shoppingCart.cart &&
          Object.values(shoppingCart.cart).map((cartItem) => (
            <div
              className="flex w-80 flex-row justify-between rounded-md bg-pbprimary-100 p-2 shadow-md"
              key={cartItem.listing.planet.id}
            >
              <h2 className="font-semibold">
                Planet:{" "}
                <span className="font-medium">
                  {cartItem.listing.planet.name}
                </span>
              </h2>
              <h2 className="font-semibold">
                Price:{" "}
                <span className="font-medium">
                  ${formatNumberToStringWithCommas(cartItem.listing.listPrice)}
                </span>
              </h2>

              <Button
                variant={"destructive"}
                onClick={() =>
                  shoppingCart.removeItemFromCart(cartItem.listing.id, () => {
                    return;
                  })
                }
              >
                Remove from cart
              </Button>
            </div>
          ))}
      </div>
      {(shoppingCart?.cart?.length ?? -1) > 0 && (
        <>
          <div className="flex w-80 gap-1 rounded-md bg-pbprimary-100 p-2">
            Total:
            <span className="font-semibold">
              {"  "}$
              {formatNumberToStringWithCommas(
                shoppingCart.cart?.reduce((acc: number, listing) => {
                  return acc + listing.listing.listPrice!;
                }, 0) ?? 0,
              )}
            </span>
          </div>
          <Button
            className={`w-42 group pointer-events-auto flex cursor-pointer items-center 
        rounded-md bg-pbprimary-100 p-2 opacity-100 transition-all   hover:bg-pbprimary-100/90 `}
            onClick={() => {
              if (
                shoppingCart.cart &&
                Object.keys(shoppingCart.cart).length > 0
              ) {
                checkoutCart.mutate();
              }
            }}
          >
            <p className="font-medium text-pbdark-850 ">Checkout</p>
            <ShoppingCart
              className="relative cursor-pointer p-1 text-pbdark-850 transition-transform duration-75 "
              width={32}
              height={32}
            />
          </Button>
        </>
      )}

      {!shoppingCart?.cart && checkoutCart.status !== "success" && (
        <p className="text-center text-pbtext-500">Your cart is empty.</p>
      )}

      {checkoutCart.status === "loading" && (
        <p className="text-center text-pbtext-500">Processing...</p>
      )}

      {checkoutCart.status === "success" && (
        <div className="flex flex-row items-center justify-center gap-2 text-2xl font-medium text-pbtext-500 sm:text-3xl">
          <Check
            className="aspect-square h-7 w-7 rounded-full bg-green-500 sm:h-8 sm:w-8"
            color="white"
          />
          <p>Thanks for your purchase!</p>
        </div>
      )}
    </main>
  );
}
