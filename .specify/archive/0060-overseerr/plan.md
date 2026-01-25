# Implementation Plan: Phase 0060 - Overseerr Integration

**Phase**: 0060-overseerr
**Created**: 2026-01-25

---

## Technical Context

| Aspect | Value |
|--------|-------|
| Language | TypeScript 5.x (strict mode) |
| Runtime | Node.js 20+ LTS |
| MCP SDK | @modelcontextprotocol/sdk |
| HTTP | Native fetch via shared HttpClient |
| Validation | Zod ^3.25 |
| Build | TypeScript compiler (tsc) |

---

## Architecture

### Service Module Structure

```
src/services/overseerr/
├── client.ts      # OverseerrClient class using HttpClient
├── types.ts       # API response interfaces
├── tools.ts       # registerOverseerrTools function
└── index.ts       # Module exports
```

### API Client Design

```typescript
// client.ts
export class OverseerrClient {
  private http: HttpClient;

  constructor(config: ServiceConfig) {
    this.http = new HttpClient({
      baseUrl: `${config.url}/api/v1`,
      headers: { "X-Api-Key": config.apiKey },
      serviceName: "Overseerr",
    });
  }

  // Request methods
  async getRequests(filter?: string, take?: number, skip?: number): Promise<RequestPage>;
  async getRequest(id: number): Promise<Request>;
  async approveRequest(id: number): Promise<Request>;
  async declineRequest(id: number): Promise<Request>;
  async deleteRequest(id: number): Promise<void>;

  // User methods
  async getUsers(take?: number, skip?: number): Promise<UserPage>;
  async getUser(id: number): Promise<User>;
  async getUserRequests(userId: number): Promise<Request[]>;
  async getUserQuota(userId: number): Promise<Quota>;

  // Issue methods
  async getIssues(filter?: string): Promise<IssuePage>;
  async getIssue(id: number): Promise<Issue>;
  async addIssueComment(id: number, comment: string): Promise<IssueComment>;
  async resolveIssue(id: number): Promise<Issue>;

  // Discovery methods
  async getTrending(): Promise<DiscoverResults>;
  async getUpcoming(): Promise<DiscoverResults>;
}
```

### Type Definitions

```typescript
// types.ts
export interface Request {
  id: number;
  status: 1 | 2 | 3 | 4; // PENDING, APPROVED, DECLINED, AVAILABLE
  type: "movie" | "tv";
  media: {
    id: number;
    tmdbId: number;
    title?: string;
    name?: string;
  };
  requestedBy: {
    id: number;
    displayName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  displayName: string;
  requestCount: number;
  permissions: number;
}

export interface Issue {
  id: number;
  issueType: number;
  status: number;
  media: { title: string };
  createdBy: { displayName: string };
  comments: IssueComment[];
}

export interface DiscoverResult {
  id: number;
  mediaType: "movie" | "tv";
  title?: string;
  name?: string;
  releaseDate?: string;
  firstAirDate?: string;
}
```

---

## Tool Registration Plan

### Semantic Tools (User-Facing)

| Tool | Parameters | Purpose |
|------|------------|---------|
| `request_list` | status?, limit? | List requests with filtering |
| `request_approve` | request_id | Approve pending request |
| `request_decline` | request_id, reason? | Decline with optional reason |

### Service-Specific Tools (Admin)

| Tool | Parameters | Purpose |
|------|------------|---------|
| `overseerr_request_details` | request_id | Full request info |
| `overseerr_request_delete` | request_id, confirm | Delete request (confirm=true required) |
| `overseerr_users` | limit? | List users |
| `overseerr_user_requests` | user_id, limit? | User's requests |
| `overseerr_user_quota` | user_id | Quota info |
| `overseerr_issues` | status?, limit? | List issues |
| `overseerr_issue_details` | issue_id | Issue info |
| `overseerr_issue_comment` | issue_id, comment | Add comment |
| `overseerr_issue_resolve` | issue_id | Resolve issue |
| `overseerr_trending` | type?, limit? | Trending content |
| `overseerr_upcoming` | limit? | Upcoming movies |

---

## Configuration Changes

### config.ts Updates

```typescript
// Add to Config interface
overseerr?: ServiceConfig;

// Add to getEnvConfig()
if (process.env.OVERSEERR_URL && process.env.OVERSEERR_API_KEY) {
  config.overseerr = {
    url: process.env.OVERSEERR_URL,
    apiKey: process.env.OVERSEERR_API_KEY,
  };
}

// Add to mergeConfigs()
overseerr: envConfig.overseerr || fileConfig.overseerr,

// Add to validateConfig()
if (config.overseerr?.url && config.overseerr?.apiKey) {
  configuredServices.push("Overseerr");
}
```

### index.ts Updates

```typescript
import { registerOverseerrTools } from "./services/overseerr/tools.js";

// In main()
if (config.overseerr) {
  registerOverseerrTools(server, config);
}
```

---

## Implementation Order

### Phase 1: Setup
1. Create service directory structure
2. Add config integration
3. Implement basic client with health check

### Phase 2: Request Management (P1)
4. Implement request types
5. Implement request client methods
6. Implement request_list tool
7. Implement request_approve tool
8. Implement request_decline tool
9. Implement overseerr_request_details tool
10. Implement overseerr_request_delete tool

### Phase 3: User Management (P2)
11. Implement user types
12. Implement user client methods
13. Implement overseerr_users tool
14. Implement overseerr_user_requests tool
15. Implement overseerr_user_quota tool

### Phase 4: Issue Management (P3)
16. Implement issue types
17. Implement issue client methods
18. Implement overseerr_issues tool
19. Implement overseerr_issue_details tool
20. Implement overseerr_issue_comment tool
21. Implement overseerr_issue_resolve tool

### Phase 5: Discovery (P3)
22. Implement discovery types
23. Implement discovery client methods
24. Implement overseerr_trending tool
25. Implement overseerr_upcoming tool

### Phase 6: Polish
26. Add to system_health tool
27. Update README
28. Manual testing

---

## Constraints & Guidelines

### Constitution Compliance
- **Safety**: No bulk approve without confirmation
- **Natural Language**: Tool names and responses are Claude-friendly
- **Stateless**: No caching, Overseerr is source of truth

### Coding Standards
- 2-space indentation
- Explicit return types on exports
- Use `z.coerce.number()` for numeric params
- Include IDs in all list outputs

### Error Handling
- Use shared `formatErrorResponse()` for all tool errors
- Map 401 → "Check API key"
- Map 404 → "Request/User/Issue not found"

---

## Testing Strategy

### Manual Testing
1. Configure Overseerr in config.json
2. Build and run MCP server
3. Test each tool via Claude

### Test Cases
- List requests with various filters
- Approve a movie request → verify in Radarr
- Approve a TV request → verify in Sonarr
- Deny request with reason
- List users, view requests, check quota
- List issues, add comment, resolve
- Get trending, get upcoming

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API changes | Pin to v1 API, check version on connect |
| Rate limiting | Use sensible defaults for pagination |
| Permission errors | Clear error messages for insufficient permissions |
| Network issues | Use shared error handling with retry hints |
