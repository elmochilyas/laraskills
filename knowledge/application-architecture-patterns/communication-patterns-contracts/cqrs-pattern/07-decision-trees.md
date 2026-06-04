# Decision Trees: CQRS Pattern

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Communication Patterns and Contracts
- **Knowledge Unit:** CQRS pattern
- **Knowledge Unit ID:** CPC-08
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Segregated models (same DB) vs full CQRS (separate DBs) | Architecture | CQRS implementation approach |
| 2 | Command bus vs direct service calls | Architecture | Command dispatch mechanism |
| 3 | Return DTOs vs return domain objects from queries | Architecture | Query response design |

---

## Decision 1: Segregated models vs full CQRS

### Context
CQRS means separating read and write models. "Segregated models" keeps read and write models in the same database — different classes, different tables, but single database. "Full CQRS" uses separate databases (write DB + read DB) with eventual consistency between them. Full CQRS adds significant complexity: eventual consistency, cross-database transactions, read model synchronization, and data staleness handling.

### Decision Tree

```
What problem is CQRS solving?
├── Read and write models differ in structure (denormalized reads, normalized writes)
│   → Segregated models in the same database
│   Write: Order (aggregate with line items, rules, validation)
│   Read: OrderSummary (flat DTO with customer name, total, status)
│   Same database, different tables and query paths
│   Benefits: simple, consistent, no eventual consistency
├── Read and write performance requirements diverge
│   → Evaluate whether separate databases are needed
│   Writes are heavy (complex validation, many inserts)
│   Reads must be fast (high traffic, complex queries)
│   ├── Mild divergence → Optimize within same DB
│   │   Indexes, materialized views, read replicas within the same DB
│   └── Extreme divergence → Full CQRS may be justified
│       Separate scaling: writes on MySQL, reads on Elasticsearch
│       Different tech: writes on relational, reads on search/NoSQL
│       Eventually consistent: accept read lag
└── Simple CRUD — reads and writes are nearly identical
    → CQRS is not needed at all
    A single model is sufficient
```

### Rationale
Segregated models within the same database provide almost all the benefits of CQRS (clean separation of read/write concerns, optimized query models, explicit commands) without the complexity of multi-database eventual consistency. Full CQRS (separate databases) should be a last resort — only when read and write performance or technology requirements diverge so significantly that a single database can't serve both. Most projects never need full CQRS.

### Recommended Default
Segregated models in the same database

### Risks
- Full CQRS for mild needs: unnecessary eventual consistency, cross-DB transaction issues
- No segregation at all: read/write models entangled, neither optimized
- Full CQRS without projection rebuild capability: read DB drifts from write DB

### Related Rules
- Default to segregated models, not full CQRS (CPC-08/05-rules.md)
- Use imperative naming for commands (CPC-08/05-rules.md)
- Never return domain objects from queries (CPC-08/05-rules.md)

### Related Skills
- Implement CQRS with Segregated Read and Write Models (CPC-08/06-skills.md)
- Implement Event Sourcing (CPC-09/06-skills.md)
- Optimize Read Models (MMD-14/06-skills.md)

---

## Decision 2: Command bus vs direct service calls

### Decision Tree

```
How are mutations dispatched in the application?
├── Through a command bus
│   Commands are explicit objects dispatched via `Bus::dispatch()`
│   └── Use command bus
│       Pros: middleware support, queuing, pipeline processing, consistent pattern
│       Cons: one extra abstraction layer
│       ├── Is the user waiting for the result?
│       │   ├── YES → Synchronous command bus (default pipeline)
│       │   └── NO  → Queued command bus (dispatch to queue)
│       │       Command handler runs in a queue worker
│       │       User gets immediate response, command processes later
│       └── Does the command need middleware (logging, auth, DB transactions)?
│           ├── YES → Command bus is essential
│           │   Middleware wraps every command consistently
│           └── NO  → Command bus still recommended
│               Consistency in pattern is valuable even without middleware
└── Through direct service method calls
    `$orderService->place($data)` or `Order::create($data)`
    ├── Small application (CRUD, no complex domain logic)
    │   Direct service calls may be acceptable
    └── Complex domain (business rules, validations, side effects)
        → Command bus required
        Without it, commands are implicit and hard to trace
```

### Rationale
The command bus makes every mutation in the application explicit and consistent. A command is a named object (`PlaceOrder`, `CancelInvoice`) that expresses intent. It goes through the bus, which provides middleware for cross-cutting concerns (logging, authorization, database transactions, queuing). Direct service calls make mutations implicit — they're just method calls that can't be intercepted, logged, or queued consistently. The command bus adds minimal overhead (one dispatch call per mutation) and the consistency benefit is substantial.

### Recommended Default
Command bus for all mutations (with sync dispatch for user-facing commands)

### Risks
- No command bus: mutations are implicit, no middleware, harder to trace
- Command bus for everything: simple CRUD operations don't warrant the abstraction
- Async command with user waiting: user gets response before command completes

### Related Rules
- Use the command bus over direct service calls (CPC-08/05-rules.md)
- Keep commands synchronous when the user waits (CPC-08/05-rules.md)
- Use imperative naming for commands (CPC-08/05-rules.md)

### Related Skills
- Implement CQRS with Segregated Read and Write Models (CPC-08/06-skills.md)
- Implement Command Pattern (SLP-04/06-skills.md)
- Choose Sync vs Queued Events (CPC-03/06-skills.md)

---

## Decision 3: Return DTOs vs return domain objects from queries

### Decision Tree

```
What does the query return to the caller (controller, consumer)?
├── DTOs, read models, or plain arrays
│   → Correct approach
│   Query classes return flat, denormalized data optimized for the view
│   No side effects, no domain logic in read path
│   Examples:
│   ├── Return `OrderSummary` DTO (with customer name, total, status)
│   └── Return `array` of flat data
│   Benefits: fast, safe, no coupling between presentation and domain
├── Eloquent models or domain entities
│   → Anti-pattern — leaky query
│   Returning entities exposes:
│   ├── Internal behavior (relationships, scopes, accessors)
│   ├── Coupling (presentation depends on domain internals)
│   └── Laziness (developer didn't create a DTO)
│   └── Fix: create a DTO or read model for every query response
└── Raw database results (no model, no DTO)
    → Conditionally acceptable
    Raw results are even faster but lose structure
    Acceptable for internal queries that don't cross boundaries
    For cross-context or API responses, always use DTOs
```

### Rationale
Queries should return data, not behavior. Eloquent models carry relationships, scopes, accessors, and mutation logic — none of which belongs in the read path. A DTO is a flat, immutable data container with no behavior. It's faster to construct (no model hydration overhead), safer to expose (no lazy loading surprises), and decoupled (changing the domain model doesn't change the DTO). Every query boundary is an opportunity to create an optimized, safe read model.

### Recommended Default
Always return DTOs or read models from queries

### Risks
- Returning entities: lazy loading N+1 queries from views, coupling presentation to domain
- Returning arrays: no type safety, harder to evolve, harder to consume
- Returning too many DTOs: overhead of maintaining many small classes

### Related Rules
- Never return domain objects from queries (CPC-08/05-rules.md)
- Keep commands synchronous when the user waits (CPC-08/05-rules.md)
- Authorize commands, authorize queries separately (CPC-08/05-rules.md)

### Related Skills
- Implement CQRS with Segregated Read and Write Models (CPC-08/06-skills.md)
- Optimize Read Models (MMD-14/06-skills.md)
- Define Formalized Contracts (CPC-01/06-skills.md)
