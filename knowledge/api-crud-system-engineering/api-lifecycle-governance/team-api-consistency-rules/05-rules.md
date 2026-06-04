# Phase 5: Rules — Team API Consistency Rules

## Rule 1: Enforce Naming Conventions via Spectral in CI
---
## Category
Maintainability
---
## Rule
Always enforce naming conventions (snake_case fields, kebab-case paths, UPPER_SNAKE_CASE enums) via Spectral rules in CI. Never rely solely on code review to catch naming violations.
---
## Reason
Automated enforcement catches violations immediately in every PR. Manual review is inconsistent and consumes reviewer attention better spent on semantic issues.
---
## Bad Example
```yaml
# CI has no Spectral linting step
# Naming violations caught only during code review (if at all)
```
---
## Good Example
```yaml
- name: Spectral Lint
  run: npx spectral lint openapi.yaml --fail-severity=warn
```
---
## Exceptions
Existing APIs being migrated to new conventions may receive a transition period.
---
## Consequences Of Violation
Inconsistent naming across services; consumer confusion; increased onboarding friction.
---

## Rule 2: Cap Active Rules at 30
---
## Category
Maintainability
---
## Rule
Always maintain a maximum of 30 active consistency rules. Remove one existing rule before adding a new one. Never let the rule count grow unbounded.
---
## Reason
Too many rules cause rule fatigue — teams stop following them. A hard cap forces curation and prioritization of only the most impactful rules.
---
## Bad Example
```yaml
# 50+ rules, many rarely checked or contradictory
rules:
  - rule-01 ... - rule-56
```
---
## Good Example
```php
// Enforce rule cap in CI
$ruleCount = SpectralRule::active()->count();
if ($ruleCount > 30) {
    throw new RuleCapExceededException("Active rules ($ruleCount) exceeds cap of 30.");
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Rule bloat; contradictory rules; teams ignore the rule set entirely.
---

## Rule 3: Use Gradual Enforcement — Recommended Then Required
---
## Category
Maintainability
---
## Rule
Always introduce new consistency rules as "recommended" for 1 month before making them "required" and blocking CI. Never flip a rule from non-existent to blocking immediately.
---
## Reason
Teams need time to adapt APIs to new rules. Immediate blocking enforcement causes frustration and emergency PRs to unblock deployments.
---
## Bad Example
```yaml
# Rule added as "error" immediately — breaks all existing PRs
- severity: error
  rule: new-naming-rule
```
---
## Good Example
```yaml
# Month 1: recommended (warning only)
- severity: warn
  rule: new-naming-rule
# Month 2+: required (error, blocks CI)
```
---
## Exceptions
Security-related rules may be required immediately.
---
## Consequences Of Violation
Team frustration; blocked deployments; emergency exemptions that never get resolved.
---

## Rule 4: Set Exception Expiration Dates
---
## Category
Governance
---
## Rule
Always set a 3-month expiration date on every rule exception granted. Never allow exceptions without an expiry. Require a 2-sentence justification in the PR description.
---
## Reason
Without expiration, permanent exceptions accumulate, and the rule set becomes meaningless. Mandatory justification prevents frivolous exceptions.
---
## Bad Example
```php
// No expiration, no justification required
RuleException::create('service-users', 'field-naming-convention');
```
---
## Good Example
```php
RuleException::create(
    service: 'service-users',
    rule: 'field-naming-convention',
    justification: 'Legacy DB columns use camelCase. Migration scheduled Q3 2026.',
    expiresAt: now()->addMonths(3),
);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Permanent exceptions accumulate; rule set becomes selectively unenforced; consistency erodes.
---

## Rule 5: Conduct Design Review Before Implementation
---
## Category
Architecture
---
## Rule
Always conduct a design review (review OpenAPI spec changes) before writing implementation code for new endpoints. Never implement an endpoint design that hasn't been reviewed.
---
## Reason
Fixing design issues in the spec is free. Fixing them after implementation costs engineering hours, tests, and documentation updates.
---
## Bad Example
```php
// Endpoint implemented from scratch, then reviewed
// Review finds pagination design flaw — rewrite required
```
---
## Good Example
```php
// PR contains only OpenAPI spec changes first
// Design review approves, then implementation PR follows
```
---
## Exceptions
Trivial endpoints (standard CRUD with no custom logic) may skip design review.
---
## Consequences Of Violation
Reimplementation cost; inconsistent designs across services; wasted engineering effort.
---

## Rule 6: Rotate Consistency Champion Each Sprint
---
## Category
Maintainability
---
## Rule
Always assign a rotating consistency champion each sprint to review new endpoint designs and enforce consistency rules. Never let consistency be nobody's responsibility.
---
## Reason
Shared ownership of consistency evaporates. Dedicated (rotating) responsibility ensures consistent attention to the rule set.
---
## Bad Example
```php
// No designated owner for consistency
// "Everyone is responsible" = "No one is responsible"
```
---
## Good Example
```php
// Rotate via sprint planning
$sprint->champion = $team->nextConsistencyChampion();
// Champion blocks 2 hours/week for design reviews and rule maintenance
```
---
## Exceptions
Teams smaller than 3 people may combine consistency champion with other roles.
---
## Consequences Of Violation
Rule drift; ignored conventions; inconsistency accumulates across sprints.
---

## Rule 7: Never Contradict Global Conventions with Sub-Conventions
---
## Category
Architecture
---
## Rule
Always ensure team-level sub-conventions extend, never contradict, organization-wide global conventions. If a sub-convention conflicts with a global convention, the global wins.
---
## Reason
Contradictory conventions defeat the purpose of consistency and confuse consumers who interact with multiple services.
---
## Bad Example
```yaml
# Global: snake_case fields
# Sub-convention: camelCase fields — contradicts global
```
---
## Good Example
```yaml
# Global: snake_case fields
# Sub-convention: snake_case + prefix field — extends, does not contradict
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent consumer experience across services; enforcement tooling conflicts; confusion.
