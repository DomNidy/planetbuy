import type * as z from "zod";
import { useForm } from "react-hook-form";
import { type RouterOutputs, api } from "~/utils/api";
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
import { updatePlanetListingSchema } from "~/utils/schemas";
import { useToast } from "./ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { DialogHeader, DialogTitle } from "./ui/dialog";
import { type Dispatch, type SetStateAction } from "react";

export default function EditListingForm({
  listingData,
  setDialogOpen,
}: {
  listingData: RouterOutputs["planet"]["getPlanetDataFromListingId"];
  setDialogOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateListing = api.user.updatePlanetListing.useMutation({
    onSettled: async () => {
      return await queryClient.invalidateQueries([
        ["planet", "getPlanetDataFromListingId"],
        { type: "query" },
      ]);
    },
    onSuccess: () => {
      toast({
        title: "Listing updated",
        description: "Your listing has been updated successfully",
        variant: "default",
        duration: 3000,
      });

      setDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof updatePlanetListingSchema>>({
    resolver: zodResolver(updatePlanetListingSchema),
    defaultValues: {
      listPrice: listingData?.listPrice,
      listingId: listingData?.id,
    },
  });

  function onSubmit(values: z.infer<typeof updatePlanetListingSchema>) {
    updateListing.mutate({
      listingId: values.listingId,
      listPrice: values.listPrice,
    });
  }
  return (
    <div>
      <Form {...form}>
        <form
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {updateListing.isLoading ? (
            <div className="flex items-center justify-center">
              <div className="h-24 w-24 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold tracking-tight">
                  Update listing for {listingData?.planet.name}
                </DialogTitle>
              </DialogHeader>
              <FormField
                control={form.control}
                name="listPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">
                      Listing price
                    </FormLabel>
                    <FormDescription>Enter a new price</FormDescription>
                    <FormControl>
                      <Input
                        placeholder={formatLargeNumberToString(
                          listingData?.listPrice ?? 0,
                        )}
                        {...field}
                      ></Input>
                    </FormControl>
                    <p className="text-sm font-bold ordinal text-muted-foreground">
                      {formatLargeNumberToString(field.value)}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                variant={"default"}
                className="font-semibold "
              >
                Update listing
              </Button>
            </>
          )}
        </form>
      </Form>
    </div>
  );
}
