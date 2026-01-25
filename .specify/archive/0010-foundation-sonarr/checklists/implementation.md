# Implementation Checklist: Foundation + Sonarr

**Purpose**: Verify implementation quality during development
**Created**: 2025-01-24
**Feature**: [spec.md](../spec.md)

---

## Requirements Completeness

- [ ] I-001 All functional requirements from spec.md have corresponding tasks
- [ ] I-002 All non-functional requirements are addressed
- [ ] I-003 All edge cases from spec.md are handled
- [ ] I-004 Error scenarios return helpful messages

## Code Quality

- [ ] I-010 TypeScript strict mode enabled and passing
- [ ] I-011 All exported functions have explicit return types
- [ ] I-012 No `any` types used (except where unavoidable with external APIs)
- [ ] I-013 Consistent naming conventions (camelCase functions, PascalCase types)
- [ ] I-014 Files under 300 lines each
- [ ] I-015 One major class/function per file

## Tool Implementation

- [ ] I-020 Each tool has clear, semantic name
- [ ] I-021 Each tool has helpful description
- [ ] I-022 Each tool parameter has .describe() annotation
- [ ] I-023 Tool responses use simple text format
- [ ] I-024 Tool errors return user-friendly messages
- [ ] I-025 All 5 semantic tools implemented (tv_*)
- [ ] I-026 All 9 admin tools implemented (sonarr_*)
- [ ] I-027 All 3 cross-service tools implemented

## API Client

- [ ] I-030 All Sonarr API endpoints wrapped in client methods
- [ ] I-031 API errors handled with helpful messages
- [ ] I-032 Network timeouts handled gracefully
- [ ] I-033 Invalid responses handled without crashing

## Configuration

- [ ] I-040 Environment variables take precedence
- [ ] I-041 config.json fallback works
- [ ] I-042 Missing config reports clear error
- [ ] I-043 config.example.json documents all options

## MCP Protocol

- [ ] I-050 Server uses stdio transport
- [ ] I-051 No console.log statements (only console.error for debug)
- [ ] I-052 All tools registered before connect()
- [ ] I-053 Server starts without errors

## Documentation

- [ ] I-060 README includes installation steps
- [ ] I-061 README includes configuration instructions
- [ ] I-062 README includes Claude Desktop config example
- [ ] I-063 README includes Claude Code config example
- [ ] I-064 README lists all available tools

---

## Notes

- Check items as you complete implementation
- All items should be checked before moving to verification
- Reference spec.md for detailed requirements
