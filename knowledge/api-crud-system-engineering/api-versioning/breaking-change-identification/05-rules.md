# Phase 5: Rules — Breaking Change Identification

## Run Automated OpenAPI Spec Diff In CI
---
## Category
Reliability
---
## Rule
Always run automated OpenAPI spec diff as a pre-merge gate in CI for every pull request that touches API response or request code.
---
## Reason
Manual review alone misses subtle breaking changes in field types, enum values, and nested schemas.
---
## Bad Example
```yaml
# CI passes without any spec comparison
```
---
## Good Example
```yaml
- run: oasdiff --base openapi-v1.yaml --revision openapi-v2.yaml --fail-on-changes
```
---
## Exceptions
Documentation-only PRs and internal-only code changes with zero consumer-visible impact.
---
## Consequences Of Violation
Breaking changes silently reach production; consumers discover breakage at runtime.
---

## Categorize Breaking Changes In Changelog
---
## Category
Maintainability
---
## Rule
Always label breaking changes in the changelog with a `BREAKING` prefix and categorise by type (field, behavior, contract, semantic).
---
## Reason
An undocumented breaking change erodes consumer trust and forces every client team to reverse-engineer the diff.
---
## Bad Example
```markdown
## Changed
- Updated user response format
```
---
## Good Example
```markdown
## Changed
- **BREAKING** (field): Removed `username` field from `/users` response
```
---
## Exceptions
Internal APIs consumed by a single team with direct communication.
---
## Consequences Of Violation
Consumer integration failures discovered in production; emergency cross-team escalation.
---

## Check Field Semantics Not Just Structure
---
## Category
Design
---
## Rule
Always verify that field semantics (meaning, units, tax-inclusion, timezone) remain unchanged — not just field names and types.
---
## Reason
A field with the same name and type but different meaning silently corrupts consumer business logic.
---
## Bad Example
```php
// price was including tax, now excluding — same name, same float type
'price' => $this->priceExcludingTax
```
---
## Good Example
```php
'price' => $this->priceIncludingTax // semantic freeze: same meaning across versions
'price_excluding_tax' => $this->priceExcludingTax // new field with new meaning
```
---
## Exceptions
When the semantic change is a bug fix and all consumers are notified in advance.
---
## Consequences Of Violation
Financial calculation errors in consumer applications; data corruption in dependent systems.
---

## Snapshot Test Every Public API Response
---
## Category
Testing
---
## Rule
Always maintain snapshot tests for every public API endpoint that assert the complete response shape against a known-good baseline.
---
## Reason
Snapshot tests detect unexpected response changes that code review and schema diff might miss.
---
## Bad Example
```php
public function test_index(): void
{
    $response = $this->getJson('/api/v1/posts');
    $response->assertOk(); // no shape assertion
}
```
---
## Good Example
```php
public function test_index(): void
{
    $response = $this->getJson('/api/v1/posts');
    $response->assertJsonSnapshot(); // asserts full shape against baseline
}
```
---
## Exceptions
Endpoints with non-deterministic responses (timestamps, random values) — use partial snapshot matching instead.
---
## Consequences Of Violation
Undocumented response drift; consumers depend on fields the team thought were removed.
---

## Treat Auth/Header Changes As Breaking
---
## Category
Security
---
## Rule
Always classify authentication, authorization, and security header changes as breaking — never deploy them as MINOR or PATCH.
---
## Reason
Security policy changes silently deny or grant access, breaking every consumer's integration.
---
## Bad Example
```php
// Added scope check without version bump
public function index(): JsonResponse { $this->authorize('posts:read'); }
```
---
## Good Example
```php
// New version with explicit scope requirement
public function index(): JsonResponse { $this->authorize('posts:read_advanced'); }
```
---
## Exceptions
Security vulnerability patches that close an existing gap (the old behavior was incorrect).
---
## Consequences Of Violation
Production authentication failures; consumers locked out of the API without warning.
---

## Use `oasdiff` Or Equivalent In CI Pipeline
---
## Category
Reliability
---
## Rule
Prefer a dedicated OpenAPI diff tool (e.g., `oasdiff`, `openapi-diff`) over manual comparison or simple string diffs for breaking change detection.
---
## Reason
String diffs miss structural changes that break consumers (e.g., `allOf` composition changes, nullable type additions).
---
## Bad Example
```yaml
# Simple string diff — misses structural changes
- run: diff openapi-v1.yml openapi-v2.yml
```
---
## Good Example
```yaml
- run: oasdiff --base openapi-v1.yml --revision openapi-v2.yml --format json
```
---
## Exceptions
Pre-CI prototyping where no consumers depend on the API yet.
---
## Consequences Of Violation
Structural breaking changes (nullable → non-nullable, array → object) reach production undetected.
---

## Maintain A Breaking Change Registry
---
## Category
Governance
---
## Rule
Always maintain a versioned breaking change registry with rationale, affected endpoints, migration path, and consumer impact assessment for every intentional breaking change.
---
## Reason
A registry enables audit trails, deprecation planning, and consumer migration support across releases.
---
## Bad Example
```php
// Intentional breaking change — no documentation
public function index(): array { return ['users' => [...]]; } // was returning {data: [...]}
```
---
## Good Example
```php
// Breaking change documented in registry
// registry/2026-03-01-wrapping-removal.md — rationale, migration path, impact
```
---
## Exceptions
Emergency security releases where documentation is written within 48 hours.
---
## Consequences Of Violation
No migration path for consumers; repeated support tickets; eroded API trust.
