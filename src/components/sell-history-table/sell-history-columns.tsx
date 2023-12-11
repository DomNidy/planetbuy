/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { getBaseUrl, type RouterOutputs } from "~/utils/api";
import { formatNumberToStringWithCommas } from "~/utils/utils";
import { SortAsc, SortDesc } from "lucide-react";

export const columns: ColumnDef<
  RouterOutputs["user"]["getSellTransactionHistory"]["sellTransactions"][number]
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
          {new Date(row.original.startDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}
        </div>
      );
    },
    accessorFn: (row) => new Date(row.startDate),
  },
  {
    accessorKey: "planet",
    header: ({ column }) => {
      return (
        <div
          className="flex cursor-pointer items-center gap-2  text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <p>Planet</p>
          {column.getIsSorted() === "asc" ? <SortDesc /> : <SortAsc />}
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <>
          {row.original?.planet?.id ? (
            <Link
              href={`/planet/${row.original.planet.id}`}
              target="_blank"
              className="flex gap-2"
            >
              <p className="font-semibold underline underline-offset-4">
                {row.original.snapshotPlanetName}
              </p>
              <OpenInNewWindowIcon />
            </Link>
          ) : (
            <div>{row.original.snapshotPlanetName}</div>
          )}
        </>
      );
    },
  },
  {
    accessorKey: "buyer",
    accessorFn: (row) => row.snapshotBuyerName ?? "Unknown",
    header: ({ column }) => {
      return (
        <div
          className="flex cursor-pointer items-center gap-2  text-left"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <p>Buyer</p>
          {column.getIsSorted() === "asc" ? <SortDesc /> : <SortAsc />}
        </div>
      );
    },
    // TODO: We can implement the functionality to link to the buyer's profile here
    // TODO: (we would need to get the buyers id and current display name from the backend first, we could do this in the same query this data is coming from)
    cell: ({ row }) => <div>{row.original.snapshotBuyerName ?? "Unknown"}</div>,
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
    accessorFn: (row) => row.snapshotListPrice,
    cell: ({ row }) => (
      <div className="font-semibold text-green-400 ">{`+$${formatNumberToStringWithCommas(
        row.original.snapshotListPrice,
      )}`}</div>
    ),
    accessorKey: "transactionTotal",
  },
];
