# Phase 5: Rules — Deprecation Notes In Docs

## Always Set The OpenAPI `deprecated: true` Flag
---
## Category
Framework Usage
---
## Rule
Set `deprecated: true` on every operation or schema property that is deprecated, in addition to adding a textual deprecation notice in the description.
---
## Reason
Tooling (documentation renderers, code generators, contract testers) reads the `deprecated` boolean flag. A description-only deprecation is invisible to automated tooling, so generated SDKs and API clients will not mark the method or property as deprecated.
---
## Bad Example
```yaml
paths:
  /users/list:
    get:
      summary: List users (old endpoint)
      # No deprecated: true flag — tooling treats it as active
```
---
## Good Example
```yaml
paths:
  /users/list:
    get:
      deprecated: true
      description: "Deprecated since v2.0. Use GET /users instead. Removal date: 2026-12-31."
```
---
## Exceptions
Emergency security removals where the endpoint is removed immediately without a deprecation period.
---
## Consequences Of Violation
Tooling treats deprecated endpoints as active; SDKs do not generate deprecation warnings; consumers unknowingly build against endpoints scheduled for removal.
---

## Include Structured Deprecation Notice In Description
---
## Category
Documentation
---
## Rule
Write every deprecation notice with exactly four elements: what is deprecated, what replaces it, the deprecation version, and the removal date.
---
## Reason
Vague deprecation notices ("will be removed in a future version") prevent consumers from planning migrations. A structured notice provides all information needed for upgrade scheduling in a single, parseable location.
---
## Bad Example
```yaml
description: "This endpoint is deprecated."
```
---
## Good Example
```yaml
description: |
  Deprecated since v2.0 (2025-06-01).
  Use `GET /users` instead.
  Removal date: 2026-12-31.
  Migration guide: https://docs.example.com/migration-v1-to-v2
```
---
## Exceptions
Soft deprecations with no removal date; omit the removal date but still state replacement.
---
## Consequences Of Violation
Consumers cannot schedule migrations; support tickets ask "when is this actually being removed?"; migration delays cause last-minute breaks.
---

## Send Deprecation And Sunset Headers In Responses
---
## Category
Design
---
## Rule
Include `Deprecation: true`, `Sunset: <RFC 1123 date>`, and `Link: <url>; rel="deprecation"` HTTP headers in responses from deprecated endpoints.
---
## Reason
Documentation-only deprecation is ineffective because consumers may not revisit docs after initial integration. Response headers alert consumers at runtime — including legacy integrations that have been running unchanged for months.
---
## Bad Example
```php
// Deprecated endpoint returns 200 with no headers
return response()->json($data);
```
---
## Good Example
```php
return response()->json($data)
    ->header('Deprecation', 'true')
    ->header('Sunset', 'Sat, 31 Dec 2026 23:59:59 GMT')
    ->header('Link', '<https://docs.example.com/migration>; rel="deprecation"');
```
---
## Exceptions
Endpoints removed immediately for security reasons; no deprecation period applies.
---
## Consequences Of Violation
Consumers continue calling deprecated endpoints indefinitely; removal dates pass without consumer awareness; integrations break unexpectedly.
---

## Log Deprecated Endpoint Usage And Notify Consumers
---
## Category
Reliability
---
## Rule
Log every request to deprecated endpoints, identify affected consumers, and proactively notify them before the removal date.
---
## Reason
Passive deprecation (documentation + headers) still misses consumers who ignore or miss the signals. Proactive notification — via email, dashboard alert, or support ticket — is the only reliable way to ensure all consumers migrate before removal.
---
## Bad Example
```php
// No logging; deprecation communicated only via docs
```
---
## Good Example
```php
Route::get('/users/list', function () {
    Log::warning('Deprecated endpoint called', [
        'route' => 'users.list',
        'consumer' => request()->header('X-Consumer-Id'),
    ]);
    // ... handle request
})->middleware('log.deprecation');
```
---
## Exceptions
Anonymous APIs where consumers cannot be identified. Log aggregate counts instead.
---
## Consequences Of Violation
Consumers using deprecated endpoints are not contacted; removal date arrives with active consumers still depending on the endpoint; emergency rollbacks or deadline extensions.
---

## Never Remove A Deprecated Endpoint Before The Stated Sunset Date
---
## Category
Reliability
---
## Rule
Honor the published sunset date. Do not remove an endpoint before the documented removal date under any circumstances.
---
## Reason
Consumers schedule their migrations around the published timeline. Premature removal breaks consumer integrations and destroys trust in the API's deprecation process. A single premature removal causes more damage than leaving the endpoint running past sunset.
---
## Bad Example
```yaml
# Docs say removal: 2026-12-31
# But the endpoint is removed in a deployment on 2026-09-15
```
---
## Good Example
```yaml
# Docs say removal: 2026-12-31
# Endpoint returns 410 Gone starting 2026-12-31
```
---
## Exceptions
Security vulnerabilities that cannot be patched on the old endpoint; immediate removal is required.
---
## Consequences Of Violation
Consumer integrations break without warning; legal exposure if consumers have contractual access guarantees; loss of trust in API lifecycle commitments.
---
