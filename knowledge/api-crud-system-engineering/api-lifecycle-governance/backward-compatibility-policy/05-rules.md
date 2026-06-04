# Phase 5: Rules — Backward Compatibility Policy

## Rule 1: Never Add Required Fields to Existing Endpoints
---
## Category
Backward Compatibility
---
## Rule
Never add a required field to the request body or parameters of an existing endpoint. Always add new fields as optional with sensible defaults.
---
## Reason
Adding required fields breaks all existing consumers who do not send the new field, causing immediate 422 validation failures.
---
## Bad Example
```php
// New required field breaks all existing POST /users callers
'email' => ['required', 'email'], // was optional in v1
```
---
## Good Example
```php
// Add as optional with default
'department_id' => ['sometimes', 'exists:departments,id'],
```
---
## Exceptions
New major version releases (v2, v3) may add required fields as part of a deliberate breaking change.
---
## Consequences Of Violation
All existing consumers receive 422 errors; immediate production incidents; consumer trust damaged.
---

## Rule 2: Never Change Default Values
---
## Category
Backward Compatibility
---
## Rule
Never change the default value of an existing parameter or field. Changing defaults silently alters behavior for consumers who rely on the default.
---
## Reason
Consumers not specifying a value implicitly rely on the documented default. Changing it causes behavioral changes without any explicit consumer action.
---
## Bad Example
```php
// Changed default per_page from 50 to 20
'per_page' => ['integer', 'min:1', 'max:100'], // default was 50, now 20
```
---
## Good Example
```php
// Add new parameter instead of changing default
// Old: per_page (default 50) — unchanged
// New: max_per_page (default 100) — endpoint now supports larger page sizes
```
---
## Exceptions
Bug fixes where the default was producing incorrect results (document in changelog as a fix).
---
## Consequences Of Violation
Silent behavior changes for consumers relying on defaults; pagination breaks; data processing discrepancies.
---

## Rule 3: Always Deprecate Before Removing Fields or Endpoints
---
## Category
Backward Compatibility
---
## Rule
Always add a deprecation period of at least 6 months before removing any field, parameter, or endpoint. Never remove functionality without a deprecation window.
---
## Reason
Immediate removal breaks consumers who depend on the removed feature. Deprecation provides time for migration.
---
## Bad Example
```php
// Field removed in next release without deprecation
// 'old_field' => 'string', // DELETED — consumers still sending it
```
---
## Good Example
```php
// Deprecate old field, add new field alongside
'old_field' => ['prohibited_with:new_field', 'deprecated'], // removed in v2
'new_field' => 'string',
```
---
## Exceptions
Emergency security fixes requiring immediate removal may bypass deprecation.
---
## Consequences Of Violation
Consumer breakage at deployment; support incidents; erosion of trust in API stability.
---

## Rule 4: Run Automated OpenAPI Diffing in CI
---
## Category
Maintainability
---
## Rule
Always run automated OpenAPI specification diffing in CI on every PR that changes the API. Reject PRs with breaking changes that lack a deprecation plan. Never merge API changes without diff validation.
---
## Reason
Automated diffing catches accidental breaking changes early, before code review. Manual review alone misses subtle compatibility issues.
---
## Bad Example
```yaml
# CI without OpenAPI diffing — breaking changes slip through
# PR that removes a response field gets merged
```
---
## Good Example
```yaml
- name: OpenAPI Compatibility Check
  run: |
    oas-diff previous-spec.yaml current-spec.yaml --fail-on-breaking
```
---
## Exceptions
Private/internal APIs not published to consumers may skip diffing.
---
## Consequences Of Violation
Accidental breaking changes reach production; consumer-facing incidents; emergency reverts.
---

## Rule 5: Never Rename Fields — Add New and Deprecate Old
---
## Category
Backward Compatibility
---
## Rule
Never rename an existing field in a response or request body. Always add the new field name and deprecate the old one, removing only after the deprecation window.
---
## Reason
Renaming breaks deserialization for consumers using strict parsing. Old code referencing the old name breaks immediately.
---
## Bad Example
```php
// Renamed 'username' to 'user_name' — breaks all existing consumers
'user_name' => 'string', // was 'username' in v1
```
---
## Good Example
```php
// Both fields present during migration period
'username' => 'string', // deprecated, present for migration
'user_name' => 'string', // new preferred field
```
---
## Exceptions
New major version with documented breaking change may remove the old field after deprecation window.
---
## Consequences Of Violation
Immediate deserialization failures for existing consumers; runtime errors; emergency rollback.
---

## Rule 6: Tolerant Reader — Ignore Unknown Fields
---
## Category
Architecture
---
## Rule
Always configure response serialization to include new fields without removing old ones, and configure request validation to ignore unknown parameters. Never reject requests due to unrecognized fields.
---
## Reason
Postel's Law (be conservative in what you send, liberal in what you accept) enables forward compatibility for consumers.
---
## Bad Example
```php
// Strict parsing rejects unknown fields
$request->validate($rules); // throws 422 on unknown fields
```
---
## Good Example
```php
// Allow unknown fields, validate only known ones
$validated = $request->safe()->only(array_keys($rules));
// Unknown fields are silently ignored
```
---
## Exceptions
Security-sensitive endpoints (auth, webhooks) may strictly validate to prevent injection.
---
## Consequences Of Violation
Forward compatibility broken; consumer adding new optional field causes 422; tight coupling enforced.
---

## Rule 7: Enforce Semantic Versioning for MAJOR Changes
---
## Category
Architecture
---
## Rule
Always bump the MAJOR version for breaking changes, MINOR for additive changes, PATCH for fixes. Never introduce breaking changes in a MINOR or PATCH release.
---
## Reason
Semantic versioning signals the nature of changes to consumers. Violating it undermines trust in version semantics.
---
## Bad Example
```php
// Breaking change in a MINOR version bump
// v1.5.0 — added required field to existing endpoint
```
---
## Good Example
```php
// Breaking change requires MAJOR bump
// v1.5.0 — additive changes
// v2.0.0 — breaking changes with deprecation window
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers auto-upgrade expecting safety and encounter breaking changes; automated dependency resolution breaks.
