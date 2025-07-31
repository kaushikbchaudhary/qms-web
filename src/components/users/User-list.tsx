'use client';
import {useEffect, useState} from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    ColumnFiltersState,
    SortingState,
} from '@tanstack/react-table';
import { userColumns } from './user-columns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {roles} from "@/config/roles";
import CustomizableTable, {useTableState} from "@/components/shared/CustomizableTable";
import {ComplaintQueryParams} from "@/lib/api/types/complaints";
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
    const { pagination, sorting ,columnVisibility, rowSelection} = tableState
    const [globalFilter, setGlobalFilter] = useState("")
    const [globalFilterFields] = useState<string[]>([
        "role",
        "firstName",
        "isVerified",
        "lastName",
    ])

    const debouncedGlobalFilterValue = useDebounce(globalFilter, 500); // 500ms delay

    // Prepare query params
    const queryParams: ComplaintQueryParams = {
        page_size: pagination.pageSize,
        page_index: pagination.pageIndex,
        global_value: debouncedGlobalFilterValue,
        global_filter: globalFilterFields,
        sort_by: sorting[0]?.id || "submission_date",
        sort_order: sorting[0]?.desc ? -1 : 1,
        filters: [], // Add any specific filters here
    }

    const {data, isLoading,isError, error, refetch } = useGetUsers(queryParams);
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
            <div className="flex items-center justify-between">
                {/*<Input*/}
                {/*    placeholder="Search users..."*/}
                {/*    value={(table.getColumn('emailId')?.getFilterValue() as string) ?? ''}*/}
                {/*    onChange={(e) => table.getColumn('emailId')?.setFilterValue(e.target.value)}*/}
                {/*    className="max-w-sm"*/}
                {/*/>*/}

                {/*<div className="flex gap-2">*/}
                {/*    /!* Role filter buttons *!/*/}
                {/*    {Object.values(roles).map((role) => (*/}
                {/*        <Button*/}
                {/*            key={role}*/}
                {/*            variant={*/}
                {/*                columnFilters.some(f => f.id === 'role' && f.value?.includes(role))*/}
                {/*                    ? 'default'*/}
                {/*                    : 'outline'*/}
                {/*            }*/}
                {/*            size="sm"*/}
                {/*            onClick={() => {*/}
                {/*                const roleFilter = columnFilters.find(f => f.id === 'role');*/}
                {/*                if (roleFilter) {*/}
                {/*                    const newValue = roleFilter.value?.includes(role)*/}
                {/*                        ? roleFilter.value.filter((v: string) => v !== role)*/}
                {/*                        : [...(roleFilter.value || []), role];*/}
                {/*                    table.getColumn('role')?.setFilterValue(newValue.length ? newValue : undefined);*/}
                {/*                } else {*/}
                {/*                    table.getColumn('role')?.setFilterValue([role]);*/}
                {/*                }*/}
                {/*            }}*/}
                {/*        >*/}
                {/*            {role}*/}
                {/*        </Button>*/}
                {/*    ))}*/}
                {/*</div>*/}
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