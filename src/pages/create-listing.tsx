import * as z from "zod";
import { useForm } from "react-hook-form";
import { RouterInputs, api } from "~/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { cn } from "~/utils/utils";

// This schema is defined in the input for `api.user.createPlanetListing`
// Whenever that gets updated, copy and paste the zod schema into here
const formSchema = z.object({
  name: z
    .string()
    .min(3, "Planet name must be at least 3 characters long")
    .max(48, "Planet name cannot exceed 48 characters"),
  listPrice: z.coerce
    .number()
    .min(100, "Listing price must be at least 100")
    .max(
      100_000_000_000_000,
      "Listing price cannot exceed 100,000,000,000,000",
    ),
  surfaceArea: z.coerce
    .number()
    .min(1, "Surface must be greater than 1 square km.")
    .max(
      100_000_000_000_000,
      "Maximum surface area size cannot exceed 100,000,000,000,000 square km.",
    ),
  discoveryDate: z.coerce.date().refine(
    (date) => {
      // If the discovery date is in the future, fail
      // (We are adding 100 seconds to the time here because we use the same schema on the serverside,
      //  and if we submit a request on the client, it might take a few extra seconds to process, causing the client
      //  side validation to succeeed, but the server side one to fail as there is latency which might cause
      //  the input date to be interpreted as being in the future, however at the time of submission it was not)
      console.log(Date.now() + 100000, date.getTime());
      if (Date.now() + 100000 < date.getTime()) {
        return false;
      }
      return true;
    },
    { message: "Date must not be in the future." },
  ),
});

export default function CreateListingPage() {
  const createListing = api.user.createPlanetListing.useMutation();

  // Destructuring react hook form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      discoveryDate: new Date(),
      listPrice: 0,
      surfaceArea: 0,
      name: "",
    },
  });

  // Create listing submit handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Send request to api to create listing for the user
    createListing.mutate(values);
  }
  return (
    <Form {...form}>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={form.handleSubmit(onSubmit)}
        className="ml-10 mt-14 w-[500px] space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Planet Name</FormLabel>
              <FormDescription>What{"'"}s your planet called?</FormDescription>
              <FormControl>
                <Input placeholder="My planet" {...field}></Input>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>List Price</FormLabel>
              <FormDescription>
                How much would you like to sell this planet for?
              </FormDescription>
              <FormControl>
                <Input
                  placeholder="100,000"
                  {...field}
                  value={undefined}
                ></Input>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="surfaceArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Surface Area (km<sup>2</sup>)
              </FormLabel>
              <FormDescription>
                What is the surface area of your planet?
              </FormDescription>
              <FormControl>
                <Input
                  type="number"
                  placeholder="2,000,000"
                  {...field}
                  value={undefined}
                ></Input>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="discoveryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Surface Area (km<sup>2</sup>)
              </FormLabel>
              <FormDescription>
                What is the surface area of your planet?
              </FormDescription>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create listing</Button>
      </form>
    </Form>
  );
}
