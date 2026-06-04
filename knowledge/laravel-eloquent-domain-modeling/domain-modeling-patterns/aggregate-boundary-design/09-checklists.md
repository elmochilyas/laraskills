# Aggregate Boundary Design — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | aggregate-boundary-design |

## Validation Checklist

- [ ] Aggregate root is clearly identified
- [ ] Child entities are modified only through root methods
- [ ] No direct API endpoints for child CRUD
- [ ] Invariants span the aggregate (not just per-model)
- [ ] Aggregate is loaded in a single query (or minimal queries)
- [ ] Cross-aggregate references use IDs, not full relations
- [ ] Transaction boundary matches the aggregate
- [ ] Save is called on the root, not individual children
