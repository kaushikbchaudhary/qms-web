"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
    PaginationState,
    OnChangeFn,
    RowSelectionState,
} from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

type CustomColumnMeta = {
    className?: string;
    actionClassName?: string;
    [key: string]: unknown;
};

export interface DataTableProps<TData, TValue> {
    /**
     * Array of column definitions
     */
    columns: ColumnDef<TData, TValue>[]
    /**
     * The data to display in the table
     */
    data: TData[]
    /**
     * Total number of items available on the server
     */
    totalItems?: number
    /**
     * Loading state of the table
     */
    isLoading?: boolean
    /**
     * Error state of the table
     */
    error?: Error | null
    /**
     * Pagination state
     */
    pagination?: PaginationState
    /**
     * Callback when pagination changes
     */
    onPaginationChange?: OnChangeFn<PaginationState>
    /**
     * Sorting state
     */
    sorting?: SortingState
    /**
     * Callback when sorting changes
     */
    onSortingChange?: OnChangeFn<SortingState>
    /**
     * Column filters state
     */
    columnFilters?: ColumnFiltersState
    /**
     * Callback when column filters change
     */
    onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>
    /**
     * Column visibility state
     */
    columnVisibility?: VisibilityState
    /**
     * Callback when column visibility changes
     */
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>
    /**
     * Row selection state
     */
    rowSelection?: RowSelectionState
    /**
     * Callback when row selection changes
     */
    onRowSelectionChange?: OnChangeFn<RowSelectionState>
    /**
     * Default page size
     */
    defaultPageSize?: number
    /**
     * Whether to show column visibility toggle
     */
    showColumnVisibilityToggle?: boolean
    /**
     * Whether to show pagination controls
     */
    showPagination?: boolean
    /**
     * Whether to show row selection checkboxes
     */
    showRowSelection?: boolean
    /**
     * Custom filter input component
     */
    filterComponent?: React.ReactNode
    /**
     * Custom empty state component
     */
    emptyStateComponent?: React.ReactNode
    /**
     * Custom loading skeleton component
     */
    loadingComponent?: React.ReactNode
    /**
     * Custom error state component
     */
    errorComponent?: React.ReactNode
    /**
     * Additional table options
     */
    options?: {
        manualPagination?: boolean
        manualSorting?: boolean
        manualFiltering?: boolean
        pageSizeOptions?: number[]
    }
    /**
     * Optional row click handler
     */
    onRowClick?: (row: TData, rowIndex: number) => void
    /**
     * Optional row className resolver
     */
    getRowClassName?: (row: TData, rowIndex: number) => string | undefined
}

