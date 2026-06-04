# Phase 5: Rules — API Style Guide Documentation

## Rule 1: Use RFC 2119 Keywords for Every Rule
---
## Category
Maintainability
---
## Rule
Always classify every style rule with RFC 2119 keywords: MUST (required), SHOULD (recommended), MAY (optional). Never write rules without explicit enforcement level.
---
## Reason
Unclassified rules create ambiguity about whether compliance is mandatory or optional, leading to inconsistent application across teams.
---
## Bad Example
```markdown
### Field naming
Use snake_case for fields.
```
---
## Good Example
```markdown
### [MUST] Field naming
Use snake_case for field names. Rationale: Consistent with Laravel conventions.
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent rule interpretation; teams treat MUST rules as optional; enforcement tooling cannot differentiate.
---

## Rule 2: Include Positive and Negative Examples for Every Rule
---
## Category
Maintainability
---
## Rule
Always provide both a correct (Good) and incorrect (Bad) example for every style rule. Never write rules without examples.
---
## Reason
Examples clarify intent faster than prose. "Use snake_case" without examples leaves room for interpretation; "Good: user_name, Bad: userName" is unambiguous.
---
## Bad Example
```markdown
### [MUST] Field naming
Use snake_case for field names.
```
---
## Good Example
```markdown
### [MUST] Field naming
Use snake_case for field names. Rationale: Consistent with Laravel conventions.
- Good: user_name, created_at, order_status
- Bad: userName, CreatedAt, orderStatus
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Ambiguous rules interpreted differently; inconsistent implementation; design review debates.
---

## Rule 3: Provide Rationale for Every Rule
---
## Category
Maintainability
---
## Rule
Always include a rationale explaining why the rule exists. Never write rules without a "why" — rationale prevents arguments and builds understanding.
---
## Reason
Rules without rationale are followed mechanically and challenged in every design review. When team members understand the "why," they follow rules consistently even in novel situations.
---
## Bad Example
```markdown
### [MUST] Use snake_case
```
---
## Good Example
```markdown
### [MUST] Use snake_case
Rationale: Consistent with Laravel framework conventions and database column naming. Reduces cognitive load when switching between PHP code, database schemas, and API responses.
```
---
## Exceptions
Self-evident rules (e.g., "Must authenticate") may omit rationale.
---
## Consequences Of Violation
Rules challenged in every design review; inconsistent application; rules abandoned when original authors leave.
---

## Rule 4: Store Style Guide as Code in Repository
---
## Category
Maintainability
---
## Rule
Always version the style guide in the repository as Markdown alongside Spectral enforcement rule files. Never maintain the style guide outside version control (wiki, shared drive, email).
---
## Reason
Version control ties style changes to PRs, provides changelog history, and enables review of style guide changes alongside code changes.
---
## Bad Example
```markdown
// Style guide on Confluence — last updated 2 years ago
// Nobody knows if it's current; no changelog
```
---
## Good Example
```bash
docs/api-style-guide/
├── index.md
├── naming-conventions.md
├── error-handling.md
├── pagination.md
└── spectral-rules/
    ├── naming.yaml
    ├── error-format.yaml
    └── pagination.yaml
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Outdated guide; no change history; PRs cannot reference style changes; guide drift from actual practice.
---

## Rule 5: Link Every Rule to Its Establishing ADR
---
## Category
Maintainability
---
## Rule
Always link each style rule to the ADR that established or modified it. Never let a style rule exist without a traceable decision record.
---
## Reason
Links to ADRs provide the full context — alternatives considered, tradeoffs accepted, and historical evolution of the rule.
---
## Bad Example
```markdown
### [MUST] Use cursor pagination
Rationale: See best practices.
```
---
## Good Example
```markdown
### [MUST] Use cursor pagination
Rationale: Consistent with offset-based limitations for large datasets.
Established by: [ADR-014: Pagination Strategy](../adr/0014-pagination-strategy.md)
```
---
## Exceptions
Rules inherited from external standards (HTTP spec, JSON:API spec) may omit ADR links.
---
## Consequences Of Violation
Cannot trace rule origin; debates repeat because previous decision rationale is unknown.
---

## Rule 6: Assign Rotating Steward for Guide Maintenance
---
## Category
Maintainability
---
## Rule
Always assign a rotating steward responsible for keeping the style guide up to date. Never leave the style guide without an owner.
---
## Reason
Without an owner, the style guide becomes outdated as conventions evolve. The steward ensures quarterly reviews, rule additions/removals, and guide updates.
---
## Bad Example
```php
// No steward — guide hasn't been updated in 18 months
// Teams have adopted patterns that contradict the guide
```
---
## Good Example
```php
// Rotating quarterly assignment
'style_guide_steward' => $team->rotatingRoles()->steward();
// Responsibilities: quarterly review, PR-based updates, exception tracking
```
---
## Exceptions
Single-developer projects may not need a dedicated steward.
---
## Consequences Of Violation
Guide stagnation; conventions drift from documented rules; guide becomes misleading.
---

## Rule 7: Deprecate Old Conventions with Migration Guidance
---
## Category
Maintainability
---
## Rule
Always document the deprecation path when a style rule changes: mark the old rule as deprecated, state the new rule, and provide migration guidance. Never silently replace a rule.
---
## Reason
Silent rule changes cause inconsistency — existing APIs follow the old rule while new APIs follow the new one. Documentation links to the old rule break.
---
## Bad Example
```markdown
# Old rule silently removed, new rule added
# No indication the convention changed
```
---
## Good Example
```markdown
### [MUST] Field naming [snake_case] — ACTIVE
### [DEPRECATED] Field naming [camelCase]
Migration: Existing APIs may continue using camelCase until next major version.
New APIs MUST use snake_case. See [ADR-031](../adr/0031-field-naming.md)
```
---
## Exceptions
Style guide rules that have never been followed (aspirational) may be replaced without deprecation.
---
## Consequences Of Violation
API surface inconsistency; consumers confused about which convention to follow; documentation contradictions.
