# Transatlantic Specifications — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | transatlantic-specifications |

## Anti-Patterns

### One Specification per Query Scope
- **Severity:** Medium
- **Problem:** Creating a specification class for every single query scope, even simple one-off conditions that are never reused or composed.
- **Solution:** Use local query scopes for simple, one-off conditions. Reserve specifications for rules that need composition or dual evaluation.

### Specifications with Only One Evaluation Method
- **Severity:** Medium
- **Problem:** A specification implements only `applyToQuery()` or only `isSatisfiedBy()`, losing the dual-evaluation benefit that makes specifications valuable.
- **Solution:** Implement both methods unless there's a clear reason not to. If only one is needed, consider if a simpler pattern (query scope, model method) would suffice.

### Complex Inline Specifications Without Composition
- **Severity:** Medium
- **Problem:** A single specification class contains complex logic with multiple conditions that should be separate, composable specifications.
- **Solution:** Break complex specifications into smaller, single-rule specifications and compose them with AND/OR operators.

### Specifications Coupled to Eloquent
- **Severity:** High
- **Problem:** The specification's `applyToQuery()` method calls Eloquent-specific methods (scopes, eager loading) that prevent using the specification with non-Eloquent data sources.
- **Solution:** Use only standard query builder methods (`where`, `orderBy`, `limit`) in `applyToQuery()`. Keep specification logic framework-agnostic where possible.
