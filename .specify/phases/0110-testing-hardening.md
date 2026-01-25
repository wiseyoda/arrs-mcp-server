# Phase 0110: Testing & Public Release Hardening

**Status**: Not Started
**Branch**: `0110-testing-hardening`
**Estimated Scope**: Large (comprehensive testing, CI/CD, final polish)

---

## Goals

1. Comprehensive test suite (unit, integration)
2. CI/CD pipeline with GitHub Actions
3. Security review and hardening
4. Performance validation for large libraries
5. Error handling edge cases
6. Final polish for public release

---

## Scope

### In Scope

- Unit tests for all client methods
- Unit tests for tool handlers
- Integration tests for key workflows
- GitHub Actions CI pipeline
- Security audit of API key handling
- Performance profiling
- Error message consistency
- Final documentation review

### Out of Scope

- E2E tests with real services (optional, manual)
- Automated release pipeline (manual for now)
- npm/package publishing (evaluate later)
- Docker container (future enhancement)

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
│   │   └── tmdb/
│   ├── providers/
│   │   ├── registry.test.ts
│   │   └── cross-provider.test.ts
│   └── shared/
│       ├── errors.test.ts
│       └── http.test.ts
├── integration/
│   ├── workflows/
│   │   ├── add-movie.test.ts
│   │   ├── add-series.test.ts
│   │   ├── cleanup-workflow.test.ts
│   │   └── consistency-check.test.ts
│   └── provider-detection.test.ts
├── fixtures/
│   ├── sonarr/
│   ├── radarr/
│   ├── plex/
│   └── ...
├── mocks/
│   └── services.ts
├── setup.ts
└── vitest.config.ts
```

### 2. Test Coverage Targets

| Area | Target | Notes |
|------|--------|-------|
| Client methods | 90%+ | Core API interactions |
| Tool handlers | 80%+ | Business logic |
| Error handling | 95%+ | All error paths |
| Provider registry | 95%+ | Critical for conditional loading |
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
      - uses: pnpm/action-setup@v4
        with:
          version: 9
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
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v4
        if: github.event_name == 'push'

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
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
- [ ] API keys never logged (even in debug mode)
- [ ] Config file permissions documented (recommend 600)
- [ ] No secrets in error messages
- [ ] Input validation on all parameters
- [ ] No command injection possible
- [ ] Path traversal prevention (if any file ops)

**Implementation:**
```typescript
// Secure logging - redact API keys
function redactSecrets(obj: unknown): unknown {
  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('token') ||
          key.toLowerCase().includes('secret')) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSecrets(value);
      }
    }
    return result;
  }
  return obj;
}
```

### 5. Performance Validation

**Benchmarks to add:**
```typescript
describe('Performance', () => {
  it('lists 500 movies in under 3 seconds', async () => {
    const start = Date.now();
    await movieList({ limit: 500 });
    expect(Date.now() - start).toBeLessThan(3000);
  });

  it('library consistency check completes in under 10 seconds', async () => {
    const start = Date.now();
    await libraryConsistency();
    expect(Date.now() - start).toBeLessThan(10000);
  });
});
```

**Areas to validate:**
- Large library listing (1000+ items)
- Cross-provider consistency checks
- Parallel API calls
- Memory usage for bulk operations

### 6. Error Handling Audit

Review all error scenarios:

| Scenario | Current | Improved |
|----------|---------|----------|
| Service timeout | Generic error | "{Service} took too long to respond (30s). Check if service is overloaded." |
| Invalid ID | Zod error | "Movie ID must be a positive number. Got: '{value}'" |
| Permission denied | 403 error | "API key doesn't have permission for this action. Check {service} user permissions." |
| Rate limited | 429 error | "Too many requests to {service}. Try again in {seconds} seconds." |
| Service down | Connection error | "{Service} is not reachable at {url}. Check if service is running." |
| Provider not configured | Undefined error | "{Provider} is not configured. Run providers_status() to see setup instructions." |

### 7. Final Polish Checklist

- [ ] All tool descriptions are clear and accurate
- [ ] All error messages are helpful and actionable
- [ ] Response formatting is consistent
- [ ] No debug logging left in production code
- [ ] package.json has correct metadata
- [ ] LICENSE file present
- [ ] .gitignore is complete
- [ ] No sensitive data in repository

---

## Testing Strategy

### Unit Tests

Test individual functions in isolation:
```typescript
describe('SonarrClient', () => {
  describe('searchSeries', () => {
    it('returns matching series for valid query', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([mockSeriesResult]),
      });

      const client = new SonarrClient(mockConfig, mockFetch);
      const results = await client.searchSeries('Breaking Bad');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Breaking Bad');
    });

    it('returns empty array for no matches', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const client = new SonarrClient(mockConfig, mockFetch);
      const results = await client.searchSeries('NonexistentShow');

      expect(results).toHaveLength(0);
    });

    it('throws ApiError on 401', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const client = new SonarrClient(mockConfig, mockFetch);

      await expect(client.searchSeries('test')).rejects.toThrow(/unauthorized/i);
    });
  });
});
```

### Integration Tests

Test tool workflows with mocked services:
```typescript
describe('Add Movie Workflow', () => {
  it('searches and adds movie correctly', async () => {
    const mockRadarr = createMockRadarrClient();
    mockRadarr.search.mockResolvedValue([mockMovie]);
    mockRadarr.add.mockResolvedValue({ id: 123 });

    // Execute workflow
    const searchResult = await movieSearch({ query: 'Inception' });
    expect(searchResult).toContain('Inception');

    const addResult = await movieAdd({ tmdb_id: 27205, quality: 'hd' });
    expect(addResult).toContain('Added');
    expect(mockRadarr.add).toHaveBeenCalledWith(
      expect.objectContaining({ tmdbId: 27205 })
    );
  });
});
```

### Provider Registry Tests

```typescript
describe('ProviderRegistry', () => {
  it('correctly identifies configured providers', () => {
    const config = { sonarr: mockSonarrConfig };
    const registry = createRegistry(config);

    expect(registry.isConfigured('sonarr')).toBe(true);
    expect(registry.isConfigured('radarr')).toBe(false);
  });

  it('throws helpful error for missing provider', () => {
    const config = { sonarr: mockSonarrConfig };
    const registry = createRegistry(config);

    expect(() => registry.requireProviders('radarr'))
      .toThrow(/radarr is not configured/i);
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
| Mock strategy | Dependency injection | Testable without real services |
| E2E tests | Manual only | Don't require full stack for CI |

---

## Verification Gate

**Gate 11** - **USER GATE** - Public Release Ready:

- [ ] All unit tests pass
- [ ] Test coverage meets targets (80%+ overall)
- [ ] CI pipeline runs successfully on PR
- [ ] No security vulnerabilities (npm audit)
- [ ] Performance benchmarks pass
- [ ] All documentation accurate and complete
- [ ] Error messages are helpful
- [ ] Works on fresh install (tested)
- [ ] Works with Claude Desktop (tested)
- [ ] Works with Claude Code (tested)
- [ ] Manual testing of all major workflows complete
- [ ] User approval for public release

---

## Dependencies

- Phase 0100 (documentation) should be complete
- All features implemented and stable
- No known bugs

---

## Testing Checklist

- [ ] Unit tests for all service clients
- [ ] Unit tests for all tool handlers
- [ ] Unit tests for provider registry
- [ ] Unit tests for shared utilities
- [ ] Integration tests for key workflows
- [ ] CI pipeline works
- [ ] Coverage reports generated
- [ ] Security review complete
- [ ] Performance benchmarks pass
- [ ] Fresh install tested
- [ ] Claude Desktop tested
- [ ] Claude Code tested
