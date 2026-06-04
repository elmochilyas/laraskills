# Phase 5: Rules — When to Create New Version

## Exhaust Backward-Compatible Options First
---
## Category
Design
---
## Rule
Always exhaust all backward-compatible options (optional fields, new endpoints, relaxed validation) before creating a new API version.
---
## Reason
Each new version is a maintenance burden carried for years — development, testing, documentation, and consumer migration.
---
## Bad Example
```php
// Created v2 because a new field was needed — could have been added as optional in v1
```
---
## Good Example
```php
// Added new field as optional with null default in v1 — no new version needed
return ['id' => $this->id, 'excerpt' => $this->when($request->has('include'), $this->excerpt)];
```
---
## Exceptions
When the change requires removing or fundamentally altering an existing field that all consumers depend on.
---
## Consequences Of Violation
Unnecessary version proliferation; maintenance cost for versions that could have been avoided.
---

## Use A Decision Tree Service For Version Evaluation
---
## Category
Design
---
## Rule
Always implement a `VersionDecisionService` that programmatically evaluates a proposed change against the version decision tree instead of relying on subjective human judgment.
---
## Reason
Subjective evaluation leads to inconsistent decisions — one developer creates a new version for a change another would make backward-compatible.
---
## Bad Example
```php
// Developer creates v2 because "this change feels big"
```
---
## Good Example
```php
class VersionDecisionService {
    public function evaluate(Change $change): string {
        return match (true) {
            !$change->isBackwardCompatible() && !$change->canBeMadeCompatible() => 'NEW_VERSION',
            !$change->isBackwardCompatible() && $change->canBeMadeCompatible() => 'COMPATIBLE_WITH_WORK',
            default => 'BACKWARD_COMPATIBLE',
        };
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent version creation; some breaking changes shipped as MINOR, some backward-compatible changes create unnecessary versions.
---

## Document Every New Version With An ADR
---
## Category
Governance
---
## Rule
Never create a new API version without writing an Architecture Decision Record documenting the change, compatibility assessment, cost estimate, and migration plan.
---
## Reason
A new version without an ADR has no audit trail — future teams won't know why it was created or what changed.
---
## Bad Example
```php
// v2 created, no documentation of what changed or why a new version was necessary
```
---
## Good Example
```php
// docs/adr/2026-03-01-create-v2.md
// Change: Replace username field with email field
// Breaking: Yes — field removal
// Backward-compatible options exhausted: No default possible
// Cost: 3 weeks development, 2 months migration, 2 years maintenance
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
No audit trail; future developers cannot understand version rationale; version proliferation without governance.
---

## Create New Version Only When You Can Maintain It
---
## Category
Governance
---
## Rule
Never create a new API version unless the team commits to maintaining it for its expected lifespan (minimum 2 years for MAJOR versions).
---
## Reason
An abandoned version that was created and never maintained is worse than the original problem it solved — consumers depend on unpatched, insecure code.
---
## Bad Example
```php
// v2 created in a sprint, nobody assigned to maintain it
```
---
## Good Example
```php
// v2 approved with dedicated maintenance budget and team roster
```
---
## Exceptions
Experimental/pre-release versions explicitly marked as such with an `-alpha` suffix.
---
## Consequences Of Violation
Abandoned versions with known vulnerabilities; consumers stuck on unmaintained versions.
---

## Monitor Version Proliferation — Max 3 Active Versions
---
## Category
Governance
---
## Rule
Never exceed 3 concurrently active API versions. When the fourth version is created, the oldest must be in the final deprecation phase.
---
## Reason
Each additional active version multiplies testing surface, security patching, documentation, and developer context-switching cost.
---
## Bad Example
```php
// 5 active versions — each change requires testing across all versions
```
---
## Good Example
```php
// 3 active versions: v1 (deprecation phase), v2 (active), v3 (active)
```
---
## Exceptions
LTS versions that extend beyond the normal lifecycle — count them separately from the active version limit.
---
## Consequences Of Violation
Testing burden grows linearly with each version; security patching becomes impractical; developer productivity declines.
---

## Consider Beta Flags Before Committing To New Version
---
## Category
Design
---
## Rule
Always evaluate whether a "beta" or "preview" feature flag within the current version can serve as a trial before committing to a full new version.
---
## Reason
A beta flag lets you validate a change with a subset of consumers before incurring the full cost of a new version.
---
## Bad Example
```php
// Created v2 for a feature that only 5% of consumers would use
```
---
## Good Example
```php
// Added preview flag: /api/v1/posts?preview=true — validated with beta consumers
// Only created v2 when preview confirmed the feature was widely adopted
```
---
## Exceptions
Changes that fundamentally alter the resource contract (e.g., removing an existing field) — beta flags cannot fix contract breaks.
---
## Consequences Of Violation
Full version cost for an unvalidated feature; version created but unused.
---

## Allocate 20% Of Lifecycle Cost To Migration Tooling
---
## Category
Governance
---
## Rule
Always allocate at least 20% of the expected lifecycle cost of a new version to consumer migration tooling and documentation.
---
## Reason
A new version is useless if consumers cannot migrate to it — migration tooling is not optional, it's part of the version cost.
---
## Bad Example
```php
// v2 shipped with no migration guide, no codemods, no changelog
```
---
## Good Example
```php
// v2 budget: 4 weeks development, 1 week migration tools, 1 week migration docs
```
---
## Exceptions
Internal APIs where the consuming team is directly collaborating on the migration.
---
## Consequences Of Violation
Consumers cannot migrate; v2 adoption near zero; v1 runs indefinitely.
