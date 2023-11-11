import { Filter } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { type RouterInputs } from "~/utils/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { type Dispatch, type SetStateAction } from "react";
import { PriceRangeSlider } from "./PriceRangeSlider";
import { SurfaceAreaRangeSlider } from "./SurfaceAreaRangeSlider";
import { env } from "~/env.mjs";

export default function SearchBar({
  filters,
  setFilters,
}: {
  filters: RouterInputs["planet"]["getAllPurchasablePlanets"]["filters"];
  setFilters: Dispatch<
    SetStateAction<
      RouterInputs["planet"]["getAllPurchasablePlanets"]["filters"]
    >
  >;
}) {
  return (
    <div className="flex px-8">
      <Input
        className="h-16 w-[65%] rounded-l-full border-[2px] border-pbneutral-500 bg-pbneutral-400 text-lg text-pbdark-800 sm:w-[350px]"
        placeholder="Search for planets..."
        onKeyUp={(e) => {
          setFilters((past) => {
            return {
              ...past,
              planetName: (e.target as HTMLInputElement).value,
            };
          });
        }}
      />

      <div className=" flex h-16 items-center justify-center rounded-r-full border-[2px] border-pbneutral-500 bg-pbneutral-400 p-4 text-lg text-neutral-700 ">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-pbdark-850 ">
              <span className="flex items-center justify-center ">
                Filter Results
                <Filter />
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90%] rounded-md bg-gray-100 sm:w-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Filters
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-16">
              <div className="flex flex-col">
                <h2 className="mb-4 font-semibold tracking-tight">
                  Price Range
                </h2>
                <PriceRangeSlider
                  filters={filters}
                  setFilters={setFilters}
                  step={Math.round(
                    (env.NEXT_PUBLIC_MAX_LISTING_PRICE -
                      env.NEXT_PUBLIC_MIN_LISTING_PRICE) /
                      250,
                  )}
                  minStepsBetweenThumbs={1}
                  defaultValue={[
                    filters?.priceRange?.minPrice ??
                      env.NEXT_PUBLIC_MIN_LISTING_PRICE,
                    filters?.priceRange?.maxPrice ??
                      env.NEXT_PUBLIC_MAX_LISTING_PRICE,
                  ]}
                  max={env.NEXT_PUBLIC_MAX_LISTING_PRICE}
                  min={env.NEXT_PUBLIC_MIN_LISTING_PRICE}
                ></PriceRangeSlider>
              </div>

              <div className="flex flex-col">
                <h2 className="mb-4 font-semibold tracking-tight">
                  Surface Area
                </h2>
                <SurfaceAreaRangeSlider
                  filters={filters}
                  setFilters={setFilters}
                  step={
                    (env.NEXT_PUBLIC_MAX_SURFACE_AREA -
                      env.NEXT_PUBLIC_MIN_SURFACE_AREA) /
                    100
                  }
                  minStepsBetweenThumbs={1}
                  defaultValue={[
                    filters?.surfaceAreaRange?.minSurfaceArea ??
                      env.NEXT_PUBLIC_MIN_SURFACE_AREA,
                    filters?.surfaceAreaRange?.maxSurfaceArea ??
                      env.NEXT_PUBLIC_MAX_SURFACE_AREA,
                  ]}
                  max={env.NEXT_PUBLIC_MAX_SURFACE_AREA}
                  min={env.NEXT_PUBLIC_MIN_SURFACE_AREA}
                ></SurfaceAreaRangeSlider>
              </div>
              <h2
                className="mt-4 cursor-pointer text-lg font-semibold text-pbdark-800 underline"
                onClick={() => setFilters({})}
              >
                Clear filters
              </h2>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
