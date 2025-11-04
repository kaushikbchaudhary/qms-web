'use client';
import {useEffect, useMemo, useState} from 'react';
import { userColumns } from './user-columns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {formatRoleLabel, roles} from "@/config/roles";
import CustomizableTable, {useTableState} from "@/components/shared/CustomizableTable";
import {ComplaintQueryParams, Filter} from "@/lib/api/types/complaints";
import {showApiErrorToast} from "@/lib/utils";
import {useDebounce} from "@/hooks/debounceHook";
import {useGetUsers} from "@/hooks/api/useUser";

export function UserList() {
    // const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    // const [sorting, setSorting] = useState<SortingState>([]);
    // const [pagination, setPagination] = useState({
    //     pageIndex: 0,
    //     pageSize: 10,
    // });
    const tableState = useTableState()
    const { pagination, setPagination, sorting, setSorting, columnVisibility, setColumnVisibility, rowSelection, setRowSelection, columnFilters, setColumnFilters } = tableState
    const [globalFilter, setGlobalFilter] = useState("")
    const [selectedRole, setSelectedRole] = useState<string>("")

    const globalFilterFields = useMemo(() => ["searchText"], [])
    const roleOptions = useMemo(() => Object.values(roles), [])

    const debouncedGlobalFilterValue = useDebounce(globalFilter, 500); // 500ms delay

    const filters = useMemo<Filter[]>(() => {
        if (!selectedRole) return [];
        return [
            {
                field: "role",
                operator: "in",
                value: selectedRole,
                subType: "string",
            },
        ];
    }, [selectedRole]);

    // Prepare query params
    const queryParams: ComplaintQueryParams = useMemo(() => {
        const trimmedSearch = debouncedGlobalFilterValue.trim();
        const sortDescriptor = sorting[0];
        const sortBy = sortDescriptor?.id ?? "createdAt";
        const sortOrder = sortDescriptor ? (sortDescriptor.desc ? -1 : 1) : -1;

        return {
            page_size: pagination.pageSize,
            page_index: pagination.pageIndex + 1,
            global_value: trimmedSearch,
            global_filter: trimmedSearch ? globalFilterFields : [],
            sort_by: sortBy,
            sort_order: sortOrder,
            filters,
        };
    }, [
        debouncedGlobalFilterValue,
        filters,
        globalFilterFields,
        pagination.pageIndex,
        pagination.pageSize,
        sorting,
    ]);

    const {data, isLoading,isError, error } = useGetUsers(queryParams);
    useEffect(() => {
        if (isError && error) {
            showApiErrorToast(error);
        }
    }, [isError, error]);

    // Fetch user data
    // const { data, isLoading, error } = useQuery({
    //     queryKey: ['users', pagination, columnFilters, sorting],
    //     queryFn: async () => {
    //         // Convert filters to API format
    //         const filters = columnFilters.map(filter => {
    //             if (filter.id === 'role') {
    //                 return {
    //                     field: 'role',
    //                     operator: 'in',
    //                     value: filter.value
    //                 };
    //             }
    //             return {
    //                 field: filter.id,
    //                 operator: '=',
    //                 value: filter.value
    //             };
    //         });
    //
    //         // Convert sorting to API format
    //         const sortField = sorting[0]?.id || 'createdAt';
    //         const sortOrder = sorting[0]?.desc ? -1 : 1;
    //
    //         const response = await axios.post('/api/v1/users/list', {
    //             page_index: pagination.pageIndex + 1,
    //             page_size: pagination.pageSize,
    //             sort_by: sortField,
    //             sort_order: sortOrder,
    //             filters
    //         }, {
    //             withCredentials: true
    //         });
    //
    //         return response.data.data;
    //     },
    //     keepPreviousData: true,
    // });

    // Initialize table
    // const table = useReactTable({
    //     data: data?.users || [],
    //     columns: userColumns,
    //     pageCount: Math.ceil((data?.count || 0) / pagination.pageSize),
    //     state: {
    //         columnFilters,
    //         sorting,
    //         pagination,
    //     },
    //     onColumnFiltersChange: setColumnFilters,
    //     onSortingChange: setSorting,
    //     onPaginationChange: setPagination,
    //     getCoreRowModel: getCoreRowModel(),
    //     getFilteredRowModel: getFilteredRowModel(),
    //     getPaginationRowModel: getPaginationRowModel(),
    //     getSortedRowModel: getSortedRowModel(),
    //     manualPagination: true,
    //     manualFiltering: true,
    //     manualSorting: true,
    // });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    <Input
                        placeholder="Search by name, email, role or contact..."
                        value={globalFilter}
                        onChange={(event) => {
                            setGlobalFilter(event.target.value);
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                        className="w-full max-w-xs md:max-w-sm"
                    />
                    <Select
                        value={selectedRole || "all"}
                        onValueChange={(value) => {
                            const roleValue = value === "all" ? "" : value;
                            setSelectedRole(roleValue);
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            {roleOptions.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {formatRoleLabel(role)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {(globalFilter.trim() || selectedRole) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setGlobalFilter("");
                            setSelectedRole("");
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        Clear filters
                    </Button>
                )}
            </div>

            <CustomizableTable
                columns={userColumns}
                data={data?.list || []}
                totalItems={data?.count || 0}
                isLoading={isLoading}
                // error={error}
                options={{
                    manualPagination: true,
                    manualSorting: true,
                    manualFiltering: true,
                }}
                sorting={sorting}
                pagination={pagination}
                columnVisibility={columnVisibility}
                rowSelection={rowSelection}
                columnFilters={columnFilters}
                onSortingChange={setSorting}
                onPaginationChange={setPagination}
                onColumnVisibilityChange={setColumnVisibility}
                onRowSelectionChange={setRowSelection}
                onColumnFiltersChange={setColumnFilters}
            />

        {/*    <div className="flex items-center justify-end space-x-2">*/}
        {/*        <Button*/}
        {/*            variant="outline"*/}
        {/*            size="sm"*/}
        {/*            onClick={() => table.previousPage()}*/}
        {/*            disabled={!table.getCanPreviousPage()}*/}
        {/*        >*/}
        {/*            Previous*/}
        {/*        </Button>*/}
        {/*        <span className="text-sm">*/}
        {/*  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}*/}
        {/*</span>*/}
        {/*        <Button*/}
        {/*            variant="outline"*/}
        {/*            size="sm"*/}
        {/*            onClick={() => table.nextPage()}*/}
        {/*            disabled={!table.getCanNextPage()}*/}
        {/*        >*/}
        {/*            Next*/}
        {/*        </Button>*/}
        {/*    </div>*/}
        </div>
    );
}
