# CAPA Module Progress Log

## Objective
Introduce a Corrective and Preventive Action (CAPA) workflow that mirrors form FOR/QAD/026/01, generates a pixel-aligned PDF, and allows investigators to link CAPA records directly from the complaint investigation section.

## Backend Deliverables
1. **Template & Generator**
   - Added `capa-template.html` (inline CSS, absolute positioning, blank lower half for manual fields).
   - Created `CreateCapaSchema` validation, `createCapaRecord` service, and Puppeteer pipeline to render and store PDFs under `uploads/capa/`.

2. **Persistence & Linking**
   - New `CapaModel` with `linked_complaint` / `linked_nc` and metadata snapshot.
   - `generateCapaIdentifier()` helper for system IDs.
   - Complaint investigation update now sanitizes CAPA numbers and calls `linkCapaToComplaint` to enforce one-to-one linkage.

3. **API Surface (`/api/v1/capa`)**
   - `POST /capa` → generate PDF, insert record, respond with `{ capaId, fileUrl }`.
   - `GET /capa/available` → list unlinked CAPAs (recent 50).
   - `GET /capa/:capaId` → validate CAPA (optionally enforce availability).
   - Documented in `API_REFERENCE.md`.

4. **Error Handling**
   - Added `CAPA_NOT_FOUND` & `CAPA_ALREADY_LINKED` error codes.

## Frontend Deliverables
1. **API & State Hooks**
   - `capaApi` (create/list/validate) + React Query hooks (`useCreateCapa`, `useAvailableCapas`, `useValidateCapa`).

2. **CAPA Creation Form**
   - New page `app/dashboard/capa/new` with `CapaForm`.
   - Form mirrors template fields, on submit calls `POST /capa`, shows success alert with CAPA ID + download link.
   - Navigation entry “Create CAPA” for relevant roles.

3. **CAPA Listing**
   - Added `/dashboard/capa` page displaying paginated CAPA records with search and CSV-friendly download links.
   - Navigation entry “CAPA Records” and role access updates for QA/support/production staff.

4. **Complaint Investigation Integration**
   - CAPA section now offers two flows when “CAPA initiated = Yes”:
     * **Link existing** – dropdown of unlinked CAPAs, validate button, and PDF preview link.
     * **Create new** – shortcut to open the CAPA form in a new tab with reminder to refresh list after submission.
   - Validation ensures only available CAPAs are linked; linking updates backend to prevent reuse.

## Outstanding / Next Steps
- Backfill existing complaints with CAPA data if present outside system.
- Add NC module once its flow is defined (mirror CAPA patterns).
- Optional: background job to prune unattached CAPAs older than X days.
- Consider unit/integration tests around CAPA-controller flow once test suite is ready.

## 2025-02-07

- **Paginated-ready PDF layout**: Rebuilt `capa-template.html` into three logical sections (non-conformance, approvals/extensions, and completion/effectiveness) so Chrome can break pages naturally. Removed the hardcoded page separator and the `max-height` truncation on multiline fields, letting long narratives spill onto subsequent pages without losing content.
- **Reusable header/footer assets**: Header/footer rendering now mirrors the complaint-form PDF by relying on Puppeteer templates from `capaService.ts`, with top/bottom margins (55mm / 30mm) reserved for the stamps, page numbers, and document metadata.
- **Configurable branding**: `CAPA_PDF_LOGO_PATH`, `CAPA_PDF_MASTER_COPY_PATH`, and `CAPA_PDF_CONTROLLED_COPY_PATH` env vars override the default artwork. Each key accepts filesystem paths, HTTP URLs, or data URIs; fallbacks live under `qms-api/public/logo/`.
