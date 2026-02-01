# Feature Specification: Documentation & Release Prep

**Feature Branch**: `0100-documentation`
**Created**: 2026-01-31
**Status**: Draft
**Input**: Phase 0100 - Documentation & Release Prep

## User Scenarios & Testing

### User Story 1 - Quick Start Setup (Priority: P1)

A new user discovers arrs-mcp-server and wants to get it working with their existing media stack as quickly as possible. They have at least one *arr service running and want to verify it works with Claude.

**Why this priority**: First-time user experience is the most critical path. If users can't get started, nothing else matters.

**Independent Test**: Can be tested by following README from scratch with a single Sonarr or Radarr instance.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repo, **When** user follows README quick start, **Then** they can run the MCP server and interact with at least one service within 5 minutes
2. **Given** user has Sonarr running, **When** they configure just Sonarr, **Then** tv_search and tv_list work correctly
3. **Given** user has multiple services, **When** they add all to config, **Then** all configured services are accessible

---

### User Story 2 - Tool Reference Lookup (Priority: P1)

A user wants to know what tools are available for a specific service (e.g., "What can I do with Plex?") and how to use a specific tool with its parameters.

**Why this priority**: Equally critical as setup - users need to discover and understand tools to use the product.

**Independent Test**: Can be tested by looking up any tool in docs/tools.md and verifying description, parameters, and example match the actual tool behavior.

**Acceptance Scenarios**:

1. **Given** docs/tools.md exists, **When** user searches for a service name, **Then** they find all tools for that service with descriptions and parameters
2. **Given** a tool entry in the catalog, **When** user reads the example, **Then** the example shows a realistic usage pattern with expected output format
3. **Given** a user is unsure which tool to use, **When** they browse by service category, **Then** semantic tools are clearly distinguished from admin/extended tools

---

### User Story 3 - Configuration Reference (Priority: P2)

A user needs to configure additional services or troubleshoot configuration issues. They need a complete reference of all configuration options.

**Why this priority**: Users will configure services after initial setup - important but secondary to quick start.

**Independent Test**: Can be tested by configuring any service using only the configuration guide.

**Acceptance Scenarios**:

1. **Given** docs/configuration.md exists, **When** user looks up a service, **Then** they find URL, API key, env var names, and config.json format
2. **Given** user needs an API key, **When** they read the "Finding API Keys" section, **Then** they find step-by-step instructions for each service
3. **Given** user wants env vars, **When** they read the env var table, **Then** all 14 env vars are listed with descriptions

---

### User Story 4 - Troubleshooting Issues (Priority: P2)

A user encounters an error (connection refused, 401 unauthorized, timeout, etc.) and needs to resolve it.

**Why this priority**: Error resolution is critical for retention but happens less frequently than initial setup.

**Independent Test**: Can be tested by matching a known error message to its troubleshooting entry.

**Acceptance Scenarios**:

1. **Given** user gets "ECONNREFUSED", **When** they look up the error in docs/troubleshooting.md, **Then** they find cause, fix steps, and verification
2. **Given** user gets "Provider not configured", **When** they read the troubleshooting entry, **Then** they learn to use providers_status() and add the missing service
3. **Given** user's tools don't appear in Claude, **When** they check the Claude Desktop/Code setup section, **Then** they find a step-by-step debugging checklist

---

### User Story 5 - Real Workflow Examples (Priority: P3)

A user wants to see how real conversations with Claude look when using arrs-mcp-server for common tasks like adding shows, checking downloads, or cleaning up their library.

**Why this priority**: Examples enhance understanding but aren't blocking for basic usage.

**Independent Test**: Can be tested by reading any example and verifying the conversation flow makes sense.

**Acceptance Scenarios**:

1. **Given** docs/examples.md exists, **When** user reads "Adding a TV Show", **Then** they see the full conversation flow with tool calls and responses
2. **Given** user reads a workflow example, **When** they try the same interaction, **Then** the tool calls and output format match what's documented
3. **Given** user wants complex workflows, **When** they read multi-step examples (cleanup, collection completion), **Then** they understand how tools chain together

---

### User Story 6 - Agent Development Guide (Priority: P3)

A developer (or Claude agent) wants to contribute to or modify arrs-mcp-server and needs to understand the project architecture, patterns, and conventions.

**Why this priority**: Developer documentation supports future development but isn't user-facing.

**Independent Test**: Can be tested by a developer reading CLAUDE.md and successfully adding a new tool following the documented pattern.

**Acceptance Scenarios**:

