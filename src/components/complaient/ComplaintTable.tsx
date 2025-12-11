// complaints-table.tsx
"use client"

import {useEffect, useMemo, useRef, useState} from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarRange, Search, X } from "lucide-react"
import {ComplaintQueryParams, ComplaintStatus} from "@/lib/api/types/complaints";
import CustomizableTable, {useTableState} from "@/components/shared/CustomizableTable";
import {useGetComplaints} from "@/hooks/api/useComplaints";
import {ColumnsComplaints} from "@/components/complaient/ColumnsComplaints";
import {cn, showApiErrorToast} from "@/lib/utils";
import {useDebounce} from "@/hooks/debounceHook";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { endOfMonth, format, startOfMonth, subDays } from 'date-fns';
import {usePathname, useRouter, useSearchParams} from "next/navigation";

type StatusFilterValue = ComplaintStatus | 'ALL';

const STATUS_FILTERS: { value: StatusFilterValue; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'UNDER_INVESTIGATION', label: 'Under Investigation' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CLOSED', label: 'Closed' },
];

type DateFilterKey = 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_3_DAYS' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM';

const QUICK_DATE_FILTERS: DateFilterKey[] = ['ALL', 'TODAY', 'YESTERDAY', 'LAST_3_DAYS', 'LAST_7_DAYS', 'THIS_MONTH'];

interface DateFilterState {
    key: DateFilterKey;
    range?: DateRange;
}

const DATE_FILTER_LABELS: Record<Exclude<DateFilterKey, 'CUSTOM'>, string> = {
    ALL: 'All time',
    TODAY: 'Today',
    YESTERDAY: 'Yesterday',
    LAST_3_DAYS: 'Last 3 days',
    LAST_7_DAYS: 'Last 7 days',
    THIS_MONTH: 'This month',
};

