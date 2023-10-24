import * as z from "zod";
import { useForm } from "react-hook-form";
import { api } from "~/utils/api";
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
import { formatLargeNumberToString } from "~/utils/utils";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

const generatePlanetsFormSchema = z.object({
  planetsToGenerate: z.coerce
    .number()
    .min(1, "Must generate at least 1 planet")
    .max(100, "Cannot generate more than 100 planets at a time"),
  // The std deviation that the randomly generated planets stats will conform to
  // If the user provides parameters which produce results that exceed the maximum value for a field
  // (ex: std dev of 10000 for value produces a planet value of 234_000_000_000_000, which exceeds value cap)
  // The stats of this planet will be scaled down accordingly
  stdDeviationPlanetStats: z.object({
    valueStdDev: z.coerce.number().min(0).max(100_000_000_000),
    surfaceAreaStdDev: z.coerce.number().min(0).max(100_000_000_000),
  }),
  // The mean that the randomly generated planet stats will vary about
  meanPlanetStats: z.object({
    valueMean: z.coerce.number().min(100).max(100_000_000_000),
    surfaceAreaMean: z.coerce.number().min(100).max(100_000_000_000),
  }),
});

export default function GenerateRandom() {
  const generateRandomPlanets = api.planet.generateRandomPlanets.useMutation();

  // Destructuring react hook form
  const form = useForm<z.infer<typeof generatePlanetsFormSchema>>({
    resolver: zodResolver(generatePlanetsFormSchema),
    defaultValues: {
      meanPlanetStats: { surfaceAreaMean: 2_500_000, valueMean: 10_000 },
      stdDeviationPlanetStats: { surfaceAreaStdDev: 50, valueStdDev: 45 },
      planetsToGenerate: 10,
    },
  });

  // Create listing submit handler
  function onSubmit(values: z.infer<typeof generatePlanetsFormSchema>) {
    // Send request to api to create listing for the user
    generateRandomPlanets.mutate(values);
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
          name="planetsToGenerate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Planets to generate</FormLabel>
              <FormDescription>
                How many planets would you like to generate?
              </FormDescription>
              <FormControl>
                <Input placeholder="35" {...field}></Input>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="meanPlanetStats.valueMean"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mean planet value</FormLabel>
              <FormDescription>
                What should the mean value of generated planets be
              </FormDescription>
              <FormControl>
                <Input
                  placeholder="10,000"
                  {...field}
                  value={undefined}
                ></Input>
              </FormControl>
              <p className="text-sm font-bold ordinal text-muted-foreground">
                {formatLargeNumberToString(field.value)}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stdDeviationPlanetStats.valueStdDev"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Std deviation of planet value</FormLabel>
              <FormDescription>
                What should the standard deviation of planet values generated be
              </FormDescription>
              <FormControl>
                <Input placeholder="4" {...field} value={undefined}></Input>
              </FormControl>
              <p className="text-sm font-bold ordinal text-muted-foreground">
                {formatLargeNumberToString(field.value)}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="meanPlanetStats.surfaceAreaMean"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mean surface area</FormLabel>
              <FormDescription>
                What should the mean surface area be
              </FormDescription>
              <FormControl>
                <Input
                  placeholder="2,500,000"
                  {...field}
                  value={undefined}
                ></Input>
              </FormControl>
              <p className="text-sm font-bold ordinal text-muted-foreground">
                {formatLargeNumberToString(field.value)}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stdDeviationPlanetStats.surfaceAreaStdDev"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Std deviation surface area</FormLabel>
              <FormDescription>
                What should the standard deviation of planet surface areas
                generated be
              </FormDescription>
              <FormControl>
                <Input placeholder="3" {...field} value={undefined}></Input>
              </FormControl>
              <p className="text-sm font-bold ordinal text-muted-foreground">
                {formatLargeNumberToString(field.value)}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create listing</Button>
      </form>
    </Form>
  );
}
