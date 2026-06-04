# ECC Standardized Knowledge — Changelog Generation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | Changelog Generation |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

Changelog generation produces a human-readable, sequentially-ordered record of API changes over time. A well-maintained changelog is critical for consumers to plan upgrades, adapt to breaking changes, and discover new capabilities. The most valuable changelogs combine automated accuracy (from spec diff or git history) with human-written migration context.

## Core Concepts

- **Entry types**: Added, Changed, Deprecated, Removed, Fixed, Security.
- **Keep a Changelog format**: Standard markdown format organized by version with categorized entries.
- **Spec diff**: Compare two OpenAPI specs via tools like Redocly CLI to auto-detect additions, removals, changes.
- **Git-based generation**: Conventional Commits (`feat:`, `fix:`, `deprecate:`) auto-generate changelogs.
- **Migration notes**: Breaking changes include step-by-step migration instructions.

## When To Use

- Public APIs consumed by external developers
- APIs with formal versioning and release cycles
- Any API where consumers need to track changes
- APIs in active development with frequent changes

## When NOT To Use

- Internal-only APIs with no external consumers
- Prototype/experimental APIs (changelog overhead exceeds value)
- APIs with a single consumer who coordinates directly with the team

## Best Practices

- **Automated + curated**: Use spec diff or git log as the source of truth, then curate and annotate manually.
- **Every version change documented**: Patches included, not just major versions.
- **Specific change descriptions**: "Fixed incorrect total count in paginated user list" not "Bug fixes."
- **Migration guidance with every breaking change**: Step-by-step instructions for upgrading.
- **ISO 8601 dates and semantic versioning**: Consistent format enables automated tooling.
- **Changelog validation in CI**: Require changelog entry when API routes change.

## Architecture Guidelines

- Host changelog alongside API documentation. Link from homepage and version selector.
- Link to full OpenAPI spec diff from each version entry.
- Provide changelog RSS/Atom feed for programmatic monitoring.
- Validate changelog presence in CI: PRs modifying routes must include changelog entry.
- Maintain per-version changelogs if multiple API versions are active.

## Performance Considerations

- Changelog generation has no runtime impact.
- Spec diff time increases with spec size (5-30 seconds for large specs).

## Security Considerations

- Do not include security vulnerability details before they are patched.
- Security-related entries should use general descriptions until consumers can safely update.

## Common Mistakes

- **Changelog only for major versions**: Consumers miss incremental changes that affect their integration.
- **Vague descriptions**: "Bug fixes and performance improvements" — consumers cannot assess impact.
- **No migration guidance**: Breaking changes documented without how-to-update instructions.
- **Inconsistent date/version format**: Automated tooling cannot parse the changelog reliably.

## Anti-Patterns

- **Changelog only for current version**: Consumers on older versions cannot determine upgrade paths.
- **Changelog drift from spec**: Entry claims a change not matching the actual spec — consumers trust incorrect information.

## Examples

- Keep a Changelog format: `## [2.1.0] - 2026-03-15` with Added/Changed/Deprecated sections.
- Spec diff: `npx @redocly/cli compare openapi-v2.0.0.yaml openapi-v2.1.0.yaml --format markdown`.

## Related Topics

- **Prerequisites**: Semantic Versioning for APIs, API Versioning Strategy
- **Closely Related**: API Version Documentation, Deprecation Notes in Docs, Breaking Change Identification
- **Advanced**: Automated spec diff pipeline, consumer change notification, changelog API endpoint

## AI Agent Notes

When generating changelog: combine automated spec diff with curated human migration notes, document every version (not just majors), include specific descriptions, validate in CI against route changes, provide spec diff links per version.

## Verification

Sources: Keep a Changelog (keepachangelog.com), Conventional Commits, Redocly CLI, domain-analysis.md.
