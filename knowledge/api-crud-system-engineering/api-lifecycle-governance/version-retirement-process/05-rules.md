# Phase 5: Rules — Version Retirement Process

## Rule 1: Audit All Consumers Before Announcing Freeze
---
## Category
Maintainability
---
## Rule
Always complete a full consumer audit before announcing a version freeze. Identify every active consumer, their contact, and their integration depth. Never announce retirement without knowing who is affected.
---
## Reason
Unknown consumers discovered during migration window cause delays, escalations, and emergency exception requests.
---
## Bad Example
```php
// Announced retirement without consumer audit
Artisan::call('version:retire', ['version' => 'v1']);
// No consumer registry query beforehand
```
---
## Good Example
```php
$consumers = ConsumerRegistry::getActiveForVersion('v1');
// Audit complete: 47 consumers, 12 high-priority, 35 standard
// Only then schedule retirement announcement
```
---
## Exceptions
Security emergencies requiring immediate removal bypass consumer audit.
---
## Consequences Of Violation
Missed consumers break at cutoff; emergency exceptions undermine retirement schedule; escalations to leadership.
---

## Rule 2: Implement Traffic-Light Retirement Stages
---
## Category
Reliability
---
## Rule
Always implement four retirement stages — Green (active), Yellow (frozen + deprecation headers), Red (410 Gone), Black (404 Not Found). Never jump directly from active to 410.
---
## Reason
Gradual stages give consumers time to detect and respond at each phase, reducing surprise breakage.
---
## Bad Example
```php
// Direct jump from active to 404
if ($version === 'v1') { abort(404); }
```
---
## Good Example
```php
$stage = VersionManager::getStage('v1');
match ($stage) {
    'green'  => // normal operation
    'yellow' => // frozen + Deprecation headers
    'red'    => response()->json(['error' => 'Gone'], 410)
        ->header('Link', '<https://docs.example.com/migration>; rel="migration"'),
    'black'  => abort(404),
};
```
---
## Exceptions
Security vulnerabilities requiring immediate removal may skip directly to black.
---
## Consequences Of Violation
Consumers have no transitional warning; runtime breakage causes support incidents and escalations.
---

## Rule 3: Return 410 Gone with Migration Link, Not Bare 404
---
## Category
Maintainability
---
## Rule
Always return HTTP 410 Gone with a `Link` header pointing to the migration guide when a retired version is accessed. Never return a bare 404 Not Found.
---
## Reason
410 explicitly signals that the resource existed but is gone intentionally (vs. 404 which means unknown). The `Link` header gives consumers an actionable path forward.
---
## Bad Example
```php
abort(404); // No indication that this was intentionally removed
```
---
## Good Example
```php
return response()->json([
    'error' => [
        'code' => 'VERSION_RETIRED',
        'message' => 'API version v1 has been retired.',
    ]
], 410)->header('Link', '<https://docs.example.com/v1-to-v2>; rel="migration"');
```
---
## Exceptions
After the grace period expires (typically 30 days post-cutoff), return 404 instead of 410.
---
## Consequences Of Violation
Consumers cannot distinguish "never existed" from "removed"; no upgrade path provided; support escalations increase.
---

## Rule 4: Maintain Rollback Capability for 30 Days Post-Cutoff
---
## Category
Reliability
---
## Rule
Always maintain a feature flag to restore a retired version for up to 30 days after cutoff. Never delete routing capability immediately after sunset date.
---
## Reason
Critical consumers who missed the cutoff window still need access during escalation handling.
---
## Bad Example
```php
// Routes entirely deleted at midnight on sunset date
public function boot(): void {
    Route::middleware('api')->group(fn() => // v1 routes removed from codebase);
}
```
---
## Good Example
```php
// Feature-flag controlled version routing
if (Feature::active('version-v1-rollback')) {
    Route::prefix('v1')->group(fn() => require base_path('routes/v1.php'));
}
```
---
## Exceptions
Security vulnerability fixes requiring version removal may disable rollback.
---
## Consequences Of Violation
Emergency restoration requires hotfix deployment and redeployment, extending outage duration.
---

## Rule 5: Archive Spec and Docs Before Removal
---
## Category
Maintainability
---
## Rule
Always archive the OpenAPI specification and documentation to read-only storage (S3, CDN) before removing a retired version. Never delete the spec when the version is removed.
---
## Reason
Archived specs enable future reference for compliance, debugging, and supporting legacy consumers still migrating.
---
## Bad Example
```php
// Routes and spec both deleted
Storage::delete('openapi/v1.yaml');
Route::prefix('v1')->group(...); // also removed
```
---
## Good Example
```php
// Archive spec before removing routes
Storage::disk('s3-archives')->put('openapi/v1/2026-06-02.yaml', $specYaml);
Route::prefix('v1')->group(...); // then remove routes
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Lost historical specification; compliance gaps; inability to support legacy debugging.
---

## Rule 6: Grant Exceptions with Expiration Dates
---
## Category
Governance
---
## Rule
Always set an expiration date on consumer exception allowlists for retired versions. Never grant indefinite extensions.
---
## Reason
Permanent exceptions defeat the purpose of retirement. Expired exceptions force follow-up and eventual migration.
---
## Bad Example
```php
// No expiration — consumer stays on v1 forever
$allowlist[$consumerId] = true;
```
---
## Good Example
```php
$allowlist[$consumerId] = [
    'granted_at' => now(),
    'expires_at' => now()->addMonths(3), // hard deadline
];
```
---
## Exceptions
Regulatory requirements may mandate indefinite legacy access with compliance review.
---
## Consequences Of Violation
Version retirement never completes; old code and infrastructure remain indefinitely; tech debt accumulates.
---

## Rule 7: Stagger Migration Progress Tracking
---
## Category
Scalability
---
## Rule
Always track consumer migration progress via dashboard from the freeze announcement. Generate migration reports daily, not continuously. Never lose visibility of who has migrated.
---
## Reason
Without tracking, you cannot measure retirement progress or identify consumers needing outreach before cutoff.
---
## Bad Example
```php
// No migration tracking at all
// "Hope everyone migrated by the deadline"
```
---
## Good Example
```php
// Scheduled daily check
$schedule->call(function () {
    $report = MigrationTracker::generateDailyReport('v1');
    if ($report->unmigratedCount() > 0) {
        Notification::route('slack', config('services.slack.migration'))
            ->notify(new UnmigratedConsumersAlert($report));
    }
})->dailyAt('09:00');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Cutoff date arrives with unmigrated consumers unknown; last-minute scrambles and exceptions.
