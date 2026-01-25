# Phase 0100: Telegram Notifications

**Status**: Not Started
**Branch**: `0100-telegram-notifications`
**Estimated Scope**: Medium (leveraging existing bot infrastructure)

---

## Goals

1. Request lifecycle notifications (new request, approved, available)
2. Proactive maintenance alerts (storage warnings, stuck imports)
3. Smart alerts (content ready, new season available)
4. Custom notification triggers
5. Digest mode (daily/weekly summaries)
6. Integration with existing Sonarr/Radarr Telegram setup

---

## Scope

### In Scope

- Direct Telegram Bot API integration
- Notification preferences and filtering
- Configurable alert thresholds
- Digest/summary generation
- Rich message formatting (inline buttons, media previews)
- Integration with audit log for event triggers

### Out of Scope

- Other notification channels (Discord, Slack, email)
- Two-way bot interaction (commands back to MCP)
- Push notification infrastructure (mobile apps)
- Notification history persistence beyond audit log

---

## Deliverables

### 1. Service Structure

```
src/services/telegram/
├── client.ts      # Telegram Bot API client
├── types.ts       # TypeScript interfaces
├── tools.ts       # MCP tool registrations
├── templates.ts   # Message templates
└── index.ts       # Exports
```

### 2. Notification Types

#### Request Lifecycle
| Event | Trigger | Message |
|-------|---------|---------|
| New Request | Overseerr webhook or poll | "New request: {title} from {user}" |
| Request Approved | After approve action | "Approved: {title} - downloading" |
| Request Available | Content added to Plex | "Ready to watch: {title}" |
| Request Denied | After deny action | "Denied: {title} - {reason}" |

#### Maintenance Alerts
| Event | Trigger | Message |
|-------|---------|---------|
| Storage Warning | 80/90/95% thresholds | "Storage at {percent}% - {free} remaining" |
| Stuck Import | Detected by health check | "{count} stuck imports need attention" |
| Service Down | Health check failure | "{service} is unreachable" |
| Failed Download | Sabnzbd failure | "Download failed: {title}" |

#### Smart Alerts
| Event | Trigger | Message |
|-------|---------|---------|
| Content Ready | New Plex addition | "Added to library: {title}" |
| New Season | Sonarr calendar + available | "New season of {show} available" |
| Collection Update | Discovery phase detection | "New MCU movie available: {title}" |

#### Digests
| Type | Frequency | Content |
|------|-----------|---------|
| Daily Digest | Configurable time | Requests summary, downloads, new content |
| Weekly Digest | Configurable day/time | Storage trends, watch stats, recommendations |

### 3. Notification Tools

| Tool | Description |
|------|-------------|
| `notify_send` | Send a custom notification |
| `notify_test` | Send a test message to verify setup |
| `notify_preferences` | View/update notification preferences |
| `notify_mute` | Temporarily mute notifications |
| `notify_unmute` | Resume notifications |
| `notify_digest` | Generate and send a digest now |

### 4. Message Templates

**Request notification:**
```
🎬 New Request

*Title:* Dune: Part Three (2026)
*Requested by:* john_doe
*Type:* Movie

[Approve] [Deny] [View Details]
```

**Storage warning:**
```
⚠️ Storage Warning

Your media storage is at *85%* capacity.

📊 Usage: 10.2 TB / 12 TB
📉 Free: 1.8 TB
📈 Trend: +45 GB/week

At current rate, storage will be full in ~6 weeks.

Consider running cleanup to free space.
```

**Daily digest:**
```
📊 Daily Media Digest - Jan 25, 2026

*New Requests:* 3
  • Dune: Part Three (pending)
  • The Bear S4 (approved)
  • Severance S3 (downloading)

*Downloads:* 5 completed, 2 in progress
  • The Last of Us S02E03 ✓
  • Oppenheimer ✓
  • ...

*Added to Library:* 4 items
  • The Last of Us S02E03
  • ...

*Storage:* 85% (1.8 TB free)

[View Full Report]
```

### 5. Example Workflows

