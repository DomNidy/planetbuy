/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { getBaseUrl, type RouterOutputs } from "~/utils/api";
import { formatNumberToStringWithCommas } from "~/utils/utils";
import { SortAsc, SortDesc } from "lucide-react";

export const columns: ColumnDef<
  RouterOutputs["user"]["getPurchaseTransactionHistory"]["transactions"][number]
>[] = [
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <div
          className="flex cursor-pointer items-center gap-2  text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <p>Date</p>
          {column.getIsSorted() === "asc" ? <SortDesc /> : <SortAsc />}
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div>
          {new Date(row.original.timestamp).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}
        </div>
      );
    },
    accessorFn: (row) => new Date(row.timestamp),
  },
  {
    accessorKey: "purchasedItems",
    accessorFn: (row) => row.purchasedItems.length,
    header: ({ column }) => {
      return (
        <div
          className="flex cursor-pointer items-center gap-2  text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <p>Item(s) purchased</p>
          {column.getIsSorted() === "asc" ? <SortDesc /> : <SortAsc />}
        </div>
      );
    },
    cell: ({ row }) => <div>{row.getValue("purchasedItems") ?? 0}</div>,
  },
  {
    header: ({ column }) => {
      return (
        <div
          className="flex cursor-pointer items-center gap-2  text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <p>Total</p>
          {column.getIsSorted() === "asc" ? <SortDesc /> : <SortAsc />}
        </div>
      );
    },
    accessorFn: (row) => row.transactionTotal,
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
          href={`${getBaseUrl()}/transaction/${row.original.id}`}
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
