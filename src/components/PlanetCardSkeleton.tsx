export default function PlanetCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 opacity-50">
      <div className="aspect-square animate-pulse  rounded-2xl bg-pbneutral-500"></div>
      <span className="flex flex-row gap-2">
        <div className="mx-0.5 h-7 w-2/3 animate-pulse rounded-lg  bg-pbtext-500 " />
        <div className="mx-0.5 h-7 w-1/3 animate-pulse rounded-lg  bg-pbtext-500 " />
      </span>
    </div>
  );
}
