import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import { Button } from "../../../components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  accessor?: (row: T) => ReactNode;
  render?: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Array<DataTableColumn<T>>;
  isLoading?: boolean;
  emptyMessage?: ReactNode;
  onSort?: (key: string) => void;
  currentSort?: { key: string; direction: "asc" | "desc" };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No data",
  onSort,
  currentSort,
  pagination
}: DataTableProps<T>): JSX.Element {
  const totalPages = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => {
                const isSorted = currentSort?.key === column.key;
                const direction = isSorted ? currentSort?.direction : undefined;
                return (
                  <TableHead key={column.key} className={column.className ?? ""}>
                    {column.sortable && onSort ? (
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={() => onSort(column.key)}
                      >
                        {column.header}
                        {isSorted ? (
                          <span>{direction === "asc" ? "▲" : "▼"}</span>
                        ) : (
                          <span className="text-muted-foreground">↕</span>
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <Fragment key={rowIndex}>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className ?? ""}>
                        {column.render ? column.render(row) : column.accessor ? column.accessor(row) : (row as any)[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                </Fragment>
              ))
            )}
          </TableBody>
          {pagination && (
            <TableCaption>
              <div className="flex items-center justify-between">
                <div>
                  Page {pagination.page} of {totalPages} ({pagination.total} items)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => pagination.onPageChange(1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => pagination.onPageChange(Math.min(totalPages, pagination.page + 1))}
                    disabled={pagination.page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => pagination.onPageChange(totalPages)}
                    disabled={pagination.page >= totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TableCaption>
          )}
        </Table>
      </div>
    </div>
  );
}
