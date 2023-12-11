import { columns } from "~/components/sell-history-table/sell-history-columns";
import { DataTable } from "~/components/sell-history-table/sell-history-table";
import { api } from "~/utils/api";

export default function SellHistory() {
  const sellTransactions = api.user.getSellTransactionHistory.useInfiniteQuery(
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
            sellTransactions.data?.pages.flatMap((page) =>
              page.sellTransactions.flatMap((tx) => tx),
            ) ?? []
          }
          columns={columns}
          dataFetcherFn={sellTransactions.fetchNextPage}
        />
      </div>
    </div>
  );
}
