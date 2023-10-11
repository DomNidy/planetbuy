import Head from "next/head";
import { api } from "~/utils/api";
import { signIn, signOut, useSession } from "next-auth/react";
import PlanetListing from "~/components/PlanetListing";

export default function Home() {
  const { data: sessionData } = useSession();

  const allPlanets = api.planet.getAllPlanets.useQuery({
    limit: 5,
  });

  function createPlanet() {
    api.planet.createPlanetListing.useMutation().mutate({
      listPrice: 3000,
      name: "Cool planet",
      surfaceArea: 499190,
    });
  }

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
      <main className="flex min-h-screen flex-col  bg-slate-900">
        <nav className="mx-auto flex h-48 w-full flex-col ">
          <h1 className={` text-3xl -tracking-tight text-slate-50`}>
            PlanetBuy
          </h1>
        </nav>
        <button
          className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
          onClick={sessionData ? () => void signOut() : () => void signIn()}
        >
          {sessionData ? "Sign out" : "Sign in"}
        </button>
        <button
          onClick={() => createPlanet}
          className="w-fit rounded-lg bg-slate-100 p-4"
        >
          Create planet
        </button>
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
        <div className="flex flex-col items-center gap-2">
          <AuthShowcase />
        </div>
      </main>
    </>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();

  const { data } = api.user.getBalance.useQuery(undefined, {
    enabled: sessionData?.user !== undefined,
  });

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {data?.balance && <span> - {data.balance}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}
