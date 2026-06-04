# Transatlantic Specifications — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | transatlantic-specifications |

## Validation Checklist

- [ ] Specification interface has both query and domain methods
- [ ] Each specification represents a single business rule
- [ ] Specifications are composable (AND, OR, NOT)
- [ ] Specifications work both in queries and in-memory
- [ ] Each specification is unit-testable
- [ ] Specifications are used in place of raw query scopes where composability matters
- [ ] No specification exists for a simple one-off condition (use scope)
- [ ] Specifications are tested for both query application and satisfaction check
