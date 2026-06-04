# Phase 5: Rules — API Version Documentation

## Separate Spec Files Per Version
---
## Category
Code Organization
---
## Rule
Maintain a separate OpenAPI spec file per supported API version using `docs/openapi-v{major}.yaml` naming convention.
---
## Reason
Single-file versioning couples version lifecycles, makes independent deprecation impossible, and forces consumers to parse a monolithic document. Separate files allow each version to evolve independently and be archived atomically.
---
## Bad Example
```yaml
# docs/openapi.yaml — one file for all versions
paths:
  /v1/users:
  /v2/users:
```
---
## Good Example
```
docs/
  openapi-v1.yaml   # info.version: "1.0"
  openapi-v2.yaml   # info.version: "2.0"
```
---
## Exceptions
APIs with only a single active version that has never been versioned. Begin separation when the first breaking change is introduced.
---
## Consequences Of Violation
Unintended documentation changes affect consumers of stable versions; version deprecation requires risky edits to shared files.
---

## Always Expose A Version Discovery Endpoint
---
## Category
Design
---
## Rule
Implement a `GET /api/versions` endpoint that returns all API versions with their status (active/deprecated/sunset) and docs URL.
---
## Reason
Consumers need a machine-readable way to discover available versions, their lifecycle stage, and where to find documentation. Without it, consumers hardcode versions or guess the latest.
---
## Bad Example
No version discovery route exists. Consumers find version information only by reading blog posts or release notes.
---
## Good Example
```json
GET /api/versions
{
  "versions": [
    { "version": "2.0", "status": "active", "docs": "https://docs.example.com/v2" },
    { "version": "1.0", "status": "deprecated", "docs": "https://docs.example.com/v1" }
  ]
}
```
---
## Exceptions
Internal APIs where all consumers coordinate deployment schedules directly.
---
## Consequences Of Violation
New consumers integrate against deprecated versions; migration planning requires manual research.
---

## Visually Distinguish Active From Deprecated Versions
---
## Architecture
---
## Rule
Render active versions with green badges, deprecated versions with yellow badges and removal dates, and sunset versions with red badges.
---
## Reason
Presenting all versions with equal visual weight misleads new consumers into choosing deprecated versions, increasing support burden and migration urgency.
---
## Bad Example
```markdown
| Version | Status |
|---------|--------|
| 2.0     | Active |
| 1.0     | Deprecated |
```
(Both rows rendered identically with no visual cues.)
---
## Good Example
- ![active](https://img.shields.io/badge/v2.0-active-brightgreen) — Recommended for new integrations
- ![deprecated](https://img.shields.io/badge/v1.0-deprecated-yellow) — Removal: 2026-12-31
---
## Exceptions
APIs with only one active version; single-version docs.
---
## Consequences Of Violation
New consumers onboard onto deprecated versions, requiring emergency migrations and creating consumer dissatisfaction.
---

## Never Remove Sunset Version Docs
---
## Category
Maintainability
---
## Rule
Keep sunset version documentation as read-only historical reference. Remove only interactive features (Try It, authentication flows).
---
## Reason
Consumers still migrating from sunset versions need documentation to understand legacy behavior. Removing docs entirely leaves them without reference material and increases support costs.
---
## Bad Example
```php
// Deleting the entire docs directory for v1 after sunset
Storage::deleteDirectory('docs/v1');
```
---
## Good Example
```php
// Preserve docs but disable interactive features
// docs/v1/index.html remains accessible
// Remove the OpenAPI spec used by interactive Try-It console
Storage::delete('docs/v1/openapi.yaml');
```
---
## Exceptions
Emergency removals where the endpoint posed a security risk (e.g., exposed PII). Document the removal in the changelog.
---
## Consequences Of Violation
Consumers on legacy integrations lose migration reference; support tickets increase as developers must reverse-engineer old behavior.
---

## Publish A Version Comparison Table
---
## Category
Documentation
---
## Rule
Include in your version documentation a table comparing authentication methods, pagination style, rate limits, and default behaviors across all active versions.
---
## Reason
Consumers evaluating whether to upgrade need a quick reference of what changed between versions. Without a comparison table, they must diff entire specs or discover differences at runtime.
---
## Bad Example
Each version's doc page is self-contained with no cross-reference. Consumers must open both pages side-by-side to spot differences.
---
## Good Example
| Feature | v1 (deprecated) | v2 (active) |
|---------|-----------------|-------------|
| Auth | API Key | Bearer Token (Sanctum) |
| Pagination | Page-based | Cursor-based |
| Rate Limit | 60/min | 300/min |
| Default page size | 20 | 50 |
---
## Exceptions
APIs with only one version.
---
## Consequences Of Violation
Consumers discover breaking differences only when their integration fails; migration planning takes longer due to manual spec comparison.
---

## Redirect Unversioned Docs To Latest Stable Version
---
## Category
Design
---
## Rule
Configure the root documentation URL to redirect (302) to the latest stable version's documentation.
---
## Reason
New consumers landing on the docs homepage should immediately see the recommended version. An unversioned root page creates confusion about which version to use.
---
## Bad Example
```php
Route::get('/docs', fn () => view('docs.index'));
// Shows a generic page with no default version recommendation
```
---
## Good Example
```php
Route::permanentRedirect('/docs', '/docs/v2');
// or redirect based on latest stable version config
Route::get('/docs', fn () => redirect('/docs/' . config('api.latest_version')));
```
---
## Exceptions
APIs with a single version; the root is the only documentation.
---
## Consequences Of Violation
New consumers must make an active choice about which version to use; many default to the wrong one.
---

## Document Auth Requirements Per Version
---
## Category
Security
---
## Rule
Explicitly document the authentication mechanism for each API version in its dedicated spec, noting any differences between versions.
---
## Reason
Auth changes across versions (e.g., API Key v1 → Bearer Token v2) are common breaking changes. Consumers using old credentials against new endpoints get confusing errors if auth differences are undocumented.
---
## Bad Example
```yaml
# Both versions reference the same security scheme
# v1 uses API Key, v2 uses Bearer — not documented separately
```
---
## Good Example
```yaml
# docs/openapi-v1.yaml
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

# docs/openapi-v2.yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      description: Sanctum token with abilities
```
---
## Exceptions
Versions sharing an identical authentication mechanism with no changes.
---
## Consequences Of Violation
Consumers silently send incompatible credentials; auth failures generate support tickets that could be eliminated by explicit documentation.
---
