# Phase 5: Rules — Phased Deprecation Timeline

## Always Implement All Four Phases
---
## Category
Governance
---
## Rule
Never skip phases in the deprecation lifecycle — always implement Announce → Warn → Enforce → Remove in order.
---
## Reason
Skipping the Announce phase surprises consumers; skipping Warn denies them migration time; skipping Enforce removes the version without degradation warnings.
---
## Bad Example
```php
// Only REMOVED phase — no announcement, no warning, no enforcement
```
---
## Good Example
```php
enum DeprecationPhase: string { case ANNOUNCED = 'announced'; case WARNING = 'warning'; case ENFORCEMENT = 'enforcement'; case REMOVED = 'removed'; }
```
---
## Exceptions
Emergency security removals where the vulnerability requires immediate action.
---
## Consequences Of Violation
Consumer panic; SLA breach; reputational damage; support crisis.
---

## Use Config-Driven Dates For Automated Phase Transitions
---
## Category
Reliability
---
## Rule
Always store phase transition dates in configuration files and automate transitions via a scheduled command — never rely on manual date tracking.
---
## Reason
Manual phase transitions are forgotten, delayed, or applied inconsistently across environments.
---
## Bad Example
```php
// Phase manually changed by editing middleware — no schedule
```
---
## Good Example
```php
// config/api/deprecation.php
'v1' => ['warning_phase_until' => '2026-06-01', 'enforcement_phase_from' => '2026-07-01']
// Scheduled: php artisan api:transition-phases
$schedule->command('api:transition-phases')->daily();
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Version stays in enforcement phase indefinitely or skips directly to removal without warning.
---

## Keep Warn Phase At Least Three Months For Public APIs
---
## Category
Governance
---
## Rule
Always set the Warn phase duration to at least 3 months (6 months recommended) for public APIs before transitioning to Enforce.
---
## Reason
Many consumers have monthly or quarterly release cycles — a shorter window leaves them unable to migrate before enforcement.
---
## Bad Example
```php
// Warn phase = 2 weeks
```
---
## Good Example
```php
// Warn phase = 6 months (standard for public APIs)
'v1' => ['deprecation_announced' => '2026-01-01', 'enforcement_begins' => '2026-07-01']
```
---
## Exceptions
Internal APIs with a single consumer team that controls their own deployment schedule.
---
## Consequences Of Violation
Consumers locked out mid-release cycle; missed SLA guarantees; account churn.
---

## Never Transition Directly From Announce To Remove
---
## Category
Reliability
---
## Rule
Guard the phase state machine so that transitions always go through Warn and Enforce — never jump from Announce to Remove.
---
## Reason
A bug that skips directly to Remove immediately breaks all consumers on that version without any warning.
---
## Bad Example
```php
// Phase machine allows: ANNOUNCED → REMOVED
```
---
## Good Example
```php
public function transition(DeprecationPhase $current): DeprecationPhase {
    return match ($current) {
        DeprecationPhase::ANNOUNCED => DeprecationPhase::WARNING,
        DeprecationPhase::WARNING => DeprecationPhase::ENFORCEMENT,
        DeprecationPhase::ENFORCEMENT => DeprecationPhase::REMOVED,
        DeprecationPhase::REMOVED => DeprecationPhase::REMOVED,
    };
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
All consumers on the version instantly lose access; emergency rollback required.
---

## Implement Enforcement As Degradation, Not Instant Breakage
---
## Category
Design
---
## Rule
Always implement the Enforce phase with gradual degradation (rate limiting, intentional latency) rather than instant endpoint breakage.
---
## Reason
Gradual degradation gives consumers a "last call" period to complete their migration while experiencing mild pressure.
---
## Bad Example
```php
case ENFORCEMENT => abort(410, 'Migrate now'); // instant breakage
```
---
## Good Example
```php
case ENFORCEMENT => RateLimiter::hit($key, 60); // degraded but functional
```
---
## Exceptions
Versions with zero traffic for 30+ days — safe to remove immediately.
---
## Consequences Of Violation
Consumers with pending migrations are cut off without warning; escalations and rollback.
---

## Return 410 Gone With Migration Message In Removal Phase
---
## Category
Reliability
---
## Rule
Always return HTTP 410 Gone with a migration message and link during the Remove phase — never return 404 or a generic error.
---
## Reason
410 explicitly signals intentional removal (vs accidental 404), and the migration message gives consumers a way forward.
---
## Bad Example
```php
abort(404); // wrong — implies the resource was never there
```
---
## Good Example
```php
abort(410, 'API version v1 has been removed. Migrate to v2: https://docs.example.com/migration');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer confusion between "not found" and "removed"; no migration path.
---

## Provide A Phase Status Endpoint For Consumers
---
## Category
Maintainability
---
## Rule
Always provide a public endpoint that returns the current deprecation phase and dates for each API version.
---
## Reason
Consumers need a programmatic way to check whether their version is still active, deprecated, or nearing removal.
---
## Bad Example
```php
// No status endpoint
```
---
## Good Example
```php
Route::get('/api/status', function () {
    return config('api.versions');
    // Returns: {"v1": {"phase": "warning", "removal": "2026-12-31"}, "v2": {"phase": "active"}}
});
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers cannot programmatically check version status; manual tracking leads to migration delays.
---

## Track Consumer Migration Percentage Per Phase
---
## Category
Governance
---
## Rule
Always monitor the percentage of consumers who have migrated off the deprecated version before advancing from Warn to Enforce.
---
## Reason
Advancing to enforcement while a significant percentage of consumers are still on the deprecated version causes production incidents.
---
## Bad Example
```php
// Phase transitions based on date only — ignores consumer migration progress
```
---
## Good Example
```php
// Hold enforcement until migration > 90%
if ($migrationPercentage < 90) { $this->delayEnforcement($version); }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Enforcement breaks consumers who weren't able to migrate; emergency timeline extension and reputation damage.
