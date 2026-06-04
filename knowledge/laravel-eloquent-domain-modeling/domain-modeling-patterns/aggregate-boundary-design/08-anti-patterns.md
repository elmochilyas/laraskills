# Aggregate Boundary Design — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | aggregate-boundary-design |

## Anti-Patterns

### Direct Child Entity CRUD Endpoints
- **Severity:** High
- **Problem:** Exposing API endpoints for directly creating, updating, or deleting child entities (e.g., `POST /order-items`) bypasses the aggregate root's invariant enforcement.
- **Solution:** All child entity modifications must go through the aggregate root. Provide root-level endpoints that invoke domain methods.

### Loading Other Aggregates as Relations
- **Severity:** Medium
- **Problem:** Defining Eloquent relationships to other aggregates and loading them eagerly creates cross-aggregate coupling and unintended data loading.
- **Solution:** Reference other aggregates by foreign key ID only. Load them explicitly when needed, not through automatic relation loading.

### Transaction Boundary Larger Than Aggregate
- **Severity:** High
- **Problem:** Wrapping modifications to multiple aggregates in a single database transaction creates contention and scalability issues.
- **Solution:** Each aggregate should be its own transaction boundary. Use eventual consistency (domain events) for cross-aggregate coordination.

### Saving Individual Children Instead of Root
- **Severity:** Medium
- **Problem:** Calling `$orderItem->save()` directly instead of `$order->save()` bypasses aggregate-level dirty detection and consistency checks.
- **Solution:** Always save through the aggregate root. Let Eloquent cascade saves to children.