const atStartOfDay = (date: Date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

const getPresetRange = (key: DateFilterKey): DateRange | undefined => {
    const today = atStartOfDay(new Date());

    switch (key) {
        case 'TODAY':
            return { from: today, to: today };
        case 'YESTERDAY': {
            const yesterday = atStartOfDay(subDays(today, 1));
            return { from: yesterday, to: yesterday };
        }
        case 'LAST_3_DAYS': {
            const from = atStartOfDay(subDays(today, 2));
            return { from, to: today };
        }
        case 'LAST_7_DAYS': {
            const from = atStartOfDay(subDays(today, 6));
            return { from, to: today };
        }
        case 'THIS_MONTH': {
            const from = atStartOfDay(startOfMonth(today));
            const to = atStartOfDay(endOfMonth(today));
            return { from, to };
        }
        default:
            return undefined;
    }
};

const formatDateRangeLabel = (range?: DateRange) => {
    if (!range?.from) return 'Custom';

    const fromLabel = format(range.from, 'MMM d, yyyy');
    const toLabel = range.to ? format(range.to, 'MMM d, yyyy') : fromLabel;

    return fromLabel === toLabel ? fromLabel : `${fromLabel} – ${toLabel}`;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

const parsePaginationFromSearchParams = (params: ReturnType<typeof useSearchParams> | null) => {
    const pageParam = params?.get('page');
    const pageSizeParam = params?.get('pageSize');

    const parsedPage = Number.parseInt(pageParam ?? '', 10);
    const parsedPageSize = Number.parseInt(pageSizeParam ?? '', 10);

    const pageIndex = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage - 1 : 0;
    const pageSize = PAGE_SIZE_OPTIONS.includes(parsedPageSize as (typeof PAGE_SIZE_OPTIONS)[number])
        ? parsedPageSize
        : PAGE_SIZE_OPTIONS[0];

    return { pageIndex, pageSize };
};

export function ComplaintsTable() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const initialPaginationRef = useRef<{ pageIndex: number; pageSize: number } | null>(null);

    if (!initialPaginationRef.current) {
        initialPaginationRef.current = parsePaginationFromSearchParams(searchParams);
    }

    const tableState = useTableState(initialPaginationRef.current.pageSize, initialPaginationRef.current)
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
    const [dateFilter, setDateFilter] = useState<DateFilterState>({ key: 'ALL' });
    const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
    const [pendingCustomRange, setPendingCustomRange] = useState<DateRange | undefined>();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [timelineFilter, setTimelineFilter] = useState<'all' | 'investigation_overdue' | 'closure_overdue'>('all');
    const searchInputRef = useRef<HTMLInputElement>(null);
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

    const dateRangeFilters = useMemo(() => {
        if (dateFilter.key === 'ALL' || !dateFilter.range?.from) {
            return [] as ComplaintQueryParams['filters'];
        }

        const from = dateFilter.range.from;
        const to = dateFilter.range.to ?? dateFilter.range.from;
        const fromDateStr = format(from, 'yyyy-MM-dd');
        const toDateStr = format(to, 'yyyy-MM-dd');

        return [{
            field: 'submission_date',
            operator: 'ltegte',
            subType: 'date',
            value: {
                min: fromDateStr,
                max: toDateStr,
            },
        }];
    }, [dateFilter]);

    const combinedFilters = useMemo(() => (
        [...statusFilters, ...dateRangeFilters]
    ), [statusFilters, dateRangeFilters]);

    // Prepare query params
    const timelineParams = useMemo(() => {
        switch (timelineFilter) {
            case 'investigation_overdue':
                return { deadline_stage: 'investigation' as const, deadline_status: 'overdue' as const };
            case 'closure_overdue':
                return { deadline_stage: 'closure' as const, deadline_status: 'overdue' as const };
            default:
                return {};
        }
    }, [timelineFilter]);

    const queryParams: ComplaintQueryParams = useMemo(() => ({
        page_size: pagination.pageSize,
        page_index: pagination.pageIndex + 1, // API uses 1-based pages
        global_value: debouncedGlobalFilterValue,
        global_filter: globalFilterFields,
        sort_by: sorting[0]?.id || "submission_date",
        sort_order: -1, // sorting[0]?.desc ? -1 : 1,
        filters: combinedFilters,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        assigned_to: !currentUser ? undefined : (assignmentFilter === 'assigned_to_me' || assignmentFilter === 'assigned_unread') ? currentUser._id : undefined,
        assignee_read: assignmentFilter === 'assigned_unread' ? 'unread' : undefined,
        investigator_user: !currentUser ? undefined : (assignmentFilter === 'investigator' || assignmentFilter === 'investigator_unread') ? currentUser._id : undefined,
        investigator_read: assignmentFilter === 'investigator_unread' ? 'unread' : undefined,
        include_deadlines: true,
        ...timelineParams,
    }), [
        pagination.pageSize,
        pagination.pageIndex,
        debouncedGlobalFilterValue,
        globalFilterFields,
        sorting,
        statusFilter,
        assignmentFilter,
        currentUser,
        combinedFilters,
        timelineParams
    ]);

    const {data, isLoading,isError, error } = useGetComplaints(queryParams);
    useEffect(() => {
        if (isError && error) {
            showApiErrorToast(error);
        }
    }, [isError, error]);

    useEffect(() => {
        if (!searchParams) return;

        const currentParams = new URLSearchParams(searchParams.toString());
        const currentPage = Number.parseInt(currentParams.get('page') ?? '', 10);
        const currentPageSize = Number.parseInt(currentParams.get('pageSize') ?? '', 10);
        const pageMatches = Number.isFinite(currentPage)
            ? currentPage === pagination.pageIndex + 1
            : pagination.pageIndex === 0;
        const sizeMatches = Number.isFinite(currentPageSize)
            ? currentPageSize === pagination.pageSize
            : false;

        if (pageMatches && sizeMatches) return;

        currentParams.set('page', String(pagination.pageIndex + 1));
        currentParams.set('pageSize', String(pagination.pageSize));

        router.replace(`${pathname}?${currentParams.toString()}`, { scroll: false });
    }, [pagination.pageIndex, pagination.pageSize, router, pathname, searchParams]);

    useEffect(() => {
        if (isDateFilterOpen) {
            setPendingCustomRange(dateFilter.key === 'CUSTOM' ? dateFilter.range : undefined);
        }
    }, [isDateFilterOpen, dateFilter.key, dateFilter.range]);

    useEffect(() => {
        if (isSearchOpen) {
            searchInputRef.current?.focus();
        }
    }, [isSearchOpen]);

    const handlePresetSelect = (key: DateFilterKey) => {
        if (key === 'CUSTOM') {
            setPendingCustomRange(dateFilter.key === 'CUSTOM' ? dateFilter.range : undefined);
            setDateFilter((prev) => ({ key: 'CUSTOM', range: prev.key === 'CUSTOM' ? prev.range : undefined }));
            return;
        }

        const presetRange = getPresetRange(key);
        setDateFilter({ key, range: presetRange });
        setIsDateFilterOpen(false);
    };

    const handleApplyCustomRange = () => {
        if (!pendingCustomRange?.from) return;

        const from = atStartOfDay(pendingCustomRange.from);
        const to = pendingCustomRange.to ? atStartOfDay(pendingCustomRange.to) : from;

        const normalizedRange: DateRange = { from, to };
        setDateFilter({ key: 'CUSTOM', range: normalizedRange });
        setPendingCustomRange(normalizedRange);
        setIsDateFilterOpen(false);
    };

    const dateFilterLabel = useMemo(() => {
        if (dateFilter.key === 'CUSTOM') {
            return formatDateRangeLabel(dateFilter.range);
        }
        return DATE_FILTER_LABELS[dateFilter.key] ?? 'Custom';
    }, [dateFilter]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm overflow-hidden">
                <div className="relative grid gap-3 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)] lg:items-center">
                    <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-4 lg:flex-1 lg:min-w-0 min-w-0">
                        <div
                            className={cn(
                                "flex items-center overflow-hidden transition-all duration-300",
                                isSearchOpen
                                    ? "gap-1.5 rounded-md border border-input bg-background px-2 w-full lg:w-auto lg:min-w-[260px]"
                                    : "gap-0 w-fit"
                            )}
                        >
                            <Button
                                type="button"
                                variant={isSearchOpen ? "default" : "outline"}
                                size="icon"
                                onClick={() => setIsSearchOpen((prev) => !prev)}
                                aria-label={isSearchOpen ? "Collapse search" : "Expand search"}
                                className="shrink-0"
                            >
                                {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                            </Button>
                            <div
                                className={cn(
                                    "min-w-0 flex-1 overflow-hidden transition-all duration-300 ease-in-out",
                                    isSearchOpen
                                        ? "max-w-full opacity-100 translate-x-0"
                                        : "max-w-0 opacity-0 -translate-x-2 pointer-events-none",
                                )}
                            >
                                <Input
                                    ref={searchInputRef}
                                    placeholder="Search complaints..."
                                    value={globalFilter}
                                    onChange={(e) => setGlobalFilter(e.target.value)}
                                    className="w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                            </div>
                        </div>

                        <Tabs
                            value={statusFilter}
                            onValueChange={(value) => setStatusFilter(value as StatusFilterValue)}
                            className="w-full lg:flex-1 lg:min-w-0"
                        >
                            <TabsList className="flex w-full gap-1 overflow-x-auto rounded-md bg-muted/40 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 lg:flex-nowrap lg:justify-end">
                        <div className="w-full sm:w-64 lg:w-64">
                            <Select
                                value={(() => {
                                    if (timelineFilter === 'investigation_overdue') return 'timeline_investigation_overdue';
                                    if (timelineFilter === 'closure_overdue') return 'timeline_closure_overdue';
                                    return assignmentFilter;
                                })()}
                                onValueChange={(value) => {
                                    if (value === 'timeline_investigation_overdue') {
                                        setTimelineFilter('investigation_overdue');
                                        setAssignmentFilter('all');
                                    } else if (value === 'timeline_closure_overdue') {
                                        setTimelineFilter('closure_overdue');
                                        setAssignmentFilter('all');
                                    } else {
                                        setTimelineFilter('all');
                                        setAssignmentFilter(value as typeof assignmentFilter);
                                    }
                                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                }}
                            >
                                <SelectTrigger className="w-full" disabled={!currentUser}>
                                    <SelectValue placeholder="All complaints" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All complaints</SelectItem>
                                    <SelectItem value="timeline_investigation_overdue">Investigation overdue</SelectItem>
                                    <SelectItem value="timeline_closure_overdue">Closure overdue</SelectItem>
                                    <SelectItem value="investigator">My investigation tasks</SelectItem>
                                    <SelectItem value="investigator_unread">My unread investigation tasks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Popover open={isDateFilterOpen} onOpenChange={setIsDateFilterOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex h-auto min-w-[110px] items-center gap-1 px-3 py-2"
                                >
                                    <CalendarRange className="h-4 w-4" />
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {dateFilterLabel}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                                <div className="space-y-4">
                                    <div className="grid gap-1">
                                        {QUICK_DATE_FILTERS.map((key) => (
                                            <Button
                                                key={key}
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                    'justify-start text-sm',
                                                    dateFilter.key === key && dateFilter.key !== 'CUSTOM' && 'bg-accent text-accent-foreground'
                                                )}
                                                onClick={() => handlePresetSelect(key)}
                                            >
                                                {DATE_FILTER_LABELS[key as Exclude<DateFilterKey, 'CUSTOM'>] ?? 'Custom'}
                                            </Button>
                                        ))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                'justify-start text-sm',
                                                dateFilter.key === 'CUSTOM' && 'bg-accent text-accent-foreground'
                                            )}
                                            onClick={() => handlePresetSelect('CUSTOM')}
                                        >
                                            Custom range
                                        </Button>
                                    </div>

                                    <div className="rounded-md border p-3">
                                        <p className="mb-2 text-xs font-medium text-muted-foreground">Select range</p>
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            numberOfMonths={2}
                                            selected={pendingCustomRange}
                                            onSelect={setPendingCustomRange}
                                            defaultMonth={pendingCustomRange?.from ?? dateFilter.range?.from ?? new Date()}
                                            disabled={{ after: new Date() }}
                                        />
                                        <div className="mt-3 flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setPendingCustomRange(undefined);
                                                    setDateFilter({ key: 'ALL' });
                                                    setIsDateFilterOpen(false);
                                                }}
                                            >
                                                Clear
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={!pendingCustomRange?.from}
                                                onClick={handleApplyCustomRange}
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
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
                    pageSizeOptions: [...PAGE_SIZE_OPTIONS],
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
