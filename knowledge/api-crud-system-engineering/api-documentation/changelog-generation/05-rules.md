# Phase 5: Rules — Changelog Generation

## Document Every Version Release Including Patches
---
## Category
Documentation
---
## Rule
Create a changelog entry for every released version — major, minor, and patch — with categorized changes (Added, Changed, Deprecated, Removed, Fixed, Security).
---
## Reason
Consumers rely on patch-level changelogs to assess whether a hotfix affects their integration. Skipping minor or patch releases forces consumers to diff specs or guess what changed between two arbitrary versions.
---
## Bad Example
```markdown
## [2.0.0] - 2026-01-15
...

## [1.0.0] - 2025-06-01
```
Versions 1.1.0, 1.2.0, 1.2.1 are missing.
---
## Good Example
```markdown
## [2.1.0] - 2026-03-15
### Added
- POST /users/export endpoint
### Fixed
- Incorrect total count in paginated user list
```
---
## Exceptions
Internal-only APIs with no external consumers.
---
## Consequences Of Violation
Consumers cannot assess impact of minor/patch updates; trust in release process erodes; upgrade decisions are deferred indefinitely.
---

## Combine Automated Spec Diff With Curated Migration Notes
---
## Category
Reliability
---
## Rule
Generate changelog entries by diffing the previous and current OpenAPI specs with automated tooling, then manually annotate each breaking change with migration instructions.
---
## Reason
Pure automation produces precise but context-free change lists. Pure manual curation misses subtle changes that automation catches. Combining both ensures accuracy and usefulness.
---
## Bad Example
```markdown
### Changed
- Updated user endpoint
```
(Vague, no spec-level precision.)
---
## Good Example
```markdown
### Changed
- `POST /users` response: `name` field split into `first_name` and `last_name`
  Migration: concatenate `first_name` and `last_name` for display.
  Previously sent `"name": "John Doe"`, now sends `"first_name": "John", "last_name": "Doe"`.
```
(Generated via `npx @redocly/cli compare openapi-v2.0.0.yaml openapi-v2.1.0.yaml` then curated.)
---
## Exceptions
No common exceptions. Both automated and manual steps are essential.
---
## Consequences Of Violation
Consumers miss subtle breaking changes not caught by manual review; automated-only changelogs lack migration context.
---

## Validate Changelog Presence In CI For Route Changes
---
## Category
Testing
---
## Rule
Block pull requests that modify API routes unless they include a corresponding changelog entry.
---
## Reason
Without CI enforcement, changelog entries are forgotten until release time, resulting in incomplete release notes and surprised consumers. Route changes are a reliable proxy for consumer-impacting changes.
---
## Bad Example
A PR adds `/api/v2/users/export` with no changelog entry. CI passes. The release ships without consumers knowing about the new endpoint.
---
## Good Example
```yaml
# CI workflow step
- name: Check changelog for route changes
  run: |
    if git diff --name-only ${{ github.event.pull_request.base.sha }} | grep -q "routes/"; then
      if ! grep -q "$(date +%Y-%m-%d)" CHANGELOG.md; then
        echo "Add a changelog entry for route changes"
        exit 1
      fi
    fi
```
---
## Exceptions
Internal route refactors with no external behavioral change.
---
## Consequences Of Violation
Changelogs become incomplete; consumers are not notified of new capabilities; documentation trust degrades.
---

## Use Specific Descriptions Not Generic Categories
---
## Category
Documentation
---
## Rule
Write changelog entries describing the specific behavioral change, not a generic category label. Include the endpoint path, what changed, and the consumer impact.
---
## Reason
"Bug fixes and performance improvements" tells consumers nothing about whether they need to update their integration or can safely deploy. Specific descriptions enable accurate upgrade impact assessment.
---
## Bad Example
```markdown
- Fixed bugs
- Performance improvements
```
---
## Good Example
```markdown
- Fixed incorrect total count in paginated GET /api/users response when filtering by role
- Reduced p95 latency for GET /api/posts from 450ms to 120ms by introducing database read-replicas
```
---
## Exceptions
Patch releases with only internal refactors that have zero consumer-facing changes.
---
## Consequences Of Violation
Consumers cannot assess upgrade risk; changelog becomes noise; consumers stop reading it.
---

## Link To Full OpenAPI Spec Diff Per Version
---
## Category
Documentation
---
## Rule
Include a link to the machine-readable OpenAPI spec diff alongside each version entry in the changelog.
---
## Reason
Human-written changelog entries inevitably omit edge-case changes or minutiae. A linked spec diff allows power users to verify all changes independently and build automated migration tooling.
---
## Bad Example
```markdown
## [2.1.0] - 2026-03-15
- Changed user response schema
```
(No way to see the exact schema difference.)
---
## Good Example
```markdown
## [2.1.0] - 2026-03-15
- Split `name` into `first_name` and `last_name`
  [View full spec diff](/diffs/v2.0.0-v2.1.0.md)
```
---
## Exceptions
No common exceptions. Always link the diff.
---
## Consequences Of Violation
Power consumers cannot verify completeness of changelog; edge-case changes go unnoticed until runtime.
---

## Never Remove Historical Changelog Entries
---
## Category
Maintainability
---
## Rule
Retain all changelog entries for every released version, including deprecated and sunset versions, in reverse chronological order.
---
## Reason
Consumers on older versions need historical entries to understand the upgrade path. Removing old entries forces consumers to archive their own copies or guess at past changes.
---
## Bad Example
```markdown
# Changelog (current version only)
## [2.1.0] - 2026-03-15
```
Older entries deleted.
---
## Good Example
```markdown
# Changelog
## [2.1.0] - 2026-03-15
...
## [2.0.0] - 2026-01-15
...
## [1.0.0] - 2025-06-01
...
```
---
## Exceptions
No common exceptions. Historical changelog entries cost negligible storage and provide ongoing value.
---
## Consequences Of Violation
Consumers stuck on older versions cannot plan upgrades; trust in the changelog as a reliable historical record is lost.
---
