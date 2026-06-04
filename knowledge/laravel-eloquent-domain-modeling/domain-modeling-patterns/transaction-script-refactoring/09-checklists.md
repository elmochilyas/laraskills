# Transaction Script Refactoring — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | transaction-script-refactoring |

## Validation Checklist

- [ ] All business logic is extracted from the controller
- [ ] Controller only sequences calls to domain methods
- [ ] Domain methods are tested independently
- [ ] Side effects are moved to domain events (not inline in controller)
- [ ] Controller tests verify behavior, not implementation details
- [ ] No duplicate logic remains in the controller
- [ ] Domain methods are on the correct model (not service for single-model logic)
- [ ] Extracted methods are tested with unit tests, not just HTTP tests
