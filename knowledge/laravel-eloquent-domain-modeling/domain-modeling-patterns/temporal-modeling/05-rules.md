# Temporal Modeling — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | temporal-modeling |

## Rules

### Rule 1: Choose temporal approach by requirements
Select SCD Type 2 when point-in-time SQL queries are needed. Select event sourcing for immutable audit trails. Select snapshots for periodic state capture without full event replay.

### Rule 2: Version on meaningful state changes
Create new versions only for business-significant state changes, not for every attribute update. Counter increments and `updated_at` changes do not warrant new versions.

### Rule 3: Add point-in-time query scopes
Implement a `scopeAsOf()` query scope that accepts a Carbon instance and returns the model state as it was at that point in time.

### Rule 4: Test temporal queries
Write tests that assert the correct state is returned for different points in time, covering current state, past states, and the gap between versions.

### Rule 5: Index temporal columns for performance
Add database indexes on `valid_from` and `valid_to` columns (or a composite index) to prevent full-table scans on temporal queries.
