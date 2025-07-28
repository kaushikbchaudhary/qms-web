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
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

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
    }
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
                                             defaultPageSize = 100,
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
                                             },
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

    const table = useReactTable({
        data,
        columns,
        pageCount: options.manualPagination ? Math.ceil(totalItems / actualPagination.pageSize) : undefined,
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

    // Default loading component
    const defaultLoadingComponent = (
        <div className="space-y-2 w-screen container">
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
        <div className="w-screen container space-y-4">
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
            <div className="rounded-md border">
                {isLoading ? (
                    loadingComponent || defaultLoadingComponent
                ) : (
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        { error ? (
                            errorComponent || defaultErrorComponent
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            emptyStateComponent || defaultEmptyStateComponent
                            )}
                    </TableBody>
                </Table>
                )}
            </div>

            {/* Pagination and row selection info */}
            {showPagination && (
                <div className="flex items-center justify-between">
                    {showRowSelection ? (
                        <div className="text-sm text-muted-foreground">
                            {table.getFilteredSelectedRowModel().rows.length} of{" "}
                            {table.getFilteredRowModel().rows.length} row(s) selected.
                        </div>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={()=> table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
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