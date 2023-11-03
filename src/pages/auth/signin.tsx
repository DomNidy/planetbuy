import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { getCsrfToken, getProviders, signIn } from "next-auth/react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "~/server/auth";
import { Button } from "~/components/ui/button";
import { guestNameSchema } from "~/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
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
import { DropdownMenuSeparator } from "~/components/ui/dropdown-menu";

const guestFormSchema = z.object({
  guestName: guestNameSchema,
});

function GuestSignIn() {
  const form = useForm<z.infer<typeof guestFormSchema>>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {},
  });

  // Create guest login submit handler
  function onSubmit(values: z.infer<typeof guestFormSchema>) {
    // Send request to api to create listing for the user
    void signIn("credentials", { guestName: values.guestName });
  }

  return (
    <div className="pt-12 text-center flex items-center flex-col">
      <DropdownMenuSeparator className="w-full mb-12 sm:w-[300px]" />
      <h2 className="text-lg font-semibold tracking-tighter text-background">Or sign in as a temporary guest user</h2>
      <Form {...form}>
        <form
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-fit space-y-2 pt-4 sm:w-[500px]"
        >
          <FormField
            control={form.control}
            name="guestName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-start text-background text-lg ">Guest name</FormLabel>
                <FormDescription className="text-muted">What should we call you?</FormDescription>
                <FormControl>
                  <Input placeholder="john doe" {...field}></Input>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant={"foreground"}>
            Login as Guest
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default function SignIn({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <div className=" flex min-h-screen  flex-row justify-center gap-4 bg-pbdark-800 pt-24  ">
        <div className=" flex w-fit flex-col items-center rounded-md p-2">
          <h2 className="text-2xl font-semibold tracking-tighter text-background">
            Welcome to Planetbuy
          </h2>
          {Object.values(providers).map((provider) => {
            if (provider.id === "credentials") {
              return;
            }
            return (
              <div key={provider.name} className={`pt-4 `}>
                <Button
                  onClick={() => void signIn(provider.id)}
                  variant={"foreground"}
                  className={`
                  ${provider.id === "github" ? "bg-gray-700 text-white" : ""}
                    ${
                      provider.id === "discord" ? "bg-[#7289da] text-white" : ""
                    }
                  }`}
                >
                  Sign in with {provider.name}
                </Button>
              </div>
            );
          })}
          <GuestSignIn />
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const csrfToken = await getCsrfToken(context);
  if (session) {
    return { redirect: { destination: "/" } };
  }

  const providers = await getProviders();
  return {
    props: { providers: providers ?? [], csrfToken },
  };
}
