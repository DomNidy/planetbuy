import { Filter, FilterX } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function SearchBar() {
  return (
    <div className="flex px-8">
      <Input
        className="h-16 w-[65%] rounded-l-full border-[2px] border-pbneutral-500 bg-pbneutral-400 text-lg sm:w-[350px]"
        placeholder="Search for planets..."
        onKeyUp={(e) => console.log(e)}
      />

      <div className=" flex h-16 items-center justify-center rounded-r-full border-[2px] border-pbneutral-500 bg-pbneutral-400 p-4 text-lg text-neutral-700 ">
        <Button className="rounded-full">
          <span className="flex items-center justify-center ">
            Filter Results
            <Filter />
          </span>
        </Button>
      </div>
    </div>
  );
}
