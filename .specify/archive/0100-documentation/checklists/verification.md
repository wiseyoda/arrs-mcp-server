# Verification Checklist: Documentation & Release Prep

**Purpose**: Post-implementation verification for documentation quality and accuracy
**Created**: 2026-01-31
**Feature**: [spec.md](../spec.md)

## Acceptance Criteria Quality

- [x] V-001 README quick start tested: clone → build → configure → run → first tool call works
- [x] V-002 Claude Desktop config JSON is valid and complete
- [x] V-003 Claude Code config JSON is valid and complete
- [x] V-004 All tool names in docs/tools.md match actual registered tool names
- [x] V-005 All tool parameters in docs/tools.md match actual zod schemas
- [x] V-006 All provider requirements per tool are accurate
- [x] V-007 All env var names match actual env vars in src/config.ts
- [x] V-008 config.example.json is valid JSON (parseable by `JSON.parse()`)
- [x] V-009 Each troubleshooting entry has: symptom, cause, and actionable fix steps
- [x] V-010 Each example conversation uses correct tool names and realistic parameters

## Non-Functional Requirements

- [x] V-011 Documentation reads clearly to a non-developer audience
- [x] V-012 All markdown code blocks have correct language tags (json, bash, typescript)
- [x] V-013 No broken internal links (README → docs/, docs/ cross-refs)
- [x] V-014 Tables render correctly in GitHub markdown preview
- [x] V-015 Consistent heading levels across all documents
- [x] V-016 Consistent formatting: tool names in backticks, service names capitalized

## Phase Goal Verification

- [x] V-017 Goal 1: README.md is comprehensive and user-friendly with working quick start
- [x] V-018 Goal 2: docs/tools.md catalogs all 88 tools with examples
- [x] V-019 Goal 3: docs/configuration.md covers all 7 services with all options
- [x] V-020 Goal 4: docs/troubleshooting.md covers 10+ common issues
- [x] V-021 Goal 5: docs/examples.md has 5+ realistic conversation workflows
- [x] V-022 Goal 6: CLAUDE.md provides complete development context

## Content Accuracy

- [x] V-023 Tool count verified: check that actual registered tools match documented count
- [x] V-024 Service count verified: all 7 services (Sonarr, Radarr, Radarr4K, Plex, Sabnzbd, Overseerr, TMDB)
- [x] V-025 Default ports match actual defaults per service
- [x] V-026 API key locations match actual service UI paths
- [x] V-027 CLAUDE.md architecture matches actual project structure
- [x] V-028 Module pattern description matches actual code patterns

## Safety & Security

- [x] V-029 No real API keys or tokens in any documentation file
- [x] V-030 4K safety (quality defaults to 'hd') prominently documented
- [x] V-031 Destructive operations have appropriate warnings
- [x] V-032 config.json and .env mentioned as gitignored

## Cross-Document Consistency

- [x] V-033 Tool names consistent between README, tools.md, and examples.md
- [x] V-034 Configuration format consistent between README, configuration.md, and config.example.json
- [x] V-035 Service names and descriptions consistent across all documents
- [x] V-036 Terminology matches glossary.md definitions

## Notes

- Verify items during and after implementation
- Items numbered V-### for cross-reference
- Mark items with date when verified
