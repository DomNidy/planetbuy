import Link from "next/link";
import { useRouter } from "next/router";
import { CircleLoader } from "react-spinners";
import { api, getBaseUrl } from "~/utils/api";
import { formatNumberToStringWithCommas } from "~/utils/utils";

export default function TransactionPage() {
  const router = useRouter();
  const transactionId = router.query.transactionId as string;

  const transactionData = api.user.getTransactionDetails.useQuery({
    transactionId: transactionId,
  });

  console.log(transactionData.data, !!transactionData.data);

  if (transactionData.status === "loading") {
    return (
      <div className="flex min-h-screen w-full justify-center bg-pbdark-800 px-4 py-48 text-white ">
        <p className="max-w-[600px] text-center text-lg leading-8">
          <CircleLoader color="white" />
        </p>
      </div>
    );
  }

  if (!transactionData.data || transactionData.data.length === 0) {
    return (
      <div className="flex min-h-screen w-full justify-center bg-pbdark-800 px-4 py-48 text-white ">
        <p className="max-w-[600px] text-center text-lg leading-8">
          Could not retrieve details for this transaction, please ensure the URL
          is correct by opening the link from the{" "}
          <Link
            href={`${getBaseUrl()}/transactions`}
            className="font-bold underline underline-offset-1"
          >
            transaction history page.
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-pbdark-800 px-4 py-40 text-white ">
      <div className="flex flex-col">
        <h1 className="ml-2 text-start text-xl font-bold">
          Transaction Details:
        </h1>

        <div className="ml-2 mt-1 flex w-full flex-row justify-between gap-8 rounded-lg font-semibold sm:w-[400px]">
          <div className="basis-24 ">Planet</div>
          <div className="basis-24">Price</div>
          <div className="basis-24">Seller</div>
        </div>

        {transactionData.data?.map((transaction, idx) => (
          <div key={idx} className="flex flex-col p-2 ">
            <div className="flex w-full flex-row justify-between gap-8 rounded-lg border-2 p-2 sm:w-[400px]">
              <div className="basis-24">
                {transaction.planet?.name ? (
                  <Link
                    href={`/planet/${transaction.planet?.id}`}
                    className="underline underline-offset-4"
                  >
                    {transaction.planet?.name}
                  </Link>
                ) : (
                  transaction.snapshotPlanetName
                )}
              </div>
              <div className="basis-24">
                ${formatNumberToStringWithCommas(transaction.snapshotListPrice)}
              </div>
              <div className="basis-24">
                {transaction.seller?.name ? (
                  <Link
                    href={`/profile/${transaction.seller?.id}`}
                    className="underline underline-offset-4"
                  >
                    {transaction.seller?.name}
                  </Link>
                ) : (
                  transaction.snapshotSellerName
                )}
              </div>
            </div>
          </div>
        ))}
        <div className="ml-2 mt-1 flex w-full flex-col  rounded-lg font-semibold sm:w-[400px]">
          <p>
            Total:{" "}
            <span className="font-normal">
              $
              {formatNumberToStringWithCommas(
                transactionData.data.reduce(
                  (acc, curr) => acc + curr.snapshotListPrice,
                  0,
                ),
              )}
            </span>
          </p>
          <p className="text-sm text-pbtext-800">
            TxID:{" "}
            <span className="overflow-hidden text-ellipsis  font-normal tracking-tight">
              {transactionId}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
