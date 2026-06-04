# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.29 Foreign key constraint management in PlanetScale/Vitess environments
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

PlanetScale (based on Vitess) and standalone Vitess environments have significant limitations with foreign key constraints. Vitess does not fully support cross-shard FK constraints and has restrictions on schema changes that differ from standard MySQL. PlanetScale enforces branch-based schema management where FKs must be created within the context of a deploy request. Understanding these limitations is essential when deploying Laravel to Vitess-based platforms.

---

# Core Concepts

- **Vitess FK limitation**: Vitess does not guarantee FK enforcement across shards. FKs are only supported within a single shard or when the parent and child tables are co-located.
- **PlanetScale branching**: Schema changes are made in a branch, deployed via a deploy request, and applied using non-blocking DDL. FK constraints must be part of the deploy request workflow.
- **Application-level enforcement**: In Vitess environments, FK enforcement is often delegated to the application layer using Eloquent relationships and application validation.
- **Drop behavior**: Vitess may silently ignore FK constraint violations or fail unpredictably depending on configuration.

---

# Mental Models

PlanetScale/Vitess treats FKs as hints rather than hard constraints. The application layer is responsible for referential integrity. Eloquent relationships continue to work, but database-level cascade behavior may not trigger.

---

# Patterns

**Skip FKs in migrations**: For Vitess deployments, omit `->constrained()` from migrations. Depend on application-level relationship logic for integrity.

**Manual delete handling**: Instead of relying on CASCADE, delete related records in application code using Eloquent events (e.g., `deleting` callback).

**Cross-shard join limitations**: Ensure related tables share the same shard key for co-location. Without co-location, FK-based joins are not supported.

---

# Architectural Decisions

| Approach | When | When Not |
|----------|------|----------|
| Application-level FKs | Vitess/PlanetScale, shared-table sharding | Single-node MySQL where DB FKs are supported |
| Database-level FKs | Single-node MySQL, co-located shards | Cross-shard environments |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Application-level FKs work across all environments | No database constraint enforcement | Orphans may accumulate
Vitess allows online schema changes | FK cascade behavior must be implemented in application | More code complexity

---

# Common Mistakes

**Assuming FK cascade works in Vitess**: CASCADE operations may not propagate across shards. Related records in a different shard remain undeleted.

**Relying on FK for data integrity**: In Vitess, the application must enforce all referential integrity. Missing application-level cleanup causes orphaned records.

---

# Related Knowledge Units

1.4 Foreign key definition | 15.1 Foreign key constraints | 15.16 Application-level vs database-level enforcement

---

# Ecosystem Usage

PlanetScale has become a popular database platform for Laravel applications, especially those deployed on Vapor or serverless infrastructure. The platform's branching workflow for schema changes requires teams to adapt their migration practices. In 2023, PlanetScale announced official foreign key constraint support, though with significant limitations — only supported in unsharded environments, constraint names change on every deployment, and cascade operations are restricted. Vitess (the underlying engine) has limited FK support that forces Laravel teams to implement referential integrity at the application layer using Eloquent events and job-based cleanup. The Laravel community has developed patterns for FK-free data integrity using service classes and domain events.

# Failure Modes

- **Cross-shard FK violation**: In a sharded Vitess environment, FKs are not enforced across shards. If a parent row is deleted in shard 1 and child rows exist in shard 2, the cascade does not propagate. Application-level cleanup must handle cross-shard references.
- **Unsupported cascade operations**: Vitess does not support `ON DELETE CASCADE` and `ON UPDATE SET NULL` in all configurations. Cascading deletes must be implemented in application code using Eloquent model events or queue jobs.
- **Deploy request revert orphans**: Reverting a PlanetScale deploy request that added a FK constraint can leave orphaned rows in the child table. The constraint is dropped but invalid data remains. Warn operators before reverting FK-related changes.
- **Constraint name changes**: PlanetScale appends a random suffix to FK constraint names on each deployment. Code that references constraint names by string literal breaks. Always reference constraints by the column or index, not the generated name.
- **Circular FK rejection**: Vitess does not support circular foreign key references between tables. Self-referencing tables are supported, but mutual references between two tables are rejected. Redesign schemas to avoid circular dependencies.

# Performance Considerations

- Foreign key enforcement in PlanetScale/Vitess goes through VTGate (the Vitess proxy), adding latency compared to direct MySQL FK enforcement. Each FK check involves proxy-level planning and execution.
- The Vitess-level FK implementation requires additional locking and communication with the MySQL server. High-concurrency workloads may experience degraded throughput compared to standard MySQL FK enforcement.
- Disabling FK checks entirely (`SET FOREIGN_KEY_CHECKS=0`) in Vitess environments avoids the performance overhead but shifts all integrity responsibility to the application layer.
- Batch operations (bulk inserts, mass updates) that trigger FK checks in Vitess should be chunked to avoid overwhelming the VTGate query planner.

# Production Considerations

- **Enable FK support carefully**: PlanetScale requires explicit opt-in for FK support in the database settings. This triggers a MySQL version upgrade and may cause a brief interruption. Enable during a maintenance window.
- **No FK validation on deploy**: PlanetScale deploy requests do not validate FK referential integrity for existing rows. A FK can be added to a table with orphaned data. Run manual validation before deploying FK changes.
- **Application-level cascade**: For cascade operations, implement `deleting` and `updating` Eloquent model events that handle cleanup in application code. Test cascade behavior under concurrent access.
- **Schema design for FK-free operation**: Design schemas for FK-free operation from the start if PlanetScale is the target platform. Use nullable foreign keys and application-level integrity checks rather than database constraints.
- **Migration order awareness**: When adding FKs to existing tables with data, ensure the parent table's referenced column has a unique index and all child rows have valid references. Run validation queries before migration.

# Internal Mechanics

PlanetScale's FK implementation operates at the Vitess VTGate level rather than the MySQL InnoDB level:
1. VTGate intercepts all queries and maintains awareness of FK constraints defined in the schema.
2. For `RESTRICT`/`NO ACTION` FKs, VTGate delegates enforcement to the underlying MySQL instance — these have minimal overhead.
3. For `CASCADE`/`SET NULL` FKs, VTGate must handle cascading operations itself because InnoDB's cascading changes are not logged to the binary log and cannot be captured by Vitess's VReplication.
4. VTGate disables `FOREIGN_KEY_CHECKS` for the underlying MySQL session and handles all FK validation and cascading logic in the proxy layer.
5. For Online DDL operations (schema changes), Vitess cannot use standard Online DDL techniques on tables with cascading FK rules because the binlog does not contain cascading changes.
6. FK constraint names are auto-generated with suffixes to ensure uniqueness across deployments, making them non-deterministic between branches.

---

# Research Notes

PlanetScale's popularity in the Laravel ecosystem means a growing number of teams encounter Vitess FK limitations. The recommended approach is to design the schema without FK constraints from the start if PlanetScale/Vitess is the target platform, and implement referential integrity entirely at the application level.
