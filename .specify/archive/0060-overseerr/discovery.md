# Discovery: Phase 0060 - Overseerr Integration

**Phase**: 0060-overseerr
**Date**: 2026-01-25
**Status**: Complete

---

## Phase Goals (Source of Truth)

From `.specify/phases/0060-overseerr.md`:

1. Full request lifecycle management (view, approve, deny, delete)
2. User management (list users, view history, quotas)
3. Issue tracking (view and respond to reported issues)
4. Discovery features (trending, popular, recommendations via Overseerr)
5. Auto-approval rule configuration
6. Settings visibility and management

---

## Codebase Analysis

### Existing Service Pattern

All services follow a consistent module structure:

```
src/services/{service}/
├── client.ts      # API client using shared HttpClient
├── types.ts       # TypeScript interfaces matching API responses
├── tools.ts       # MCP tool registration with Zod schemas
└── index.ts       # Module exports
```

Key patterns identified:
- **HTTP Client**: Use shared `src/shared/http.ts` with `HttpClient` class
- **Authentication**: Header-based via `X-Api-Key` header
- **Error Handling**: Use shared error classes from `src/shared/errors.ts`
- **Tool Naming**: Semantic tools (verb_noun) for user-facing, service-prefixed for admin
- **Parameter Types**: Always use `z.coerce.number()` for numeric params (MCP passes strings)

### Integration Points

1. **Config**: Add `overseerr` to `Config` interface in `src/config.ts`
2. **Main Registration**: Import and register in `src/index.ts`
3. **Shared HTTP**: Reuse `HttpClient` for API calls
4. **Shared Errors**: Use `ApiError`, `NetworkError`, `formatErrorResponse()`

---

## Overseerr API Research

### Authentication

- **Method**: API Key via `X-Api-Key` header
- **Base URL**: `{url}/api/v1`
- **Docs**: Available at `{url}/api-docs` (OpenAPI 3.0)

### Key Endpoints

#### Requests
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/request` | GET | List requests (supports `filter`, `take`, `skip`) |
| `/request/{id}` | GET | Get request details |
| `/request/{id}` | PUT | Update request (approve/decline) |
| `/request/{id}` | DELETE | Delete request |

Status values: 1=PENDING, 2=APPROVED, 3=DECLINED, 4=AVAILABLE

#### Users
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/user` | GET | List users with pagination |
| `/user/{id}` | GET | Get user details |
| `/user/{id}/requests` | GET | User's requests |
| `/user/{id}/quota` | GET | User's quota info |

#### Issues
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/issue` | GET | List issues |
| `/issue/{id}` | GET | Get issue details |
| `/issue/{id}/comment` | POST | Add comment |
| `/issue/{id}/{status}` | POST | Update status |

#### Discovery
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/discover/movies` | GET | Discover movies |
| `/discover/tv` | GET | Discover TV shows |
| `/discover/trending` | GET | Trending content |
| `/discover/movies/upcoming` | GET | Upcoming movies |

### Pagination

- Uses `take` and `skip` query parameters (not `limit`/`offset`)
- Response includes `results` array and page metadata

### Gotchas

1. Request status filtering uses specific values: `pending`, `approved`, `available`, `failed`, `processing`
2. User management requires `MANAGE_USERS` permission
3. API request counts may differ from UI counts (known issue)
4. When approving requests, Overseerr sends to Sonarr/Radarr automatically

---

## User Configuration

- **Overseerr URL**: `http://192.168.1.234:5055`
- **API Key**: Available (will be added to config.json)
- **Priority**: All features equally important

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API Version | v1 | Current stable Overseerr API |
| Pagination | Use `take`/`skip` | Matches Overseerr API conventions |
| Request Actions | Approve/Decline via PUT | Follows API pattern |
| Tool Naming | `request_*` for semantic, `overseerr_*` for admin | Consistent with other services |
| Discovery | Via Overseerr API | Leverages existing TMDB integration |

---

## Tool Categories

### Semantic Tools (User-Facing)
- `request_list` - List pending/approved requests
- `request_approve` - Approve a request
- `request_decline` - Decline a request with reason

### Service-Specific Tools (Admin)
- `overseerr_request_details` - Full request info
- `overseerr_request_delete` - Delete request
- `overseerr_users` - List users
- `overseerr_user_requests` - User's request history
- `overseerr_user_quota` - User quotas
- `overseerr_issues` - List issues
- `overseerr_issue_details` - Issue info
- `overseerr_issue_comment` - Comment on issue
- `overseerr_issue_resolve` - Resolve issue
- `overseerr_trending` - Trending content
- `overseerr_discover` - Discovery/recommendations

---

## Files to Create/Modify

### New Files
- `src/services/overseerr/client.ts`
- `src/services/overseerr/types.ts`
- `src/services/overseerr/tools.ts`
- `src/services/overseerr/index.ts`

### Modified Files
- `src/config.ts` - Add overseerr config interface
- `src/index.ts` - Register overseerr tools

---

## Verification Criteria

From phase document:
- [ ] Can list pending requests
- [ ] Can approve a request (sends to Sonarr/Radarr)
- [ ] Can deny a request with reason
- [ ] Can view user list and their request history
- [ ] Can view reported issues
- [ ] Trending/discovery tools return valid results
- [ ] Error handling works (invalid request ID, user not found)
- [ ] Works with both movies and TV requests
