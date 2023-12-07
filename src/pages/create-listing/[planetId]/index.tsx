/* eslint-disable @typescript-eslint/no-misused-promises */
import { useRouter } from "next/router";
import { useToast } from "~/components/ui/use-toast";
import { env } from "~/env.mjs";
import { api, getBaseUrl } from "~/utils/api";
import Image from "next/image";
import {
  formatLargeNumberToString,
  formatNumberToStringWithCommas,
} from "~/utils/utils";
import { Button } from "~/components/ui/button";
import type * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPlanetListingSchema } from "~/utils/schemas";
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
import { Check } from "lucide-react";
import Link from "next/link";
import { CircleLoader } from "react-spinners";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateListingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const planetData = api.planet.getPlanetData.useQuery({
    planetId: router.query.planetId as string,
  });

  const createListing = api.user.createPlanetListing.useMutation({
    onError(err) {
      console.log(err, "Error creating planet listing");
      toast({
        title: "Failed to create planet listing",
        description:
          "An error occurred while creating your planet listing. Please try again later.",
        variant: "destructive",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries([["user", "getUsersListings"]]);

      await queryClient.invalidateQueries([["user", "getUsersPlanets"]]);

      await queryClient.invalidateQueries([["planet", "getPlanetListings"]]);
    },
  });

  const form = useForm<z.infer<typeof createPlanetListingSchema>>({
    resolver: zodResolver(createPlanetListingSchema),
    defaultValues: {
      listPrice: env.NEXT_PUBLIC_MIN_LISTING_PRICE,
      planetId: router.query.planetId as string,
    },
  });

  // Create listing handler
  function onSubmit(listingProps: z.infer<typeof createPlanetListingSchema>) {
    createListing.mutate(listingProps);
  }

  if (!planetData.data) {
    return (
      <div className="flex min-h-screen w-full justify-center bg-pbdark-800 px-4  md:px-16 lg:px-44">
        <div className="mt-36 flex  h-fit  w-fit  flex-col rounded-lg  p-4">
          <h2>Unable to find planet</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full justify-center bg-pbdark-800 px-4  md:px-16 lg:px-44">
      {createListing.status === "success" && (
        <div className="mb-16 flex flex-col items-center justify-center gap-2 text-2xl font-medium text-pbtext-500 sm:text-3xl">
          <div className="flex flex-row gap-2">
            <Check
              className="aspect-square h-7 w-7 rounded-full bg-green-500 sm:h-8 sm:w-8"
              color="white"
            />
            <p>Listing created</p>{" "}
          </div>

          <div className="flex flex-row gap-4">
            <Link
              href={`${getBaseUrl()}/listing/${createListing.data.id}`}
              className="text-base text-muted underline"
            >
              Take me there
            </Link>
            <Link
              href={`${getBaseUrl()}/create-listing`}
              className="text-base text-muted underline"
            >
              Create another
            </Link>
          </div>
        </div>
      )}

      {createListing.status === "loading" && (
        <div className="flex flex-col  items-center justify-center gap-2 text-2xl font-medium text-pbtext-500 sm:text-3xl">
          <div className="flex flex-row items-center">
            <CircleLoader color="white" />
          </div>
        </div>
      )}

      {createListing.status === "idle" && (
        <div className="mt-36 flex  h-fit  w-fit  flex-col rounded-lg  p-4">
          <div className="flex  flex-col items-center gap-4 lg:flex-row lg:items-start">
            <div
              className=" relative mb-4  aspect-square rounded-2xl bg-pbneutral-500
md:h-[300px] md:w-[300px]"
            >
              {planetData?.data.planetImage && (
                <Image
                  src={`${env.NEXT_PUBLIC_BUCKET_URL}/${planetData?.data.planetImage.bucketPath}`}
                  placeholder="blur"
                  blurDataURL={`${env.NEXT_PUBLIC_BUCKET_URL}/${planetData?.data.planetImage.bucketPath}`}
                  alt=""
                  width={300}
                  height={300}
                  className="rounded-lg object-cover"
                  quality={100}
                  priority
                />
              )}
            </div>

            <div
              className={`flex h-fit w-full flex-col rounded-md bg-pbdark-850 bg-gradient-to-b from-pbdark-700 to-pbdark-800 p-2 ${
                planetData.data.temperature === "EXTREME_COLD"
                  ? "from-cyan-400/40"
                  : ""
              }
    ${planetData.data.temperature === "COLD" ? "from-cyan-500/50" : ""}
    ${planetData.data.temperature === "TEMPERATE" ? "from-stone-500" : ""}
    ${planetData.data.temperature === "WARM" ? "from-orange-300" : ""}
    ${planetData.data.temperature === "HOT" ? "from-orange-500" : ""} ${
      planetData.data.temperature === "EXTREME_HOT" ? "from-red-600/40" : ""
    }`}
            >
              <div className="flex h-fit flex-row p-1">
                <h1 className="text-[28px] font-semibold leading-6 tracking-tighter text-pbtext-500 ">
                  {planetData.data.name}
                </h1>
              </div>

              <div className=" flex w-full flex-row justify-start  gap-2 px-1 ">
                <h2 className="basis-5/12 text-[18px]  font-medium leading-6 tracking-tighter   text-pbtext-700">
                  Quality:
                </h2>
                <h2
                  className={`basis-7/12 text-end text-[22px] font-semibold leading-6 tracking-tighter 
    ${planetData.data.quality === "COMMON" ? "text-gray-500" : ""}
    ${planetData.data.quality === "UNIQUE" ? "text-green-600" : ""}
    ${planetData.data.quality === "RARE" ? "text-blue-600" : ""}
    ${planetData.data.quality === "OUTSTANDING" ? "text-purple-600" : ""}
    ${planetData.data.quality === "PHENOMENAL" ? "text-orange-600" : ""}
    `}
                >
                  {planetData.data.quality}
                </h2>
              </div>

              <div className="flex w-full flex-row justify-start gap-2 px-1 ">
                <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter   text-pbtext-700">
                  Terrain:
                </h2>
                <h2
                  className={`basis-7/12 text-end text-[22px] font-semibold leading-6 tracking-tighter 
    ${planetData.data.terrain === "DESERTS" ? "text-yellow-400" : ""}
    ${planetData.data.terrain === "PLAINS" ? "text-green-300" : ""}
    ${planetData.data.terrain === "FORESTS" ? "text-green-800" : ""}
    ${planetData.data.terrain === "OCEANS" ? "text-blue-500" : ""}
    ${planetData.data.terrain === "MOUNTAINS" ? "text-stone-600" : ""}
    ${planetData.data.terrain === "OTHER" ? "text-gray-400" : ""}
    `}
                >
                  {planetData.data.terrain}
                </h2>
              </div>

              <div className="flex w-full flex-row justify-start gap-2 px-1 ">
                <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter  text-pbtext-700">
                  Temperature:
                </h2>

                <h2
                  className={`basis-7/12 text-end text-[22px] font-semibold leading-6 tracking-tighter  
    ${planetData.data.temperature === "EXTREME_COLD" ? "text-cyan-400" : ""}
    ${planetData.data.temperature === "COLD" ? "text-cyan-500" : ""}
    ${planetData.data.temperature === "TEMPERATE" ? "text-stone-500" : ""}
    ${planetData.data.temperature === "WARM" ? "text-orange-300" : ""}
    ${planetData.data.temperature === "HOT" ? "text-orange-500" : ""} ${
      planetData.data.temperature === "EXTREME_HOT" ? "text-red-600" : ""
    }
    `}
                >
                  {planetData.data.temperature
                    .replace("_", " ")
                    .replace("EXTREME", "EXTREMELY")}
                </h2>
              </div>
              <div className="flex w-[17rem] flex-row justify-start gap-2  px-1 md:w-80"></div>

              <div className="flex w-full flex-row justify-start gap-2 px-1 ">
                <h2 className="basis-5/12 text-[18px] font-medium leading-6 tracking-tighter text-pbtext-700">
                  Surface Area:
                </h2>
                <h2 className="basis-7/12 text-end text-[20px] leading-6 tracking-tighter text-pbtext-500 ">
                  {formatLargeNumberToString(planetData.data.surfaceArea)}
                  <sup>2</sup> km
                </h2>
              </div>
            </div>
          </div>
          <Form {...form}>
            <form
              className="rounded-lg bg-black/20 p-2"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="listPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Listing Price</FormLabel>
                    <FormDescription>
                      How much would you like to sell this planet for?
                    </FormDescription>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={env.NEXT_PUBLIC_MIN_LISTING_PRICE.toString()}
                      />
                    </FormControl>
                    <p className="text-sm ordinal text-muted-foreground">
                      {`${
                        formatNumberToStringWithCommas(field.value) &&
                        `$${formatNumberToStringWithCommas(field.value)}`
                      }`}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" variant={"foreground"}>
                Create listing
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
