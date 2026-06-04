# ECC Standardized Knowledge — API Changelog Maintenance

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Lifecycle & Governance |
| Knowledge Unit | API Changelog Maintenance |
| Difficulty | Intermediate |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

API changelog maintenance covers the format, generation, and lifecycle of API change documentation. A well-maintained changelog serves as the single source of truth for what has changed, what is deprecated, and what is coming next. Automation ensures consistency while manual curation ensures readability. The hybrid model (auto-extract from PR descriptions + manual review) balances accuracy with narrative quality.

## Core Concepts

- **Keep a Changelog format**: Standardized sections — Added, Changed, Deprecated, Removed, Fixed, Security.
- **Semantic versioning integration**: Entries grouped by API version/release with tags.
- **Automated generation**: Extraction from commit messages, PR titles, or annotation metadata.
- **Manual curation**: Human review of auto-generated entries for clarity, tone, completeness.
- **Changelog API endpoint**: Machine-readable changelog endpoint for automated tooling.
- **Breaking change markers**: Visual indicators highlighting entries containing breaking changes.

## When To Use

- Every public API with external consumers
- APIs with regular release cycles
- APIs with documented deprecation and versioning policies
- Multi-service architectures needing coordinated change documentation

## When NOT To Use

- Prototype APIs with no external consumers
- Internal-only APIs with a single consumer team
- APIs with no release versioning

## Best Practices

- **PR body as source of truth**: Structured changelog blocks in PR descriptions. CI extracts on merge.
- **Unreleased section**: Track changes not yet in a release — consumers see upcoming changes.
- **Link to migration guides**: Every deprecation entry links to detailed migration documentation.
- **Category sorting**: Sort entries by category (Added > Changed > Deprecated > Removed > Fixed > Security) then by endpoint path.
- **Ticket references**: Link each entry to relevant issue/ticket.
- **CI gating**: Block releases without changelog updates for PRs with API changes.

## Architecture Guidelines

- Store changelog in repository as `CHANGELOG.md` alongside code.
- Per-service changelog + aggregated index for multi-service architectures.
- Publish via developer portal, RSS feed, and JSON endpoint.
- Archive entries older than 2 years to `CHANGELOG-ARCHIVE.md` to keep file under 1 MB.
- JSON changelog endpoint cached at CDN, regenerated on each release.

## Performance Considerations

- CI changelog generation adds negligible time (parse PR body, append to file).
- JSON changelog endpoint cached (CDN or application cache).
- Changelog files kept under 1 MB; older entries archived.

## Security Considerations

- Internal refactoring entries should not be published to public changelog.
- Security fixes documented in changelog after patch is deployed (avoid tipping off attackers).
- Separate internal vs external changelog files.

## Common Mistakes

- Entries only developers understand (avoid jargon).
- Forgetting to update changelog before release — enforce via CI gating.
- Including internal refactoring with no consumer impact.
- Using vague language like "improved performance" without specifics.
- Not linking to migration guides for deprecation entries.

## Anti-Patterns

- **Fully automated changelog with no review**: Technically correct but lacks narrative flow.
- **Manual-only changelog**: Inconsistent timing and coverage.
- **Changelog as an afterthought**: Updated only when someone remembers.

## Examples

- Entry format: `### Added - POST /v2/orders - New bulk order creation endpoint. (#1423)`.
- Unreleased section: `[Unreleased] - Added ... - Changed ...`.
- Breaking change marker: `### Changed [BREAKING] - Response format for GET /users pagination metadata updated.`

## Related Topics

- **Prerequisites**: Backward Compatibility Policy, Deprecation Policy Design
- **Closely Related**: API Style Guide Documentation, Breaking Change Process
- **Advanced**: Automated OpenAPI-to-changelog diff generation, Changelog RSS/Atom feed, Consumer changelog subscription system

## AI Agent Notes

When maintaining API changelogs: use Keep a Changelog format, auto-extract from PR descriptions + manual review, include Unreleased section, link deprecation entries to migration guides, gate releases on changelog updates in CI, categorize and sort entries consistently.

## Verification

Sources: Keep a Changelog v1.1.0, Stripe changelog, GitHub API Changes page, domain-analysis.md.
