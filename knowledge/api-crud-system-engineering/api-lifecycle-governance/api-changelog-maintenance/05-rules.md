# Phase 5: Rules — API Changelog Maintenance

## Rule 1: Gate Releases on Changelog Updates in CI
---
## Category
Maintainability
---
## Rule
Always block releases (via CI) when a pull request introduces API changes without a corresponding changelog entry. Never merge API-changing PRs without updating the changelog.
---
## Reason
Changelogs are the single source of truth for API changes. Without CI gating, entries are forgotten until release time, when they are written hastily or missed entirely.
---
## Bad Example
```yaml
# CI pipeline without changelog validation
# PR adding new endpoint merges without changelog entry
```
---
## Good Example
```yaml
# CI step verifying changelog was updated
- name: Check Changelog
  run: php artisan changelog:check --diff --pr="${{ github.event.pull_request.body }}"
```
---
## Exceptions
Internal-only changes with no consumer-facing API surface may bypass.
---
## Consequences Of Violation
Changelog gaps; consumers surprised by changes at runtime; release notes incomplete.
---

## Rule 2: Use the Keep a Changelog Format
---
## Category
Maintainability
---
## Rule
Always structure the changelog using Keep a Changelog sections: Added, Changed, Deprecated, Removed, Fixed, Security. Never use free-form or ad-hoc section naming.
---
## Reason
Standardized format enables automated parsing, consumer tooling, and cross-service consistency.
---
## Bad Example
```markdown
## v2.0.0
What's new:
- New user endpoint
Fixes:
- Bug fix
```
---
## Good Example
```markdown
## [2.0.0] - 2026-06-02
### Added
- POST /v2/users — New user creation endpoint (#1423)
### Changed
- GET /v1/users — Response field `name` deprecated in favor of `full_name`
### Fixed
- GET /users — Pagination cursor encoding issue (#1389)
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent changelogs across services; automated consumers cannot parse; reduced readability.
---

## Rule 3: Auto-Extract from PR Descriptions, Curate Manually
---
## Category
Maintainability
---
## Rule
Always auto-extract changelog entries from structured PR descriptions via CI, then require manual review before release. Never rely solely on automation or solely on manual authoring.
---
## Reason
Automation ensures completeness and consistency; manual review ensures narrative quality and consumer-facing clarity.
---
## Bad Example
```php
// Fully automated — merges all commit messages verbatim
$changelog = implode("\n", $commits->pluck('message'));
```
---
## Good Example
```php
// CI extracts structured changelog block from PR body
$prBody = $githubPR->body();
$entries = ChangelogExtractor::fromPR($prBody);
// Human reviewer edits before release
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Fully automated: jargon-filled, no narrative flow. Fully manual: inconsistent timing and coverage.
---

## Rule 4: Link Deprecation Entries to Migration Guides
---
## Category
Maintainability
---
## Rule
Every changelog entry in the Deprecated section must include a hyperlink to the corresponding migration guide. Never mark something as deprecated without a link to upgrade instructions.
---
## Reason
Deprecation without migration guidance forces consumers to search or ask for instructions, creating friction and support overhead.
---
## Bad Example
```markdown
### Deprecated
- GET /v1/users — Use /v2/users instead.
```
---
## Good Example
```markdown
### Deprecated
- GET /v1/users — Replaced by /v2/users. [Migration guide](/docs/v1-to-v2-migration)
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Increased support tickets; delayed consumer migration; frustration from blocked team members.
---

## Rule 5: Maintain an Unreleased Section
---
## Category
Maintainability
---
## Rule
Always keep an `[Unreleased]` section at the top of the changelog tracking changes not yet in a release. Never allow unreleased changes to go undocumented.
---
## Reason
The Unreleased section gives consumers visibility into upcoming changes and enables early preparation.
---
## Bad Example
```markdown
## [2.0.0] - 2026-06-02
- (only released changes; no unreleased tracking)
```
---
## Good Example
```markdown
## [Unreleased]
### Added
- POST /v2/orders — Bulk order creation (#1501)
## [2.0.0] - 2026-06-02
...
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Changes forgotten between releases; consumers surprised by new endpoints; release preparation chaotic.
---

## Rule 6: Mark Breaking Changes Visibly
---
## Category
Maintainability
---
## Rule
Always append `[BREAKING]` to the category header or entry title for changes that break backward compatibility. Never bury breaking changes in standard entries.
---
## Reason
Breaking changes require immediate consumer attention. Visual markers allow scanning at a glance.
---
## Bad Example
```markdown
### Changed
- GET /users response format updated.
```
---
## Good Example
```markdown
### Changed [BREAKING]
- GET /users — Response pagination metadata format changed. [Migration guide](/docs/pagination-v2)
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers miss breaking changes; production breakage after deployment.
---

## Rule 7: Archive Entries Older Than 2 Years
---
## Category
Maintainability
---
## Rule
Always archive changelog entries older than 2 years to a `CHANGELOG-ARCHIVE.md` file. Keep the main `CHANGELOG.md` file under 1 MB.
---
## Reason
An oversized changelog becomes slow to load, hard to search, and overwhelming for readers focused on recent changes.
---
## Bad Example
```bash
# Changelog with 10 years of entries — 5 MB file
ls -lh CHANGELOG.md  # 5.2 MB
```
---
## Good Example
```bash
# Archive run on release cut
php artisan changelog:archive --older-than=2years
# CHANGELOG.md now 0.3 MB, archive at CHANGELOG-ARCHIVE.md
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Slow loading in editors and CI; degraded developer experience; readers overwhelmed.
