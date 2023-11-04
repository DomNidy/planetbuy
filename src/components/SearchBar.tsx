import { Filter, FilterX } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { RouterInputs, api } from "~/utils/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Slider } from "./ui/slider";
import { Dispatch, SetStateAction } from "react";
import { SliderThumb } from "@radix-ui/react-slider";

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
            <div className="flex flex-col">
              <div className="flex flex-col">
                <h2 className="mb-4 font-semibold tracking-tight">
                  Price Range
                </h2>
                <Slider
                  onPointerUp={(e) => console.log(e)}
                  step={100_000}
                  minStepsBetweenThumbs={1}
                  defaultValue={[100_000, 5_000_000]}
                  max={5_000_000}
                  min={100}
                ></Slider>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
