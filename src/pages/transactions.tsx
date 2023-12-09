import { columns } from "~/components/transactions-table/columns";
import { DataTable } from "~/components/transactions-table/data-table";
import { api } from "~/utils/api";

export default function Transactions() {
  const transacitons = api.user.getTransactionHistory.useQuery({ limit: 5 });

  return (
    <div className="flex min-h-screen w-full justify-center bg-pbdark-800 px-4 py-32 text-white ">
      <DataTable data={transacitons.data ?? []} columns={columns} />
    </div>
  );
}
