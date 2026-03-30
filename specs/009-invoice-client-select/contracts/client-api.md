# API Contracts: Client Selector

**Feature**: `009-invoice-client-select`
**Date**: 2026-02-26
**Status**: No new endpoints — documents existing API used by this feature.

---

## GET /api/clients

**Purpose**: Fetch all saved clients for the authenticated user (browse mode) or search by name.

**Authentication**: Required (session cookie). Returns 401 if unauthenticated.

### Browse Mode (picker open, no query)

**Request**:
```
GET /api/clients
```

**Response** `200 OK`:
```json
{
  "clients": [
    {
      "id": "uuid",
      "userId": "user-id",
      "businessName": "ABC Traders",
      "ntnCnic": "1234567",
      "province": "Punjab",
      "address": "123 Main Street, Lahore",
      "registrationType": "Registered",
      "notes": null,
      "isDeleted": false,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-15T10:00:00.000Z"
    }
  ]
}
```

- Results sorted alphabetically by `businessName`
- Maximum 200 results
- Only `isDeleted = false` records returned
- Scoped to authenticated user (tenant-isolated)

### Search Mode (picker filter, user is typing)

**Request**:
```
GET /api/clients?q=ABC
```

- Minimum `q` length: 2 characters (server enforces)
- `q` is matched case-insensitively against `businessName` (ILIKE `%q%`)
- Maximum 50 results

**Response**: Same shape as Browse Mode.

### Error Responses

| Status | Body | When |
|--------|------|------|
| 401 | `{"error": "Unauthorized"}` | Session missing or expired |
| 500 | `{"error": "..."}` | Server-side failure |

---

## Component Contract: `ClientSearch`

**Props interface** (unchanged):
```typescript
interface ClientSearchProps {
  form: UseFormReturn<InvoiceFormData>;
}
```

**Behaviour contract**:

| Trigger | Action |
|---------|--------|
| Component mounts | No fetch |
| User clicks/focuses the picker trigger | Fetch `GET /api/clients` (no q), populate `allClients` |
| User types in filter input | Filter `allClients` client-side (case-insensitive substring match on businessName) |
| User selects a client | Auto-fill form fields per mapping table in data-model.md; close picker; show selected name chip |
| User clicks Clear | Reset `selectedName`, clear auto-filled form fields, reset state |
| User clicks outside picker | Close picker; preserve any partial query |
| API returns error | Show error state inside picker; allow manual entry |

**Auto-fill field contract**:

Fields are set via `form.setValue(field, value)`. Only non-empty values are applied. The form's existing validation rules are unaffected.

---

## No New Endpoints

This feature introduces zero new API routes. The existing `GET /api/clients` endpoint handles both use cases (browse and search) without modification.
