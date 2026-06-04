# Phase 5: Rules — Sunset Header Implementation

## Always Pair Sunset With Deprecation Header
---
## Category
Maintainability
---
## Rule
Never send a `Sunset` header without a preceding `Deprecation` header — always pair them on deprecated endpoint responses.
---
## Reason
A `Sunset` header without `Deprecation` is a surprise removal announcement — consumers had no warning that the version was deprecated.
---
## Bad Example
```php
$response->header('Sunset', '...'); // no Deprecation header in any prior response
```
---
## Good Example
```php
$response->header('Deprecation', 'true');
$response->header('Sunset', Carbon::create(2026, 12, 31)->toRfc7231String());
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer shock at unexpected removal deadline; trust erosion; support crisis.
---

## Use HTTP-Date Format For Sunset Value
---
## Category
Reliability
---
## Rule
Always format the `Sunset` header value as an RFC 7231 HTTP-date using Carbon's `toRfc7231String()` — never use arbitrary date formats.
---
## Reason
RFC 8594 specifies HTTP-date format. Non-standard date formats cannot be parsed by consumer tooling that reads the Sunset header.
---
## Bad Example
```php
$response->header('Sunset', '2026-12-31'); // non-standard format
```
---
## Good Example
```php
$response->header('Sunset', Carbon::create(2026, 12, 31, 23, 59, 59)->toRfc7231String());
// Output: Sun, 31 Dec 2026 23:59:59 GMT
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer tooling cannot parse the sunset date; automated notification systems ignore the header.
---

## Set Sunset Minimum 6 Months After Deprecation
---
## Category
Governance
---
## Rule
Always set the `Sunset` date at least 6 months after the initial `Deprecation` header was first served.
---
## Reason
Consumers need sufficient time to plan and execute migration — 6 months is the industry minimum for public APIs.
---
## Bad Example
```php
// Sunset set 2 weeks after deprecation
```
---
## Good Example
```php
// Deprecation started: 2026-01-01, Sunset: 2026-12-31 (12 months)
$response->header('Sunset', Carbon::parse('2026-12-31')->toRfc7231String());
```
---
## Exceptions
Internal APIs where the consuming team has agreed to a shorter timeline via direct communication.
---
## Consequences Of Violation
Consumers unable to migrate before removal; SLA violations; account churn.
---

## Automate Enforcement At Midnight On Sunset Date
---
## Category
Reliability
---
## Rule
Always run a scheduled command daily that checks sunset dates and automatically returns 410 Gone for versions past their sunset.
---
## Reason
Manual sunset enforcement is forgotten or delayed — automated enforcement ensures the promise is kept.
---
## Bad Example
```php
// No automation — developers must remember to remove the version
```
---
## Good Example
```php
// Scheduled command runs daily
$schedule->command('api:enforce-sunset')->daily();
// Returns 410 automatically when date is reached
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Missed sunset dates; consumers learn to ignore deadlines; perpetual deprecated versions.
---

## Never Extend A Sunset Date Lightly
---
## Category
Governance
---
## Rule
Never extend a published `Sunset` date unless the cost of breaking consumers exceeds the cost of maintaining the old version — and communicate the extension immediately.
---
## Reason
Extending a sunset date trains consumers that deadlines are negotiable, reducing future deprecation urgency.
---
## Bad Example
```php
// Sunset date silently extended without consumer notification
```
---
## Good Example
```php
// Extension is a last resort, communicated to all consumers immediately
Log::channel('consumer-notification')->warning('Sunset date extended for v1 to 2027-06-01', ...);
```
---
## Exceptions
When the alternative version is discovered to have a critical security vulnerability that requires remediation.
---
## Consequences Of Violation
Consumer trust erosion; future deprecation warnings ignored; permanent maintenance burden.
---

## Cache Post-Sunset 410 Responses
---
## Category
Performance
---
## Rule
Always set cache headers on 410 responses for retired versions so CDNs and proxies can serve them without hitting the application.
---
## Reason
A burst of requests to a retired version can overwhelm the application — caching reduces load to zero for repeated requests.
---
## Bad Example
```php
abort(410, 'Removed.'); // no cache headers
```
---
## Good Example
```php
abort(410, 'API version v1 has been removed.')
    ->header('Cache-Control', 'public, max-age=86400');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Retired version traffic spike; application CPU waste on 410 responses that could be served from cache.
---

## Store Sunset Dates In Config, Not Hardcoded
---
## Category
Maintainability
---
## Rule
Always store sunset dates in configuration files — never hardcode them in middleware, controllers, or commands.
---
## Reason
Hardcoded dates require code changes and deploys to update; config-based dates can be updated in a single file.
---
## Bad Example
```php
public function handle($request, $next) {
    $sunset = '2026-12-31'; // hardcoded in middleware
}
```
---
## Good Example
```php
// config/api/sunset.php
'v1' => '2026-12-31',
// Middleware reads from config
$sunset = Carbon::parse(config("api.sunset.{$version}"));
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Emergency date changes require full deployment; config drift across environments.
