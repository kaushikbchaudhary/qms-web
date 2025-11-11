'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, Users, ClipboardList, Target, Rocket, CalendarClock, AlertOctagon } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
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
  const router = useRouter()

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

  const timelineSummary = data?.timelineSummary ?? {
    investigation: { overdue: 0, dueSoon: 0, onTrack: 0 },
    closure: { overdue: 0, dueSoon: 0, onTrack: 0 },
  }

  const overdueAlerts = data?.timelineAlerts?.overdue ?? []
  const dueSoonAlerts = data?.timelineAlerts?.dueSoon ?? []

  const handleNavigate = (complaintId?: string) => {
    if (!complaintId) return
    router.push(`/dashboard/complaints/${complaintId}`)
  }

  const formatTimelineStatus = (alert: any) => {
    if (alert.overdueBy && alert.overdueBy > 0) {
      return `${alert.overdueBy} day(s) overdue`
    }
    if (typeof alert.remainingDays === 'number') {
      return `${alert.remainingDays} day(s) remaining`
    }
    return 'No SLA data'
  }

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
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Investigation timeline health</CardTitle>
            <CardDescription>Overdue vs upcoming SLAs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Overdue</span>
              <Badge variant="destructive">{timelineSummary.investigation.overdue}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Due soon</span>
              <Badge variant="secondary">{timelineSummary.investigation.dueSoon}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>On track</span>
              <Badge variant="outline">{timelineSummary.investigation.onTrack}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Closure timeline health</CardTitle>
            <CardDescription>Upcoming closure risks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Overdue</span>
              <Badge variant="destructive">{timelineSummary.closure.overdue}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Due soon</span>
              <Badge variant="secondary">{timelineSummary.closure.dueSoon}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>On track</span>
              <Badge variant="outline">{timelineSummary.closure.onTrack}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-destructive" />
              Overdue timelines
            </CardTitle>
            <CardDescription>Complaints already past their SLA</CardDescription>
          </CardHeader>
          <CardContent>
            {overdueAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue complaints right now.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueAlerts.map((alert) => (
                    <TableRow key={`${alert._id}-${alert.stage}`}>
                      <TableCell>
                        <div className="font-medium">{alert.complaint_number || alert._id}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {alert.status.replace(/_/g, ' ').toLowerCase()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{alert.stage}</Badge>
                      </TableCell>
                      <TableCell>{alert.dueDate ? formatDate(alert.dueDate) : '—'}</TableCell>
                      <TableCell className="text-destructive text-sm">{formatTimelineStatus(alert)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleNavigate(alert._id)}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Upcoming deadlines
            </CardTitle>
            <CardDescription>Complaints approaching their SLA</CardDescription>
          </CardHeader>
          <CardContent>
            {dueSoonAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No complaints nearing deadlines.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Complaint</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Due date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueSoonAlerts.map((alert) => (
                    <TableRow key={`${alert._id}-${alert.stage}`}> 
                      <TableCell>
                        <div className="font-medium">{alert.complaint_number || alert._id}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {alert.status.replace(/_/g, ' ').toLowerCase()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{alert.stage}</Badge>
                      </TableCell>
                      <TableCell>{alert.dueDate ? formatDate(alert.dueDate) : '—'}</TableCell>
                      <TableCell className="text-sm">{formatTimelineStatus(alert)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleNavigate(alert._id)}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
