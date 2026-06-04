# Temporal Modeling — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | temporal-modeling |

## Anti-Patterns

### Versioning on Every Save
- **Severity:** High
- **Problem:** Creating a new version on every `save()` event floods the table with versions for irrelevant changes (view count increments, `updated_at` touches, cache clears).
- **Solution:** Version only on meaningful business state changes. Use explicit versioning from domain methods or specific model events.

### No Indexes on Temporal Columns
- **Severity:** Medium
- **Problem:** Querying `valid_from <= ? AND (valid_to IS NULL OR valid_to > ?)` without indexes causes full-table scans that get progressively slower as the table grows.
- **Solution:** Add composite indexes on `(valid_from, valid_to)` or individual indexes on each column.

### Using Event Sourcing for Simple Audit Needs
- **Severity:** Medium
- **Problem:** Full event sourcing with event replay and projection building for a simple requirement like "show me the previous state of this record."
- **Solution:** SCD Type 2 is simpler and directly queryable for most audit requirements. Only use event sourcing when you need full event-level granularity and replay.

### Overlapping Version Ranges
- **Severity:** High
- **Problem:** New versions are created with overlapping `valid_from`/`valid_to` ranges due to incorrect timestamp handling, causing ambiguous point-in-time queries.
- **Solution:** Ensure the previous version's `valid_to` is set before the new version's `valid_from` using `now()` consistently or a single clock source.
