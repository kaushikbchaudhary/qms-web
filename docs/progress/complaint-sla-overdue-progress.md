# Complaint SLA Overdue Surfacing – Progress Log

## 2025-02-06

- **Overdue notification types**: Added `COMPLAINT_OVERDUE` and `INVESTIGATION_OVERDUE` to `notificationModel.ts` so we can persist SLA alerts distinct from regular assignment updates.
- **Complaint list metadata**: `listComplaint` now accepts `include_deadlines` and injects the same `buildDeadlineMetadata` payload that powers the detail view, allowing tables or exports to render SLA badges without re-computing anything on the client. (File: `qms-api/src/modules/v1/complaint/services/complaintService.ts`).
- **Auto-sync overdue alerts**: `listNotifications` calls a new helper that finds every active complaint tied to the requesting user (either as the current assignee or an active investigator). When the investigation or closure window is overdue, it upserts a sticky notification, re-opening it if the user previously marked it read. Once the complaint moves out of scope (resolved/closed or unassigned), the alert auto-resolves. (File: `qms-api/src/modules/v1/notification/services/notificationService.ts`).
- **Web list indicators**: Extended `ComplaintQueryParams` with `include_deadlines` and added a “Timeline” column in `ColumnsComplaints.tsx`. Investigation and closure rows now show badges (On Track / Due Soon / Overdue) plus remaining or overdue working days directly in the table.
- **Notification drawer UX**: Updated `notifications.ts` typings and the header dropdown so SLA alerts display descriptive text (e.g., “Investigation timeline overdue by 2 working day(s)”) and a destructive badge (Investigation or Closure Overdue). This keeps overdue tasks visible even if the detail page is not opened.

> **Next ideas**: add filters (“Only Overdue”) to the complaint table using the injected deadline metadata, and consider digest emails if users continue ignoring the persistent alerts.

## 2025-02-07

- **Complaint list overload filters**: `listComplaint` now accepts `deadline_stage` (`investigation` / `closure`) plus `deadline_status` so the API can return only overdue/due-soon items. It reuses `buildPaginationComponents` to keep sorting/pagination consistent even though the deadline math happens in memory (`qms-api/src/modules/v1/complaint/services/complaintService.ts`).
- **Shared pagination helper**: Refactored the paginate plugin to expose `buildPaginationComponents`, allowing ad-hoc queries (like the new SLA filter) to reuse the same global search + column filter building logic without cloning it (`qms-api/src/models/plugins/paginate.ts`).
- **Web timeline filter**: Added a dedicated select on the complaints table that hits the new API params so users can switch between "all", "investigation overdue", and "closure overdue" views instantly. Query typing (`ComplaintQueryParams`) now includes the deadline filters, ensuring future UI surfaces can reuse the same capability (`qms-web/src/components/complaient/ComplaintTable.tsx`, `qms-web/src/lib/api/types/complaints.ts`). After UX feedback, those options now live inside a compact timeline select beside the assignment filter to avoid stretching the status tabs while keeping the same API wiring.
- **Dashboard visibility**: `getComplaintStats` now computes SLA summaries (overdue/due soon/on-track per stage) plus lightweight alert lists. The admin dashboard renders these as quick metrics plus two tables (overdue vs. upcoming deadlines) with deep links into each complaint, so leadership can immediately spot timeline risks without drilling into the table (`qms-api/src/modules/v1/complaint/services/complaintService.ts`, `qms-web/src/app/admin/dashboard/page.tsx`).

> **Future updates to track**: add saved views/widgets on the dashboard that show counts for each overdue bucket, expose due-soon filters, and consider exporting these lists for escalation meetings. Document any additional API flags or batch-alert logic here as it grows.
