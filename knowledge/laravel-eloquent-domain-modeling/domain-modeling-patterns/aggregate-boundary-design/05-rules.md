# Aggregate Boundary Design — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | aggregate-boundary-design |

## Rules

### Rule 1: Identify aggregate root for consistency
Each aggregate must have a clearly identified root model that acts as the sole entry point for all modifications within the boundary.

### Rule 2: Writes go through the aggregate root
Child entities must never be modified directly. All state changes to models within the aggregate must go through the root's domain methods.

### Rule 3: Load entire aggregate for writes
When performing a write operation, load the full aggregate (root + all relevant children) so that invariants can be checked across the entire boundary.

### Rule 4: Reference other aggregates by ID
Cross-aggregate references should use foreign key IDs, not loaded Eloquent model instances. This prevents unintended loading of related aggregate data.

### Rule 5: Save the root, not individual children
Call `save()` on the aggregate root, which cascades to children through Eloquent's relationship persistence. Do not save individual child entities separately.
