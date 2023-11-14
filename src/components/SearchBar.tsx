import { Check, Filter } from "lucide-react";
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
  useEffect,
} from "react";
import { PriceRangeSlider } from "./PriceRangeSlider";
import { SurfaceAreaRangeSlider } from "./SurfaceAreaRangeSlider";
import { env } from "~/env.mjs";
import {
  SearchFilterContext,
  SearchFilterKeys,
} from "~/context/SearchFilterContext";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
  PlanetQuality,
  PlanetTemperatureRange,
  PlanetTerrain,
} from "@prisma/client";
import { overpass } from "~/pages/_app";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";

export default function SearchBar({
  filters,
  setFilters,
}: {
  filters: RouterInputs["planet"]["getPlanetListings"]["filters"];
  setFilters: Dispatch<
    SetStateAction<RouterInputs["planet"]["getPlanetListings"]["filters"]>
  >;
}) {
  const searchFilterContext = useContext(SearchFilterContext);

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
      planetQuality: undefined,
    });

    searchFilterContext.setActiveFilters({
      SURFACE_AREA_RANGE: false,
      PRICE_RANGE: false,
      PLANET_QUALITIES: false,
      PLANET_TERRAINS: false,
      PLANET_TEMPERATURES: false,
    });
  }

  // Whenever planetQuality array changes, if the array is of length 0, set planetQuality to undefined
  // Otherwise our request would send an empty array, which would always return no results as it would fail to match any
  useEffect(() => {
    if (filters?.planetQuality?.length == 0) {
      setFilters((past) => {
        return {
          ...past,
          planetQuality: undefined,
        };
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.planetQuality]);

  return (
    <div className={`flex px-8 ${overpass.className}`}>
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
          <DialogContent className="w-[90%] rounded-md bg-pbprimary-100 sm:w-auto ">
            <ScrollArea className=" mt-2 pr-[1.2rem]  -z-10 h-[600px]">
              <div className="">
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

                  <div className="flex flex-col">
                    <h2 className="mb-4 font-semibold tracking-tight">
                      Planet Qualities
                    </h2>
                    <ToggleGroup
                      value={filters?.planetQuality ?? []}
                      onValueChange={(selectedQualities) => {
                        searchFilterContext.setFilterActive(
                          SearchFilterKeys.PLANET_QUALITIES,
                          true,
                        );

                        console.log(selectedQualities, filters?.planetQuality);
                        setFilters((past) => {
                          return {
                            ...past,
                            planetQuality: selectedQualities as PlanetQuality[],
                          };
                        });
                      }}
                      type="multiple"
                      className="grid w-full grid-cols-2 justify-stretch gap-3 md:grid-cols-3 "
                    >
                      <ToggleGroupItem
                        value={`${PlanetQuality.COMMON}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetQuality.COMMON}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetQuality?.find(
                                (e) => e === PlanetQuality.COMMON,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetQuality.UNIQUE}`}
                        aria-label="Toggle unique"
                      >
                        {" "}
                        <div className="relative w-full   rounded-lg border-4 border-pbaccent-uncommon bg-pbprimary-100 p-1.5 font-semibold  text-pbaccent-uncommon  hover:text-pbaccent-uncommon/90">
                          {`${PlanetQuality.UNIQUE}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetQuality?.find(
                                (e) => e === PlanetQuality.UNIQUE,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetQuality.RARE}`}
                        aria-label="Toggle rare"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-pbaccent-rare bg-pbprimary-100 p-1.5 font-semibold  text-pbaccent-rare shadow-md hover:text-pbaccent-rare/90">
                          {`${PlanetQuality.RARE}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetQuality?.find(
                                (e) => e === PlanetQuality.RARE,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetQuality.OUTSTANDING}`}
                        aria-label="Toggle outstanding"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-pbaccent-outstanding bg-pbprimary-100 p-1.5 font-semibold  text-pbaccent-outstanding shadow-md hover:text-pbaccent-outstanding/90">
                          {`${PlanetQuality.OUTSTANDING}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetQuality?.find(
                                (e) => e === PlanetQuality.OUTSTANDING,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetQuality.PHENOMENAL}`}
                        aria-label="Toggle phenomenal"
                        className=" "
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-pbaccent-phenomenal bg-pbprimary-100 p-1.5 font-semibold text-pbaccent-phenomenal  shadow-md hover:text-pbaccent-phenomenal/90">
                          {`${PlanetQuality.PHENOMENAL}`}{" "}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700  ${
                              filters?.planetQuality?.find(
                                (e) => e === PlanetQuality.PHENOMENAL,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="flex flex-col">
                    <h2 className="mb-4 font-semibold tracking-tight">
                      Planet Terrains
                    </h2>
                    <ToggleGroup
                      value={filters?.planetTerrain ?? []}
                      onValueChange={(selectedTerrains) => {
                        searchFilterContext.setFilterActive(
                          SearchFilterKeys.PLANET_TERRAINS,
                          true,
                        );

                        console.log(selectedTerrains, filters?.planetTerrain);

                        setFilters((past) => {
                          return {
                            ...past,
                            planetTerrain: selectedTerrains as PlanetTerrain[],
                          };
                        });
                      }}
                      type="multiple"
                      className="grid w-full grid-cols-2 justify-stretch gap-3 md:grid-cols-3 "
                    >
                      <ToggleGroupItem
                        value={`${PlanetTerrain.DESERTS}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetTerrain.DESERTS}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetTerrain?.find(
                                (e) => e === PlanetTerrain.DESERTS,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetTerrain.FORESTS}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetTerrain.FORESTS}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetTerrain?.find(
                                (e) => e === PlanetTerrain.FORESTS,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetTerrain.MOUNTAINS}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetTerrain.MOUNTAINS}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetTerrain?.find(
                                (e) => e === PlanetTerrain.MOUNTAINS,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetTerrain.OCEANS}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetTerrain.OCEANS}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetTerrain?.find(
                                (e) => e === PlanetTerrain.OCEANS,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetTerrain.PLAINS}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetTerrain.PLAINS}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetTerrain?.find(
                                (e) => e === PlanetTerrain.PLAINS,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetTerrain.OTHER}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetTerrain.OTHER}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetTerrain?.find(
                                (e) => e === PlanetTerrain.OTHER,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="flex flex-col">
                    <h2 className="mb-4 font-semibold tracking-tight">
                      Planet Climates
                    </h2>
                    <ToggleGroup
                      value={filters?.planetTemperature ?? []}
                      onValueChange={(selectedTemperatures) => {
                        searchFilterContext.setFilterActive(
                          SearchFilterKeys.PLANET_TEMPERATURES,
                          true,
                        );

                        console.log(
                          selectedTemperatures,
                          filters?.planetTemperature,
                        );

                        setFilters((past) => {
                          return {
                            ...past,
                            planetTemperature:
                              selectedTemperatures as PlanetTemperatureRange[],
                          };
                        });
                      }}
                      type="multiple"
                      className="grid w-full grid-cols-2 justify-stretch gap-3 md:grid-cols-3 "
                    >
                      <ToggleGroupItem
                        value={`${PlanetTemperatureRange.EXTREME_COLD}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetTemperatureRange.EXTREME_COLD}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetTemperature?.find(
                                (e) =>
                                  e === PlanetTemperatureRange.EXTREME_COLD,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetTemperatureRange.COLD}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetTemperatureRange.COLD}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetTemperature?.find(
                                (e) => e === PlanetTemperatureRange.COLD,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetTemperatureRange.TEMPERATE}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetTemperatureRange.TEMPERATE}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetTemperature?.find(
                                (e) => e === PlanetTemperatureRange.TEMPERATE,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetTemperatureRange.WARM}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetTemperatureRange.WARM}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetTemperature?.find(
                                (e) => e === PlanetTemperatureRange.WARM,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetTemperatureRange.HOT}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetTemperatureRange.HOT}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetTemperature?.find(
                                (e) => e === PlanetTemperatureRange.HOT,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value={`${PlanetTemperatureRange.EXTREME_HOT}`}
                        aria-label="Toggle common"
                        className="w-fit"
                      >
                        {" "}
                        <div className="relative w-full rounded-lg border-4 border-neutral-500 bg-pbprimary-100 p-1.5 font-semibold  text-neutral-500 shadow-md hover:text-neutral-500/90">
                          {`${PlanetTemperatureRange.EXTREME_HOT}`}
                          <Check
                            className={`absolute -right-2.5 -top-2 h-5 w-5 rounded-full bg-pbdark-700 ${
                              filters?.planetTemperature?.find(
                                (e) => e === PlanetTemperatureRange.EXTREME_HOT,
                              )
                                ? "block"
                                : "hidden"
                            }`}
                            color="white"
                          />
                        </div>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <h2
                    className="mt-4 cursor-pointer text-lg font-semibold text-pbdark-800 underline"
                    onClick={() => resetFilters()}
                  >
                    Clear filters
                  </h2>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
