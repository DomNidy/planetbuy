import { type User } from "@prisma/client";

type PlanetData = {
  User: { name: string | null };
  planetName: string;
  listPrice: number;
  surfaceArea: number;
  postedDate: Date;
  discoveryDate: Date;
};
export default function PlanetListing(planetData: PlanetData) {
  return (
    <div className="w-fit rounded-lg bg-slate-700 p-8">
      <h2 className="font-semibold">
        Planet: <span className="font-medium">{planetData.User?.name}</span>
      </h2>
      <h2 className="font-semibold">
        Price: <span className="font-medium">{planetData.listPrice}</span>
      </h2>
      <h2 className="font-semibold">
        List Date:{" "}
        <span className="font-medium">
          {planetData.postedDate.toLocaleDateString()}
        </span>
      </h2>
      <h2 className="font-semibold">
        Discovery Date:{" "}
        <span className="font-medium">
          {planetData.discoveryDate.toLocaleDateString()}
        </span>
      </h2>
      <button className=" rounded-md bg-white p-2 hover:bg-slate-200">
        Add to cart
      </button>
    </div>
  );
}
