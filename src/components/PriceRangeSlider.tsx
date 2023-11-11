"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn, formatNumberToStringWithCommas } from "~/utils/utils";
import { type RouterInputs } from "~/utils/api";
import { env } from "~/env.mjs";

const PriceRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    setFilters: React.Dispatch<
      React.SetStateAction<
        RouterInputs["planet"]["getAllPurchasablePlanets"]["filters"]
      >
    >;
    filters: RouterInputs["planet"]["getAllPurchasablePlanets"]["filters"];
  }
>(({ className, setFilters, filters, ...props }, ref) => {
  // Updates the values of min price and max price in filter
  function updateFilterPriceRangeState(newMin: number, newMax: number) {
    setFilters((past) => {
      return {
        ...past,
        priceRange: {
          minPrice: newMin,
          maxPrice: newMax,
        },
      };
    });
  }

  return (
    <SliderPrimitive.Root
      onValueChange={(v) => {
        updateFilterPriceRangeState(Math.min(...v), Math.max(...v));
      }}
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow cursor-pointer overflow-hidden rounded-full bg-gray-200">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>

      <SliderPrimitive.Thumb className="block h-5 w-5 cursor-pointer rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
        <div
          className={`relative top-7 h-fit w-fit -translate-x-1/3 rounded-full bg-pbdark-800 p-1 transition-transform`}
        >
          <p className="font-semibold text-pbprimary-100">
            $
            {formatNumberToStringWithCommas(
              filters?.priceRange?.minPrice ??
                env.NEXT_PUBLIC_MAX_LISTING_PRICE,
            )}
          </p>
        </div>
      </SliderPrimitive.Thumb>

      <SliderPrimitive.Thumb className="block h-5 w-5 cursor-pointer rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
        <div
          className={`relative top-7 h-fit w-fit -translate-x-1/3 rounded-full bg-pbdark-800 p-1 transition-transform`}
        >
          <p className="font-semibold text-pbprimary-100">
            $
            {formatNumberToStringWithCommas(
              filters?.priceRange?.maxPrice ??
                env.NEXT_PUBLIC_MAX_LISTING_PRICE,
            )}
          </p>
        </div>
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
});
PriceRangeSlider.displayName = SliderPrimitive.Root.displayName;

export { PriceRangeSlider };
