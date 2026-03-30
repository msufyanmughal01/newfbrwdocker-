# API Contracts: Responsive Design & TaxDigital Rebrand

**Feature**: `008-responsive-rebrand`
**Date**: 2026-02-26

## No New API Endpoints

This feature introduces zero new API routes. All existing API endpoints in `src/app/api/` remain unchanged.

The responsive design work is entirely client-side (layout, CSS, React state). The brand rename affects only string literals in JSX, metadata objects, and email templates — none of which require API changes.

### Existing API surface (unchanged)

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/invoices` | Invoice CRUD |
| GET/PUT/DELETE | `/api/invoices/[id]` | Invoice by ID |
| POST | `/api/invoices/validate` | FBR validation |
| POST | `/api/fbr/submit` | FBR submission |
| GET | `/api/clients`, `/api/clients/[id]` | Client management |
| GET | `/api/dashboard/metrics` | Dashboard analytics |
| GET | `/api/fbr/reference/*` | FBR reference data |
| GET/PUT | `/api/settings/business-profile` | Settings |
| GET/POST | `/api/hs-codes/master` | HS code management |

All contracts, request/response shapes, and error taxonomies for the above are unchanged.
