# Phase 0060: Overseerr Integration

**Status**: Not Started
**Branch**: `0060-overseerr`
**Estimated Scope**: Large (new service with full API coverage)

---

## Goals

1. Full request lifecycle management (view, approve, deny, delete)
2. User management (list users, view history, quotas)
3. Issue tracking (view and respond to reported issues)
4. Discovery features (trending, popular, recommendations via Overseerr)
5. Auto-approval rule configuration
6. Settings visibility and management

---

## Scope

### In Scope

- New service: `src/services/overseerr/`
- Full Overseerr API client
- Request management tools (semantic + admin)
- User management tools
- Issue management tools
- Discovery/trending tools
- Integration with existing Sonarr/Radarr workflows

### Out of Scope

- Jellyseerr (Overseerr fork) - different API nuances
- Direct Plex authentication through Overseerr
- Custom notification configurations (use existing Overseerr settings)

---

## Deliverables

### 1. Service Structure

```
src/services/overseerr/
├── client.ts      # Overseerr API client
├── types.ts       # TypeScript interfaces
├── tools.ts       # MCP tool registrations
└── index.ts       # Exports
```

### 2. Request Management Tools

**Semantic Tools (User-Facing):**

| Tool | Description |
|------|-------------|
| `request_list` | List all requests with filtering (status, type, user) |
| `request_approve` | Approve a pending request |
| `request_deny` | Deny a request with optional reason |
| `request_status` | Check status of a specific request |

**Admin Tools:**

| Tool | Description |
|------|-------------|
| `overseerr_request_details` | Full details of a request |
| `overseerr_request_delete` | Delete a request |
| `overseerr_request_retry` | Retry a failed request |

### 3. User Management Tools

| Tool | Description |
|------|-------------|
| `overseerr_users` | List all Overseerr users |
| `overseerr_user_requests` | View requests by specific user |
| `overseerr_user_quota` | Check user's request quota and limits |

### 4. Issue Management Tools

| Tool | Description |
|------|-------------|
| `overseerr_issues` | List reported issues |
| `overseerr_issue_details` | View issue details |
| `overseerr_issue_comment` | Add comment to an issue |
| `overseerr_issue_resolve` | Mark issue as resolved |

### 5. Discovery Tools

| Tool | Description |
|------|-------------|
| `overseerr_trending` | Trending movies and TV shows |
| `overseerr_popular` | Popular content |
| `overseerr_upcoming` | Upcoming releases |
| `overseerr_discover` | Personalized recommendations |

### 6. Example Workflows

**Approve a request:**
```typescript
// User: "What requests are pending?"
request_list({ status: 'pending' })
// Response:
// Pending Requests (3):
// [1234] Movie: Dune Part 3 - Requested by john_doe (2 days ago)
// [1235] TV: The Last of Us S2 - Requested by jane_smith (1 day ago)
// [1236] Movie: Oppenheimer - Requested by john_doe (3 hours ago)

// User: "Approve Dune"
request_approve({ request_id: 1234 })
// Response:
// Request #1234 approved.
// Dune Part 3 has been sent to Radarr for download.
```

**Check user activity:**
```typescript
// User: "What has john_doe requested lately?"
overseerr_user_requests({ username: 'john_doe', limit: 10 })
// Response:
// john_doe's Recent Requests:
// [1234] Dune Part 3 - Approved (downloading)
// [1236] Oppenheimer - Pending
// [1200] Barbie - Available (completed 5 days ago)
```

---

## API Endpoints to Implement

### Requests
- `GET /api/v1/request` - List requests
- `GET /api/v1/request/:id` - Get request details
- `POST /api/v1/request/:id/approve` - Approve request
- `POST /api/v1/request/:id/decline` - Decline request
- `DELETE /api/v1/request/:id` - Delete request
- `POST /api/v1/request/:id/retry` - Retry request

### Users
- `GET /api/v1/user` - List users
- `GET /api/v1/user/:id` - Get user details
- `GET /api/v1/user/:id/requests` - User's requests
- `GET /api/v1/user/:id/quota` - User's quota

### Issues
- `GET /api/v1/issue` - List issues
- `GET /api/v1/issue/:id` - Get issue details
- `POST /api/v1/issue/:id/comment` - Add comment
- `POST /api/v1/issue/:id/status` - Update status

### Discovery
- `GET /api/v1/discover/movies` - Discover movies
- `GET /api/v1/discover/tv` - Discover TV
- `GET /api/v1/discover/trending` - Trending content
- `GET /api/v1/discover/movies/upcoming` - Upcoming movies

### Settings (Read-only for now)
- `GET /api/v1/settings/main` - Main settings
- `GET /api/v1/status` - System status

---

## Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Request confirmation | Always confirm approve/deny | Safety - prevent accidental approvals |
| User lookup | By username or ID | Flexibility in conversation |
| Discovery integration | Via Overseerr's APIs | Leverages existing TMDB integration |
| Auto-approval rules | Store in config, execute on-demand | No autonomous actions per user preference |

---

## Verification Gate

**Gate 6** - Overseerr Integration:

- [ ] Can list pending requests
- [ ] Can approve a request (sends to Sonarr/Radarr)
- [ ] Can deny a request with reason
- [ ] Can view user list and their request history
- [ ] Can view reported issues
- [ ] Trending/discovery tools return valid results
- [ ] Error handling works (invalid request ID, user not found)
- [ ] Works with both movies and TV requests

---

## Dependencies

- Phase 0050 (polish-extended) must be complete
- Overseerr instance configured and accessible
- Overseerr API key available

---

## Technical Notes

### Authentication

Overseerr uses API key authentication via header:
```typescript
headers: {
  'X-Api-Key': config.overseerr.apiKey,
  'Content-Type': 'application/json'
}
```

### Request Types

Overseerr requests can be:
- Movie requests (type: 'movie')
- TV requests (type: 'tv')

TV requests may be for specific seasons or full series.

### Status Values

Request statuses:
- `1` = Pending
- `2` = Approved
- `3` = Declined
- `4` = Available (completed)

### Integration with Sonarr/Radarr

When a request is approved, Overseerr automatically:
1. Adds to Sonarr/Radarr
2. Starts search for content
3. Updates request status

Our tools should cross-reference with Sonarr/Radarr queue to show download progress.

---

## Testing Checklist

- [ ] Test with movie requests
- [ ] Test with TV show requests (full series)
- [ ] Test with TV show requests (specific seasons)
- [ ] Test approve workflow
- [ ] Test deny workflow with reason
- [ ] Test user quota limits
- [ ] Test issue creation and resolution
- [ ] Test discovery endpoints
- [ ] Test error handling (invalid IDs)
- [ ] Test with no pending requests
