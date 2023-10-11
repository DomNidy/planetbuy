import { signIn, signOut, useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { HamburgerMenuIcon, Cross2Icon } from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const session = useSession();

  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((e) => {
      if (e[0] && e[0]?.target.clientWidth > 640) {
        setDropdownOpen(false);
      }
    });

    resizeObserver.observe(docRef.current as Element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  if (dropdownOpen) {
    return (
      <div className="fixed top-0 flex w-full flex-row-reverse bg-slate-950 p-4 text-slate-50 sm:p-10">
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="ml-auto  flex h-7 w-7 cursor-pointer items-center justify-center rounded-full p-1 hover:bg-white/30 sm:hidden "
        >
          <Cross2Icon width={25} height={25} />
        </div>
        <div className="flex flex-row ">
          <AuthDisplay />
        </div>
      </div>
    );
  }
  return (
    <div
      className="fixed top-0 mb-auto flex w-full bg-slate-950 p-4 text-slate-50 sm:p-10"
      ref={docRef}
    >
      <div className="flex grow flex-col gap-y-0.5">
        <h1 className={`  text-2xl font-semibold -tracking-tight `}>
          PlanetBuy
        </h1>
        <p className="hidden sm:block">The planet marketplace</p>
      </div>

      <div className="hidden flex-col items-center gap-2 sm:flex">
        <AuthDisplay />
      </div>
      <div
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full p-1 hover:bg-white/30 sm:hidden "
      >
        <HamburgerMenuIcon width={25} height={25} />
      </div>
    </div>
  );
}
function AuthDisplay() {
  const { data: sessionData } = useSession();

  const { data } = api.user.getBalance.useQuery(undefined, {
    enabled: sessionData?.user !== undefined,
  });

  return (
    <div className="flex flex-col  items-start justify-center ">
      <p className=" text-base text-slate-50">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
      </p>
      <p className="text-base text-slate-50">
        {sessionData && <span>Balance: ${data?.balance}</span>}
      </p>
      <p className="text-base text-slate-50">
        {sessionData && <span>Cart (0)</span>}
      </p>

      <button
        className="mt-1 rounded-lg bg-white/10 px-4 py-2 font-semibold text-slate-50 no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}
