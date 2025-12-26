# Device Material Issue Module – Progress Log

_Last updated: 2025-10-29 14:17 _

## Recent Highlights
- Normalised role identifiers to slug values and exposed friendly labels across both API and web layers.
- Simplified the create-request form to only the essential fields while auto-attaching requester signatures from stored profiles.
- Updated navigation rules so store & inventory, sales/marketing, QA variants, and engineering roles see the correct tabs.
- Added store-facing UX: warning banner when batch number is missing, inline batch update form, signature preview (store + recipient), and a "View" action in the list table.
- Hardened React rendering by using safe name/signature helpers, eliminating "object as React child" runtime errors.
- Converted the device-issue detail route to a client-side page to avoid streaming/500 issues with React Query hooks.

## Outstanding / Next Steps
- Confirm backend connection details (MongoDB host is currently unreachable from local sandbox).
- Replace remaining `<img>` usage with `next/image` or a custom loader to satisfy lint warnings.
- Review unused variables/hooks flagged by ESLint in legacy complaint components (optional cleanup).

## Validation
- `npm run build` (Next.js) – ✅
- `npx tsc -p .` (API) – ✅

## Notes
- Stored role aliases currently treat both `store-inventory` and legacy "store & inventory" as equivalent to accommodate existing records.
- Signature URL helper prefixes relative paths with `NEXT_PUBLIC_API_BASE_URL`; ensure this env variable is present in deployments.

## Planning Notes (2025-10-29 14:23  )
- Target flow: requester → store inventory adds batch/lot → organizational acceptance, with tracking-friendly UI.
- Improvements to design usability: need clearer action prompts, dedicated sections per role, and table download by date range for super-admin.
- Upcoming tasks: redesign detail layout for progressive steps, add batch update confirmation UX, implement date-range exports, and ensure navigation communicates user responsibilities.
- Ensure progress document remains in sync with future chat sessions for continuity.

## Update (2025-10-29 14:41 )
- Added workflow status card with per-step messaging and icons to clarify progress for every role.
- Store sign-off and recipient acknowledgement sections now include contextual descriptions, guidance, and signature previews.
- Maintained helper formatting so populated user objects display as names in tables, status history, and summary cards.

## Update (2025-10-29 14:56 )
- Hid the status-transition card for roles without transition permissions; only managers/super-admins can now access it.
- Adjusted override toggle so it appears exclusively for super-admin users.

## Update (2025-10-29 15:00 )
- Limited batch-number editing UI strictly to Store & Inventory users; other roles now see read-only details with concise messaging.
- Removed in-card instructional copy to reduce noise while keeping the input and save action for store users.

## Update (2025-10-29 15:25 )
- Removed attachment upload/download functionality from the device request detail page to keep the inventory module focused on metadata tracking.

## Update (2025-10-29 16:07 )
- Hid status transition controls entirely so the device issue detail page is now read-only for FIFO tracking (no super-admin override button).

## Update (2025-10-29 16:09 )
- Simplified detail view by removing purpose, production/approval, and pickup cards, plus the unused "Expected use" line. Focus is now on requester, device summary, store sign-off, and recipient acknowledgement only.

## NOTE (2025-10-29 16:11 )
- Pending task: align backend schema/validators with the slimmed UI (remove unused fields like pickup.location, production.notes, purpose extras, etc.).


## Blueprint (2025-10-29 16:15 )

### Actors & Roles
- **Requester** (Support / Sales & Marketing) – submits device/material request with minimal metadata.
- **Store & Inventory** – reviews incoming requests, records batch/lot number, and their stored signature is auto-attached.
- **Pickup Recipient** (Production / Engineering) – confirms handover with stored signature.
- **Super Admin** – monitors full inventory history, exports reports, approves exceptional cases.

### End-to-End Flow
1. **Submission**
   - Requester fills the simplified form (name snapshot, device details, purpose summary).
   - API auto-attaches requester signature/timestamp; initial status becomes `SUBMITTED`.
2. **Store Sign-off**
   - Store user opens the request from the list.
   - Workflow banner highlights "Store sign-off" as pending.
   - When they enter the batch/lot number and save, backend stores `production.batch_number` plus store signature/timestamp.
   - UI flips the banner to "completed" and exposes signature preview in both detail and table.
