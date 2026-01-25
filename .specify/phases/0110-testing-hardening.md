# Phase 0110: Testing & Public Release Hardening

**Status**: Not Started
**Branch**: `0110-testing-hardening`
**Estimated Scope**: Large (comprehensive testing and documentation)

---

## Goals

1. Comprehensive test suite (unit, integration, e2e)
2. CI/CD pipeline with GitHub Actions
3. Security review and hardening
4. Performance optimization for large libraries
5. Documentation for contributors and users
6. Error handling edge cases
7. Public release preparation

---

## Scope

### In Scope

- Unit tests for all client methods and helpers
- Integration tests for tool workflows
- End-to-end tests with mock/real services
- GitHub Actions CI pipeline
- Security audit of API key handling
- Performance profiling and optimization
- README overhaul
- Contributing guide
- API documentation
- Troubleshooting guide

### Out of Scope

- Automated release pipeline (manual for now)
- npm/package publishing (evaluate later)
- Docker container (future enhancement)
- Multi-platform testing (focus on macOS/Linux)

---

## Deliverables

### 1. Test Infrastructure

```
tests/
├── unit/
│   ├── services/
│   │   ├── sonarr/
│   │   │   ├── client.test.ts
│   │   │   └── tools.test.ts
│   │   ├── radarr/
│   │   ├── plex/
│   │   ├── sabnzbd/
│   │   ├── overseerr/
│   │   ├── tmdb/
│   │   ├── trakt/
│   │   └── telegram/
│   ├── database/
│   │   ├── audit-log.test.ts
│   │   ├── analytics.test.ts
│   │   └── migrations.test.ts
│   └── shared/
│       ├── errors.test.ts
│       └── http.test.ts
├── integration/
│   ├── workflows/
│   │   ├── add-movie.test.ts
│   │   ├── request-lifecycle.test.ts
│   │   ├── cleanup-workflow.test.ts
│   │   └── collection-completion.test.ts
│   └── cross-service/
│       ├── consistency-check.test.ts
│       └── bulk-operations.test.ts
├── e2e/
│   ├── setup.ts
│   ├── claude-desktop.test.ts
│   └── claude-code.test.ts
├── fixtures/
│   ├── sonarr/
│   ├── radarr/
│   └── ...
├── mocks/
│   ├── services.ts
│   └── database.ts
└── vitest.config.ts
```

### 2. Test Coverage Targets

| Area | Target | Notes |
|------|--------|-------|
| Client methods | 90%+ | Core API interactions |
| Tool handlers | 80%+ | Business logic |
| Error handling | 95%+ | All error paths |
| Database operations | 90%+ | Critical for state |
| Shared utilities | 95%+ | Foundational code |

### 3. CI/CD Pipeline

**.github/workflows/ci.yml:**
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

### 4. Security Hardening

**Review areas:**
- [ ] API keys never logged
- [ ] Config file permissions (600)
- [ ] No secrets in error messages
- [ ] Input validation on all parameters
- [ ] SQL injection prevention (parameterized queries)
- [ ] Path traversal prevention
- [ ] Rate limiting for external APIs

**Implementation:**
```typescript
// Secure logging
function sanitizeForLog(obj: unknown): unknown {
  if (typeof obj === 'string' && obj.length > 20) {
    return obj.slice(0, 4) + '***';
  }
  // ... recursive sanitization
}

// Input validation
const movieIdSchema = z.coerce.number().int().positive();
```

### 5. Performance Optimization

**Areas to optimize:**
- Large library listing (pagination, streaming)
- Parallel API calls (Promise.all where safe)
- Database query optimization (indexes)
- Memory usage for bulk operations
- Response size reduction

**Benchmarks to add:**
```typescript
// tests/performance/benchmarks.ts
describe('Performance', () => {
  it('lists 1000 movies in under 5 seconds', async () => {
    const start = Date.now();
    await movieList({ limit: 1000 });
    expect(Date.now() - start).toBeLessThan(5000);
  });
});
```

### 6. Documentation

**README.md overhaul:**
- Quick start (5 minutes to running)
- Full configuration reference
- Tool catalog with examples
- Troubleshooting section
- Contributing link

**CONTRIBUTING.md:**
- Development setup
- Code style guide
- Testing requirements
- PR process

**docs/:**
- API reference (generated from code)
- Workflow examples
- Architecture overview
- Troubleshooting guide

### 7. Error Handling Audit

Review all error scenarios:

