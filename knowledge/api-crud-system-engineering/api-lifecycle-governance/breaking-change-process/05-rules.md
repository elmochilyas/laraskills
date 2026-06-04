# Phase 5: Rules — Breaking Change Process

## Rule 1: Require RFC with Impact Analysis Before Implementation
---
## Category
Architecture
---
## Rule
Always write a structured RFC with quantitative impact analysis before implementing any breaking change. Never implement a breaking change without an approved RFC.
---
## Reason
RFCs prevent wasted implementation effort on changes that may be rejected. Impact analysis ensures stakeholders understand the cost before approving.
---
## Bad Example
```php
// Breaking change implemented and deployed without RFC
// "Just rename the field, it's cleaner"
```
---
## Good Example
```markdown
## RFC-042: User Field Rename
### Impact Analysis
- 34 consumers affected
- 12 using `username` field in production
- Migration effort: 2 days per consumer average
- Timeline: Proposal -> Approval (1w) -> Migration window (6mo) -> Cutoff
```
---
## Exceptions
Emergency security fixes may bypass RFC via exception process with VP sign-off.
---
## Consequences Of Violation
Wasted implementation; consumer breakage discovered post-deployment; leadership escalations.
---

## Rule 2: Obtain CAB Approval Before Implementation
---
## Category
Governance
---
## Rule
Always submit breaking change RFCs to the Change Advisory Board for approval. Never bypass the CAB for any breaking change, regardless of perceived size.
---
## Reason
CAB provides cross-functional review (engineering + product) ensuring all perspectives are considered. Small breaking changes are still breaking.
---
## Bad Example
```php
// "Minor" breaking change approved by one engineer, no CAB review
// CAB bypassed because "it's just a field rename"
```
---
## Good Example
```php
// CAB standard review: 48-hour SLA
$cab = app(ChangeAdvisoryBoard::class);
$approval = $cab->review($rfc, urgency: Urgency::STANDARD);
if ($approval->denied()) {
    throw new BreakingChangeDeniedException($approval->reason());
}
```
---
## Exceptions
Emergency security fixes may bypass CAB with VP-level sign-off and post-incident CAB review.
---
## Consequences Of Violation
Unreviewed breaking changes reach production; missed consumer impact; regulatory compliance gaps.
---

## Rule 3: Dark Launch Breaking Changes Behind Feature Flags
---
## Category
Reliability
---
## Rule
Always deploy breaking changes behind feature flags initially, activating only for internal testing. Never activate breaking changes for consumers directly on first deployment.
---
## Reason
Dark launches enable testing in production without consumer impact, allowing you to verify the change works before exposing it.
---
## Bad Example
```php
// Breaking change deployed directly to all consumers
public function index() { return $this->newFormat(); } // Immediate breakage
```
---
## Good Example
```php
public function index(Request $request) {
    if (Feature::active('v2-users-response')) {
        return $this->newFormat();
    }
    return $this->oldFormat();
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Undiscovered bugs affect all consumers immediately; rollback required; incident declared.
---

## Rule 4: Create Tested Migration Guide Before Rollout
---
## Category
Maintainability
---
## Rule
Always write and test every code example in the migration guide before announcing a breaking change. Never publish untested migration instructions.
---
## Reason
Untested examples contain errors that block consumer migration and generate support requests that negate the purpose of the guide.
---
## Bad Example
```markdown
<!-- Untested migration example — likely broken -->
```php
$response = Http::get('/v2/users'); // assumes v2 response format
```*
```
---
## Good Example
```markdown
<!-- Tested migration example — CI-verified -->
```php
$response = Http::get('/v2/users');
$data = $response->json('data'); // CI test passes against actual v2
```*
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumers blocked by broken examples; support tickets increase; migration delayed.
---

## Rule 5: Progressive Rollout with Monitoring Gates
---
## Category
Reliability
---
## Rule
Always roll out breaking changes progressively: 1% -> 5% -> 25% -> 100% of consumers, with monitoring gates at each stage. Never roll out to all consumers at once.
---
## Reason
Progressive rollout limits blast radius. Monitoring gates detect issues before they affect all consumers.
---
## Bad Example
```php
// 100% rollout immediately
$active = true; // All consumers affected at once
```
---
## Good Example
```php
$percentage = match (true) {
    $monitoring->errorRateOk() && $monitoring->durationOk() => $this->nextStage(),
    default => $this->currentStage(), // rollback if gates fail
};
Feature::percentage('v2-response', $percentage);
```
---
## Exceptions
Security fixes requiring immediate full rollout may bypass progressive stages.
---
## Consequences Of Violation
Undetected issues impact all consumers simultaneously; full rollback required; SLO breach.
---

## Rule 6: Maintain Old Behavior for 30 Days Post-Migration
---
## Category
Reliability
---
## Rule
Always keep the old behavior available (deployed but deactivated) for 30 days after the migration cutoff date. Never delete old code immediately after the migration window closes.
---
## Reason
Post-migration monitoring catches consumers who missed the cutoff. Immediate deletion forces emergency restoration.
---
## Bad Example
```php
// Old code deleted on cutoff date
// "v1 users" controller removed from codebase
```
---
## Good Example
```php
// Old behavior feature-flagged, not deleted
if (Feature::active('v1-fallback') && $request->header('X-API-Version') === 'v1') {
    return (new V1Controller())->index(); // still deployed but inactive
}
// Scheduled cleanup after 30 days of zero usage
```
---
## Exceptions
Security vulnerabilities requiring immediate removal may skip retention.
---
## Consequences Of Violation
Emergency hotfix required to restore old behavior; extended incident duration.
---

## Rule 7: Conduct Individual Consumer Outreach
---
## Category
Reliability
---
## Rule
Always contact affected consumers individually (via named contacts) during the migration window. Never rely solely on changelog and dashboard notifications.
---
## Reason
Individual outreach ensures the right technical contact receives and understands the migration requirements. Generic notifications are easily missed.
---
## Bad Example
```php
// Only changelog announcement — no direct contact
Changelog::add('Breaking change: v2 users endpoint');
```
---
## Good Example
```php
foreach ($affectedConsumers as $consumer) {
    Notification::route('mail', $consumer->technicalContact)
        ->notify(new BreakingChangeMigrationNotice(
            rfc: $rfc,
            deadline: $cutoffDate,
            migrationGuide: $guideUrl,
        ));
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Key decision-makers remain unaware; migration not scheduled; last-minute escalation at cutoff.
