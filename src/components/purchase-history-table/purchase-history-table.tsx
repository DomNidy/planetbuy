import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  type PaginationState,
  type SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { useMemo, useState } from "react";
import {
  type FetchNextPageOptions,
  type InfiniteQueryObserverResult,
} from "@tanstack/react-query";
import { type RouterOutputs } from "~/utils/api";

// TODO: We should adjust this interface to use generic type instead of hardcoding it with RouterOutputs["user"]["getPurchaseTransactionHistory"]
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  dataFetcherFn: (
    options?: FetchNextPageOptions | undefined,
  ) =>
    | Promise<
        InfiniteQueryObserverResult<
          RouterOutputs["user"]["getPurchaseTransactionHistory"]
        >
      >
    | undefined;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  dataFetcherFn,
}: DataTableProps<TData, TValue>) {
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // TODO: We can pass this state the the dataFetcherFn to fetch a dynamic amount of data
  const pagination = useMemo(
    () => ({ pageIndex, pageSize }),
    [pageIndex, pageSize],
  );

  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { pagination, sorting },
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange: setPagination,
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-pbdark-850 ">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-white/0">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="font-semibold text-white "
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getCoreRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                className="hover:bg-muted/20"
                key={row.id}
                aria-selected={row.getIsSelected() && "true"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="hover:bg-none">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="mr-2 flex items-center justify-end space-x-2 py-4">
        <Button
          variant={"foreground"}
          size={"sm"}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <p>
          {pagination.pageIndex} / {table.getPageCount() - 1}
        </p>
        <Button
          variant={"foreground"}
          size={"sm"}
          onClick={() => {
            void dataFetcherFn();
            console.log("Next");
            table.nextPage();
          }}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
