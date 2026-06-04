# Decision Trees: Event Sourcing and CQRS Within Modular Monolith

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Event sourcing and CQRS within modular monolith
- **Knowledge Unit ID:** MMD-15
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Event sourcing vs traditional persistence per aggregate | Architecture | Aggregate design |
| 2 | Module-specific vs shared event store | Architecture | Event store design |
| 3 | CQRS with separate read/write models vs single model | Architecture | Read/write design |

---

## Decision 1: Event sourcing vs traditional persistence per aggregate

### Context
Event sourcing should be applied per-aggregate, not module-wide. Aggregates that need audit trails, temporal queries, or complex state reconstruction justify the additional complexity. Simple CRUD aggregates within the same module should use traditional persistence.

### Decision Tree

```
Does the aggregate need an audit trail (who changed what and when)?
├── YES → Consider event sourcing
│   Does the aggregate need temporal queries (state at any point in time)?
│   ├── YES → Event sourcing strongly recommended
│   └── NO → Event sourcing may still be justified for audit trail alone
└── NO
    Does the aggregate have complex state reconstruction logic?
    ├── YES → Event sourcing simplifies complex state derivation
    └── NO → Traditional persistence (Eloquent model) is correct
        Does the aggregate need to emit events that other modules consume?
        ├── YES → Use standard domain events with traditional persistence
        └── NO → Standard Eloquent CRUD is sufficient
```

### Rationale
Event sourcing adds significant complexity: event store, replay, snapshots, versioning, upcasters. Without a clear need for audit trails or temporal queries, traditional persistence is simpler and more maintainable. A module can mix both — Invoice is event-sourced, PaymentMethod uses Eloquent.

### Recommended Default
Traditional persistence (Eloquent) unless audit trail or temporal queries are required

### Risks
- Event sourcing for everything: unnecessary complexity for CRUD aggregates
- No event versioning: replay breaks when event schema changes
- No snapshot strategy: 10,000+ events cause minutes-long replay times

### Related Rules
- Event Sourcing Per-Aggregate (MMD-15/05-rules.md)
- Module-Specific Event Store (MMD-15/05-rules.md)
- Version Events From Day One (MMD-15/05-rules.md)
- Implement Snapshots (MMD-15/05-rules.md)

### Related Skills
- Apply Event Sourcing and CQRS Within a Modular Monolith (MMD-15/06-skills.md)
- Design Event Sourcing (CPC-09/06-skills.md)
- Define and Dispatch Domain Events (LAP-08/06-skills.md)

---

## Decision 2: Module-specific vs shared event store

### Context
Each module's event store must be module-specific — owned tables, own infrastructure, own schema. A shared event store across modules creates coupling at the storage level. All modules would depend on the same event store schema, defeating module isolation.

### Decision Tree

```
Does the event store serve only one module's event-sourced aggregates?
├── YES
│   Is the event store implemented within the module's infrastructure layer?
│   ├── YES → Module-specific — correct ownership
│   └── NO → Move event store into the module's infrastructure
└── NO (shared across modules)
    → Defeats module isolation — refactor immediately
    Can each module own its event store tables?
    ├── YES → Split into per-module event stores
    └── NO → Architecture issue — event store coupling signals a boundary problem
```

### Rationale
A shared event store means all event-sourced modules depend on the same tables and schema. Schema changes require cross-module coordination. Module extraction requires event store separation. Module-specific event stores preserve the isolation that the modular architecture provides.

### Recommended Default
Module-specific event store in each module's infrastructure layer

### Risks
- Shared event store: all modules coupled to same schema
- Shared event store: extraction requires schema separation
- Cross-module queries into event store: defeats isolation

### Related Rules
- Module-Specific Event Store (MMD-15/05-rules.md)
- Event Sourcing Per-Aggregate (MMD-15/05-rules.md)
- Standard Events for Cross-Module Comm (MMD-15/05-rules.md)

### Related Skills
- Apply Event Sourcing and CQRS Within a Modular Monolith (MMD-15/06-skills.md)
- Apply CQRS Pattern (CPC-08/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)

---

## Decision 3: CQRS with separate read/write models vs single model

### Context
CQRS separates read models (queries) from write models (commands). It should only be applied when read and write workloads have genuinely different performance requirements, data shapes, or change frequencies. Applying CQRS without justification doubles maintenance without benefit.

### Decision Tree

```
Do reads and writes have different performance requirements?
├── YES (reads need denormalized views, writes need normalized models)
│   Does the read model differ significantly from the write model?
│   ├── YES → CQRS is justified — separate read/write models
│   └── NO → Single model with query optimization (caching, eager loading)
└── NO (same performance profile)
    Do reads and writes have different data shapes?
    ├── YES → CQRS justified — read model presents different structure
    └── NO → Single model — CQRS adds complexity without benefit
        → Use single Eloquent model with repository or service pattern
```

### Rationale
CQRS is not a default pattern — it's a targeted solution for divergent read/write workloads. A single Eloquent model with well-optimized queries handles most cases. The modular structure makes CQRS easy to introduce later because module boundaries are already in place.

### Recommended Default
Single model with query optimization; CQRS only when read/write workloads diverge

### Risks
- CQRS without justification: double model maintenance without benefit
- CQRS without justification: slower development for CRUD operations
- Single model for divergent workloads: read queries are slow or write constraints are compromised

### Related Rules
- Apply CQRS Only When Justified (MMD-15/05-rules.md)
- Module-Specific Projectors (MMD-15/05-rules.md)
- Event Sourcing Per-Aggregate (MMD-15/05-rules.md)

### Related Skills
- Apply Event Sourcing and CQRS Within a Modular Monolith (MMD-15/06-skills.md)
- Apply CQRS Pattern (CPC-08/06-skills.md)
- Define and Dispatch Domain Events (LAP-08/06-skills.md)
