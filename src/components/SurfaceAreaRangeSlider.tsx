"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn, formatLargeNumberToString } from "~/utils/utils";
import { type RouterInputs } from "~/utils/api";
import { env } from "~/env.mjs";

const SurfaceAreaRangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    filters: RouterInputs["planet"]["getAllPurchasablePlanets"]["filters"];
  }
>(({ className, filters, ...props }, ref) => {
  return (
    <SliderPrimitive.Root
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

      <SliderPrimitive.Thumb
        className={`block h-5 w-5  cursor-pointer rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50`}
      >
        <div
          className={`absolute   top-7 w-32  -translate-x-1/3 rounded-full bg-pbdark-800 p-1 px-4 text-sm font-semibold   transition-transform`}
        >
          <p className="font-semibold text-pbprimary-100">
            {formatLargeNumberToString(
              filters?.surfaceAreaRange?.minSurfaceArea ??
                env.NEXT_PUBLIC_MIN_SURFACE_AREA,
            )}
            <sup>2</sup> km
          </p>
        </div>
      </SliderPrimitive.Thumb>

      <SliderPrimitive.Thumb className="block h-5 w-5 cursor-pointer rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
        <div
          className={`absolute  top-7 w-32 -translate-x-1/3 rounded-full bg-pbdark-800 p-1 px-4 text-sm font-semibold   transition-transform`}
        >
          <p className="font-semibold text-pbprimary-100">
            {formatLargeNumberToString(
              filters?.surfaceAreaRange?.maxSurfaceArea ??
                env.NEXT_PUBLIC_MAX_SURFACE_AREA,
            )}
            <sup>2</sup> km
          </p>
        </div>
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
});
SurfaceAreaRangeSlider.displayName = SliderPrimitive.Root.displayName;

export { SurfaceAreaRangeSlider };
