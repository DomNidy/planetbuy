import { type ColumnDef } from "@tanstack/react-table";
import { type RouterOutputs } from "~/utils/api";
import { formatNumberToStringWithCommas } from "~/utils/utils";

export const columns: ColumnDef<
  RouterOutputs["user"]["getTransactionHistory"][number]
>[] = [
  {
    accessorKey: "id",
    header: "Transaction ID",
  },
  {
    accessorKey: "timestamp",
    header: "Date",
  },
  {
    accessorKey: "purchasedItems",
    header: "Item(s) Purchased",
    cell: ({ row }) => (
      <div>{(row.getValue("purchasedItems") as []).length ?? 0}</div>
    ),
  },
  {
    header: "Total",
    cell: ({ row }) => (
      <div>{`$${formatNumberToStringWithCommas(
        row.getValue("transactionTotal"),
      )}`}</div>
    ),
    accessorKey: "transactionTotal",
  },
];
