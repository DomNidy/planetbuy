import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { api } from "~/utils/api";

import "~/styles/globals.css";
import { Poppins, Pixelify_Sans } from "next/font/google";
import Navbar from "../components/Navbar";
import ShoppingCartProvider from "../context/ShoppingCartContext";
import { Toaster } from "~/components/ui/toaster";
import React from "react";
import { TailwindIndicator } from "~/components/TailwindIndicator";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
export const pixelifySans = Pixelify_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={useQueryClient()}>
        <ShoppingCartProvider>
          <Navbar />
          <TailwindIndicator />
          <div className={`${poppins.className}`}>
            <Component {...pageProps} />
            <Toaster />
          </div>
          <ReactQueryDevtools />
        </ShoppingCartProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
