"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { api, getBaseUrl } from "~/utils/api";
import { PersonIcon } from "@radix-ui/react-icons";
import { useContext } from "react";
import { ShoppingCartContext } from "~/context/ShoppingCartContext";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  ClipboardList,
  Container,
  Gavel,
  LogOut,
  ShoppingBagIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { formatNumberToStringWithCommas } from "~/utils/utils";

export default function Navbar() {
  return (
    <div className="absolute  w-full  ">
      <div className=" relative top-0 z-10 flex w-full flex-row  justify-between bg-gradient-to-b from-pbdark-800 to-transparent p-4 text-black  sm:p-5 sm:px-16 md:p-10 md:px-32">
        <Link
          href={`${getBaseUrl()}/`}
          className={` text-pl cursor-pointer text-3xl font-bold tracking-tighter text-pbtext-500 `}
        >
          PlanetBuy
        </Link>

        <div className={`flex flex-col items-center gap-2`}>
          <AuthDisplay />
        </div>
      </div>
    </div>
  );
}
function AuthDisplay() {
  const router = useRouter();
  const shoppingCart = useContext(ShoppingCartContext);
  const { data: sessionData } = useSession();

  const userBalance = api.user.getBalance.useQuery(undefined, {
    enabled: sessionData?.user !== undefined,
  });

  return (
    <div
      className={`flex flex-row items-center justify-center rounded-md text-black`}
    >
      <div className="text-base ">
        {sessionData && (
          <div className="flex flex-row gap-2">
            <div className="mr-4 hidden cursor-default items-center gap-1 rounded-full bg-pbprimary-100 p-2 font-medium text-pbdark-800 transition sm:flex ">
              Balance:{" "}
              <span className=" ">
                $
                {formatNumberToStringWithCommas(
                  userBalance?.data?.balance ?? 0,
                )}
              </span>
            </div>
            <div
              className="mr-4 flex cursor-pointer items-center rounded-full border-2 border-transparent bg-pbprimary-100 p-2 text-pbdark-800 transition 
              hover:border-pbprimary-100 hover:bg-pbdark-800 hover:text-white "
              onClick={() => router.push(`${getBaseUrl()}/checkout`)}
            >
              <ShoppingBagIcon className="mr-2 h-4 w-4"></ShoppingBagIcon>
              <span>
                Cart {`(${shoppingCart.cart ? shoppingCart.cart.length : 0})`}
              </span>
            </div>
          </div>
        )}
      </div>

      {sessionData ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className={`hover:bg-primary-700 group flex
              h-9  w-9  items-center justify-center rounded-full border-2 bg-pbprimary-100 p-0  font-semibold
              text-black no-underline transition hover:border-pbprimary-100 hover:bg-pbdark-800`}
            >
              <PersonIcon className="h-5 w-5 rounded-full text-black group-hover:text-white "></PersonIcon>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mr-2 w-fit rounded-lg  p-2 text-lg ">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem className="">
                <Link
                  href={`${getBaseUrl()}/profile/${sessionData.user.id}`}
                  className="flex w-full items-center"
                >
                  <PersonIcon className="mr-2 h-4 w-4"></PersonIcon>
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href={`${getBaseUrl()}/profile/${sessionData.user.id}`}
                  className="flex w-full items-center"
                >
                  <Container className="mr-2 h-4 w-4" />
                  <span>Your Planets</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuLabel>Marketplace</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link
                  className="flex w-full items-center  "
                  href={`${getBaseUrl()}/create-listing`}
                >
                  <Gavel className="mr-2 h-4 w-4" />
                  <span>Create a Listing</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href={`${getBaseUrl()}/profile/${
                    sessionData.user.id
                  }/listings`}
                  className="flex w-full items-center"
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  <span>Your Listings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex items-center" onClick={() => void signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          className={`rounded-lg border-2 border-pbtext-500 border-opacity-0 bg-pbprimary-100 px-4 py-2  font-semibold
          text-pbdark-850 no-underline transition hover:border-opacity-100 hover:bg-pbdark-800 hover:text-pbtext-500`}
          onClick={() => void signIn()}
        >
          Sign in
        </button>
      )}
    </div>
  );
}
