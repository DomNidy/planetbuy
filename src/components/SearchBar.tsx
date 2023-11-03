import { Filter, FilterX } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { api } from "~/utils/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Slider } from "./ui/slider";

export default function SearchBar() {
  return (
    <div className="flex px-8">
      <Input
        className="h-16 w-[65%] rounded-l-full border-[2px] border-pbneutral-500 bg-pbneutral-400 text-lg text-background sm:w-[350px]"
        placeholder="Search for planets..."
        onKeyUp={(e) => console.log(e)}
      />

      <div className=" flex h-16 items-center justify-center rounded-r-full border-[2px] border-pbneutral-500 bg-pbneutral-400 p-4 text-lg text-neutral-700 ">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <span className="flex items-center justify-center ">
                Filter Results
                <Filter />
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Filters
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col">
              <div className="flex flex-col">
                <Slider
                  defaultValue={[10000]}
                  step={50}
                  max={100_000_000_000_000}
                  min={100}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
