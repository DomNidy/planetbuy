import { createContext, useEffect, useState } from "react";
import { type RouterOutputs, api } from "~/utils/api";

type CartCTX = {
  cart?: RouterOutputs["user"]["getCartItems"];
  addItemToCart: (itemId: string) => void;
  itemCount: number;
};

export const ShoppingCartContext = createContext<CartCTX>({
  addItemToCart() {
    return;
  },
  cart: [],
  itemCount: 0,
});

// I want to use this to persist the shopping cart state across multiple page routes
// This should provide functionality to add items to shopping cart
// This should provide functionality to checkout from the shopping cart

export default function ShoppingCartProvider({
  children,
}: {
  children: JSX.Element[];
}) {
  // Cart item state is retrieved from api
  const cartItemsQuery = api.user.getCartItems.useQuery(undefined, {});

  const addItemMutation = api.user.addItemToCart.useMutation({
    onMutate: () => {
      // As soon as we send out the request, increment the cart item count
      setCartItemCount((past) => past + 1);
    },
    onError: () => {
      // If the request fails, decrement the cart item count
      setCartItemCount((past) => past - 1);
    },
  });

  // Stores the amount of items in cart, if the query has no data, return 0
  const [cartItemCount, setCartItemCount] = useState<number>(
    cartItemsQuery ? cartItemsQuery.data?.length ?? 0 : 0,
  );

  // This function is made available outside the context
  const addItemToCart = (itemId: string) =>
    addItemMutation.mutate({ itemId: itemId });

  // Whenever the data from our query changes, update the cart item count accordingly
  useEffect(() => {
    if (cartItemsQuery.data) {
      setCartItemCount(cartItemsQuery.data.length);
    }
  }, [cartItemsQuery.data]);

  return (
    <ShoppingCartContext.Provider
      value={{
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        cart: cartItemsQuery.data ? cartItemsQuery.data : [],
        itemCount: cartItemCount,
        addItemToCart: addItemToCart,
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
}
