/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { getBaseUrl, type RouterOutputs } from "~/utils/api";
import { formatNumberToStringWithCommas } from "~/utils/utils";

export const columns: ColumnDef<
  RouterOutputs["user"]["getTransactionHistory"][number]
>[] = [
  {
    accessorKey: "id",
    header: "Transaction ID",
    id: "transactionId",
  },
  {
    // TODO: Add row sorting here
    accessorKey: "timestamp",
    header: "Date",
  },
  {
    // TODO: Add row sorting here
    accessorKey: "purchasedItems",
    header: "Item(s) Purchased",
    cell: ({ row }) => (
      <div>{(row.getValue("purchasedItems") as []).length ?? 0}</div>
    ),
  },
  {
    // TODO: Add row sorting here
    header: "Total",
    cell: ({ row }) => (
      <div>{`$${formatNumberToStringWithCommas(
        row.getValue("transactionTotal"),
      )}`}</div>
    ),
    accessorKey: "transactionTotal",
  },
  {
    header: "Details",
    cell: ({ row }) => (
      <div className="cursor-pointer">
        <Link
          target="_blank"
          href={`${getBaseUrl()}/transaction/${row.getValue("transactionId")}`}
        >
          <OpenInNewWindowIcon
            color="white"
            className="h-4 w-4 rounded-md bg-opacity-30 transition-transform duration-75 hover:scale-125 "
          />
        </Link>
      </div>
    ),
  },
];
