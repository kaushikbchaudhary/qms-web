# Socket Event Reference

This document links every real-time event to the exact backend emitters and frontend listeners so you can trace problems line-by-line.

## 1. Socket bootstrap

| Layer | File | Notes |
| --- | --- | --- |
| Server init | `qms-api/src/socket/socketManager.ts` | `initSocket` wires auth middleware, registers default rooms (`user:{id}`, `complaints`, `device-material-issues`) and exposes helper emitters. |
| Client init | `qms-web/src/lib/socket/client.ts` | `initializeSocket` connects to `NEXT_PUBLIC_API_BASE_URL` via WebSocket and caches the singleton instance. |
| Provider | `qms-web/src/providers/SocketProvider.tsx` | Ensures the user is authenticated, attaches event listeners, and invalidates React Query caches. |

### Auth flow

1. Client reads `localStorage.token` and calls `initializeSocket({ token })`.
2. Server middleware (`authenticateSocket`) validates the JWT and attaches the user to `socket.data`.
3. `registerDefaultRooms` joins:
   - `user:{userId}` for per-user notifications.
   - `complaints` room.
   - `device-material-issues` room.
   - Any role-based rooms (`role:{roleKey}`) for future use.

Sockets are always enabled; once authenticated, every client stays connected unless authentication fails.

## 2. Event matrix

### Notifications (`notification:new`)

| Backend emit | Path | Trigger |
| --- | --- | --- |
| `emitNotificationEvent` helper | `qms-api/src/socket/socketManager.ts` | Sends payload to `user:{id}` room. |
| Device requests | `qms-api/src/modules/v1/deviceMaterialIssue/services/deviceMaterialIssueService.ts` | `createNotification` helper creates `NotificationModel` row then emits with `{ id, type, payload }`. Fired on submit, store sign-off, status changes, issuance, etc. |
| Complaints | `qms-api/src/modules/v1/complaint/services/complaintService.ts` | Emits after investigator assignment (`notificationId`) and other notification workflows. |
| SLA alerts | `qms-api/src/modules/v1/notification/services/notificationService.ts` | Emits periodic deadline alerts. |

Frontend listener: `SocketProvider` → `handleNotification`. This now:

```ts
await queryClient.invalidateQueries({ queryKey: ['notifications'], exact: false });
await queryClient.refetchQueries({ queryKey: ['notifications'], exact: false, type: 'active' });
```

So every `notification:new` forces the dropdown queries to refetch immediately. If you still do not see updates, confirm the socket connection stays open (single WS entry in DevTools).

### Complaint events

| Event name | Backend emit | Payload | Frontend reaction |
| --- | --- | --- | --- |
| `complaint:created` | `complaintService.createComplaint` | `{ complaintId }` | `SocketProvider` invalidates `['complaints']` and `['complaint-stats']`; also invalidates `['complaint', complaintId]` when provided. |
| `complaint:updated` | `complaintService.updateComplaintStatus`, `assignInvestigators`, etc. | `{ complaintId, status? }` | Same as above. |

### Device material issue events

| Event name | Backend emit | Source method | Payload | Frontend reaction |
| --- | --- | --- | --- | --- |
| `device-issue:created` | `createDeviceMaterialIssue` | After new request insert | `{ requestId, status }` | `SocketProvider` invalidates list, queue head, and request detail (per `requestId`). |
| `device-issue:updated` | `prepareDeviceMaterialIssueForPickup`, `updateDeviceMaterialIssue` | After store batch update or general edits | `{ requestId, status }` | Same invalidations. |
| `device-issue:status-changed` | `transitionDeviceMaterialIssueStatus`, `prepareDeviceMaterialIssueForPickup` (when status flips to ready) | Status transitions | `{ requestId, status }` | Same invalidations; used to move rows between tabs instantly. |
| `device-issue:issued` | `recordRecipientSignature` | When recipient signs | `{ requestId, status }` | Same invalidations. |

## 3. Debug checklist

1. **Auth token** – `localStorage.token` must be a valid JWT; otherwise the server rejects the connection and you’ll see constant reconnect attempts in DevTools.
2. **Network tab** – expect one persistent `wss://…/socket.io/?EIO=4&transport=websocket`. If you see dozens of entries, the socket is reconnecting; inspect console logs for `UNAUTHORIZED`.
3. **Event flow** – set breakpoints/logging:
   - Server: add `console.log` inside `emitNotificationEvent` or the specific service to verify the emit path runs.
   - Client: add a log inside `handleNotification` to confirm the socket event arrives; if it does, the dropdown will refetch immediately.

Use this doc to verify each step whenever real-time updates appear stalled.
