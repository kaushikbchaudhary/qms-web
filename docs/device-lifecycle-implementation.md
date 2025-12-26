# Device Lifecycle Lookup & PDF – Implementation Summary

## Overview
- Goal: Enter device serial → fetch full lifecycle (device, assignment, subscription, history) → export form-aligned PDF matching the provided request form.
- Flow: qms-web → qms-api → ecg-backend → erp-module.

## Endpoints
- qms-api (new):
  - `POST /api/v1/device-lifecycle/lookup` — returns lifecycle payload + `pdf` mapping.
  - `POST /api/v1/device-lifecycle/export/pdf` — returns PDF (form-style layout).
- ecg-backend (proxy to ERP):
  - `GET/POST /api/v1/inventories/by-serial/:serialNo/lifecycle` — forwards to erp-module and returns lifecycle (history enabled).
- erp-module:
  - `GET /api/v1/inventories/by-serial/:serialNo/lifecycle` — now selects `history` explicitly.

## Env Configuration
- qms-api `.env`:
  - `DEVICE_API_BASE_URL` → ecg-backend inventories base (e.g., `http://localhost:3000/api/v1/inventories`).
  - `DEVICE_API_TOKEN` → API key/token to pass as `x-api-key`/Bearer to ecg-backend.
- ecg-backend `.env`:
  - `API_KEY` (and/or `SUPPORT_SERVER_API_KEY`) — must match qms-api’s token/support key.
- qms-web `.env`:
  - `NEXT_PUBLIC_API_BASE_URL` and `SERVER_API_BASE_URL` → qms-api base (e.g., `http://localhost:8001/`).

## qms-api Changes
- Added lifecycle module (`src/modules/v1/deviceLifecycle`):
  - Validators: serial/fromDate/toDate/page/limit.
  - Service: calls downstream lifecycle endpoint with headers `x-api-key` + optional Bearer.
  - Controller: returns original payload plus `pdf` mapping for form fields (patient, device, clinic/distributor, dates, accessories placeholder, return info/condition, signatures). Patient name falls back to `name`; issuance type from subscription.
  - PDF service: renders form-style PDF matching provided request form (patient/user info, device info, clinic/distributor, wear/enrolment dates, accessories table with defaults, return info, return condition table, audit history, signature lines).
- Routing: mounted at `/api/v1/device-lifecycle` (lookup, export/pdf).
- Config: added `DEVICE_API_*` env parsing in `src/utils/config.ts`.

## ecg-backend Changes
- Inventory router: added lifecycle proxy route (GET/POST) using API key check (`x-api-key` vs `API_KEY` or `SUPPORT_SERVER_API_KEY`), no login required for key.
- Inventory controller: lifecycle fetch proxies to ERP with params; erp-controller now selects `history` (+history) so audit events return.

## erp-module Changes
- `getInventoryLifecycleBySerial` now `.select('+history')` to include history in responses.

## qms-web Changes
- Home page UI (`src/app/page.tsx`):
  - Serial + date range + page/limit inputs.
  - Fetch lifecycle (uses `api/v1/device-lifecycle/lookup`) and shows device/assignment/subscription/history with pagination controls.
  - Download PDF button (calls `api/v1/device-lifecycle/export/pdf`).

## Mapping to Form Fields (pdf object)
- Patient: name (fallback to `name`), mobile; age/gender/address placeholders.
- Device: name, model, serial, issuance type (from subscription type), issuance date (first assignment), manufacturing/batch placeholders.
- Clinic/Distributor: name, mobile; address placeholder.
- Dates: device wear date (first assignment), enrolment period (subscription expiry).
- Accessories: list (defaults to form items if empty).
- Return info/condition & signatures: placeholders, ready to fill when data available.

## What to Fill Next
- Populate age/gender/address, batch/manufacturing, clinic/distributor address, return dates/condition, signatures when available in upstream data.
- If history is still empty, ensure ERP has history records for that serial.