| Scenario | Current | Improved |
|----------|---------|----------|
| Service timeout | Generic error | "Sonarr took too long to respond. Check if service is overloaded." |
| Invalid ID format | Zod error | "Movie ID must be a number. Got: 'abc'" |
| Permission denied | 403 error | "API key doesn't have permission for this action. Check Sonarr user permissions." |
| Rate limited | 429 error | "Too many requests to TMDB. Try again in 30 seconds." |
| Database locked | SQLite error | "Database is busy. Another operation may be in progress." |

---

## Testing Strategy

### Unit Tests

Test individual functions in isolation:
```typescript
describe('SonarrClient', () => {
  describe('searchSeries', () => {
    it('returns matching series for valid query', async () => {
      const client = new SonarrClient(mockConfig);
      mockFetch.mockResolvedValue({ json: () => mockSeriesResults });

      const results = await client.searchSeries('Breaking Bad');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Breaking Bad');
    });

    it('returns empty array for no matches', async () => {
      const client = new SonarrClient(mockConfig);
      mockFetch.mockResolvedValue({ json: () => [] });

      const results = await client.searchSeries('NonexistentShow123');

      expect(results).toHaveLength(0);
    });

    it('throws ApiError on 401', async () => {
      const client = new SonarrClient(mockConfig);
      mockFetch.mockResolvedValue({ status: 401, ok: false });

      await expect(client.searchSeries('test')).rejects.toThrow(ApiError);
    });
  });
});
```

### Integration Tests

Test tool workflows with mocked services:
```typescript
describe('Add Movie Workflow', () => {
  it('searches, confirms, and adds movie', async () => {
    // Mock Radarr search response
    mockRadarr.search.mockResolvedValue([mockMovie]);
    mockRadarr.add.mockResolvedValue({ id: 123 });

    // Search
    const searchResult = await movieSearch({ query: 'Inception' });
    expect(searchResult.content[0].text).toContain('Inception');

    // Add
    const addResult = await movieAdd({
      tmdb_id: 27205,
      quality: 'hd'
    });
    expect(addResult.content[0].text).toContain('Added');
    expect(mockRadarr.add).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 27205 })
    );
  });
});
```

### E2E Tests

Test with real services (optional, CI skip by default):
```typescript
describe.skipIf(!process.env.E2E)('E2E Tests', () => {
  it('full workflow with real Sonarr', async () => {
    const result = await tvSearch({ query: 'The Office' });
    expect(result.content[0].text).toContain('The Office');
  });
});
```

---

## Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Test framework | Vitest | Fast, TS native, good DX |
| Coverage tool | v8 (via Vitest) | Built-in, accurate |
| CI provider | GitHub Actions | Free for open source |
| E2E approach | Optional real services | Don't require full stack for CI |
| Documentation | Markdown + JSDoc | Simple, version controlled |

---

## Verification Gate

**Gate 11** - **USER GATE** - Public Release Ready:

- [ ] All unit tests pass
- [ ] Test coverage meets targets
- [ ] CI pipeline runs successfully
- [ ] No security vulnerabilities (npm audit)
- [ ] Performance benchmarks pass
- [ ] README is complete and accurate
- [ ] Contributing guide exists
- [ ] All tools documented
- [ ] Error messages are helpful
- [ ] Works on fresh install
- [ ] Works with Claude Desktop
- [ ] Works with Claude Code
- [ ] Manual testing of all major workflows
- [ ] User approval for public release

---

## Dependencies

- All previous phases complete (0060-0100)
- All features implemented and stable

---

## Technical Notes

### Test Configuration

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['tests/**', 'dist/**'],
    },
    setupFiles: ['tests/setup.ts'],
  },
});
```

### Mock Strategy

Use dependency injection for testability:
```typescript
// Production
const client = new SonarrClient(config.sonarr);

// Test
const client = new SonarrClient(config.sonarr, mockHttpClient);
```

### Documentation Generation

Consider using TypeDoc for API docs:
```bash
pnpm add -D typedoc
typedoc --out docs/api src/index.ts
```

---

## Testing Checklist

- [ ] Unit tests written for all clients
- [ ] Unit tests written for all tools
- [ ] Integration tests for key workflows
- [ ] E2E test setup documented
- [ ] CI pipeline works
- [ ] Coverage reports generated
- [ ] Security scan passes
- [ ] Performance benchmarks pass
- [ ] README updated
- [ ] Contributing guide created
- [ ] All manual tests documented
- [ ] Fresh install tested
