import { type Planet } from "@prisma/client";
import { UseTRPCQueryResult } from "@trpc/react-query/shared";
import { createContext, useEffect, useState } from "react";
import { RouterOutputs, api } from "~/utils/api";

type CartCTX = {
  cart?: RouterOutputs["user"]["getCartItems"];
  addItemToCart: (itemId: string) => void;
};

export const ShoppingCartContext = createContext<CartCTX>({
  addItemToCart() {
    return;
  },
  cart: [],
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

  const addItemMutation = api.user.addItemToCart.useMutation();

  const addItemToCart = (itemId: string) =>
    addItemMutation.mutate({ itemId: itemId });

  return (
    <ShoppingCartContext.Provider
      value={{
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        cart: cartItemsQuery.data ? cartItemsQuery.data : [],

        addItemToCart: addItemToCart,
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
}
