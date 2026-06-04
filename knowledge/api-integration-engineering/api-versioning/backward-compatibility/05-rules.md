## Never Remove Fields Within a Version
---
## Category
Architecture
---
## Rule
Never remove, rename, or change the type of existing response fields within a version — only additive changes are allowed.
---
## Reason
Existing consumers depend on every field they receive; removal causes silent breakage (undefined property access) that may not surface immediately.
---
## Bad Example
```json
// v1: { "name": "John", "email": "john@example.com" }
// v1 (updated): { "full_name": "John", "email": "john@example.com" } — name removed, BREAKING
```
---
## Good Example
```json
// v1: { "name": "John", "email": "john@example.com" }
// v1 (updated): { "name": "John", "full_name": "John", "email": "john@example.com" } — additive only
```
---
## Exceptions
Security-sensitive fields (passwords, tokens) that must be removed immediately.
---
## Consequences Of Violation
Silent consumer breakage, undefined property errors, production incidents requiring emergency consumer updates.
## Add Only Optional New Fields with Defaults
---
## Category
Architecture
---
## Rule
All new fields added within a version must be optional with sensible defaults that preserve existing behavior.
---
## Reason
Required new fields break existing consumers that don't send them, forcing unnecessary updates.
---
## Bad Example
```yaml
# New required field — existing requests without it fail validation
parameters:
  - name: locale
    required: true
    in: query
```
---
## Good Example
```yaml
# New optional field with default — no consumer changes needed
parameters:
  - name: locale
    required: false
    schema:
      type: string
      default: 'en'
```
---
## Exceptions
None — always make new fields optional.
---
## Consequences Of Violation
Existing consumer requests fail validation, broken integrations, emergency consumer updates.
## Validate Backward Compatibility in CI with OpenAPI Diff
---
## Category
Testing
---
## Rule
Run OpenAPI spec diff tools in CI on every change to detect breaking modifications before deployment.
---
## Reason
Manual code review cannot reliably detect all types of breaking changes (type changes, field removals, default value changes).
---
## Bad Example
```yaml
# No CI check — breaking changes deployed silently
```
---
## Good Example
```yaml
# CI step: diff OpenAPI specs
- run: openapi-diff old-spec.yaml new-spec.yaml --fail-on-breaking
```
---
## Exceptions
None — always validate backward compatibility in CI.
---
## Consequences Of Violation
Breaking changes reach production, consumer integrations break, production incidents.
## Use Postel's Law: Accept What You Don't Expect
---
## Category
Architecture
---
## Rule
Accept unknown fields in requests without error; ignore unexpected fields in responses from upstream APIs.
---
## Reason
Unknown fields may be used by future consumers or newer API versions; rejecting them prevents forward compatibility.
---
## Bad Example
```php
$validated = $request->validate([
    'name' => 'required',
    // unknown fields rejected — breaks when new fields added
]);
```
---
## Good Example
```php
$validated = $request->validate([
    'name' => 'required',
    // unknown fields accepted — forward compatible
]);
```
---
## Exceptions
Security-critical endpoints where unknown fields are suspicious.
---
## Consequences Of Violation
Future API additions break existing consumers, unnecessary version bumps for simple additive changes.
## Never Change Response Format as a "Bug Fix"
---
## Category
Reliability
---
## Rule
Changing the format or semantics of a response is a breaking change requiring a new version, not a bug fix.
---
## Reason
Consumers may rely on the "buggy" behavior; changing it without a version bump breaks their integration silently.
---
## Bad Example
```php
// "Bug fix": changed date format from 'Y-m-d' to 'Y-m-d\TH:i:s\Z' without version bump
```
---
## Good Example
```php
// Fix date format in v2 — v1 retains original format
class V1\UserController { /* original format */ }
class V2\UserController { /* fixed format */ }
```
---
## Exceptions
Behavior that is a security vulnerability or causes data corruption.
---
## Consequences Of Violation
Silent consumer breakage, date parsing failures, production incidents labeled as "bug fixes."
## Document Migration Paths for Breaking Changes
---
## Category
Maintainability
---
## Rule
When a breaking change is necessary, provide clear before/after migration documentation with code examples.
---
## Reason
Even with versioning, consumers need guidance to migrate; undocumented breaking changes cause confusion and support burden.
---
## Bad Example
```php
// v2 ships with no migration docs — consumers must reverse-engineer the changes
```
---
## Good Example
```php
/**
 * Migration Guide: v1 -> v2
 * - `name` field replaced with `first_name` and `last_name`
 * - Old: { "name": "John Doe" }
 * - New: { "first_name": "John", "last_name": "Doe" }
 * - Migration: split name into components
 */
```
---
## Exceptions
Internal APIs where consumers can see the code.
---
## Consequences Of Violation
Support tickets, slow consumer migration, frustrated API consumers.
