# ECC Anti-Patterns — Read Model Strategies

## Domain: Backend Architecture & Design | Subdomain: Command Query Separation

### Anti-Pattern Inventory

1. **Denormalization Without Need** — Complex denormalized tables when in-memory works
2. **Event-Sourced Projection for Simple Reads** — Full projection infrastructure for basic reporting
3. **Stale Read Models** — Read models not refreshed when source data changes
4. **No Read Model at All** — Complex queries directly on transactional models
5. **Read Model Coupled to Write Model Schema** — Read model mirrors DB columns, not query needs
6. **Multiple Inconsistent Read Models** — Same data read differently in different places

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Denormalization Without Need

**Category:** Architecture

**Description:** Denormalized tables and complex sync infrastructure when in-memory transformation suffices.

**Why It Happens:** "Optimize for reads" applied before read volume problem exists.

**Warning Signs:** Separate denormalized tables for < 1000 daily requests; nightly batch jobs for denormalization.

**Why Is It Harmful:** Added infrastructure complexity. Data synchronization issues. Eventual consistency bugs — for no performance benefit.

**Preferred Alternative:** Use in-memory transformation (Eloquent API Resources) first. Add denormalization only when read performance is measured as a problem.

**Refactoring Strategy:** Replace denormalized tables with in-memory transformations. Add caching where needed.

**Related Rules:** Start with in-memory, denormalize only when needed (05-rules.md)

---

### Anti-Pattern 2: Event-Sourced Projection for Simple Reads

**Category:** Architecture

**Description:** Full event-sourced projection infrastructure for basic reporting queries.

**Why It Happens:** Projection pattern seen as "proper CQRS"; overengineered for simple needs.

**Warning Signs:** Event store → projector → read model → API response pipeline for a simple user list.

**Why Is It Harmful:** High complexity for simple data. Projector must catch up. Event schema changes are painful.

**Preferred Alternative:** Direct queries or in-memory models for simple reads. Reserve projections for complex aggregations.

**Refactoring Strategy:** Replace projection with direct query or view. Keep projections only for complex cross-aggregate reads.

**Related Rules:** Use projections only for complex read needs (05-rules.md)

---

### Anti-Pattern 3: Stale Read Models

**Category:** Data Quality

**Description:** Read models not refreshed when source data changes, serving stale data.

**Why It Happens:** No invalidation mechanism; refresh triggered only on restart.

**Warning Signs:** Users see outdated data; read model refresh lag measured in hours.

**Why Is It Harmful:** Users lose trust in displayed data. Business decisions based on stale information.

**Preferred Alternative:** Implement cache invalidation, materialized view refresh, or event-driven update.

**Refactoring Strategy:** Add event listener to invalidate/refresh read model when source data changes.

**Related Rules:** Keep read models synchronized with source data (05-rules.md)

---

### Anti-Pattern 4: No Read Model at All

**Category:** Architecture

**Description:** Complex queries executed directly on transactional models.

**Why It Happens:** Read model seen as unnecessary overhead.

**Warning Signs:** Complex Eloquent queries with multiple joins in controllers; reporting queries time out.

**Why Is It Harmful:** Transactional models optimized for writes. Complex reads on same models cause performance issues. Write operations blocked by read locks.

**Preferred Alternative:** Create lightweight read models optimized for specific query patterns.

**Refactoring Strategy:** Identify slow query patterns. Create dedicated read models or DB views for them.

**Related Rules:** Create read models for complex query patterns (05-rules.md)

---

### Anti-Pattern 5: Read Model Coupled to Write Model Schema

**Category:** Architecture

**Description:** Read model fields mirror database columns rather than serving query needs.

**Why It Happens:** Automatic/ORM-based read models that map directly to tables.

**Warning Signs:** Read model has same fields as DB table; computed/aggregated data not pre-calculated.

**Why Is It Harmful:** Read model doesn't serve its purpose — queries still need to compute aggregates. Changes to DB schema require read model updates.

**Preferred Alternative:** Design read model for the query consumer, not the database schema.

**Refactoring Strategy:** Redesign read model fields based on actual UI/API needs. Pre-compute aggregates.

**Related Rules:** Design read models for consumers, not database (05-rules.md)

---

### Anti-Pattern 6: Multiple Inconsistent Read Models

**Category:** Data Quality

**Description:** Same data represented differently across read models with different freshness guarantees.

**Why It Happens:** Each read model built independently without coordination.

**Warning Signs:** User count different between dashboard and report; order status inconsistent across views.

**Why Is It Harmful:** Erodes trust in data. Hard to debug which read model is correct.

**Preferred Alternative:** Single source of truth for each data type. Read models are derived, not independent.

**Refactoring Strategy:** Consolidate shared data into single read model. Derived models reference authoritative one.

**Related Rules:** Maintain consistency across read models (05-rules.md)
