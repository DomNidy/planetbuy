import { type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { api } from "~/utils/api";

import "~/styles/globals.css";
import { Poppins, Pixelify_Sans } from "next/font/google";
import Navbar from "../components/Navbar";
import ShoppingCartProvider from "../context/ShoppingCartContext";
import React from "react";
import { TailwindIndicator } from "~/components/TailwindIndicator";

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
      <ShoppingCartProvider>
        <Navbar />
        <TailwindIndicator />
        <div className={`${poppins.className}`}>
          <Component {...pageProps} />
        </div>
      </ShoppingCartProvider>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