**Configure notifications:**
```typescript
// User: "Set up Telegram notifications"
notify_test()
// Response:
// Test notification sent to Telegram.
// Check your chat to confirm receipt.

notify_preferences({
  requests: {
    new_request: true,
    approved: true,
    available: true,
    denied: false
  },
  maintenance: {
    storage_warning: { enabled: true, thresholds: [80, 90, 95] },
    stuck_imports: true,
    service_down: true
  },
  content: {
    new_additions: false,  // Too noisy
    new_seasons: true
  },
  digest: {
    daily: { enabled: true, time: '09:00' },
    weekly: { enabled: true, day: 'sunday', time: '10:00' }
  }
})
// Response:
// Notification preferences updated.
//
// Enabled:
// ✓ New requests, approvals, availability
// ✓ Storage warnings (80%, 90%, 95%)
// ✓ Stuck imports, service outages
// ✓ New seasons
// ✓ Daily digest at 9:00 AM
// ✓ Weekly digest on Sunday at 10:00 AM
//
// Disabled:
// ✗ Request denials
// ✗ All new library additions
```

**Send custom notification:**
```typescript
// User: "Send a notification that the movie night picks are ready"
notify_send({
  message: "Movie Night picks are ready! Check Plex for this week's selection.",
  priority: 'normal'
})
// Response:
// Notification sent to Telegram.
```

**Mute temporarily:**
```typescript
// User: "Mute notifications for 2 hours"
notify_mute({ duration: '2h' })
// Response:
// Notifications muted for 2 hours.
// Will resume at 3:45 PM.
//
// Critical alerts (service down) will still be sent.
```

---

## Telegram Bot API Integration

### Setup

1. Create bot via @BotFather
2. Get bot token
3. Get chat ID (user or group)
4. Configure in config.json

### API Endpoints Used

```typescript
const TELEGRAM_API = 'https://api.telegram.org/bot{token}';

// Send message
POST /sendMessage
{
  chat_id: string,
  text: string,
  parse_mode: 'MarkdownV2',
  reply_markup?: InlineKeyboardMarkup
}

// Send photo (for media previews)
POST /sendPhoto
{
  chat_id: string,
  photo: string,  // URL
  caption: string
}
```

### Message Formatting

Use MarkdownV2 for rich formatting:
```typescript
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
```

---

## Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Bot approach | Direct API, not webhook | Simpler for MCP, no server needed |
| Message format | MarkdownV2 | Rich formatting support |
| Critical alerts | Always send | Safety - service down shouldn't be silenced |
| Rate limiting | Max 30 msg/sec | Telegram API limit |
| Digest storage | Generate on demand | No persistent scheduling needed |

---

## Configuration

```json
{
  "telegram": {
    "botToken": "123456:ABC-DEF...",
    "chatId": "-1001234567890",
    "enabled": true
  }
}
```

Optional: Multiple chat IDs for different notification types.

---

## Verification Gate

**Gate 10** - Telegram Notifications:

- [ ] Test message sends successfully
- [ ] New request notification works
- [ ] Request approved notification works
- [ ] Storage warning triggers at threshold
- [ ] Daily digest generates and sends
- [ ] Mute/unmute works correctly
- [ ] Critical alerts bypass mute
- [ ] Message formatting renders correctly
- [ ] Inline buttons work (if implemented)

---

## Dependencies

- Phase 0090 (library-intelligence) should be complete
- Telegram bot created and configured
- Chat ID obtained

---

## Technical Notes

### Event Detection

Two approaches for event detection:

1. **Poll-based**: Periodic checks via MCP tools
   - Health check detects storage/stuck imports
   - Plex recently added detects new content
   - Works without webhooks

2. **Audit log based**: React to logged actions
   - Approve action triggers notification
   - Add action triggers notification
   - Requires audit log integration

### Digest Generation

```typescript
async function generateDailyDigest(): Promise<string> {
  const [requests, downloads, additions, storage] = await Promise.all([
    getRecentRequests(24),
    getRecentDownloads(24),
    getRecentAdditions(24),
    getStorageStatus(),
  ]);

  return formatDigest({ requests, downloads, additions, storage });
}
```

### Scheduling

MCP doesn't have built-in scheduling. Options:

1. **External scheduler**: Cron job calls MCP endpoint
2. **On-demand**: User triggers `notify_digest()`
3. **Pseudo-scheduling**: Check on each relevant tool call if digest is due

Recommend: On-demand + pseudo-scheduling.

---

## Testing Checklist

- [ ] Bot token validates
- [ ] Test message sends to correct chat
- [ ] Markdown formatting renders
- [ ] Storage warning at 80% threshold
- [ ] Daily digest includes all sections
- [ ] Mute prevents non-critical notifications
- [ ] Unmute resumes notifications
- [ ] Rate limiting prevents spam
- [ ] Error handling for API failures
- [ ] Graceful degradation if Telegram unavailable
