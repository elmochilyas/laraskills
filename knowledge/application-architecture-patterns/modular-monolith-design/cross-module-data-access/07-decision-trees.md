# Decision Trees: Cross-Module Data Access

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Cross-module data access: query patterns without JOINs
- **Knowledge Unit ID:** MMD-10
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Service contract call vs event projection for cross-module data | Architecture | Data access design |
| 2 | Forbid vs allow Eloquent relationships across modules | Architecture | Model definition |
| 3 | Application-level assembly vs SQL JOIN | Architecture | Query design |

---

## Decision 1: Service contract call vs event projection

### Context
Module A needs data owned by Module B. Two approaches: call a service contract (real-time, in-process method call) or maintain a local projection updated via events (eventual consistency). The decision depends on freshness requirements and read frequency.

### Decision Tree

```
Does the consumer need real-time (current) data?
├── YES → Service contract call
│   Is this a high-frequency read (list view, dashboard)?
│   ├── YES → Contract call with batch endpoint (avoid N+1)
│   └── NO → Single contract call is fine
└── NO (eventual consistency acceptable)
    Is this data read frequently (multiple times per request or by many users)?
    ├── YES → Event projection (local copy updated via events)
    │   Can you monitor projection freshness?
    │   ├── YES → Projection with freshness alerts
    │   └── NO → Must use service call until monitoring is in place
    └── NO → Service contract call is simpler than projection maintenance
```

### Rationale
Service contract calls are simpler but add per-request latency. Event projections are more complex (event subscription, projection table, freshness monitoring) but eliminate repeated cross-module calls for frequent reads. Default to contract calls and only add projections when read frequency justifies the complexity.

### Recommended Default
Service contract call for occasional reads; event projection for frequent reads

### Risks
- Event projection stale: consumer sees outdated data
- Service call per item (N+1): 100 contract calls for 100 list items
- Projection without monitoring: stale data goes undetected

### Related Rules
- Never JOIN Across Module Tables (MMD-10/05-rules.md)
- No Cross-Module Eloquent Relationships (MMD-10/05-rules.md)
- Service Calls for Real-Time Data (MMD-10/05-rules.md)
- Event Projections for Frequent Reads (MMD-10/05-rules.md)

### Related Skills
- Handle Cross-Module Data Access Without SQL JOINs (MMD-10/06-skills.md)
- Manage Sync Inter-Module Communication (MMD-06/06-skills.md)
- Manage Async Inter-Module Communication (MMD-07/06-skills.md)

---

## Decision 2: Forbid vs allow Eloquent relationships across modules

### Context
Eloquent relationships (`belongsTo`, `hasMany`, `belongsToMany`) referencing another module's model are forbidden. They create implicit cross-module queries that look like property access but generate database queries across module boundaries, coupling schema evolution between modules.

### Decision Tree

```
Does the relationship reference a model owned by another module?
├── YES
│   Can you store the foreign IDs in the current module and resolve via contract?
│   ├── YES → Store IDs (JSON array or pivot table owned by this module)
│   │   `$invoice->product_ids` → resolve via `catalogContract->getProducts($ids)`
│   └── NO → Restructure — module boundaries may need adjustment
└── NO (within same module) → Eloquent relationships are fine
```

### Rationale
Eloquent relationships across modules couple database schema and create invisible cross-module queries. Storing foreign IDs and resolving via contract calls maintains explicit, traceable data access. The cost is slightly more code, but the benefit is clear module boundaries and independent schema evolution.

### Recommended Default
No Eloquent relationships across modules; store IDs and resolve via contracts

### Risks
- Cross-module `belongsTo`: implicit JOIN on every access, schema coupling
- Cross-module lazy loading: N+1 queries that cross module boundaries
- JSON IDs in MySQL: no foreign key enforcement, manual integrity checks

### Related Rules
- No Cross-Module Eloquent Relationships (MMD-10/05-rules.md)
- Never JOIN Across Module Tables (MMD-10/05-rules.md)
- Service Calls for Real-Time Data (MMD-10/05-rules.md)

### Related Skills
- Handle Cross-Module Data Access Without SQL JOINs (MMD-10/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)

---

## Decision 3: Application-level assembly vs SQL JOIN

### Context
Cross-module result assembly (combining data from multiple modules) must happen in application code, not in SQL. Application-level assembly calls each module's contract and combines results in PHP. SQL JOINs across module tables create the strongest form of coupling.

### Decision Tree

```
Are you joining tables owned by different modules?
├── YES → Forbidden — must use application-level assembly
│   How many modules' data do you need?
│   ├── 2 → Fetch from each module's contract, combine in orchestrator
│   └── 3+ → Consider creating a read model (event-sourced projection)
│       that pre-combines data for the specific query
└── NO (same module) → SQL JOIN is acceptable within a single module
```

### Rationale
A JOIN between tables owned by different modules couples table structure, index strategy, and schema evolution. Application-level assembly is explicit: you can see which data comes from which module. For complex cross-module queries, a dedicated read model (CQRS projection) pre-combines data via events.

### Recommended Default
Application-level assembly for cross-module data; SQL JOINs within a module

### Risks
- Application-level assembly slower than JOIN (5-50ms per operation)
- N+1 across modules: calling a service for each item in a list
- Read model (projection) maintenance cost for complex queries

### Related Rules
- Never JOIN Across Module Tables (MMD-10/05-rules.md)
- Assemble Results in App Code (MMD-10/05-rules.md)
- Database-Level Permissions (MMD-10/05-rules.md)

### Related Skills
- Handle Cross-Module Data Access Without SQL JOINs (MMD-10/06-skills.md)
- Apply CQRS Pattern (CPC-08/06-skills.md)
- Implement Data Transfer Objects (LAP-14/06-skills.md)
