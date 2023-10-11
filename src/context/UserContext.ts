import { Planet, User } from "@prisma/client";
import { createContext } from "react";

type UserContext = {
  user?: User;
  cartItems?: Planet[];
};

export const UserContext = createContext<UserContext>({});
