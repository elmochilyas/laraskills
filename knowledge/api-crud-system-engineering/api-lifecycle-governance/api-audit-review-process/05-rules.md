# Phase 5: Rules — API Audit Review Process

## Rule 1: Run Automated Checks Before Manual Review
---
## Category
Maintainability
---
## Rule
Always run all automated audit checks (Spectral linting, deprecation report, security scan, documentation diff) before starting manual review. Never begin manual review without automated results.
---
## Reason
Automated checks catch the majority of issues instantly, freeing human reviewers to focus on semantic and contextual problems that automation cannot detect.
---
## Bad Example
```php
// Manual review started without automated report
// Reviewer spends 2 hours finding naming violations Spectral would catch in 10 seconds
```
---
## Good Example
```php
$report = AuditRunner::runAutoChecks(['spectral', 'deprecation', 'security', 'docs']);
$manualItems = $report->filter(fn($i) => !$i->autoResolvable);
// Reviewer handles only remaining items
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Audit time wasted on machine-detectable issues; reviewer fatigue; semantic issues missed.
---

## Rule 2: Measure Remediation Rate, Not Finding Rate
---
## Category
Maintainability
---
## Rule
Always track and report remediation closure rate as the primary audit metric. Never measure success by the number of findings discovered.
---
## Reason
High finding counts indicate thorough auditing, not API health. Closure rate measures whether issues are actually being fixed.
---
## Bad Example
```php
// Dashboard shows "47 findings discovered this quarter" — meaningless without closure rate
```
---
## Good Example
```php
// Dashboard shows remediation rate
'remediation_rate' => 85, // % of findings closed within target time
'critical_closure_rate' => 100, // all critical fixed within 48h
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
High finding counts with low remediation creates false sense of improvement; findings accumulate.
---

## Rule 3: Allocate 10% of Sprint Capacity to Remediation
---
## Category
Maintainability
---
## Rule
Always allocate at least 10% of each sprint's capacity to remediating audit findings. Never let audit remediation compete with feature work without dedicated allocation.
---
## Reason
Without dedicated capacity, remediation is deferred indefinitely. Findings accumulate until they become unmanageable.
---
## Bad Example
```php
// No dedicated remediation time
// "We'll fix audit findings when we have time" — never happens
```
---
## Good Example
```php
// 10% sprint allocation
$sprint->capacity = 100; // story points
$sprint->remediationBudget = 10; // 10% reserved for audit findings
```
---
## Exceptions
Startup phase or MVP delivery may temporarily reduce allocation to 5% with explicit leadership approval.
---
## Consequences Of Violation
Accumulated technical debt; audit fatigue (same findings quarter after quarter); governance process discredited.
---

## Rule 4: Enforce Severity-Based Action Thresholds
---
## Category
Reliability
---
## Rule
Always enforce time-based remediation thresholds by severity: Critical within 48 hours, Major within current sprint, Minor within current quarter. Never allow critical findings to remain unresolved beyond 48 hours.
---
## Reason
Severity-specific SLAs ensure the most impactful issues are addressed urgently while lower-severity items are handled systematically.
---
## Bad Example
```php
// Same deadline for all findings regardless of severity
AuditFinding::all()->each->resolveBy(endOfQuarter: true);
```
---
## Good Example
```php
match ($finding->severity) {
    Severity::CRITICAL => $finding->resolveBy(now()->addHours(48)),
    Severity::MAJOR => $finding->resolveBy(now()->addDays(14)), // end of sprint
    Severity::MINOR => $finding->resolveBy(now()->addMonths(3)),
};
```
---
## Exceptions
Critical findings requiring architectural changes may escalate to 7-day timeline with VP approval.
---
## Consequences Of Violation
Critical issues left open; production incidents from unaddressed findings; SLA breaches.
---

## Rule 5: Rotate Auditor Role Each Quarter
---
## Category
Maintainability
---
## Rule
Always rotate the auditor role among team members each quarter. Never let the same person conduct consecutive audits.
---
## Reason
Fresh perspectives catch issues that repeated auditors normalize. Rotation also distributes knowledge and prevents single-person bottlenecks.
---
## Bad Example
```php
// Same auditor for 4 consecutive quarters
// "I've seen these findings before, they're fine" — normalization of deviance
```
---
## Good Example
```php
// Quarter rotation
'auditor' => $team->nextAuditor(); // auto-rotated, no repeats within 4 quarters
```
---
## Exceptions
Teams smaller than 3 people may use external reviewer or paired audit.
---
## Consequences Of Violation
Auditor blind spots; stale perspectives; institutionalized normalizing of issues.
---

## Rule 6: Store Audit Reports in Version Control
---
## Category
Maintainability
---
## Rule
Always commit audit reports and remediation plans to the repository alongside code. Never store audit results only in email or chat archives.
---
## Reason
Version-controlled audit reports provide an immutable historical record, enable trend analysis, and are accessible to all team members.
---
## Bad Example
```php
// Audit report sent via email — nobody can find it later
Mail::send(new AuditReport($findings));
```
---
## Good Example
```php
// Report committed to repo
Storage::disk('repo')->put("audits/2026-Q2-report.md", $report->toMarkdown());
Git::commit("docs/audits/2026-Q2-report.md", "Add Q2 2026 audit report");
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Audit reports lost; trend analysis impossible; compliance gaps in regulated environments.
---

## Rule 7: Never Let Audits Cover Only Production
---
## Category
Reliability
---
## Rule
Always audit staging and development environments alongside production. Never restrict audits to production only.
---
## Reason
Issues caught in staging or development cost less than issues caught in production. Environment-specific problems (config drift, secrets) are only detectable by auditing all environments.
---
## Bad Example
```php
// Production-only audit
$environments = ['production']; // staging issues missed
```
---
## Good Example
```php
$environments = ['production', 'staging', 'development'];
foreach ($environments as $env) {
    $report = AuditRunner::run(Environment::fromString($env));
}
```
---
## Exceptions
Development environments with no stable API surface may be excluded.
---
## Consequences Of Violation
Config drift between environments; staging-only issues reach production; security gaps undetected.
