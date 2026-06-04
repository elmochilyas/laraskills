# Metadata

Domain: Application Architecture Patterns
Subdomain: Communication Patterns and Contracts
Knowledge Unit: CQRS pattern
Knowledge Unit ID: CPC-08
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Command Query Responsibility Segregation (CQRS) separates read operations from write operations into different models. Writes go through Commands (mutations). Reads go through Queries (no side effects). In a modular monolith, CQRS is often applied at the module level: write models use the domain model with business rules; read models are optimized for specific queries with denormalized data. Full CQRS (separate databases) is rarely justified. Segregated models within the same database is the pragmatic default.

---

# Core Concepts

- **Command:** A mutation that changes state. Named in imperative mood (`PlaceOrder`, `CancelInvoice`). Returns no data (or only success/failure). Validates business rules. Dispatched to a command handler.
- **Query:** A read that returns data. No side effects. Returns DTOs or read models, never domain objects. Queries can bypass the domain model for performance.
- **Segregated model:** The write model uses aggregates, entities, value objects. The read model uses flat DTOs or denormalized projections.
- **Command bus:** Dispatch commands to handlers. Laravel's command bus supports queues, middleware, and pipelines.

---

# When To Use

- Complex domain logic where read and write models differ.
- Performance optimization — read models denormalized for specific queries.
- Audit/history tracking — commands provide an explicit record.

---

# When NOT To Use

- Simple CRUD where reads and writes are nearly identical.
- Small applications where CQRS overhead outweighs benefits.

---

# Best Practices

- **Default to segregated models, not full CQRS.** WHY: Segregated models within the same database provide the benefits of CQRS (optimized reads, clean writes) without the complexity of separate databases. Full CQRS (separate databases) is only justified when read and write performance requirements diverge significantly.
- **Keep commands synchronous when user waits.** WHY: Commands that the user waits for should be synchronous. Commands that don't need immediate effect can be queued for async processing.
- **Never return domain objects from queries.** WHY: Queries should return DTOs or arrays, never entities. Returning entities exposes internal behavior and couples the presentation layer to the domain model.
- **Use command bus over direct service calls.** WHY: The command bus provides middleware support, queuing capability, pipeline processing, and a consistent pattern for all mutations. Direct service method calls lose these capabilities.

---

# Architecture Guidelines

- Commands: imperative naming, no return data, validated, dispatched to handler.
- Queries: side-effect free, return DTOs/read models, bypass domain model.
- Read models: maintained by projectors listening to events (denormalized copies).
- Write models: ORM/domain objects with business rules.
- Segregated models (same DB) is the default. Full CQRS (separate DBs) for extreme cases.

---

# Performance Considerations

- Write model: validated, routed through command bus. Adds microseconds per write.
- Read model: optimized queries, no domain logic. Significantly faster for complex queries.
- Full CQRS: eventual consistency between read/write databases.

---

# Security Considerations

- Commands should authorize the operation. Queries should authorize access to data.

---

# Common Mistakes

1. **CQRS for simple CRUD:** Separating commands and queries when reads and writes are nearly identical. Cause: applying pattern without need. Consequence: adds complexity without benefit. Better: use CQRS only when read/write models differ significantly.

2. **Domain objects in queries:** Returning entities to the presentation layer. Cause: convenience. Consequence: couples presentation to domain. Better: queries return DTOs or arrays.

3. **CQRS without command bus:** Using service methods directly without encapsulation. Cause: not adopting the pattern fully. Consequence: commands are implicit, not explicit — harder to trace and test. Better: commands should be explicit objects dispatched through a bus.

---

# Anti-Patterns

- **CQRS-for-CRUD**: Separating read/write models when they're identical. Wasteful complexity.
- **Leaky queries**: Queries returning internal domain objects instead of DTOs.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| CPC-02 Domain events basics | MMD-15 Event sourcing CQRS | CPC-09 Event sourcing |
| SLP-04 Command patterns | CPC-10 Outbox pattern | MMD-14 Read model optimization |

---

# AI Agent Notes

- Default: segregated models in same database. Avoid full CQRS.
- Commands are imperative, go through command bus, return nothing.
- Queries return DTOs, never domain objects.
- Use read models/projections for optimized queries.

---

# Verification

- [ ] Commands use imperative naming via command bus
- [ ] Queries return DTOs (not domain objects/entities)
- [ ] Read and write models are separate classes
- [ ] Read models are optimized for specific queries
- [ ] CQRS not applied to simple CRUD operations
