"use client"

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCapaList } from "@/hooks/api/useCapa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2, RefreshCcw, Search } from "lucide-react";

const PAGE_SIZE = 10;

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd MMM yyyy");
  } catch {
    return value;
  }
};

export default function CapaListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ?? "", []);

  const { data, isFetching, refetch, isLoading } = useCapaList({
    page,
    pageSize: PAGE_SIZE,
    search: query.length ? query : undefined,
  });

  const totalPages = useMemo(() => {
    if (!data?.total) return 1;
    return Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  }, [data?.total]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  const handleClearSearch = () => {
    setSearch("");
    setQuery("");
    setPage(1);
  };

  const list = data?.list ?? [];

  return (
    <div className="flex h-full flex-col gap-6 py-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CAPA Records</h1>
          <p className="text-sm text-muted-foreground">
            Review previously generated CAPA forms. Use the filters to locate records and download the stored PDF.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/capa/new">Create CAPA</Link>
        </Button>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by CAPA ID, source, description, or preparer"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            Apply
          </Button>
          <Button type="button" variant="ghost" onClick={handleClearSearch} disabled={!search && !query}>
            Clear
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CAPA ID</TableHead>
              <TableHead>Initiation Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Prepared By</TableHead>
              <TableHead align="center">Linked Complaint</TableHead>
              <TableHead align="center">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading CAPA records…
                  </div>
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No CAPA records found.
                </TableCell>
              </TableRow>
            ) : (
              list.map((capa) => {
                const preparedName = capa.preparedBy?.name ?? "—";
                const preparedDesignation = capa.preparedBy?.designation;
                const fileUrl = capa.fileUrl;
                const complaintLink = capa.linkedComplaint ? `/dashboard/complaints/${capa.linkedComplaint}` : null;

                const downloadHref = fileUrl
                  ? fileUrl.startsWith("http")
                    ? fileUrl
                    : `${apiBaseUrl ? `${apiBaseUrl}/` : ""}${fileUrl.replace(/^\/+/, "")}`
                  : null;

                return (
                  <TableRow key={capa.capaId}>
                    <TableCell className="font-mono text-sm">{capa.capaId}</TableCell>
                    <TableCell>{formatDate(capa.initiationDate)}</TableCell>
                    <TableCell className="max-w-sm truncate">{capa.sourceOfCapa ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{preparedName}</span>
                        {preparedDesignation ? (
                          <span className="text-xs text-muted-foreground">{preparedDesignation}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {complaintLink ? (
                        <Button asChild variant="link" size="sm">
                          <Link href={complaintLink}>View Complaint</Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unlinked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {downloadHref ? (
                        <Button asChild size="sm" variant="secondary">
                          <Link href={downloadHref} target="_blank" rel="noopener noreferrer">
                            Download
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unavailable</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {data?.total ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, data.total)} of ${data.total}` : "No records"}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || isFetching}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || isFetching}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
