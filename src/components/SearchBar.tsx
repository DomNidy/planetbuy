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
import {
  useState,
  type Dispatch,
  type SetStateAction,
  useContext,
} from "react";
import { PriceRangeSlider } from "./PriceRangeSlider";
import { SurfaceAreaRangeSlider } from "./SurfaceAreaRangeSlider";
import { env } from "~/env.mjs";
import {
  SearchFilterContext,
  SearchFilterKeys,
} from "~/context/SearchFilterContext";

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
  const searchFilterContext = useContext(SearchFilterContext);

  // Stores state of price range slider (this is to make the sliders controlled components, allowing us to easily modify their values via code)
  const [priceRangeSliderValues, setPriceRangeSliderValues] = useState<
    number[]
  >([env.NEXT_PUBLIC_MIN_LISTING_PRICE, env.NEXT_PUBLIC_MAX_LISTING_PRICE]);

  function resetFilters() {
    setFilters({
      priceRange: {
        minPrice: env.NEXT_PUBLIC_MIN_LISTING_PRICE,
        maxPrice: env.NEXT_PUBLIC_MAX_LISTING_PRICE,
      },
      surfaceAreaRange: {
        minSurfaceArea: env.NEXT_PUBLIC_MIN_SURFACE_AREA,
        maxSurfaceArea: env.NEXT_PUBLIC_MAX_SURFACE_AREA,
      },
    });

    searchFilterContext.setActiveFilters({
      SURFACE_AREA_RANGE: false,
      PRICE_RANGE: false,
    });
  }

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
            <Button className="relative rounded-full border-2 border-white bg-pbdark-850">
              <span className="flex items-center justify-center ">
                <p>Filter Results</p>
                <Filter />
              </span>
              {searchFilterContext.getActiveFilters().length > 0 ? (
                <div
                  className={`absolute -right-2 -top-1 flex h-6 w-6 items-center justify-center rounded-full 
                              border-2 border-pbdark-850 bg-pbprimary-100 text-center font-semibold text-pbdark-850 `}
                >
                  {searchFilterContext.getActiveFilters().length}
                </div>
              ) : (
                <></>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90%] rounded-md bg-gray-100 sm:w-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Filters
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-16">
              {/** Price range slider group */}
              <div className="flex flex-col">
                <h2 className="mb-4 font-semibold tracking-tight">
                  Price Range
                </h2>
                <PriceRangeSlider
                  filters={filters}
                  step={Math.round(
                    (env.NEXT_PUBLIC_MAX_LISTING_PRICE -
                      env.NEXT_PUBLIC_MIN_LISTING_PRICE) /
                      250,
                  )}
                  value={[
                    filters?.priceRange?.minPrice ??
                      env.NEXT_PUBLIC_MIN_LISTING_PRICE,
                    filters?.priceRange?.maxPrice ??
                      env.NEXT_PUBLIC_MAX_LISTING_PRICE,
                  ]}
                  onValueChange={(values) => {
                    searchFilterContext.setFilterActive(
                      SearchFilterKeys.PRICE_RANGE,
                      true,
                    );

                    setFilters((past) => {
                      return {
                        ...past,
                        priceRange: {
                          minPrice: Math.min(...values),
                          maxPrice: Math.max(...values),
                        },
                      };
                    });
                  }}
                  minStepsBetweenThumbs={1}
                  max={env.NEXT_PUBLIC_MAX_LISTING_PRICE}
                  min={env.NEXT_PUBLIC_MIN_LISTING_PRICE}
                ></PriceRangeSlider>
              </div>

              {/** Surface area slider group */}
              <div className="flex flex-col">
                <h2 className="mb-4 font-semibold tracking-tight">
                  Surface Area
                </h2>
                <SurfaceAreaRangeSlider
                  filters={filters}
                  step={
                    (env.NEXT_PUBLIC_MAX_SURFACE_AREA -
                      env.NEXT_PUBLIC_MIN_SURFACE_AREA) /
                    100
                  }
                  value={[
                    filters?.surfaceAreaRange?.minSurfaceArea ??
                      env.NEXT_PUBLIC_MIN_SURFACE_AREA,
                    filters?.surfaceAreaRange?.maxSurfaceArea ??
                      env.NEXT_PUBLIC_MAX_SURFACE_AREA,
                  ]}
                  onValueChange={(values) => {
                    searchFilterContext.setFilterActive(
                      SearchFilterKeys.SURFACE_AREA_RANGE,
                      true,
                    );

                    setFilters((past) => {
                      return {
                        ...past,
                        surfaceAreaRange: {
                          minSurfaceArea: Math.min(...values),
                          maxSurfaceArea: Math.max(...values),
                        },
                      };
                    });
                  }}
                  minStepsBetweenThumbs={1}
                  max={env.NEXT_PUBLIC_MAX_SURFACE_AREA}
                  min={env.NEXT_PUBLIC_MIN_SURFACE_AREA}
                ></SurfaceAreaRangeSlider>
              </div>
              <h2
                className="mt-4 cursor-pointer text-lg font-semibold text-pbdark-800 underline"
                onClick={() => resetFilters()}
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
