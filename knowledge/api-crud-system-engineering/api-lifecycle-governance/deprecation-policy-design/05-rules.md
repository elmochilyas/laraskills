# Phase 5: Rules — Deprecation Policy Design

## Rule 1: Always Provide Migration Path
---
## Category
Maintainability
---
## Rule
Always document a complete migration path when deprecating any endpoint, field, or parameter. Never deprecate without providing upgrade instructions.
---
## Reason
Consumers cannot migrate without clear direction. Undocumented deprecations cause support escalations and consumer churn.
---
## Bad Example
```php
// Deprecation header added, but no migration guide referenced
return response($data)->header('Deprecation', 'true');
```
---
## Good Example
```php
return response($data)
    ->header('Deprecation', 'true')
    ->header('Sunset', 'Sat, 01 Nov 2026 00:00:00 GMT')
    ->header('Link', '<https://docs.example.com/v1-to-v2>; rel="migration"');
```
---
## Exceptions
Security fixes requiring immediate removal may bypass migration documentation.
---
## Consequences Of Violation
Consumer breakage, increased support tickets, ecosystem trust erosion.
---

## Rule 2: Use Deprecation and Sunset HTTP Headers
---
## Category
Architecture
---
## Rule
Always emit both `Deprecation` and `Sunset` HTTP headers on deprecated endpoints. Never rely solely on documentation or changelog notifications for deprecation signaling.
---
## Reason
Headers provide machine-readable deprecation signals that automated tooling and client libraries can consume, enabling proactive consumer migration.
---
## Bad Example
```php
// Only documenting deprecation in changelog, no HTTP headers
// Changelog: "GET /v1/users is deprecated"
```
---
## Good Example
```php
// Inject via middleware scanning #[Deprecated] attribute
#[Deprecated(since: 'v2', sunset: '2026-11-01')]
Route::get('/users', [UserController::class, 'index']);
```
---
## Exceptions
Internal-only endpoints with no external consumers may skip header emission.
---
## Consequences Of Violation
Consumers discover deprecation only at runtime or when reading changelog; migration delayed, cutoff surprises.
---

## Rule 3: Vary Deprecation Window by Endpoint Criticality
---
## Architecture
---
## Rule
Use a 12-month deprecation window for critical endpoints (payments, auth, data export) and a 6-month window for standard endpoints. Never apply a single window to all endpoints.
---
## Reason
Critical endpoints require longer migration due to deeper integration, regulatory compliance, and higher consumer impact.
---
## Bad Example
```php
// Same 6-month window for all endpoints regardless of criticality
$deprecationWindow = '6 months'; // applied to /payments/charge too
```
---
## Good Example
```php
$window = match ($endpoint->criticality) {
    Criticality::CRITICAL => '12 months',
    Criticality::STANDARD => '6 months',
};
```
---
## Exceptions
Emergency security fixes bypass standard windows entirely.
---
## Consequences Of Violation
Critical consumers forced into rushed migration; escalations, exception requests, or breakage.
---

## Rule 4: Feature-Flag All Deprecation Cutoffs
---
## Category
Reliability
---
## Rule
Always wrap deprecation cutoffs in feature flags that enable emergency rollback without redeploying old code. Never perform hard cutoffs that require code rollback to reverse.
---
## Reason
Cutoffs may need reversal due to missed consumers or critical escalations. Feature flags enable instant recovery.
---
## Bad Example
```php
// Hard cutoff: code deleted, version removed from router
Route::delete('/v1/old-endpoint', ...); // removed permanently
```
---
## Good Example
```php
// Feature-flagged cutoff
if (Feature::active('remove-v1-users')) {
    return response()->json(['error' => '410 Gone'], 410);
}
// Old logic still deployable via flag toggle
```
---
## Exceptions
Security vulnerabilities requiring immediate removal may skip flag-based rollback.
---
## Consequences Of Violation
Extended outage for missed consumers; emergency hotfix deployment required; incident severity elevated.
---

## Rule 5: Log Deprecated Endpoint Usage for Consumer Outreach
---
## Category
Maintainability
---
## Rule
Always log requests to deprecated endpoints with consumer identity and timestamp. Never deprecate without visibility into who is still using the deprecated feature.
---
## Reason
Proactive consumer outreach requires knowing which consumers are affected. Without usage data, you cannot assist migration.
---
## Bad Example
```php
// No logging on deprecated endpoint
public function oldUsersIndex() { return User::all(); }
```
---
## Good Example
```php
public function oldUsersIndex(Request $request) {
    DeprecationLogger::log($request->user(), 'GET /v1/users');
    return User::all();
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Cannot identify or contact affected consumers before cutoff; inevitable breakage and escalations.
---

## Rule 6: Send Multiple Notification Waves
---
## Category
Reliability
---
## Rule
Deprecation notification must be sent in at least three waves: at announcement, at midpoint, and 30 days before cutoff. Never send a single notification.
---
## Reason
Single notifications are easily missed (spam filters, vacation, team changes). Multiple waves increase the probability that the right person sees the message.
---
## Bad Example
```php
// One email 6 months before cutoff, no reminders
Mail::to($consumers)->send(new DeprecationNotice(...));
```
---
## Good Example
```php
// Scheduled notifications
DeprecationNotifier::schedule($deprecation, [
    'at_announcement' => now()->subMonths(6),
    'at_midpoint' => now()->subMonths(3),
    'at_30_days_before' => now()->subDays(30),
]);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers miss the only notification; cutoff surprises cause escalations and emergency exception requests.
---

## Rule 7: Use ISO 8601 Dates in All Deprecation Metadata
---
## Category
Maintainability
---
## Rule
Always use ISO 8601 formatted dates in `Sunset` headers, deprecation metadata, and deprecation notices. Never use ambiguous formats like "next quarter" or "Q3 2026".
---
## Reason
ISO 8601 is machine-parseable, unambiguous across time zones, and standard across the HTTP ecosystem.
---
## Bad Example
```php
'sunset' => 'November 2026' // ambiguous: no timezone, no day
```
---
## Good Example
```php
'sunset' => '2026-11-01T00:00:00Z' // ISO 8601 UTC
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer tooling cannot parse dates; misinterpretation leads to unexpected cutoffs or missed deadlines.
---

## Rule 8: Never Perpetually Deprecate
---
## Category
Maintainability
---
## Rule
Always set a concrete `Sunset` date when deprecating. Never mark endpoints as deprecated without scheduling their removal.
---
## Reason
Perpetual deprecation accumulates technical debt, confuses consumers ("is this still supported?"), and bypasses the cleanup cycle.
---
## Bad Example
```php
// No sunset date set — deprecated forever with no removal plan
header('Deprecation: true');
// header('Sunset: ...') // MISSING
```
---
## Good Example
```php
// Concrete removal date required
header('Deprecation: true');
header('Sunset: Sat, 01 Nov 2026 00:00:00 GMT');
```
---
## Exceptions
Deprecation of internal-only endpoints may omit Sunset if cleanup is handled via internal process.
---
## Consequences Of Violation
Dead code accumulates; consumers lose trust in deprecation signals; removal never happens.
