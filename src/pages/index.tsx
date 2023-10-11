import Head from "next/head";
import { api } from "~/utils/api";
import { signIn, signOut, useSession } from "next-auth/react";
import PlanetListing from "~/components/PlanetListing";
import Navbar from "~/components/Navbar";

export default function Home() {
  const { data: sessionData } = useSession();

  const allPlanets = api.planet.getAllPlanets.useQuery({
    limit: 5,
  });

  return (
    <>
      <Head>
        <title>
          PlanetBuy - Your favorite extraterrestrial realty marketplace!
        </title>
        <meta
          name="description"
          content="Your favorite extraterrestrial realty marketplace!"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center  bg-slate-900">
        {allPlanets.data ? (
          allPlanets.data.map((planetData, idx) => (
            <PlanetListing
              User={planetData.User ?? { name: "Unknown seller" }}
              discoveryDate={planetData.discoveryDate}
              listPrice={planetData.listPrice}
              planetName={planetData.name}
              postedDate={planetData.postedDate}
              surfaceArea={planetData.surfaceArea}
              key={idx}
            />
          ))
        ) : (
          <>No planet data found.</>
        )}
        
      </main>
    </>
  );
}

