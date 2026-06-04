# Phase 5: Rules — Deprecation Link Headers

## Always Include `rel="deprecation"` Link On Deprecated Endpoints
---
## Category
Maintainability
---
## Rule
Always include a `Link` header with `rel="deprecation"` on every deprecated API response, pointing to the migration guide.
---
## Reason
A deprecation warning without a link to next steps forces consumers to search documentation — many simply won't.
---
## Bad Example
```php
$response->header('Deprecation', 'true'); // no link
```
---
## Good Example
```php
$response->header('Link', '<https://docs.example.com/migration/v1-to-v2>; rel="deprecation"');
```
---
## Exceptions
Automated internal services where the consumer team is directly notified through other channels.
---
## Consequences Of Violation
Consumers don't migrate; support tickets asking "what do we do now?".
---

## Use Absolute URLs In Link Headers
---
## Category
Reliability
---
## Rule
Always use absolute URLs (including scheme and domain) in link headers — never relative paths.
---
## Reason
HTTP libraries on the consumer side resolve link header URLs without context — a relative URL becomes `https://api.example.com/relative-path` by default, which is usually wrong.
---
## Bad Example
```php
$response->header('Link', '</docs/migration>; rel="deprecation"');
```
---
## Good Example
```php
$response->header('Link', '<https://docs.example.com/docs/migration-v1-to-v2>; rel="deprecation"');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers follow broken links; migration guides inaccessible; increased support load.
---

## Include Both Deprecation And Alternate Links
---
## Category
Maintainability
---
## Rule
Always send separate `Link` headers for `rel="deprecation"` (migration guide) and `rel="alternate"` (new version endpoint) on deprecated response.
---
## Reason
Consumers need both the migration guide for context and the new version URL to update their code.
---
## Bad Example
```php
$response->header('Link', '<https://docs.example.com/migration>; rel="deprecation"');
```
---
## Good Example
```php
$response->header('Link', '<https://docs.example.com/migration>; rel="deprecation"');
$response->header('Link', '<https://api.example.com/api/v2/users>; rel="alternate"');
```
---
## Exceptions
When the alternative version is not yet available (deprecation announced before new version is stable).
---
## Consequences Of Violation
Consumers have guidance but no destination; migration stalls.
---

## Test Link Target Health Periodically
---
## Category
Reliability
---
## Rule
Always run a scheduled health check that verifies all deprecation link targets return HTTP 200.
---
## Reason
Documentation moves, URLs change, and a broken deprecation link is worse than no link — consumers follow it and get a 404.
---
## Bad Example
```php
// No link health check
```
---
## Good Example
```php
$schedule->command('api:check-deprecation-links')->weekly();
// Checks each configured link target returns 200 before logging alert
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Silent link rot; consumers cannot find migration information; escalated support tickets.
---

## Send Multiple Links As Separate Headers Not Comma-Separated
---
## Category
Reliability
---
## Rule
Always send multiple `Link` headers as individual headers rather than comma-separated values in a single header.
---
## Reason
Many HTTP client libraries parse comma-separated link headers incorrectly or drop all but the first link value.
---
## Bad Example
```php
$response->header('Link', '<url1>; rel="deprecation", <url2>; rel="alternate"');
```
---
## Good Example
```php
$response->header('Link', '<url1>; rel="deprecation"');
$response->header('Link', '<url2>; rel="alternate"');
```
---
## Exceptions
When the consumer tooling is known to correctly parse RFC 5988 comma-separated link headers.
---
## Consequences Of Violation
Alternative link is silently dropped; consumers never discover the new version endpoint.
---

## Use Standard Relation Types Only
---
## Category
Design
---
## Rule
Never invent custom `rel` values — always use standard IANA-registered relation types (`deprecation`, `sunset`, `alternate`, `latest-version`).
---
## Reason
Non-standard relation types cannot be interpreted by generic HTTP clients or tooling that understands the Link header protocol.
---
## Bad Example
```php
$response->header('Link', '<url>; rel="go-here-instead"');
```
---
## Good Example
```php
$response->header('Link', '<url>; rel="alternate"');
```
---
## Exceptions
Internal APIs where the consuming team explicitly agreed on custom relation semantics.
---
## Consequences Of Violation
Tooling ignores the link; consumers must manually parse non-standard headers.
---

## Include Links In Error Responses For Deprecated Endpoints
---
## Category
Maintainability
---
## Rule
Always include deprecation `Link` headers in 410 error responses so consumers who hit a removed endpoint can find the migration path.
---
## Reason
Consumers hitting a 410 are the ones that need the migration link the most — they already missed the deprecation window.
---
## Bad Example
```php
abort(410, 'This API version has been removed.'); // no link
```
---
## Good Example
```php
abort(410, 'This API version has been removed. Migrate to v2: https://docs.example.com/migration');
// Also: $response->header('Link', '<https://docs.example.com/migration>; rel="deprecation"');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers hit dead ends with no recovery path; permanent consumer churn.
