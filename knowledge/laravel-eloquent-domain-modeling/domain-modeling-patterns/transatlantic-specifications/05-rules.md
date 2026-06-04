# Transatlantic Specifications — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | transatlantic-specifications |

## Rules

### Rule 1: Specification encapsulates one business rule
Each specification class must represent exactly one business rule. If a rule has multiple conditions, compose them with AND/OR specifications rather than putting all conditions in one class.

### Rule 2: Support both query and in-memory evaluation
Implement both `applyToQuery()` for database filtering and `isSatisfiedBy()` for in-memory validation. This enables the same rule to be used in queries, validation, and domain logic.

### Rule 3: Make specifications composable
Implement `AndSpecification`, `OrSpecification`, and `NotSpecification` composable operators so specifications can be combined at runtime in different configurations.

### Rule 4: Use specifications where rules repeat across contexts
If the same business rule is used for database queries, form validation, and domain logic, encapsulate it in a specification. Otherwise, a local query scope may suffice.

### Rule 5: Test both applyToQuery and isSatisfiedBy
Write tests that verify the specification produces the correct SQL conditions via `applyToQuery()` and returns the correct boolean via `isSatisfiedBy()`.
