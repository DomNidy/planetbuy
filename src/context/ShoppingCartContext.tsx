import { useQueryClient } from "@tanstack/react-query";
import { type SetStateAction, createContext, useEffect, useState } from "react";
import { useToast } from "~/components/ui/use-toast";
import { type RouterOutputs, api } from "~/utils/api";

type CartCTX = {
  cart?: RouterOutputs["user"]["getCartItems"];
  addItemToCart: (
    planetData: RouterOutputs["planet"]["getAllPurchasablePlanets"]["items"][number],
    setIsOptimisticCallback: (value: SetStateAction<boolean>) => void,
  ) => void;
  removeItemFromCart: (
    itemId: string,
    setIsOptimisticCallback: (value: SetStateAction<boolean>) => void,
  ) => void;
  isItemInCart: (itemId: string) => boolean;
};

export const ShoppingCartContext = createContext<CartCTX>({
  isItemInCart() {
    throw Error("Not implemented");
  },
  addItemToCart() {
    throw Error("Not implemented");
  },
  removeItemFromCart() {
    throw Error("Not implemented");
  },
  cart: [],
});

export default function ShoppingCartProvider({
  children,
}: {
  children: JSX.Element[];
}) {
  // Shadcn toaster component used to display error messages received from backend
  const { toast } = useToast();

  const queryClient = useQueryClient();

  // Cart item state is retrieved from api
  const cartItemsQuery = api.user.getCartItems.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const addItemMutation = api.user.addItemToCart.useMutation({
    onMutate: async (item) => {
      // Cancel outgoing refetches so they dont overwrite our optimistic update
      await queryClient.cancelQueries([
        ["user", "getCartItems"],
        { type: "query" },
      ]);

      // Create a copy of the previous cart state before updating it optimistically
      const previousCart: RouterOutputs["user"]["getCartItems"] | undefined =
        queryClient.getQueryData([["user", "getCartItems"], { type: "query" }]);

      queryClient.setQueryData([["user", "getCartItems"], { type: "query" }], [
        {
          id: `LOADING${item.listingId}`,
          listing: { id: item.listingId, listPrice: 0, planet: {} },
        },
        ...(previousCart ?? []),
      ] as RouterOutputs["user"]["getCartItems"]);
      return { previousCart, item };
    },
    onError: (error, itemAdded, context) => {
      // Roll back cart to previous state on error
      queryClient.setQueryData(
        [["user", "getCartItems"], { type: "query" }],
        context?.previousCart,
      );
    },
    onSettled: async () => {
      // Refetch data after settled
      return await queryClient.invalidateQueries([
        ["user", "getCartItems"],
        { type: "query" },
      ]);
    },
  });

  const removeItemMutation = api.user.removeItemFromCart.useMutation({
    onMutate: async ({ listingId }) => {
      await queryClient.cancelQueries([
        ["user", "getCartItems"],
        { type: "query" },
      ]);

      // Create a copy of the previous cart state before updating it optimistically
      const previousCart: RouterOutputs["user"]["getCartItems"] | undefined =
        queryClient.getQueryData([["user", "getCartItems"], { type: "query" }]);

      // Update query data to exclude the removed item (for optimistic update)
      queryClient.setQueryData(
        [["user", "getCartItems"], { type: "query" }],
        previousCart?.filter((item) => item.listing.id != listingId),
      );
      return { previousCart, listingId };
    },
    onError: (error, item, context) => {
      toast({
        title: "Failed to remove item from cart",
        description: `${error.message}`,
        variant: "destructive",
      });

      queryClient.setQueryData(
        [["user", "getCartItems"], { type: "query" }],
        context?.previousCart,
      );
    },
    onSettled: async () => {
      // Refetch cartItems data from the server
      return await queryClient.invalidateQueries([
        ["user", "getCartItems"],
        { type: "query" },
      ]);
    },
  });

  // Wrapper functions around mutations, these are made available to outter context
  const addItemToCart = (
    planetData: RouterOutputs["planet"]["getAllPurchasablePlanets"]["items"][number],
    setIsOptimisticCallback: (value: SetStateAction<boolean>) => void,
  ) => {
    if (!planetData?.planet?.listing?.id) {
      toast({
        title: "Failed to add item to cart, please try again.",
        description:
          "We couldn't add this item to your cart, an internal error occured. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    console.log(`Adding item with id ${planetData.planet.listing.id} to cart.`);
    addItemMutation
      .mutateAsync({ listingId: planetData.planet.listing.id })
      .then(() => setIsOptimisticCallback(false))
      .catch((err) => {
        setIsOptimisticCallback(false);
        console.error(
          "Error occured in addItemMutation request",
          JSON.stringify(err),
        );
      });
  };

  const removeItemFromCart = (
    listingId: string,
    setIsOptimisticCallback: (value: SetStateAction<boolean>) => void,
  ) => {
    removeItemMutation
      .mutateAsync({
        listingId: listingId,
      })
      .then(() => setIsOptimisticCallback(false))
      .catch(() => {
        setIsOptimisticCallback(false);
        console.log("Error occured in removeItemMutation request");
      });
  };

  // Returns true if an item is present in our shopping cart
  // Returns false if the item is not present
  function isItemInCart(itemId: string): boolean {
    if (!cartItemsQuery.data) {
      return false;
    }

    for (const item of cartItemsQuery.data) {
      if (item.listing.id == itemId) {
        return true;
      }
    }
    return false;
  }

  return (
    <ShoppingCartContext.Provider
      value={{
        cart: cartItemsQuery.data,
        addItemToCart: addItemToCart,
        removeItemFromCart: removeItemFromCart,
        isItemInCart: isItemInCart,
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
}
