/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { api, getBaseUrl } from "~/utils/api";
import { Cross2Icon, PersonIcon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState, useContext } from "react";
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
  PackagePlus,
  ShoppingBagIcon,
} from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="fixeds top-0 z-50  flex w-full justify-between  p-4 text-black shadow-md  sm:p-10 sm:px-32">
      <Link
        href={`${getBaseUrl()}/`}
        className={` text-pl cursor-pointer text-3xl font-bold tracking-tighter text-pbprimary-500 `}
      >
        PlanetBuy
      </Link>

      <div className=" flex flex-col items-center gap-2">
        <AuthDisplay />
      </div>
    </div>
  );
}
function AuthDisplay() {
  const router = useRouter();
  const shoppingCart = useContext(ShoppingCartContext);
  const { data: sessionData } = useSession();

  const { data } = api.user.getBalance.useQuery(undefined, {
    enabled: sessionData?.user !== undefined,
  });

  useEffect(() => {
    console.log("re");
  }, [shoppingCart.itemCount]);

  return (
    <div className=" flex  flex-row items-center justify-center rounded-md text-black">
      <div className="text-base ">
        {sessionData && (
          <div className="mr-4 flex items-center rounded-full bg-pbprimary-700 p-2 text-slate-50 transition hover:bg-pbprimary-500">
            <ShoppingBagIcon className="mr-2 h-4 w-4"></ShoppingBagIcon>
            <span
              className="cursor-pointer"
              onClick={() => router.push(`${getBaseUrl()}/checkout`)}
            >
              Cart {`(${shoppingCart.itemCount ?? 0})`}
            </span>
          </div>
        )}
      </div>

      {sessionData ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex h-9 
                w-9 items-center justify-center  rounded-full 
              bg-pbprimary-700 font-semibold text-black no-underline transition hover:bg-pbprimary-500`}
            >
              <PersonIcon className="h-5 w-5 rounded-full text-slate-50"></PersonIcon>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mr-2 w-fit rounded-lg border-pbneutral-500 bg-white p-2 text-lg text-pbtext-700">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link
                  href={`${getBaseUrl()}/profile/${sessionData.user.id}`}
                  className="flex"
                >
                  <PersonIcon className="mr-2 h-4 w-4"></PersonIcon>
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Container className="mr-2 h-4 w-4" />
                <span>Your Planets</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuLabel>Marketplace</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link className="flex" href={`${getBaseUrl()}/create-listing`}>
                  <Gavel className="mr-2 h-4 w-4" />
                  <span>Create a Listing</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  href={`${getBaseUrl()}/profile/${
                    sessionData.user.id
                  }/listings`}
                  className="flex"
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  <span>Your Listings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <div className="flex" onClick={() => void signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          className={`rounded-lg bg-pbprimary-700 px-4
          py-2 font-semibold text-slate-50 no-underline transition hover:bg-pbprimary-500`}
          onClick={() => void signIn()}
        >
          Sign in
        </button>
      )}
    </div>
  );
}
