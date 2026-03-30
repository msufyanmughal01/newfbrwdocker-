# API Contracts: Phase 1 — Foundation

**Branch**: `001-phase1-foundation` | **Date**: 2026-02-11

## Overview

Phase 1 APIs fall into two categories:
1. **Better Auth managed routes** — handled by the `[...all]` catch-all route handler
2. **Application routes** — custom API endpoints and Server Actions

## Better Auth Managed Routes

All auth routes are served under `/api/auth/*` via a Next.js catch-all route handler.

### POST /api/auth/sign-up/email

Register a new user with email and password. Automatically creates an organization.

**Request Body**:
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)"
}
```

**Success Response** (200):
```json
{
  "user": { "id": "string", "name": "string", "email": "string" },
  "session": { "id": "string", "token": "string", "expiresAt": "ISO 8601" }
}
```
Sets HTTP-only session cookie.

**Error Responses**:
- 400: Invalid email format or password too short
- 409: Email already registered

---

### POST /api/auth/sign-in/email

Authenticate with email and password.

**Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response** (200):
```json
{
  "user": { "id": "string", "name": "string", "email": "string" },
  "session": { "id": "string", "token": "string", "expiresAt": "ISO 8601" }
}
```
Sets HTTP-only session cookie.

**Error Responses**:
- 401: Invalid credentials

---

### POST /api/auth/sign-in/social

Initiate Google OAuth flow.

**Request Body**:
```json
{
  "provider": "google",
  "callbackURL": "/dashboard"
}
```

**Success Response** (302): Redirects to Google OAuth consent screen.

---

### POST /api/auth/sign-out

End the current session.

**Headers**: Session cookie (required)

**Success Response** (200):
```json
{ "success": true }
```
Clears session cookie.

---

### GET /api/auth/session

Get current session and user info.

**Headers**: Session cookie (required)

**Success Response** (200):
```json
{
  "session": { "id": "string", "token": "string", "expiresAt": "ISO 8601" },
  "user": { "id": "string", "name": "string", "email": "string" }
}
```

**Error Responses**:
- 401: No valid session

---

### POST /api/auth/forget-password

Request password reset email.

**Request Body**:
```json
{
  "email": "string (required)"
}
```

**Success Response** (200):
```json
{ "status": true }
```
Always returns success (does not reveal if email exists).

---

### POST /api/auth/reset-password

Reset password with token.

**Request Body**:
```json
{
  "token": "string (required)",
  "newPassword": "string (required, min 8 chars)"
}
```

**Success Response** (200):
```json
{ "status": true }
```

**Error Responses**:
- 400: Invalid or expired token

---

## Better Auth Organization Plugin Routes

### POST /api/auth/organization/create

Create a new organization. (Used internally during registration via hook.)

**Headers**: Session cookie (required)

**Request Body**:
```json
{
  "name": "string (required)",
  "slug": "string (required, unique)"
}
```

**Success Response** (200):
```json
{
  "id": "string",
  "name": "string",
  "slug": "string",
  "createdAt": "ISO 8601"
}
```

---

### POST /api/auth/organization/invite

Invite a user to the organization.

**Headers**: Session cookie (required, must be owner role)

**Request Body**:
```json
{
  "email": "string (required)",
  "role": "operator | accountant (required)",
  "organizationId": "string (optional, defaults to active org)"
}
```

**Success Response** (200):
```json
{
  "invitationId": "string",
  "email": "string",
  "role": "string",
  "organizationId": "string"
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Not an owner
- 400: User already a member

---

### POST /api/auth/organization/accept-invitation

Accept an organization invitation.

**Headers**: Session cookie (required)

**Request Body**:
```json
{
  "invitationId": "string (required)"
}
```

**Success Response** (200):
```json
{
  "member": { "id": "string", "role": "string", "organizationId": "string" }
}
```

---

### GET /api/auth/organization/list-members

List members of the current organization.

**Headers**: Session cookie (required)

**Success Response** (200):
```json
{
  "members": [
    { "id": "string", "userId": "string", "role": "string", "user": { "name": "string", "email": "string" } }
  ]
}
```

**Error Responses**:
- 401: Not authenticated

---

## Application API Routes

### GET /api/organization/profile

Get the extended profile for the user's organization.

**Headers**: Session cookie (required)

**Success Response** (200):
```json
{
  "id": "string",
  "organizationId": "string",
  "taxIdentifier": "string | null",
  "phone": "string | null",
  "address": "string | null",
  "city": "string | null",
  "status": "active | suspended"
}
```

**Error Responses**:
- 401: Not authenticated

---

### PUT /api/organization/profile

Update the extended organization profile.

**Headers**: Session cookie (required, must be owner role)

**Request Body**:
```json
{
  "taxIdentifier": "string (optional)",
  "phone": "string (optional)",
  "address": "string (optional)",
  "city": "string (optional)"
}
```

**Success Response** (200):
```json
{
  "id": "string",
  "organizationId": "string",
  "taxIdentifier": "string | null",
  "phone": "string | null",
  "address": "string | null",
  "city": "string | null",
  "status": "active"
}
```

**Error Responses**:
- 401: Not authenticated
- 403: Not an owner

---

## Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "string (error code)",
  "message": "string (human-readable description)"
}
```

## Authentication Pattern

- All protected endpoints require a valid session cookie
- Session cookies are HTTP-only, Secure, SameSite=Lax
- Middleware checks session presence for route-level protection
- Server Actions/Route Handlers verify session + role for action-level authorization
- 401 = not authenticated, 403 = authenticated but insufficient permissions