export default function CustomizableTable<TData, TValue>({
                                             columns,
                                             data,
                                             totalItems = 0,
                                             isLoading = false,
                                             error = null,
                                             pagination,
                                             onPaginationChange,
                                             sorting,
                                             onSortingChange,
                                             columnFilters,
                                             onColumnFiltersChange,
                                             columnVisibility,
                                             onColumnVisibilityChange,
                                             rowSelection,
                                             onRowSelectionChange,
                                             defaultPageSize = 10,
                                             showColumnVisibilityToggle = true,
                                             showPagination = true,
                                             showRowSelection = false,
                                             filterComponent,
                                             emptyStateComponent,
                                             loadingComponent,
                                             errorComponent,
                                             options = {
                                                 manualPagination: false,
                                                 manualSorting: false,
                                                 manualFiltering: false,
                                                 pageSizeOptions: [10, 25, 50, 100],
                                             },
                                             onRowClick,
                                             getRowClassName,
                                         }: DataTableProps<TData, TValue>) {
    const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: defaultPageSize,
    })

    const [internalSorting, setInternalSorting] = React.useState<SortingState>([])
    const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>([])
    const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>({})
    const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({})

    // Use controlled state if provided, otherwise use internal state
    const actualPagination = pagination !== undefined ? pagination : internalPagination
    const actualSorting = sorting !== undefined ? sorting : internalSorting
    const actualColumnFilters = columnFilters !== undefined ? columnFilters : internalColumnFilters
    const actualColumnVisibility = columnVisibility !== undefined ? columnVisibility : internalColumnVisibility
    const actualRowSelection = rowSelection !== undefined ? rowSelection : internalRowSelection

    const handlePaginationChange = onPaginationChange !== undefined
        ? onPaginationChange
        : setInternalPagination

    const handleSortingChange = onSortingChange !== undefined
        ? onSortingChange
        : setInternalSorting

    const handleColumnFiltersChange = onColumnFiltersChange !== undefined
        ? onColumnFiltersChange
        : setInternalColumnFilters

    const handleColumnVisibilityChange = onColumnVisibilityChange !== undefined
        ? onColumnVisibilityChange
        : setInternalColumnVisibility

    const handleRowSelectionChange = onRowSelectionChange !== undefined
        ? onRowSelectionChange
        : setInternalRowSelection

    const pageSizeOptions = options.pageSizeOptions ?? [10, 25, 50, 100]
    const manualTotalItems = options.manualPagination
        ? (totalItems && totalItems > 0 ? totalItems : data.length)
        : undefined

    const table = useReactTable({
        data,
        columns,
        pageCount: options.manualPagination
            ? Math.max(
                1,
                Math.ceil(
                    Math.max(manualTotalItems ?? 1, 1) /
                    Math.max(actualPagination.pageSize, 1)
                )
            )
            : undefined,
        state: {
            pagination: actualPagination,
            sorting: actualSorting,
            columnFilters: actualColumnFilters,
            columnVisibility: actualColumnVisibility,
            rowSelection: actualRowSelection,
        },
        onPaginationChange: handlePaginationChange,
        onSortingChange: handleSortingChange,
        onColumnFiltersChange: handleColumnFiltersChange,
        onColumnVisibilityChange: handleColumnVisibilityChange,
        onRowSelectionChange: handleRowSelectionChange,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: options.manualPagination ? undefined : getPaginationRowModel(),
        getSortedRowModel: options.manualSorting ? undefined : getSortedRowModel(),
        getFilteredRowModel: options.manualFiltering ? undefined : getFilteredRowModel(),
        manualPagination: options.manualPagination,
        manualSorting: options.manualSorting,
        manualFiltering: options.manualFiltering,
        debugTable: process.env.NODE_ENV === 'development',
    })

    const paginationState = table.getState().pagination
    const resolvedTotalItems = options.manualPagination
        ? (manualTotalItems ?? 0)
        : table.getFilteredRowModel().rows.length
    const currentPageStart = resolvedTotalItems === 0
        ? 0
        : paginationState.pageIndex * paginationState.pageSize + 1
    const currentPageRowCount = table.getRowModel().rows.length || data.length
    const currentPageEnd = resolvedTotalItems === 0
        ? 0
        : Math.min(
            resolvedTotalItems,
            currentPageStart + currentPageRowCount - 1
        )
    const totalPages = options.manualPagination
        ? Math.max(1, Math.ceil(Math.max(resolvedTotalItems, 1) / Math.max(paginationState.pageSize, 1)))
        : Math.max(1, table.getPageCount() || 1)
    const selectedRowCount = table.getFilteredSelectedRowModel().rows.length

    // Default loading component
    const defaultLoadingComponent = (
        <div className="space-y-2 w-full">
            {Array.from({ length: actualPagination.pageSize }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    )

    // Default error component
    const defaultErrorComponent = (
        <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center text-red-500">
                Error loading data: {'error?.message'}
            </TableCell>
        </TableRow>
    )

    // Default empty state component
    const defaultEmptyStateComponent = (
        <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
                No results found.
            </TableCell>
        </TableRow>
    )

    return (
        <div className="w-full space-y-4">
            {/* Filter and column visibility controls */}
            <div className="flex items-center justify-between gap-4">
                {/*{filterComponent || (*/}
                {/*    <Input*/}
                {/*        placeholder="Filter data..."*/}
                {/*        value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}*/}
                {/*        onChange={(event) =>*/}
                {/*            table.getColumn("email")?.setFilterValue(event.target.value)*/}
                {/*        }*/}
                {/*        className="max-w-sm"*/}
                {/*    />*/}
                {/*)}*/}

                {/*{showColumnVisibilityToggle && (*/}
                {/*    <DropdownMenu>*/}
                {/*        <DropdownMenuTrigger asChild>*/}
                {/*            <Button variant="outline" className="ml-auto">*/}
                {/*                Columns <ChevronDown className="ml-2 h-4 w-4" />*/}
                {/*            </Button>*/}
                {/*        </DropdownMenuTrigger>*/}
                {/*        <DropdownMenuContent align="end">*/}
                {/*            {table*/}
                {/*                .getAllColumns()*/}
                {/*                .filter((column) => column.getCanHide())*/}
                {/*                .map((column) => (*/}
                {/*                    <DropdownMenuCheckboxItem*/}
                {/*                        key={column.id}*/}
                {/*                        className="capitalize"*/}
                {/*                        checked={column.getIsVisible()}*/}
                {/*                        onCheckedChange={(value) =>*/}
                {/*                            column.toggleVisibility(!!value)*/}
                {/*                        }*/}
                {/*                    >*/}
                {/*                        {column.id}*/}
                {/*                    </DropdownMenuCheckboxItem>*/}
                {/*                ))}*/}
                {/*        </DropdownMenuContent>*/}
                {/*    </DropdownMenu>*/}
                {/*)}*/}
            </div>

            {/* Table */}
            <div className="w-full overflow-hidden rounded-md border">
                <div className="w-full overflow-x-auto">
                    {isLoading ? (
                        loadingComponent || defaultLoadingComponent
                    ) : (
                <Table className="min-w-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const columnMeta = header.column.columnDef.meta as CustomColumnMeta | undefined;
                                    const headClassName = columnMeta?.className ?? columnMeta?.actionClassName ?? "";

                                    return (
                                        <TableHead key={header.id} className={headClassName}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        { error ? (
                            errorComponent || defaultErrorComponent
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => {
                                const resolvedClassName = getRowClassName
                                    ? getRowClassName(row.original, row.index) ?? ''
                                    : '';
                                const isClickable = Boolean(onRowClick) && !resolvedClassName.includes('cursor-not-allowed');
                                const rowClasses = [
                                    'transition-colors',
                                    isClickable ? 'cursor-pointer hover:bg-muted/60' : '',
                                    resolvedClassName,
                                ]
                                    .filter(Boolean)
                                    .join(' ');

                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        onClick={
                                            onRowClick
                                                ? () => onRowClick(row.original, row.index)
                                                : undefined
                                        }
                                        className={rowClasses}
                                    >
                                        {row.getVisibleCells().map((cell) => {
                                            const cellMeta = cell.column.columnDef.meta as CustomColumnMeta | undefined;
                                            const cellClassName = cellMeta?.className ?? cellMeta?.actionClassName ?? "";

                                            return (
                                                <TableCell key={cell.id} className={cellClassName}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        ) : (
                            emptyStateComponent || defaultEmptyStateComponent
                            )}
                    </TableBody>
                </Table>
                    )}
                </div>
            </div>

            {/* Pagination and row selection info */}
            {showPagination && (
                <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                        {resolvedTotalItems === 0 ? (
                            'No records to display.'
                        ) : (
                            <>
                                Showing <span className="font-medium text-foreground">{currentPageStart}</span>
                                {'-'}
                                <span className="font-medium text-foreground">{currentPageEnd}</span>
                                {' of '}
                                <span className="font-medium text-foreground">{resolvedTotalItems}</span>
                                {` item${resolvedTotalItems === 1 ? '' : 's'}`}.
                            </>
                        )}
                        {showRowSelection && selectedRowCount > 0 && (
                            <span className="ml-2 text-xs text-foreground">
                                • {selectedRowCount} selected
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Rows per page</span>
                            <Select
                                value={String(paginationState.pageSize)}
                                onValueChange={(value) => table.setPageSize(Number(value))}
                            >
                                <SelectTrigger className="h-8 w-[90px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pageSizeOptions.map((size) => (
                                        <SelectItem key={size} value={String(size)}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            Page
                            <span className="font-medium text-foreground">
                                {resolvedTotalItems === 0 ? 0 : paginationState.pageIndex + 1}
                            </span>
                            <span>/</span>
                            <span>{resolvedTotalItems === 0 ? 0 : totalPages}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="h-8 w-8"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="h-8 w-8"
                                aria-label="Next page"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Utility hook to use with your API calls
export function useTableState(defaultPageSize = 10) {
    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: defaultPageSize,
    })
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

    return {
        pagination,
        setPagination,
        sorting,
        setSorting,
        columnFilters,
        setColumnFilters,
        columnVisibility,
        setColumnVisibility,
        rowSelection,
        setRowSelection,
    }
}
