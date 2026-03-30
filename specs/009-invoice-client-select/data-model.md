# Data Model: Invoice Client Selector

**Feature**: `009-invoice-client-select`
**Date**: 2026-02-26

---

## Schema Changes

**None.** This feature requires no database schema changes. All data already exists in the `clients` table.

---

## Existing Entities Used

### Client (read-only from this feature)

**Table**: `clients`
**Source**: `src/lib/db/schema/clients.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Yes | Primary key |
| userId | text | Yes | Tenant scoping (FK → user.id) |
| businessName | varchar(255) | Yes | Displayed in picker list |
| ntnCnic | varchar(13) | No | Auto-filled into buyerNTNCNIC |
| province | varchar(100) | No | Auto-filled into buyerProvince (if valid FBR province) |
| address | text | No | Auto-filled into buyerAddress |
| registrationType | varchar(50) | No | Auto-filled into buyerRegistrationType |
| isDeleted | boolean | Yes | Soft-delete flag; only isDeleted=false shown |

**Access pattern**: `GET /api/clients` — returns all non-deleted clients for the authenticated user, sorted alphabetically by businessName.

---

## Auto-Fill Field Mapping

When a client is selected from the picker, the following invoice form fields are populated:

| Client Field | Invoice Form Field | Notes |
|-------------|-------------------|-------|
| `businessName` | `buyerBusinessName` | Always applied |
| `ntnCnic` | `buyerNTNCNIC` | Applied only if non-empty |
| `address` | `buyerAddress` | Applied only if non-empty |
| `province` | `buyerProvince` | Applied only if non-empty AND matches a valid FBR province value |
| `registrationType` | `buyerRegistrationType` | Applied only if value is "Registered" or "Unregistered" |

---

## Component State Model

The upgraded `ClientSearch` component maintains the following local state (no persistence, no server writes):

| State | Type | Purpose |
|-------|------|---------|
| `allClients` | `ClientResult[]` | Full list loaded on picker open |
| `filteredClients` | `ClientResult[]` | Subset matching current query |
| `query` | `string` | Current filter text |
| `isOpen` | `boolean` | Picker dropdown visibility |
| `loading` | `boolean` | Initial load spinner |
| `selectedName` | `string` | Display name of selected client |
| `error` | `string \| null` | API load failure message |

---

## Validation Rules

- Province must match a value in the FBR province enum; if not, Province field is left blank.
- Registration Type must be exactly "Registered" or "Unregistered"; any other value is skipped.
- No form submission validation is added or changed by this feature — existing validation rules remain.

---

## No State Transitions

This feature is purely read: it reads saved clients and populates form fields. No records are created, updated, or deleted by this feature.
