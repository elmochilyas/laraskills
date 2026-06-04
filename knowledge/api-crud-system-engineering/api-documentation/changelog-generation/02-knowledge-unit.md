# Changelog Generation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Documentation
- **Knowledge Unit:** Changelog Generation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Changelog generation is the process of producing a human-readable, sequentially-ordered record of API changes over time. An API changelog documents new endpoints, modified request/response schemas, deprecated features, removed functionality, and bug fixes — each entry linked to the relevant API version.

A well-maintained changelog is critical for API consumers to plan upgrades, adapt to breaking changes, and discover new capabilities. Changelogs can be generated manually (maintained in a CHANGELOG.md), extracted from git history (via conventional commits), or derived from OpenAPI spec diffs (comparing two spec versions). In Laravel APIs, the changelog is often published alongside the documentation and linked from endpoint descriptions.

---

## Core Concepts

### Changelog Entry Types
- **Added** — New endpoints, new parameters, new response fields
- **Changed** — Modified behavior, changed schemas, new required fields
- **Deprecated** — Endpoints or fields marked for removal
- **Removed** — Endpoints or fields that no longer exist
- **Fixed** — Bug fixes affecting API behavior
- **Security** — Security-related changes

### Keep a Changelog Format
The recommended format follows [keepachangelog.com](https://keepachangelog.com):

```markdown
# Changelog

## [2.1.0] - 2026-03-15

### Added
- `POST /api/users/export` — Export users as CSV
- `include` parameter on `GET /api/users` for related resources

### Changed
- `GET /api/users` now returns paginated results by default
- `UserResource` now includes `updated_at` field

### Deprecated
- `GET /api/users/list` — use `GET /api/users` instead

## [2.0.0] - 2026-01-10

### Added
- New API v2 with URL prefix `/api/v2/`

### Removed
- Removed `GET /api/v1/users/export` endpoint
```

### OpenAPI Spec Diff
Automated changelog generation by comparing OpenAPI specs:

```bash
openapi-diff openapi-v2.0.0.yaml openapi-v2.1.0.yaml
```

Tools like `openapi-diff` (Redocly) and `openapi-diff` (OpenAPI Tools) compare two specs and produce a machine-readable diff that can be formatted as a changelog.

---

## Mental Models

### Changelog as Consumer Upgrade Guide
The changelog answers "What do I need to do to upgrade from version X to version Y?" Each entry should tell the consumer what changed and whether action is required.

### Spec Diff → Human Changelog
Automated change detection produces a machine-readable diff (added paths, removed properties, changed constraints). The human changelog is a curated, explained subset of this diff — grouping related changes, adding context, and omitting irrelevant noise.

### Version Boundary Entries
A changelog is organized by version boundaries. Each version section documents everything that changed since the previous version. The diff between the two versions is the raw material for the changelog.

---

## Internal Mechanics

### Manual Changelog Maintenance
```markdown
## [1.2.0] - 2026-06-02

### Added
- `POST /api/posts/{post}/comments` — Add comment to post
- `GET /api/posts/{post}/comments` — List comments on a post

### Changed
- `GET /api/posts` now supports `?sort=created_at` parameter
- Comment count included in `PostResource`
```

### Git-Based Generation (Conventional Commits)
Using conventional commit prefixes to auto-generate changelogs:

```bash
# Conventional commit messages
feat: add comment endpoints
feat(api): add sort parameter to posts list
fix(api): return correct total count in pagination
deprecate: deprecate /api/posts/list endpoint

# Generation
npx conventional-changelog -p conventionalcommits -i CHANGELOG.md -s
```

### OpenAPI Diff Changelog
Automated spec comparison:

```bash
npx @redocly/cli compare openapi-v1.yaml openapi-v2.yaml --format markdown > changelog.md
```

The diff output categorizes changes into:
- **Additions** — New paths, new schemas, new parameters
- **Removals** — Deleted paths, removed properties
- **Changes** — Modified schemas, changed constraints, new required fields
- **Deprecations** — Endpoints or fields marked deprecated

### Integration with Doc Generators
Scramble and Scribe do not generate changelogs natively. Changelogs are maintained separately and linked from documentation. Some teams embed changelog snippets in endpoint descriptions.

---

## Patterns

### Changelog in Documentation UI
Host the changelog alongside API documentation. Link from:
- The documentation homepage
- Endpoint descriptions (for recently changed endpoints)
- The API version selector

### Version Comparison from Changelog
For each version entry, provide a link to the full OpenAPI spec diff:

```markdown
## [2.1.0] - 2026-03-15

Full spec diff: `openapi-diff v2.0.0 v2.1.0`

### Added
...
```

### Migration Notes Per Entry
For breaking changes, include migration instructions directly in the changelog:

```markdown
### Changed
- `GET /api/users` now requires `page` parameter (previously defaulted to 1)
  **Migration:** Add `?page=1` to existing requests
```

### Changelog Feed
Provide a changelog RSS/Atom feed or webhook notification for consumers who want to monitor API changes programmatically.

---

## Architectural Decisions

### Manual vs Automated Generation
Manual changelogs provide human context and migration guidance but require discipline. Automated (git-based or spec-diff-based) changelogs are always accurate but lack context. Decision: Use automated diff as the source of truth, then curate and annotate manually.

### Changelog Location
Options: Standalone `CHANGELOG.md` in the repository, embedded in the documentation site, or a dedicated changelog API endpoint (`GET /changelog`). Best practice: Host on the documentation site and maintain the source in the repository.

### Granularity Level
Should each endpoint change get its own entry, or should related changes be grouped? Grouped entries (by feature or area) are more readable but less precise. Decision: Group minor changes; document breaking changes individually.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Automated changelogs save time | Lack human context and migration guidance | Curate automated output manually |
| Manual changelogs provide context | Requires discipline to maintain | Automate reminders in PR workflow |
| Spec-diff changelogs are accurate | Requires versioned OpenAPI specs | Store specs per API version |
| Changelog feeds enable monitoring | Additional infrastructure to maintain | RSS feeds are simple to implement |

---

## Performance Considerations

### N/A
Changelog generation has no runtime performance impact.

---

## Production Considerations

### Changelog in CI Pipeline
Validate that PRs include changelog entries for public API changes:

```bash
# CI check: require changelog entry for API changes
if git diff --name-only $BASE..$HEAD | grep -q "routes/"; then
  if ! grep -q "$VERSION" CHANGELOG.md; then
    echo "Changelog entry required for route changes"
    exit 1
  fi
fi
```

### Changelog Versioning
The changelog should track the API version, not the application version. Maintain separate changelogs for different API versions if multiple versions are active.

### Publishing Changelog
Publish changelog updates alongside API releases. Include the changelog link in deployment notifications and release announcements.

---

## Common Mistakes

### Changelog Only for Major Versions
Why it happens: Minor and patch changes seem insignificant. Why it's harmful: Consumers miss incremental changes that affect their integration. Better approach: Document every version change, including patches.

### Vague Change Descriptions
Why it happens: "Bug fixes and performance improvements." Why it's harmful: Consumers cannot determine whether the change affects them. Better approach: Be specific: "Fixed incorrect total count in paginated user list."

### No Migration Guidance
Why it happens: Breaking changes are documented without how-to-update instructions. Why it's harmful: Consumers must reverse-engineer the migration path. Better approach: Include specific migration steps for every breaking change.

### Inconsistent Date/Version Format
Why it happens: Manual maintenance without format enforcement. Why it's harmful: Automated tooling cannot parse the changelog reliably. Better approach: Use ISO 8601 dates and semantic versioning consistently.

---

## Failure Modes

### Missing Changelog Entry
A breaking change is deployed without a changelog entry. Failure mode: Consumers encounter unexpected failures and cannot determine the cause. Mitigation: Automated changelog validation in CI.

### Stale Changelog for Old Versions
The changelog is maintained only for the current API version. Failure mode: Consumers on older versions cannot determine upgrade paths. Mitigation: Maintain historical changelog entries for all supported versions.

### Changelog Drift from Spec
The changelog claims a change that does not match the current spec or code. Failure mode: Consumers trust the changelog and prepare for changes that were not actually implemented. Mitigation: Validate changelog entries against spec diff in CI.

---

## Ecosystem Usage

### Stripe Changelog
Stripe maintains a detailed, dated changelog organized by month. Each entry includes the affected API version, API resource, change type, and migration instructions. Stripe also offers a changelog RSS feed and email notifications.

### GitHub Changelog
GitHub's API changelog is organized by date with clear "breaking changes" callouts. Each entry links to the relevant documentation and includes code examples for migration.

### Twilio Changelog
Twilio publishes an API changelog with version numbers, dates, and categorized changes. Breaking changes are highlighted prominently. Twilio also provides a changelog API endpoint for programmatic access.

---

## Related Knowledge Units

### Prerequisites
- Semantic Versioning for APIs — Version numbers that communicate change severity
- API Versioning Strategy — Which changes trigger a version bump

### Related Topics
- API Version Documentation — Documenting versioned API artifacts
- Deprecation Notes in Docs — Marking deprecated endpoints in documentation
- Breaking Change Identification — Detecting changes between spec versions

### Advanced Follow-up Topics
- Automated Spec Diff Pipeline — CI workflow for comparing OpenAPI spec versions
- Consumer Change Notification — Email/webhook notification of API changes
- Changelog API Endpoint — Serving changelog as a machine-readable API

---

## Research Notes

### Source Analysis
- Keep a Changelog: https://keepachangelog.com — Standard changelog format
- Conventional Commits: https://www.conventionalcommits.org — Git commit format for automated changelogs
- Redocly OpenAPI Diff: https://redocly.com/docs/cli/commands/lint/ — Spec comparison tool

### Key Insight
The most valuable changelogs combine automated accuracy (from spec diff or git history) with human-written context (migration guidance, reasons for change). Neither approach alone is sufficient.

### Version-Specific Notes
- OpenAPI Diff v1.0+: Breaking/Non-breaking classification output
- conventional-changelog v3+: Conventional Commits integration
- Laravel 11: No built-in changelog generation; relies on external tooling
