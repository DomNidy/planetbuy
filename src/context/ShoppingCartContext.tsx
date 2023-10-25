import { createContext, useEffect, useState } from "react";
import { useToast } from "~/components/ui/use-toast";
import { type RouterOutputs, api } from "~/utils/api";

type CartCTX = {
  cart?: RouterOutputs["user"]["getCartItems"];
  addItemToCart: (itemId: string) => void;
  removeItemFromCart: (itemId: string) => void;
  itemCount: number;
};

export const ShoppingCartContext = createContext<CartCTX>({
  addItemToCart() {
    throw Error("Not implemented");
  },
  removeItemFromCart() {
    throw Error("Not implemented");
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
  // Shadcn toaster component used to display error messages received from backend
  const { toast } = useToast();

  // Cart item state is retrieved from api
  const cartItemsQuery = api.user.getCartItems.useQuery(undefined, {
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // We use this local state as it gives us an easier time dealing with optimistic cart item removals
  const [localCart, setLocalCart] = useState<
    RouterOutputs["user"]["getCartItems"] | undefined
  >();

  const addItemMutation = api.user.addItemToCart.useMutation({
    // As soon as we send out the request, increment the cart item count (optimistic update)
    onMutate: () => {
      setCartItemCount((past) => past + 1);
    },
    onError: (error) => {
      // If the request fails, decrement the cart item count
      setCartItemCount((past) => past - 1);
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
    onMutate: ({ itemId }) => {
      // Remove item from local cart (for optimistic deletion)
      setLocalCart((past) => {
        if (past) {
          return past.filter((item) => item.id != itemId);
        }
        return [];
      });
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

  // Stores the amount of items in cart, if the query has no data, return 0
  const [cartItemCount, setCartItemCount] = useState<number>(
    cartItemsQuery ? cartItemsQuery.data?.length ?? 0 : 0,
  );

  // Wrapper functions around mutations, these are made available to outter context
  const addItemToCart = (itemId: string) => {
    addItemMutation.mutate({ itemId: itemId });
  };

  const removeItemFromCart = (itemId: string) => {
    removeItemMutation.mutate({
      itemId: itemId,
    });
  };

  // Whenever the cartItemsQuery data from the server changes
  // Update the cart item count, and update the localCart data
  useEffect(() => {
    setLocalCart(cartItemsQuery.data);
    setCartItemCount(cartItemsQuery.data?.length ?? 0);
  }, [cartItemsQuery.data]);

  return (
    <ShoppingCartContext.Provider
      value={{
        // * Notice here we are exporting the localCart state, not the actual react-query server fetched state
        // * We use the localCart state in order to perform optimistic item removals
        cart: localCart,
        itemCount: cartItemCount,
        addItemToCart: addItemToCart,
        removeItemFromCart: removeItemFromCart,
      }}
    >
      {children}
    </ShoppingCartContext.Provider>
  );
}
