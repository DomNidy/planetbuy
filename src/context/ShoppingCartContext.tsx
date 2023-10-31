import { createContext, useEffect, useState } from "react";
import { useToast } from "~/components/ui/use-toast";
import { type RouterOutputs, api } from "~/utils/api";

type CartCTX = {
  cart?: Record<string, RouterOutputs["user"]["getCartItems"][number]>;
  addItemToCart: (
    planetData: RouterOutputs["planet"]["getAllPurchasablePlanets"][number],
  ) => void;
  removeItemFromCart: (itemId: string) => void;
  isItemInCart: (itemId: string) => boolean;
  itemCount: number;
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
  cart: {},
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
  // Shadcn toaster component used to display error messages received from backend
  const { toast } = useToast();

  // Cart item state is retrieved from api
  const cartItemsQuery = api.user.getCartItems.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // We use this local state as it gives us an easier time dealing with optimistic cart item removals
  // * localCart is keyed with listing ids
  const [localCart, setLocalCart] = useState<
    Record<string, RouterOutputs["user"]["getCartItems"][number]> | undefined
  >();

  // Stores the amount of items in cart, if the query has no data, return 0
  const [cartItemCount, setCartItemCount] = useState<number>(
    cartItemsQuery ? cartItemsQuery.data?.length ?? 0 : 0,
  );

  const addItemMutation = api.user.addItemToCart.useMutation({
    // As soon as we send out the request, increment the cart item count (optimistic update)
    onMutate: (item) => {
      // Add a temporary item to local cart for optimistic update
      setLocalCart((past) => {
        return {
          ...(past
            ? {
                ...past,
                [item.listingId]: {
                  id: "Loading...",
                  listing: {
                    id: item.listingId,
                    listPrice: 0,
                    planet: {
                      discoveryDate: new Date(),
                      id: "Loading...",
                      name: "Loading...",
                      ownerId: "Loading...",
                      quality: "COMMON",
                      surfaceArea: 0,
                      temperature: "COLD",
                      terrain: "DESERTS",
                    },
                  },
                },
              }
            : {}),
        };
      });
      setCartItemCount((past) => past + 1);
    },
    onError: (error, itemAdded) => {
      // If the request fails, decrement the cart item count
      setCartItemCount((past) => past - 1);

      // Create a copy of the cart state and delete the itemId that was added during optimistic update
      const updatedMap = { ...localCart };
      delete updatedMap[itemAdded.listingId];
      setLocalCart(updatedMap);

      toast({
        title: "Failed to add item to cart",
        description: `${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Refetch cartItems data from the server
      void cartItemsQuery.refetch();
    },
  });

  const removeItemMutation = api.user.removeItemFromCart.useMutation({
    // As soon as we send out request, decriment cart item count (optimistic update)
    onMutate: ({ listingId }) => {
      // Create a copy of the cart state and delete the listingId from it
      const updatedMap = { ...localCart };
      delete updatedMap[listingId];
      setLocalCart(updatedMap);
      setCartItemCount((past) => (past - 1 < 0 ? 0 : past - 1));
    },
    onError: (error) => {
      setCartItemCount((past) => past + 1);
      toast({
        title: "Failed to remove item from cart",
        description: `${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Refetch cartItems data from the server
      void cartItemsQuery.refetch();
    },
  });

  // Wrapper functions around mutations, these are made available to outter context
  const addItemToCart = (
    planetData: RouterOutputs["planet"]["getAllPurchasablePlanets"][number],
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
    addItemMutation.mutate({ listingId: planetData.planet.listing.id });
  };

  const removeItemFromCart = (listingId: string) => {
    removeItemMutation.mutate({
      listingId: listingId,
    });
  };

  // Returns true if an item is present in our shopping cart
  // Returns false if the item is not present
  function isItemInCart(itemId: string): boolean {
    if (!localCart) {
      return false;
    }
    return !!localCart[itemId];
  }

  // Whenever the cartItemsQuery data from the server changes
  // Update the cart item count, and update the localCart data
  useEffect(() => {
    setLocalCart(
      (prevLocalCart) =>
        cartItemsQuery.data?.reduce(
          (updatedCart, item) => {
            updatedCart[item.listing.id] = item;
            return updatedCart;
          },
          { ...prevLocalCart },
        ) ?? {},
    );
    setCartItemCount(cartItemsQuery.data?.length ?? 0);
  }, [cartItemsQuery.data, cartItemsQuery.dataUpdatedAt]);

  return (
    <ShoppingCartContext.Provider
      value={{
        // * Notice here we are exporting the localCart state, not the actual react-query server fetched state
        // * We use the localCart state in order to perform optimistic item removals
        cart: localCart,
        itemCount: cartItemCount,
        addItemToCart: addItemToCart,
        removeItemFromCart: removeItemFromCart,
        isItemInCart: isItemInCart,
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
}
