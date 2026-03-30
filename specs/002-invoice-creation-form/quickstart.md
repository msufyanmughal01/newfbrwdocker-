# Quickstart Guide: Invoice Creation Form

**Branch**: `002-invoice-creation-form` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)

## Purpose

This guide helps developers set up, implement, and test the invoice creation form feature. Follow these steps to go from zero to a working implementation.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup Steps](#setup-steps)
3. [File Creation Order](#file-creation-order)
4. [Running the Development Server](#running-the-development-server)
5. [Testing Checklist](#testing-checklist)
6. [Key Files Reference](#key-files-reference)
7. [Common Issues and Solutions](#common-issues-and-solutions)

---

## Prerequisites

### Required Software

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **PostgreSQL**: v14+ (Neon serverless for production)
- **Git**: Latest version

### Required Knowledge

- TypeScript fundamentals
- Next.js App Router
- React 19 features (hooks, Server/Client Components)
- Drizzle ORM basics
- Zod validation

### Environment Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd fbrdigitalinvoicingportal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create `.env.local` file with the following:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/fbr_invoicing

   # Authentication (Better-Auth)
   AUTH_SECRET=your-secret-key-here
   AUTH_URL=http://localhost:3000

   # Optional: FBR API (Phase 2)
   # FBR_API_URL=https://api.fbr.gov.pk
   # FBR_API_KEY=your-fbr-api-key
   ```

4. **Run database migrations**:
   ```bash
   npm run db:generate  # Generate migration from schema
   npm run db:migrate   # Apply migrations to database
   ```

---

## Setup Steps

### Step 1: Create Feature Branch

```bash
git checkout -b 002-invoice-creation-form
```

### Step 2: Install Additional Dependencies

```bash
# Form management
npm install react-hook-form @hookform/resolvers

# Validation
npm install zod

# IndexedDB wrapper
npm install idb

# Date handling (if needed)
npm install date-fns

# Debouncing utility
npm install use-debounce
```

### Step 3: Database Schema Setup

1. Create schema file:
   ```bash
   touch src/lib/db/schema/invoices.ts
   ```

2. Copy schema from [data-model.md](./data-model.md) into `src/lib/db/schema/invoices.ts`

3. Export schema from main index:
   ```typescript
   // src/lib/db/schema/index.ts
   export * from './auth';
   export * from './organization-profile';
   export * from './invoices'; // Add this line
   ```

4. Generate and run migration:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### Step 4: Validation and Business Logic

Create the following files in order:

1. **FBR Reference Data** (`src/lib/invoices/fbr-reference-data.ts`):
   - Static data for provinces, tax rates, HS codes, UOMs
   - See [research.md](./research.md) for complete implementation

2. **Validation Schemas** (`src/lib/invoices/validation.ts`):
   - Zod schemas for invoice and line items
   - See [contracts/invoice-api.md](./contracts/invoice-api.md) for complete schemas

3. **Calculation Functions** (`src/lib/invoices/calculations.ts`):
   - Pure functions for tax calculations
   - See implementation below

4. **FBR Mapping** (`src/lib/invoices/fbr-mapping.ts`):
   - Convert internal format to FBR API format
   - See [data-model.md](./data-model.md) for implementation

5. **Draft Storage** (`src/lib/invoices/draft-storage.ts`):
   - IndexedDB operations for draft persistence
   - See implementation below

### Step 5: API Routes

Create API endpoints in this order:

1. `src/app/api/invoices/validate/route.ts` - Validation endpoint (no database required)
2. `src/app/api/invoices/route.ts` - Create invoice endpoint
3. `src/app/api/drafts/route.ts` - Draft management (Phase 2)

See [contracts/invoice-api.md](./contracts/invoice-api.md) for complete implementations.

### Step 6: UI Components

Create components in this order (bottom-up approach):

1. **Utility Components**:
   - `src/components/invoices/DraftIndicator.tsx` - Save status display

2. **Form Components**:
   - `src/components/invoices/LineItemRow.tsx` - Single line item
   - `src/components/invoices/LineItemsTable.tsx` - Dynamic line items table
   - `src/components/invoices/InvoiceHeader.tsx` - Invoice header fields
   - `src/components/invoices/InvoiceSummary.tsx` - Calculated totals display

3. **Main Form**:
   - `src/app/(dashboard)/invoices/invoice-form-client.tsx` - Main form component
   - `src/app/(dashboard)/invoices/new/page.tsx` - Server Component wrapper

---

## File Creation Order

Follow this order to minimize dependency issues:

### Phase 0: Setup (5 files)
```
1. src/lib/invoices/fbr-reference-data.ts
2. src/lib/invoices/validation.ts
3. src/lib/invoices/calculations.ts
4. src/lib/invoices/fbr-mapping.ts
5. src/lib/invoices/draft-storage.ts
```

### Phase 1: Database (2 files)
```
6. src/lib/db/schema/invoices.ts
7. drizzle/migrations/0001_create_invoices.sql (auto-generated)
```

### Phase 2: API Routes (3 files)
```
8. src/app/api/invoices/validate/route.ts
9. src/app/api/invoices/route.ts
10. src/app/api/drafts/route.ts (Phase 2 - optional)
```

### Phase 3: UI Components (7 files)
```
11. src/components/invoices/DraftIndicator.tsx
12. src/components/invoices/LineItemRow.tsx
13. src/components/invoices/LineItemsTable.tsx
14. src/components/invoices/InvoiceHeader.tsx
15. src/components/invoices/InvoiceSummary.tsx
16. src/app/(dashboard)/invoices/invoice-form-client.tsx
17. src/app/(dashboard)/invoices/new/page.tsx
```

### Phase 4: Tests (6 files)
```
18. tests/unit/lib/invoices/calculations.test.ts
19. tests/unit/lib/invoices/validation.test.ts
20. tests/unit/lib/invoices/fbr-mapping.test.ts
21. tests/integration/api/invoices.test.ts
22. tests/integration/api/drafts.test.ts
23. tests/e2e/invoice-creation.spec.ts
```

**Total: 23 files**

---

## Running the Development Server

### Start Development Server

```bash
npm run dev
```

Server runs at: `http://localhost:3000`

### Access Invoice Form

1. Navigate to: `http://localhost:3000/dashboard/invoices/new`
2. Login if required (use existing auth system)
3. Start creating an invoice

### Hot Reload

Next.js automatically reloads on file changes. No restart needed.

---

## Testing Checklist

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm run test:unit tests/unit/lib/invoices/calculations.test.ts

# Run with coverage
npm run test:unit -- --coverage
```

**Test Coverage Targets**:
- `calculations.ts`: 100% (pure functions, easy to test)
- `validation.ts`: 95%+ (test all validation rules)
- `fbr-mapping.ts`: 95%+ (test format conversion)

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Test specific API route
npm run test:integration tests/integration/api/invoices.test.ts
```

**Test Cases**:
- ✅ Create valid Sale Invoice
- ✅ Create valid Debit Note with reference
- ✅ Reject invoice with invalid NTN/CNIC
- ✅ Reject invoice with > 100 line items
- ✅ Reject Debit Note without reference
- ✅ Validate calculations match expected totals

### E2E Tests

```bash
# Run end-to-end tests
npm run test:e2e

# Run specific spec
npm run test:e2e tests/e2e/invoice-creation.spec.ts

# Run in UI mode (interactive)
npm run test:e2e:ui
```

**Test Scenarios**:
- ✅ Load invoice form (<1 second)
- ✅ Add 10 line items
- ✅ Add 100 line items (performance test)
- ✅ Real-time calculation updates (<100ms)
- ✅ Form validation displays errors
- ✅ Submit valid invoice
- ✅ Draft auto-save every 60 seconds
- ✅ Resume draft after page reload

### Manual Testing Checklist

- [ ] Form loads within 1 second
- [ ] Add line item button works
- [ ] Remove line item button works
- [ ] Calculations update in real-time
- [ ] Tax calculations are accurate (verify manually)
- [ ] Validation errors display inline
- [ ] Cannot submit invalid invoice
- [ ] Draft saves automatically every 60 seconds
- [ ] Draft indicator shows save status
- [ ] Can create Sale Invoice
- [ ] Can create Debit Note (requires invoice reference)
- [ ] Seller NTN/CNIC validates correctly
- [ ] Buyer NTN/CNIC validates correctly (or empty if unregistered)
- [ ] Invoice reference validates for Debit Notes
- [ ] Province dropdown has all 7 provinces
- [ ] Tax rate dropdown has all standard rates
- [ ] 100 line items don't cause lag

---

## Key Files Reference

### Business Logic

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/lib/invoices/validation.ts` | Zod schemas | `invoiceSchema`, `lineItemSchema`, types |
| `src/lib/invoices/calculations.ts` | Tax calculations | `calculateInvoiceTotals`, `calculateLineItem` |
| `src/lib/invoices/fbr-mapping.ts` | FBR format conversion | `mapToFBRFormat`, `validateFBRPayload` |
| `src/lib/invoices/fbr-reference-data.ts` | Static reference data | `FBR_PROVINCES`, `FBR_TAX_RATES`, etc. |
| `src/lib/invoices/draft-storage.ts` | IndexedDB operations | `saveDraft`, `loadDraft`, `deleteDraft` |

### Database

| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/lib/db/schema/invoices.ts` | Drizzle schema | `invoices`, `lineItems`, `invoiceDrafts` |

### API Routes

| File | Purpose | Methods |
|------|---------|---------|
| `src/app/api/invoices/route.ts` | Invoice CRUD | `POST` (create), `GET` (list) |
| `src/app/api/invoices/validate/route.ts` | Pre-submission validation | `POST` |
| `src/app/api/drafts/route.ts` | Draft management | `GET`, `POST`, `DELETE` |

### UI Components

| File | Purpose | Props |
|------|---------|-------|
| `src/app/(dashboard)/invoices/new/page.tsx` | Server Component wrapper | None |
| `src/app/(dashboard)/invoices/invoice-form-client.tsx` | Main form component | None |
| `src/components/invoices/InvoiceHeader.tsx` | Invoice header fields | `control`, `errors` |
| `src/components/invoices/LineItemsTable.tsx` | Dynamic line items | `control`, `watch` |
| `src/components/invoices/LineItemRow.tsx` | Single line item | `item`, `index`, `onChange`, `onRemove` |
| `src/components/invoices/InvoiceSummary.tsx` | Totals display | `calculations` |
| `src/components/invoices/DraftIndicator.tsx` | Save status | `isSaving`, `lastSaved` |

---

## Common Issues and Solutions

### Issue 1: Database Migration Fails

**Symptom**: `npm run db:migrate` fails with "relation already exists"

**Solution**:
```bash
# Drop all tables and re-run migration
npm run db:drop   # WARNING: Deletes all data
npm run db:migrate

# Or reset database (development only)
npm run db:reset
```

### Issue 2: Form Performance Lag

**Symptom**: Typing in form fields feels sluggish with many line items

**Solution**:
- Ensure using uncontrolled inputs (`{...register('fieldName')}`)
- Verify `LineItemRow` is wrapped in `memo()`
- Check calculation memoization dependencies
- Use React DevTools Profiler to identify re-renders

### Issue 3: Validation Errors Not Showing

**Symptom**: Form submits without showing validation errors

**Solution**:
```typescript
// Ensure zodResolver is configured
const { handleSubmit } = useForm({
  resolver: zodResolver(invoiceSchema), // This line is critical
});

// Ensure errors are displayed in UI
{errors.fieldName && <span>{errors.fieldName.message}</span>}
```

### Issue 4: IndexedDB Not Persisting Drafts

**Symptom**: Drafts don't persist after page reload

**Solution**:
- Check browser console for IndexedDB errors
- Verify database name and version in `draft-storage.ts`
- Test in incognito mode (some browsers restrict IndexedDB)
- Check browser storage quota: `navigator.storage.estimate()`

### Issue 5: Calculations Are Incorrect

**Symptom**: Tax totals don't match expected values

**Solution**:
- Verify calculation logic in `calculations.ts`
- Check precision: quantities (4 decimals), amounts (2 decimals)
- Add unit tests with known values
- Compare with FBR specification examples

### Issue 6: TypeScript Errors After Schema Changes

**Symptom**: Type errors after modifying Zod schemas

**Solution**:
```bash
# Regenerate types from Zod schemas
npm run type-check

# Ensure you're using z.infer<>
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
```

### Issue 7: API Route Returns 401 Unauthorized

**Symptom**: All API requests fail with 401 error

**Solution**:
- Verify session token is being sent in headers
- Check `auth.api.getSession()` configuration
- Ensure user is logged in
- Check `AUTH_SECRET` in `.env.local`

### Issue 8: FBR Payload Validation Fails

**Symptom**: `validateFBRPayload()` returns errors

**Solution**:
- Compare payload structure with `dataformat.md` specification
- Check field naming (exact match required)
- Verify all required fields are present
- Ensure correct data types (string vs number)

---

## Sample Implementation: Calculation Functions

**File**: `src/lib/invoices/calculations.ts`

```typescript
import { LineItem } from './validation';

export interface LineItemCalculation {
  subtotal: number;
  salesTax: number;
  lineTotal: number;
}

export interface InvoiceCalculations {
  lineItemTotals: LineItemCalculation[];
  subtotal: number;
  totalTax: number;
  totalExtraTax: number;
  totalFurtherTax: number;
  grandTotal: number;
}

/**
 * Parse tax rate from string format (e.g., "18%" -> 18)
 */
export function parseTaxRate(rate: string): number {
  const match = rate.match(/^(\d+)%$/);
  if (!match) {
    throw new Error(`Invalid tax rate format: ${rate}`);
  }
  return parseInt(match[1], 10);
}

/**
 * Calculate totals for a single line item
 */
export function calculateLineItem(item: LineItem): LineItemCalculation {
  // Base calculation: quantity * price - discount
  const subtotal = item.quantity * item.valueSalesExcludingST - (item.discount || 0);

  // Sales tax calculation
  const taxRate = parseTaxRate(item.rate);
  const salesTax = subtotal * (taxRate / 100);

  // Line total: subtotal + all taxes
  const lineTotal = subtotal + salesTax + (item.extraTax || 0) + (item.furtherTax || 0);

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    salesTax: parseFloat(salesTax.toFixed(2)),
    lineTotal: parseFloat(lineTotal.toFixed(2)),
  };
}

/**
 * Calculate invoice totals from all line items
 */
export function calculateInvoiceTotals(items: LineItem[]): InvoiceCalculations {
  const lineItemTotals = items.map((item) => calculateLineItem(item));

  const subtotal = lineItemTotals.reduce((sum, item) => sum + item.subtotal, 0);
  const totalTax = lineItemTotals.reduce((sum, item) => sum + item.salesTax, 0);
  const totalExtraTax = items.reduce((sum, item) => sum + (item.extraTax || 0), 0);
  const totalFurtherTax = items.reduce((sum, item) => sum + (item.furtherTax || 0), 0);
  const grandTotal = subtotal + totalTax + totalExtraTax + totalFurtherTax;

  return {
    lineItemTotals,
    subtotal: parseFloat(subtotal.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    totalExtraTax: parseFloat(totalExtraTax.toFixed(2)),
    totalFurtherTax: parseFloat(totalFurtherTax.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
}
```

---

## Sample Implementation: Draft Storage

**File**: `src/lib/invoices/draft-storage.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { InvoiceFormData } from './validation';

interface InvoiceDraft {
  id: string;
  invoiceData: Partial<InvoiceFormData>;
  lastSaved: number; // Unix timestamp
  organizationId: string;
}

interface DraftDB extends DBSchema {
  drafts: {
    key: string;
    value: InvoiceDraft;
    indexes: { 'by-organization': string; 'by-last-saved': number };
  };
}

let dbPromise: Promise<IDBPDatabase<DraftDB>> | null = null;

/**
 * Initialize IndexedDB connection
 */
function getDB(): Promise<IDBPDatabase<DraftDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DraftDB>('invoice-drafts', 1, {
      upgrade(db) {
        const store = db.createObjectStore('drafts', { keyPath: 'id' });
        store.createIndex('by-organization', 'organizationId');
        store.createIndex('by-last-saved', 'lastSaved');
      },
    });
  }
  return dbPromise;
}

/**
 * Save draft to IndexedDB
 */
export async function saveDraft(
  draftId: string,
  invoiceData: Partial<InvoiceFormData>,
  organizationId: string
): Promise<void> {
  const db = await getDB();
  await db.put('drafts', {
    id: draftId,
    invoiceData,
    lastSaved: Date.now(),
    organizationId,
  });
}

/**
 * Load draft from IndexedDB
 */
export async function loadDraft(draftId: string): Promise<InvoiceDraft | undefined> {
  const db = await getDB();
  return await db.get('drafts', draftId);
}

/**
 * List all drafts for an organization
 */
export async function listDrafts(organizationId: string): Promise<InvoiceDraft[]> {
  const db = await getDB();
  return await db.getAllFromIndex('drafts', 'by-organization', organizationId);
}

/**
 * Delete draft from IndexedDB
 */
export async function deleteDraft(draftId: string): Promise<void> {
  const db = await getDB();
  await db.delete('drafts', draftId);
}

/**
 * Clear all drafts (for testing/reset)
 */
export async function clearAllDrafts(): Promise<void> {
  const db = await getDB();
  await db.clear('drafts');
}
```

---

## Next Steps

After completing setup and testing:

1. **Generate Tasks**: Run `/sp.tasks` to create implementation task list
2. **Implement Feature**: Follow task list and file creation order
3. **Run Tests**: Ensure all tests pass before moving to next task
4. **Performance Testing**: Test with 100 line items to verify performance targets
5. **Code Review**: Review code against [plan.md](./plan.md) architectural decisions
6. **Integration Testing**: Test with existing dashboard and auth system
7. **Create Pull Request**: Follow Git workflow for code review

## Additional Resources

- [FBR Digital Invoicing API v1.12](../../../dataformat.md)
- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Research Findings](./research.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/invoice-api.md)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)
- [Drizzle ORM Documentation](https://orm.drizzle.team)

---

**Happy Coding!** If you encounter issues not covered in this guide, consult the research and plan documents or reach out to the team.
