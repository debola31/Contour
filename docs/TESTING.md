# Jigged Test Registry

## Overview

| Metric | Target | Current |
|--------|--------|---------|
| **Statements** | 45% | ~65% |
| **Branches** | 45% | ~59% |
| **Functions** | 45% | ~67% |
| **Lines** | 45% | ~66% |

**Test Frameworks:**
- **Frontend:** Vitest + React Testing Library + MSW
- **Backend:** pytest
- **E2E:** Playwright (configured, not yet implemented)

---

## Test Files

### Unit Tests - Utilities

| Module | File | Tests | Coverage |
|--------|------|-------|----------|
| quotesAccess | `__tests__/utils/quotesAccess.test.ts` | 58 | ~67% |
| companyAccess | `__tests__/utils/companyAccess.test.ts` | 23 | 100% |
| operationsAccess | `__tests__/utils/operationsAccess.test.ts` | 35 | ~70% |
| csvParser | `__tests__/utils/csvParser.test.ts` | 24 | 100% |
| storageHelpers | `__tests__/utils/storageHelpers.test.ts` | 28 | 100% |
| customerAccess | `__tests__/utils/customerAccess.test.ts` | 12 | ~34% |
| partsAccess | `__tests__/utils/partsAccess.test.ts` | 26 | ~68% |

### Component Tests

| Component | File | Tests | Coverage |
|-----------|------|-------|----------|
| AuthGuard | `__tests__/components/auth/AuthGuard.test.tsx` | 11 | 93% |
| CustomerForm | `__tests__/components/customers/CustomerForm.test.tsx` | 5 | ~58% |
| PartForm | `__tests__/components/parts/PartForm.test.tsx` | 9 | ~52% |

### Backend Tests (pytest)

| Module | File | Description |
|--------|------|-------------|
| Customer Import | `api/tests/integration/test_import_api.py` | 3-phase import flow |
| Parts Import | `api/tests/integration/test_parts_import_api.py` | Parts CSV import |
| Smoke | `api/tests/test_smoke.py` | Basic sanity checks |

---

## Running Tests

### Frontend (Vitest)

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test

# Run with UI dashboard
pnpm test:ui

# Run with coverage report
pnpm test:coverage

# Run specific test file
pnpm test __tests__/utils/quotesAccess.test.ts
```

### Backend (pytest)

```bash
cd api

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/integration/test_import_api.py

# Run with coverage
pytest --cov=.
```

### E2E (Playwright) - Future

```bash
# Run headless
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui
```

---

## Edge Cases Covered

### Data Validation
- [x] Empty required fields
- [x] Quantity bounds (1-1,000,000)
- [x] Price bounds (0-999,999.99)
- [x] Description length limits (5000 chars)
- [x] SQL injection prevention (search sanitization)
- [x] File type validation (PDF only)
- [x] File size limits (50MB)

### Business Logic
- [x] Quote status state machine (draft → pending → approved/rejected)
- [x] Invalid status transitions blocked
- [x] Multi-tenancy data isolation (company_id filtering)
- [x] Last company preference handling
- [x] Attachment count limits (5 per quote)
- [x] FK constraint handling (23503 errors)

### Error Handling
- [x] Supabase PGRST116 (not found) graceful handling
- [x] Database errors with user-friendly messages
- [x] Storage upload/download failures
- [x] Auth flow redirects

### Import Operations
- [x] Duplicate name detection (database)
- [x] Duplicate name detection (within file)
- [x] Missing required fields
- [x] Auto-create resource groups
- [x] Batch processing for large imports

---

## Test Patterns

### Utility Test Pattern

```typescript
// Use vi.hoisted for mock setup before vi.mock
const { mockQueryBuilder, mockSupabase } = vi.hoisted(() => {
  const builder = { /* chainable mock methods */ };
  const supabase = { from: vi.fn(() => builder) };
  return { mockQueryBuilder: builder, mockSupabase: supabase };
});

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => mockSupabase,
}));

describe('utilityName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
  });

  it('does something', async () => {
    mockQueryBuilder.data = { /* expected data */ };
    mockQueryBuilder.error = null;

    const result = await functionUnderTest();

    expect(result).toEqual(/* expected */);
  });
});
```

### Component Test Pattern

```typescript
import { render, screen, waitFor, routerMocks } from '../../test-utils';

describe('ComponentName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRouterMocks();
  });

  it('renders correctly', async () => {
    render(<Component prop="value" />);

    await waitFor(() => {
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });
});
```

---

## Mock Infrastructure

### MSW Handlers (`__tests__/mocks/handlers.ts`)

Pre-configured mock API responses for:
- Customer import endpoints
- Parts import endpoints
- (Expandable for quotes, operations)

### Test Utilities (`__tests__/test-utils.tsx`)

- Custom `render()` with ThemeProvider
- Router mocks (push, replace, back, etc.)
- `resetRouterMocks()` helper

---

## Coverage Thresholds

Current thresholds in `vitest.config.ts`:

```typescript
thresholds: {
  statements: 45,
  branches: 45,
  functions: 45,
  lines: 45,
}
```

**Roadmap:**
- Phase 1: 45% (achieved)
- Phase 2: 50%
- Phase 3: 55%
- Phase 4: 60%

---

## Adding New Tests

1. **Utility Tests:** Create in `__tests__/utils/`
2. **Component Tests:** Create in `__tests__/components/{category}/`
3. **Follow existing patterns** for Supabase mocking
4. **Update this document** with new test counts

---

## Known Gaps

### Not Yet Tested (Frontend)
- `utils/jobAttachmentsAccess.ts`
- `components/quotes/QuoteForm.tsx`
- `components/auth/Login.tsx`
- `components/auth/SignUp.tsx`
- `components/auth/CompanySelector.tsx`
- `components/operations/OperationForm.tsx`
- Import components (MappingReviewTable, ConflictDialog, etc.)

### Not Yet Tested (Backend)
- `api/routes/operations_import_routes.py`
- AI provider unit tests
- Import framework service unit tests

### E2E Tests (Not Implemented)
- Authentication flow
- Quote lifecycle
- Import workflows
