## Rule 1: Enforce every critical architectural rule as an automated fitness function in CI
---
## Category
Architecture
---
## Rule
Never rely on manual code review alone to enforce architectural rules; encode them as PHPStan, Deptrac, or PHPArkitect checks that fail the build.
---
## Reason
Manual discipline degrades over time, especially with team growth and turnover. Automated checks catch violations before merge.
---
## Bad Example
```
No CI enforcement: "We just review for architecture violations in PRs."
After 6 months, 30% of services reference Eloquent in domain layer.
```
---
## Good Example
```neon
# phpstan.neon
rules:
    - App\Architecture\DomainMustNotDependOnInfrastructure
```

```yaml
# deptrac.yaml
layers:
    - Domain
    - Application
    - Infrastructure
ruleset:
    Domain:
        - Application
    Application:
        - Infrastructure
```
---
## Exceptions
Early prototypes or proof-of-concept projects where architecture is intentionally fluid.
---
## Consequences Of Violation
Architectural drift, unplanned refactoring, increasing maintenance cost.
---
## Rule 2: Start with 3–5 high-value fitness functions before adding more
---
## Category
Architecture
---
## Rule
Introduce fitness functions incrementally—begin with the most impactful rules (e.g., layer dependency direction, no Eloquent in domain) and expand only after the team adapts.
---
## Reason
Too many rules at once cause developer frustration, rule fatigue, and eventual abandonment of all checks.
---
## Bad Example
```yaml
# Day one: 25 fitness functions
# Week three: all disabled because "CI takes too long"
```
---
## Good Example
```yaml
# Sprint 1: "Domain must not import Illuminate"
# Sprint 2: "No circular dependencies between modules"
# Sprint 3: "Services must not call Eloquent directly"
```
---
## Exceptions
Greenfield projects starting with a clear architecture can add more rules early, but still in phased order.
---
## Consequences Of Violation
Rule fatigue, disabled checks, architectural drift.
---
## Rule 3: Keep fitness functions in sync with the actual architecture
---
## Category
Maintainability
---
## Rule
When ADRs change the architecture, update the corresponding fitness functions in the same PR.
---
## Reason
Fitness functions that enforce an outdated architecture produce false positives, eroding trust in automation.
---
## Bad Example
```
Team adopts CQRS write models, but the rule "no separate read models" still blocks the CI build.
```
---
## Good Example
```
ADR-023: "Adopt read models for reporting"
Same PR: adds "ReadModel must not write" fitness function.
```
---
## Exceptions
When the architecture change is a temporary experiment with an expiration date.
---
## Consequences Of Violation
False positives, automated checks ignored, eventual removal of all checks.
---
## Rule 4: Include positive guidance rules, not only negative constraints
---
## Category
Architecture
---
## Rule
Add fitness functions that verify desired structural patterns exist (e.g., "every aggregate root must have a test") in addition to prohibiting bad patterns.
---
## Reason
Only-negative rules tell developers what not to do without guiding toward the intended structure.
---
## Bad Example
```
# Only negative rules
- Domain layer must NOT use Eloquent
- Controllers must NOT have business logic
```
---
## Good Example
```
# Negative + positive rules
- Domain layer must NOT use Eloquent
- Every use case must have a Feature test
- Module boundaries must be declared in deptrac config
```
---
## Exceptions
When the architecture is in early exploration and structural patterns are not yet settled.
---
## Consequences Of Violation
Developers know what to avoid but not what to do, leading to inconsistent patterns.
---
## Rule 5: Run fitness functions in CI, not just locally or on-demand
---
## Category
Reliability
---
## Rule
Every fitness function must execute in CI and block merges on failure; local-only checks are optional.
---
## Reason
Local-only checks can be bypassed, forgotten, or misconfigured; CI provides consistent enforcement.
---
## Bad Example
```
"Run `composer analyse` locally before pushing" — 40% of commits skip this.
```
---
## Good Example
```yaml
# .github/workflows/architecture.yml
- name: Run architecture checks
  run: composer analyse
```
---
## Exceptions
Prohibitively slow checks (minimize rules first; split into fast vs. thorough pipelines).
---
## Consequences Of Violation
Architecture violations merge into main branch, accumulating technical debt.
