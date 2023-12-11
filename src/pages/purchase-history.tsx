import { columns } from "~/components/purchase-history-table/purchase-history-columns";
import { DataTable } from "~/components/purchase-history-table/purchase-history-table";
import { api } from "~/utils/api";

export default function Transactions() {
  const transactions = api.user.getPurchaseTransactionHistory.useInfiniteQuery(
    {
      limit: 12,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 30000,
      keepPreviousData: true,
    },
  );

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-pbdark-800 px-4 py-32 text-white ">
      <div className="flex flex-col ">
        <DataTable
          data={
            transactions.data?.pages.flatMap((page) =>
              page.transactions.flatMap((tx) => tx),
            ) ?? []
          }
          columns={columns}
          dataFetcherFn={transactions.fetchNextPage}
        />
      </div>
    </div>
  );
}
