# Phase 5: Rules — Semantic Versioning for APIs

## Bump MAJOR Only For Consumer-Visible Breaking Changes
---
## Category
Governance
---
## Rule
Never bump the MAJOR version for internal refactors or implementation-only changes — only bump when the API contract itself breaks.
---
## Reason
Every MAJOR bump signals a costly migration to consumers. Internal refactors without contract changes should be PATCH.
---
## Bad Example
```php
// MAJOR bumped because database was migrated from MySQL to Postgres — contract unchanged
```
---
## Good Example
```php
// MAJOR bumped because /users response removed 'username' field
```
---
## Exceptions
Security architecture overhauls where the old contract exposes vulnerability patterns.
---
## Consequences Of Violation
Version inflation; consumers ignore MAJOR signals; unnecessary migration costs.
---

## Use URL MAJOR Version Only, Communicate MINOR Via Changelog
---
## Category
Design
---
## Rule
Always scope URL path versioning to MAJOR only (`/api/v1/`) — never include MINOR or PATCH in the URL.
---
## Reason
MINOR and PATCH are transparent to consumers by definition; including them in the URL creates unnecessary churn.
---
## Bad Example
```
/api/v1.3.0/users  # unnecessary detail in URL
```
---
## Good Example
```
/api/v1/users  # MAJOR only
# MINOR communicated via changelog, PATCH transparent
```
---
## Exceptions
Pre-release versions (`-alpha`, `-beta`, `-rc.1`) that need to coexist with stable versions.
---
## Consequences Of Violation
URL clutter; consumers hardcode sub-version URLs that change with every MINOR release.
---

## Automate Version Bump Detection In CI
---
## Category
Reliability
---
## Rule
Always run automated OpenAPI spec diff in CI to detect the required version bump type — never rely on developers to manually determine MAJOR/MINOR/PATCH.
---
## Reason
Developers subjectively assess breaking vs non-breaking and often under-bump to avoid the MAJOR conversation.
---
## Bad Example
```yaml
# No automated version detection — developer assigns "MINOR" manually
```
---
## Good Example
```yaml
- run: oasdiff --base openapi-v1.yaml --revision openapi-v2.yaml --format json
- run: php artisan api:calculate-version-bump --diff=openapi-diff.json
```
---
## Exceptions
Documentation-only PRs that do not change the API contract.
---
## Consequences Of Violation
Breaking changes shipped as MINOR; consumers hit runtime errors without a version signal.
---

## Patch Releases Must Have Zero Contract Change
---
## Category
Reliability
---
## Rule
Never change the API contract in a PATCH release — PATCH is limited to implementation bug fixes with identical consumer-visible behavior.
---
## Reason
Consumers auto-upgrade to PATCH releases expecting zero breakage. Any contract change violates this trust.
---
## Bad Example
```php
// PATCH — but response now includes a new field
public function index(): array { return [...$data, 'new_field' => $this->new_field]; }
```
---
## Good Example
```php
// PATCH — fixes timeout bug, response identical
public function index(): array { return Cache::remember('posts', 3600, fn() => $this->getPosts()); }
```
---
## Exceptions
Security patches that must add a response header (e.g., `Strict-Transport-Security`) — communicate clearly.
---
## Consequences Of Violation
Consumer integrations break on auto-patch deployment; trust erosion in the versioning system.
---

## Publish A Version Compatibility Table
---
## Category
Maintainability
---
## Rule
Always publish a machine-readable version compatibility table that maps each API version to its MAJOR.MINOR.PATCH, release date, and deprecation status.
---
## Reason
Consumers need a single source of truth to determine which version to use and when they need to migrate.
---
## Bad Example
```php
// No version table — consumers guess which versions exist
```
---
## Good Example
```php
// GET /api/versions returns:
[
    {"version": "v1", "semver": "1.8.3", "status": "deprecated", "removal": "2026-12-31"},
    {"version": "v2", "semver": "2.1.0", "status": "active", "removal": null}
]
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer confusion about supported versions; some teams stay on long-unsupported versions.
---

## Maintain A Version Changelog With Conventional Commits
---
## Category
Maintainability
---
## Rule
Always map conventional commit prefixes to version bump types and generate a changelog: `feat!` → MAJOR, `feat` → MINOR, `fix` → PATCH.
---
## Reason
A structured changelog generated from commits ensures every change is categorized correctly and consumers can track API evolution.
---
## Bad Example
```markdown
## Changed
- Updated thing
```
---
## Good Example
```markdown
## v2.0.0 (2026-06-01)
### BREAKING
- Removed `username` field from /users response

## v1.3.0 (2026-05-01)
### Added
- Added `excerpt` field to /posts response (optional)
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers cannot track API changes; support tickets asking "what changed between versions?".
---

## LTS Versions Get Extended Support Windows
---
## Category
Governance
---
## Rule
Always define and document long-term support (LTS) versions with a minimum 24-month support window before deprecation.
---
## Reason
Enterprise consumers plan annual integration cycles and require guaranteed stability windows.
---
## Bad Example
```php
// All versions treated equally — no LTS designation
```
---
## Good Example
```php
// config/api/lts.php
'v2' => ['lts' => true, 'support_until' => '2028-06-01', 'security_patches_until' => '2029-06-01']
```
---
## Exceptions
Internal-only APIs with no enterprise consumers.
---
## Consequences Of Violation
Enterprise consumers cannot commit to integration; lost enterprise adoption.
---

## Never Ship Breaking Changes As MINOR
---
## Category
Governance
---
## Rule
Never classify a breaking change as MINOR to avoid the MAJOR version bump conversation — always be honest about the version impact.
---
## Reason
Shipping breaking changes as MINOR undermines the entire versioning contract and erodes consumer trust.
---
## Bad Example
```php
// Breaking change shipped as MINOR because "nobody uses that field"
```
---
## Good Example
```php
// Breaking change correctly shipped as MAJOR with migration path and timeline
// If nobody uses the field, the MAJOR bump has zero cost — do it right
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer runtime breakage on "minor" upgrade; trust destroyed; versioning system becomes meaningless.
