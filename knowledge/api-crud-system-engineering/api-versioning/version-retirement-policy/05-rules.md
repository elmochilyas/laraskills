# Phase 5: Rules — Version Retirement Policy

## Publish The Retirement Policy Publicly
---
## Category
Governance
---
## Rule
Always publish the version retirement policy at a stable URL that consumers can reference and programmatically check.
---
## Reason
An unpublished policy is not discoverable — consumers cannot plan their migration timelines without knowing the rules.
---
## Bad Example
```php
// No published retirement policy
```
---
## Good Example
```php
// config/api/retirement.php published at /api/policy
// Returns minimum notice periods, retirement criteria, and version statuses
```
---
## Exceptions
Internal-only APIs where consumers are in the same organization and policy is shared via internal documentation.
---
## Consequences Of Violation
Consumers cannot plan migration; surprise removals; trust erosion.
---

## Never Retire Without A Stable Alternative Available
---
## Category
Reliability
---
## Rule
Never retire an API version unless a stable, production-tested alternative version exists for all endpoints the retired version served.
---
## Reason
Retiring a version without an alternative leaves consumers with no migration target — they cannot upgrade.
---
## Bad Example
```php
// v1 retired but v2 is still in beta with known bugs
```
---
## Good Example
```php
// v2 has been in production for 6 months, consumer migration at 95%
// All v1 endpoints have equivalent v2 endpoints
```
---
## Exceptions
Emergency security removal where the old version has a critical vulnerability and staying is riskier than removing.
---
## Consequences Of Violation
Consumers without an upgrade path are forced off the API entirely; permanent consumer churn.
---

## Automate Retirement Eligibility Checks
---
## Category
Reliability
---
## Rule
Always run automated retirement eligibility checks that evaluate traffic percentage, notice period, and alternative stability before scheduling removal.
---
## Reason
Manual retirement evaluation is inconsistent and often delayed, leaving inactive versions running indefinitely.
---
## Bad Example
```php
// Manual decision — no automated check
```
---
## Good Example
```php
$schedule->command('api:check-retirement-eligibility')->weekly();
// Flags versions with traffic < 1% for 60 days, notice period met, alternative stable
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Versions with zero traffic continue running, consuming maintenance and infrastructure resources.
---

## Use A Retirement Queue Prioritized By Traffic
---
## Category
Maintainability
---
## Rule
Always maintain a prioritized retirement queue that removes least-used versions first, ordered by consumer count and traffic volume.
---
## Reason
Removing a high-traffic version first risks breaking many consumers — remove low-traffic versions first to validate the process.
---
## Bad Example
```php
// Removal order is arbitrary
```
---
## Good Example
```php
// Retirement queue ordered by ascending traffic %, then by consumer count
$queue = collect(config('api.versions'))
    ->filter(fn($v) => $v['status'] === 'DEPRECATED')
    ->sortBy(['traffic_percentage', 'consumer_count']);
```
---
## Exceptions
Security-driven removals where the vulnerability severity overrides traffic prioritization.
---
## Consequences Of Violation
High-traffic version removed incorrectly; consumer disruption despite low-traffic versions being easier to retire first.
---

## Maintain Exception Register With Approval Chain
---
## Category
Governance
---
## Rule
Always document every retirement policy exception in a register with rationale, approver name, and expiration date — never grant exceptions verbally.
---
## Reason
Undocumented exceptions accumulate silently, and the policy becomes meaningless when every retirement is an exception.
---
## Bad Example
```php
// Exception granted verbally in a meeting — no record
```
---
## Good Example
```php
// exception_register.md
| Version | Rationale | Approver | Expiry | Date |
|---------|-----------|----------|--------|------|
| v1      | Revenue impact > $500K | VP Eng | 2027-06-01 | 2026-05-01 |
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Policy erosion; exception proliferation; audit failure.
---

## Post-Retention 410 Guarantee For 90 Days
---
## Category
Reliability
---
## Rule
Always maintain 410 Gone responses for at least 90 days after version retirement so consumers debugging failed requests can identify the removed version.
---
## Reason
Consumers with stale integrations hit retired endpoints weeks after removal — a 410 with migration info guides them back.
---
## Bad Example
```php
// Version removed — requests return 404 immediately
```
---
## Good Example
```php
// Version retired — returns 410 with migration link
// 410 maintained for 90+ days
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers hitting retired endpoints see generic 404s with no guidance; escalations to find "what happened to v1?".
---

## Config-Gated Route Loading Enables Emergency Restore
---
## Category
Reliability
---
## Rule
Always use config-gated route loading so a retired version can be restored immediately by flipping a config value if an emergency arises.
---
## Reason
Post-retirement issues (alternative version bug, consumer emergency) require instant restore — not a code deploy and release pipeline.
---
## Bad Example
```php
// Retired version routes permanently removed from RouteServiceProvider
```
---
## Good Example
```php
// Route loading gated by config — restore by setting active: true
if (config("api.versions.v1.active", false)) {
    Route::prefix('api/v1')->group(base_path('routes/api-v1.php'));
}
```
---
## Exceptions
Versions retired for security reasons (re-enabling would reintroduce the vulnerability).
---
## Consequences Of Violation
Emergency restore requires full deployment pipeline; recovery time measured in hours, not seconds.
---

## Perform Post-Retirement Validation
---
## Category
Testing
---
## Rule
Always run an automated test suite against retired versions to verify they return 410 Gone and serve no data.
---
## Reason
Configuration drift or forgotten routes can accidentally serve data for retired versions, creating a security risk.
---
## Bad Example
```php
// No post-retirement verification
```
---
## Good Example
```php
// CI test runs weekly against retired versions
public function test_retired_v1_returns_410(): void {
    $response = $this->getJson('/api/v1/users');
    $response->assertStatus(410);
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Silent data serving on retired versions; security vulnerability; regulatory compliance risk.