3. **Pickup Acknowledgement**
   - Recipient navigates to the request.
   - Workflow banner shows pending acknowledgement; form captures stored signature and optional notes.
   - Status transitions to `ISSUED`; acknowledgement metadata is displayed everywhere.
4. **Audit & Reporting**
   - Super admin views the FIFO list, filters date range, and exports full table (planned: CSV/PDF with signature URLs and timestamps).
   - Status transitions and sign-offs are read-only for super admin unless exceptional intervention is needed (override removed for now).

### Data Model Targets (pending backend cleanup)
- Keep: requester snapshot, device details, priority/status, production.batch_number, pickup.store_* metadata, recipient acknowledgement, timestamps, FIFO position (optional).
- Remove/deprecate: purpose extras, production notes, pickup location & override fields, attachments, custom fields not surfaced in UI.

### UI Components
- **DeviceIssueTable** – list view with search/filter, status badges, signature previews, "View" action.
- **DeviceIssueDetail** – sections:
  1. Workflow status card (submission → store sign-off → pickup).
  2. Requester & device overview.
  3. Store sign-off panel (editable only for store role).
  4. Recipient acknowledgement panel.
- Export button for super admin (to be implemented) on list page with date-range picker.

### Next Actions
- Trim backend schema/validators to match the reduced dataset.
- Implement date-range export endpoint + UI control for super admin.
- Add automated notifications (optional) when store or recipient steps complete.


## Product Story (2025-10-29 16:16 )
Our device/material issue module supports the full lifecycle of issuing hardware or tools inside the organisation. A requester (support or sales/marketing) raises a minimal request that captures who needs the item and why. Once submitted, the store & inventory team becomes the hero of the next scene: they review the FIFO queue, record the batch or lot number, and their stored signature marks the device as prepared. After that, production/engineering recipients acknowledge pickup with their signature, closing the loop. Super admins oversee the entire storyline from the list view, filter by time range, and export the inventory history for audits. Notifications and audit trails make it easy to understand who touched the request, when, and why, without overwhelming frontline users with unnecessary fields.

## Update (2025-10-29 16:23 )
- Removed the per-request PDF download action from the detail page; exports will be handled from the list view only.

## Update (2025-10-29 16:34 )
- Stripped the row-level PDF button from the device issue table and deleted the corresponding `GET /device-issue/:id/pdf` endpoint. Super-admin export will return later as a consolidated list download (CSV/PDF) once the date-range flow is ready.

## Update (2025-10-29 16:55 )
- Removed legacy attachment, approval, and quality-check fields from the device request schema/validators/services. Cleaned the API surface (and docs) so payloads only include requester snapshot, core device info, batch number, and signatures.

## Update (2025-10-29 17:20 )
- Added a list-level PDF export (`POST /device-issue/export/pdf`) and surfaced a “Download PDF” button on the Received tab for super-admins. The report mirrors the inventory table columns, embeds signature images, and respects the current filters.

## Update (2025-10-29 17:32 )
- Restored the export layout to the original single-request form and simply repeated table rows per record. Signature cells now render the stored images with a fallback “Unsigned” frame, showing only the capture date beneath—no printed names, exactly matching the legacy format expectations.

## Update (2025-10-29 17:45 )
- Matched the Device Material Issue list PDF to the “DeviceMaterialIssueRequest 2” design by adding the organisation logo, master copy banner, and controlled copy footer stamp (with env-based overrides). The header/ footer now mirror the complaint report styling while retaining the per-row signature table.

## Update (2025-10-29 18:02 )
- Removed persisted signature paths from device requests; the API now derives requester and store signatures directly from the linked user profile on every read. Responses (and exports) expose fresh `requested_by_signature_path`/`store_signature_path` values without storing redundant paths in the database.

## Update (2025-10-29 18:18 )
- Added `quality-assurance` role support end-to-end: the user validator now normalises legacy `qa` inputs to the new slug, device-issue permissions handle both aliases, and the shared role constants expose the updated identifier to keep the web app and API aligned.
