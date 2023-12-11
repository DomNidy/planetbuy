import { columns } from "~/components/transactions-table/columns";
import { DataTable } from "~/components/transactions-table/data-table";
import { api } from "~/utils/api";

export default function Transactions() {
  const transactions = api.user.getTransactionHistory.useInfiniteQuery(
    {
      limit: 13,
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