1. **Given** CLAUDE.md exists at project root, **When** a developer reads it, **Then** they understand the project architecture, module pattern, and code conventions
2. **Given** a developer wants to add a new tool, **When** they follow the "Adding a New Tool" section, **Then** the steps are clear and complete
3. **Given** Claude Code opens the project, **When** it reads CLAUDE.md, **Then** it has sufficient context to make correct architectural decisions

---

### Edge Cases

- What happens when user has no services configured? (Docs should explain minimum 1 service required)
- What happens when config.json has invalid JSON? (Troubleshooting should cover this)
- What happens when API key is rotated? (Config guide should mention restart requirement)
- What about Docker users? (Should mention config via env vars for containers)
- What about users on Windows/Linux? (Claude Desktop config path differs by OS)

## Requirements

### Functional Requirements

- **FR-001**: README.md MUST include a quick start section that gets users from clone to working in under 5 minutes
- **FR-002**: README.md MUST include Claude Desktop AND Claude Code setup instructions with OS-specific config paths
- **FR-003**: docs/tools.md MUST document all 88 registered MCP tools with name, description, required providers, parameters, and usage example
- **FR-004**: docs/tools.md MUST organize tools by service and distinguish semantic vs admin vs extended tiers
  - _Note: Semantic = natural language tools (tv_search, movie_add); Admin = service-specific operations (sonarr_queue, radarr_details); Extended = advanced/discovery tools (system_health, library_audit). When classifying borderline tools, use the comment section headers in each tools.ts file as source of truth._
- **FR-005**: docs/configuration.md MUST document all 7 services (Sonarr, Radarr, Radarr4K, Plex, Sabnzbd, Overseerr, TMDB) with config.json format, env var names, and API key finding instructions
- **FR-006**: docs/configuration.md MUST include a complete env var reference table (14 variables: SONARR_URL, SONARR_API_KEY, RADARR_URL, RADARR_API_KEY, RADARR4K_URL, RADARR4K_API_KEY, PLEX_URL, PLEX_TOKEN, SABNZBD_URL, SABNZBD_API_KEY, OVERSEERR_URL, OVERSEERR_API_KEY, TMDB_API_KEY, CONFIG_PATH)
- **FR-007**: docs/troubleshooting.md MUST cover at minimum: connection errors, auth failures, missing providers, timeout issues, and Claude Desktop/Code setup problems
- **FR-008**: docs/examples.md MUST include at least 5 conversation examples covering: adding content, checking downloads, finding missing items, cleanup workflows, and cross-service operations
- **FR-009**: CLAUDE.md MUST document project architecture (Plugin Architecture principle), module pattern, Natural Language First design philosophy, Stateless Operation principle, code conventions, and how to add new tools/services
- **FR-010**: config.example.json MUST include all 7 services (currently missing Overseerr and TMDB)
- **FR-011**: All documentation MUST use realistic but fake credentials in examples
- **FR-012**: Documentation MUST emphasize Safety by Default: quality defaults to 'hd' in README features section, tools.md quality parameter docs, and configuration.md Radarr section
- **FR-013**: README.md MUST link to detailed docs/ guides rather than duplicating content
- **FR-014**: All documentation examples MUST be audited to verify fake credentials only (no real API keys, URLs with real hostnames, or tokens)

### Non-Functional Requirements

- **NFR-001**: Documentation MUST be written in plain English with sentences averaging under 25 words, avoiding jargon without explanation, and accessible to non-developers
- **NFR-002**: All code examples MUST be valid and syntactically correct
- **NFR-003**: Documentation MUST have no broken internal links
- **NFR-004**: Tool catalog MUST be organized for quick scanning (tables, headers, consistent format)

### Key Entities

- **Tool Entry**: Name, description, required providers, parameters (name, type, required, description), example usage, example output
- **Configuration Entry**: Service name, config.json format, environment variables, API key location instructions
- **Troubleshooting Entry**: Error message/symptom, cause, fix steps, verification

## Success Criteria

### Measurable Outcomes

- **SC-001**: README quick start section can guide a new user from clone to first tool call with only one service configured
- **SC-002**: All 88 MCP tools are documented in docs/tools.md with accurate parameters
- **SC-003**: All 7 services have configuration entries in docs/configuration.md
- **SC-004**: At least 10 error scenarios are covered in docs/troubleshooting.md including: ECONNREFUSED, 401/403 auth failures, missing provider config, timeouts, invalid JSON config, Claude Desktop setup, Claude Code setup, missing API keys, rate limiting, and service unavailability
- **SC-005**: At least 5 conversation examples demonstrate different workflow patterns
- **SC-006**: CLAUDE.md provides sufficient context for an agent to understand the project architecture
- **SC-007**: config.example.json includes all 7 services
- **SC-008**: No broken links exist between documentation files
