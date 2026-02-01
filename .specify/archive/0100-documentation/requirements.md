# Requirements Checklist: Documentation & Release Prep

**Purpose**: Track completion of all spec requirements
**Created**: 2026-01-31
**Feature**: [spec.md](spec.md)

## Functional Requirements

- [ ] FR-001 README.md includes quick start section (clone to working in 5 min)
- [ ] FR-002 README.md includes Claude Desktop AND Claude Code setup with OS-specific paths
- [ ] FR-003 docs/tools.md documents all 88 MCP tools with name, description, providers, params, example
- [ ] FR-004 docs/tools.md organizes tools by service with semantic/admin/extended tiers
- [ ] FR-005 docs/configuration.md documents all 7 services with config.json, env vars, API key instructions
- [ ] FR-006 docs/configuration.md includes complete env var reference table
- [ ] FR-007 docs/troubleshooting.md covers connection errors, auth, missing providers, timeouts, Claude setup
- [ ] FR-008 docs/examples.md includes 5+ conversation examples (add content, downloads, missing items, cleanup, cross-service)
- [ ] FR-009 CLAUDE.md documents architecture (Plugin Architecture), module pattern, Natural Language First philosophy, Stateless Operation, conventions, adding tools/services
- [ ] FR-010 config.example.json includes all 7 services (add Overseerr, TMDB)
- [ ] FR-011 All documentation uses fake credentials in examples
- [ ] FR-012 Documentation emphasizes Safety by Default: quality defaults to 'hd' in README, tools.md, configuration.md
- [ ] FR-013 README.md links to detailed docs/ guides rather than duplicating

## Non-Functional Requirements

- [ ] NFR-001 Documentation is plain English, sentences under 25 words avg, no unexplained jargon, accessible to non-developers
- [ ] NFR-002 All code examples are valid and syntactically correct
- [ ] NFR-003 No broken internal links between documentation files
- [ ] NFR-004 Tool catalog organized for quick scanning (tables, headers, consistent format)

## Success Criteria

- [ ] SC-001 README quick start guides new user from clone to first tool call
- [ ] SC-002 All 88 MCP tools documented in docs/tools.md
- [ ] SC-003 All 7 services configured in docs/configuration.md
- [ ] SC-004 At least 10 error scenarios in docs/troubleshooting.md
- [ ] SC-005 At least 5 conversation examples in docs/examples.md
- [ ] SC-006 CLAUDE.md provides sufficient agent context
- [ ] SC-007 config.example.json includes all 7 services
- [ ] SC-008 No broken links between documentation files

- [ ] FR-014 All documentation examples audited to verify fake credentials only (no real API keys, hostnames, or tokens)

## Notes

- Check items off as completed: `[x]`
- Add comments or findings inline
- Items are numbered for easy reference in tasks
