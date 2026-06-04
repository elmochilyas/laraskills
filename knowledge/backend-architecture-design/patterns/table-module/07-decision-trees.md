# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Table Module pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Table Module vs Transaction Script vs Domain Model selection
* Decision 2: Table Module granularity — per table vs per entity group
* Decision 3: Cross-table operations — Table Module coordination

---

# Architecture-Level Decision Trees

---

## Decision: Table Module vs Transaction Script vs Domain Model Selection

---

## Decision Context

Choose the appropriate domain logic pattern — Table Module (per-table class), Transaction Script (per-use-case), or Domain Model (rich object model).

---

## Decision Criteria

* performance considerations: Table Module handles bulk operations efficiently (row set processing)
* architectural considerations: Table Module fits between TS and DM in complexity; natural for moderate table-oriented logic
* security considerations: Table Module can centralize per-table authorization in one class
* maintainability considerations: Table Module is simpler than Domain Model but may be less reusable as logic spans tables

---

## Decision Tree

Is business logic naturally organized by table/entity (most operations on a single table)?
↓
YES → Is the logic moderate in complexity (2-5 rules per table, some cross-table queries)?
    YES → Table Module (natural fit — one class per table/entity)
    NO → Is the logic TRIVIAL (CRUD with no real rules)?
        YES → Transaction Script is simpler (just a controller or action class)
        NO → Is the logic COMPLEX (state machines, workflow, 6+ rules)?
            YES → Domain Model (Table Module doesn't scale to complex rules)
NO → Does logic frequently span multiple tables?
    YES → Consider Domain Model or Service Layer (Table Module per table creates coupling)
    ↓
    Can cross-table logic be handled by a Service Layer that coordinates Table Modules?
    YES → Table Module per table + Service Layer for cross-table orchestration
    NO → Domain Model is more appropriate

---

## Rationale

Table Module is the middle ground between Transaction Script (per use case) and Domain Model (rich objects). It organizes logic by table/entity — one class per table. It's ideal for moderate-complexity logic that's naturally table-oriented. For simple CRUD, Transaction Script is simpler. For complex interconnected rules, Domain Model handles state and relationships better.

---

## Recommended Default

**Default:** Table Module for moderate-complexity table-oriented logic. Transaction Script for simple CRUD. Domain Model for complex interconnected rules.

**Reason:** Table Module matches the organizational pattern of relational databases and ORMs. It's simpler than Domain Model but more organized than Transaction Script for table-centric operations.

---

## Risks Of Wrong Choice

Table Module for simple CRUD: unnecessary abstraction layer. Table Module for complex rules: logic splits across modules, state management suffers. Domain Model for table-oriented logic: over-engineered for what is essentially data-centric.

---

## Related Rules

- Rule 1: Table Module organizes business logic by table/entity — one class per table

---

## Related Skills

- Implement Table Module
- Choose Between Transaction Script and Domain Model

---

## Decision: Table Module Granularity — Per Table vs Per Entity Group

---

## Decision Context

Choose whether to create one Table Module per database table or per logical entity group.

---

## Decision Criteria

* performance considerations: per-table is more granular; per-entity-group may load unnecessary dependencies
* architectural considerations: per-entity-group aligns with aggregates; per-table may create tight cross-table coupling
* security considerations: per-entity-group enables group-level authorization
* maintainability considerations: per-table is simpler to map; per-entity-group reduces file count

---

## Decision Tree

Do multiple tables represent a single logical entity (e.g., `orders` + `order_items` = Order)?
↓
YES → One Table Module per entity group (e.g., `OrderModule` handles both `orders` and `order_items`)
    ↓
    Does the entity group span 3+ tables?
    YES → Consider sub-modules within the entity group (too large for one class)
    ↓
    Sub-module by table: `OrderModule` delegates to `OrderTable` and `OrderItemTable`
    NO → Single class for the entity group
    NO → One Table Module per table (each table is a distinct concept)
↓
Do Table Modules frequently call each other (tight coupling across modules)?
YES → Consider merging into a single entity-group module
NO → Keep separate (independent tables)

---

## Rationale

Table Module granularity should match the logical entity boundary, not the physical table boundary. If tables always appear together (order + order_items), they should be a single Table Module. If tables are independent (users + audit_logs), they should be separate modules. The goal is minimizing cross-module coordination while keeping each module cohesive.

---

## Recommended Default

**Default:** One Table Module per logical entity group (tables that are always used together). Split into sub-modules when the group exceeds 3 tables.

**Reason:** Entity-group granularity reduces cross-module calls, aligns with domain concepts, and minimizes file count. Per-table granularity creates unnecessary coordination overhead.

---

## Risks Of Wrong Choice

Per-table for always-coupled tables: excessive cross-module calls, tight coupling between modules. Entity-group for independent tables: giant class with unrelated responsibilities.

---

## Related Rules

- Rule 3: Table Module should handle operations for one table or entity group — not unrelated tables

---

## Related Skills

- Design Table Module Boundaries
- Identify Entity Groups

---

## Decision: Cross-Table Operations — Table Module Coordination

---

## Decision Context

Choose how Table Modules coordinate when an operation spans multiple tables/entities.

---

## Decision Criteria

* performance considerations: service layer coordination adds delegation overhead (negligible)
* architectural considerations: Service Layer isolates cross-table orchestration from per-table logic
* security considerations: Service Layer can enforce cross-table authorization
* maintainability considerations: separate orchestration prevents Table Modules from coupling to each other

---

## Decision Tree

Does the operation require data from multiple tables?
↓
YES → Is there a clear coordinating service (e.g., `OrderService` that uses `OrderModule` + `InventoryModule`)?
    YES → Service Layer coordinates Table Modules (each module handles its table)
    ↓
    Does the Service Layer contain only orchestration logic (no business rules)?
    YES → Correct layering: Service orchestrates, Table Modules execute
    NO → Move business rules into Table Modules or Domain services
    NO → Do Table Modules call each other directly?
        YES → Refactor to Service Layer (direct cross-module calls create tight coupling)
        ↓
        Can the Table Modules be merged into one entity group?
        YES → Merge (they're not independent if they constantly call each other)
        NO → Introduce Service Layer to orchestrate
NO → Single Table Module handles the operation (no cross-table coordination needed)

---

## Rationale

Table Modules should not call each other directly — this creates tight coupling between table-specific classes. A Service Layer should orchestrate cross-table operations, delegating per-table logic to Table Modules. This maintains each Table Module's independence and allows them to be tested in isolation.

---

## Recommended Default

**Default:** Service Layer orchestrates cross-table operations. Each Table Module handles only its own table/entity-group. Table Modules never call each other.

**Reason:** Direct cross-module calls couple table-specific logic together, defeating the modularity benefit. Service Layer keeps orchestration separate and modules independently testable.

---

## Risks Of Wrong Choice

Direct cross-module calls: tight coupling, modules cannot be tested independently, change in one module breaks others. Service Layer doing business logic: the orchestrator becomes a god class, Table Modules become anemic.

---

## Related Rules

- Rule 4: Table Modules should not call each other — use a Service Layer for cross-table operations

---

## Related Skills

- Design Service Layer
- Coordinate Table Modules
