import { useRouter } from "next/router";
import { api } from "~/utils/api";

export default function ListingsPage() {
  const router = useRouter();

  const userListings = api.user.getUserProfile.useQuery({
    userId: router.query.uid as string,
  });

  return <div className="min-h-screen w-full">{userListings.data?.name}</div>;
}
