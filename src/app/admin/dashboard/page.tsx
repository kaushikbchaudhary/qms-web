'use client'

import { useMemo } from 'react'
import { useComplaintStats } from '@/hooks/api/useComplaints'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, Users, ClipboardList, Target, Rocket } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { formatRoleLabel } from '@/config/roles'

const formatRoleList = (roleValue: any): string => {
  if (!roleValue) return ''
  const roleArray = Array.isArray(roleValue) ? roleValue : [roleValue]
  return roleArray
    .filter(Boolean)
    .map((role: string) => formatRoleLabel(role) || role)
    .join(', ')
}

const valueOrZero = (value?: number) => (typeof value === 'number' ? value : 0)

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useComplaintStats()

  const statusCounts = data?.statusCounts ?? {}
  const investigatorAssignmentSummary = data?.assignmentSummary ?? { assigned: 0, unassigned: 0 }
  const totalComplaints = valueOrZero(data?.total)
  const inProgress = valueOrZero(statusCounts['UNDER_INVESTIGATION'])
  const submitted = valueOrZero(statusCounts['SUBMITTED'])
  const resolved = valueOrZero(statusCounts['RESOLVED'])

  const statusDistribution = useMemo(() => {
    if (!totalComplaints || totalComplaints === 0) return []
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count: valueOrZero(count),
      percentage: Math.round((valueOrZero(count) / totalComplaints) * 100),
    }))
  }, [statusCounts, totalComplaints])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <CardTitle className="text-destructive">Unable to load dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Something went wrong while fetching complaint insights. Please try again or check the server logs.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          High-level insights into complaint volume, progress, and team workload.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total complaints</CardDescription>
            <CardTitle className="text-3xl">{totalComplaints}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList className="h-4 w-4" /> Overall volume being tracked
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Awaiting investigation</CardDescription>
            <CardTitle className="text-3xl">{inProgress + submitted}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="h-4 w-4" /> {inProgress} currently under investigation
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Resolved</CardDescription>
            <CardTitle className="text-3xl">{resolved}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Rocket className="h-4 w-4" /> Cases closed successfully
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Complaints without investigator</CardDescription>
            <CardTitle className="text-3xl">{investigatorAssignmentSummary.unassigned}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> Waiting for investigator assignment
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Status distribution</CardTitle>
            <CardDescription>Snapshot across complaint stages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No complaints recorded yet.</p>
            ) : (
              statusDistribution.map(({ status, count, percentage }) => (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{status.replace(/_/g, ' ').toLowerCase()}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Investigation coverage</CardTitle>
            <CardDescription>Investigator assignment overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Assigned to investigators</span>
              <Badge variant="secondary">{investigatorAssignmentSummary.assigned}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>No investigator assigned</span>
              <Badge variant="destructive">{investigatorAssignmentSummary.unassigned}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top investigators</CardTitle>
            <CardDescription>Team members handling the most investigations</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topAssignees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No investigator assignments recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investigator</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Active assignments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topAssignees.map((entry, index) => {
                    const name = [entry.user?.firstName, entry.user?.lastName]
                      .filter(Boolean)
                      .join(' ') || entry.user?.emailId || 'Unassigned'
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell>{formatRoleList(entry.user?.role)}</TableCell>
                        <TableCell className="text-right">{entry.count}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest complaints entering the system</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentComplaints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent complaints.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentComplaints.map((complaint) => (
                    <TableRow key={complaint._id}>
                      <TableCell className="font-medium">
                        {complaint.complaint_number || complaint._id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {complaint.status.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDateTime(complaint.created_on || complaint.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
