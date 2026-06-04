# Temporal Modeling — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | temporal-modeling |

## Validation Checklist

- [ ] Versioning approach is selected based on requirements
- [ ] Temporal columns or events table exists in the schema
- [ ] Versioning logic is invoked on state changes (model events, explicit calls)
- [ ] Point-in-time query scope returns correct state
- [ ] Tests cover current-state and historical-state queries
- [ ] Performance of temporal queries is acceptable (index temporal columns)
- [ ] No overlapping version ranges exist
- [ ] Versioning does not fire on incidental saves (touch, counter)
