// complaints-table.tsx
"use client"

import {useEffect, useMemo, useState} from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import {ComplaintQueryParams, ComplaintStatus} from "@/lib/api/types/complaints";
import CustomizableTable, {useTableState} from "@/components/shared/CustomizableTable";
import {useGetComplaints} from "@/hooks/api/useComplaints";
import {ColumnsComplaints} from "@/components/complaient/ColumnsComplaints";
import {showApiErrorToast} from "@/lib/utils";
import {useDebounce} from "@/hooks/debounceHook";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';

type StatusFilterValue = ComplaintStatus | 'ALL';

const STATUS_FILTERS: { value: StatusFilterValue; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'UNDER_INVESTIGATION', label: 'Under Investigation' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CLOSED', label: 'Closed' },
];

export function ComplaintsTable() {
    const tableState = useTableState()
    const {
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
    } = tableState
    const [globalFilter, setGlobalFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('ALL');
    const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'assigned_to_me' | 'assigned_unread' | 'investigator' | 'investigator_unread'>('all');
    const [globalFilterFields] = useState<string[]>([
        "customer.name",
        "customer.company",
        "product_details.model",
        "product_details.serial_number",
        "complaint_type.name",
    ])
    const currentUser = useAuthStore((state) => state.user);

    const debouncedGlobalFilterValue = useDebounce(globalFilter, 500); // 500ms delay
    const statusFilters = useMemo(() => (
        statusFilter === 'ALL'
            ? []
            : [{ field: 'status', operator: 'eq', value: statusFilter }]
    ), [statusFilter]);

    // Prepare query params
    const queryParams: ComplaintQueryParams = useMemo(() => ({
        page_size: pagination.pageSize,
        page_index: pagination.pageIndex,
        global_value: debouncedGlobalFilterValue,
        global_filter: globalFilterFields,
        sort_by: sorting[0]?.id || "submission_date",
        sort_order: -1, // sorting[0]?.desc ? -1 : 1,
        filters: statusFilters,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        assigned_to: !currentUser ? undefined : (assignmentFilter === 'assigned_to_me' || assignmentFilter === 'assigned_unread') ? currentUser._id : undefined,
        assignee_read: assignmentFilter === 'assigned_unread' ? 'unread' : undefined,
        investigator_user: !currentUser ? undefined : (assignmentFilter === 'investigator' || assignmentFilter === 'investigator_unread') ? currentUser._id : undefined,
        investigator_read: assignmentFilter === 'investigator_unread' ? 'unread' : undefined,
    }), [
        pagination.pageSize,
        pagination.pageIndex,
        debouncedGlobalFilterValue,
        globalFilterFields,
        sorting,
        statusFilters,
        statusFilter,
        assignmentFilter,
        currentUser
    ]);

    const {data, isLoading,isError, error, refetch } = useGetComplaints(queryParams);
    useEffect(() => {
        if (isError && error) {
            showApiErrorToast(error);
        }
    }, [isError, error]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4 lg:flex-1">
                        <Input
                            placeholder="Search complaints..."
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="w-full lg:max-w-xs"
                        />

                        <Tabs
                            value={statusFilter}
                            onValueChange={(value) => setStatusFilter(value as StatusFilterValue)}
                            className="w-full lg:flex-1"
                        >
                            <TabsList className="flex w-full gap-1 overflow-x-auto rounded-md bg-muted/40 p-1 lg:gap-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {STATUS_FILTERS.map(({ value, label }) => (
                                    <TabsTrigger
                                        key={value}
                                        value={value}
                                        className="flex-1 min-w-[110px] whitespace-nowrap text-xs sm:text-sm"
                                    >
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>

                        <Select
                            value={assignmentFilter}
                            onValueChange={(value) => setAssignmentFilter(value as typeof assignmentFilter)}
                        >
                            <SelectTrigger className="w-full lg:w-56" disabled={!currentUser}>
                                <SelectValue placeholder="Assignment filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All complaints</SelectItem>
                                <SelectItem value="assigned_to_me">Assigned to me</SelectItem>
                                <SelectItem value="assigned_unread">My unread assignments</SelectItem>
                                <SelectItem value="investigator">My investigation tasks</SelectItem>
                                <SelectItem value="investigator_unread">My unread investigation tasks</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 self-start lg:self-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isLoading}
                            className="w-full lg:w-auto"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </div>

            <CustomizableTable
                columns={ColumnsComplaints}
                data={data?.list || []}
                totalItems={data?.count || 0}
                isLoading={isLoading}
                // error={error}
                options={{
                    manualPagination: true,
                    manualSorting: true,
                    manualFiltering: true,
                    pageSizeOptions: [10, 25, 50, 100],
                }}
                sorting={sorting}
                onSortingChange={setSorting}
                pagination={pagination}
                onPaginationChange={setPagination}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                showRowSelection
            />
        </div>
    )
}
