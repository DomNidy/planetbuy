/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { getBaseUrl, type RouterOutputs } from "~/utils/api";
import { formatNumberToStringWithCommas } from "~/utils/utils";
import { Button } from "../ui/button";

export const columns: ColumnDef<
  RouterOutputs["user"]["getTransactionHistory"]["transactions"][number]
>[] = [
  {
    accessorFn: (row) => row.id,
    accessorKey: "id",
    header: "Transaction ID",
    id: "transactionId",
  },
  {
    // TODO: Add row sorting here
    accessorKey: "timestamp",
    header: "Date",
    accessorFn: (row) => new Date(row.timestamp),
  },
  {
    // TODO: Add row sorting here
    accessorKey: "purchasedItems",
    accessorFn: (row) => row.purchasedItems.length,
    header: ({ column }) => {
      return (
        // TODO: Style this button
        <p>Item(s) purchased</p>
      );
    },
    cell: ({ row }) => <div>{row.getValue("purchasedItems") ?? 0}</div>,
  },
  {
    // TODO: Add row sorting here
    header: "Total",
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
