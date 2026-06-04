# Bounded Contexts

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Domain Modeling Patterns
- **Last Updated:** 2026-06-02

## Executive Summary
Bounded contexts are the fundamental organizational pattern in Domain-Driven Design, dividing a large domain into explicit, internally-consistent subdomains. In Laravel, bounded contexts map to module boundaries, each with its own Eloquent models, routes, controllers, and policies. This KU covers identifying, defining, and maintaining bounded contexts in a Laravel application, including context mapping and inter-context communication.

## Core Concepts
- **Bounded Context:** A logical boundary where a particular domain model applies consistently. Inside the boundary, terms have specific meanings; outside, they may differ.
- **Context Map:** A diagram or documentation describing relationships and translations between bounded contexts.
- **Shared Kernel:** A shared subset of the domain model that two contexts agree upon, typically kept small.
- **Anti-Corruption Layer (ACL):** A translation layer that converts concepts from one context to another, preventing model pollution.
- **Ubiquitous Language:** The language used within a single bounded context, consistent across code, docs, and conversations.
- **Module:** A Laravel namespace or package that organizes a bounded context's code.

## Mental Models
- **"Context as Microcosm":** Each bounded context is its own micro-universe with internally consistent rules. The word "Customer" may mean different things in Sales context vs Support context.
- **"The Great Wall":** A bounded context is a wall. Inside, everything is consistent. Communication across walls requires translation, like crossing international borders.
- **"Team Ownership Boundary":** Each bounded context should be owned by one team. Conway's Law applies — system structure mirrors communication structure.

## Internal Mechanics
In Laravel, bounded contexts are typically organized as:
```
app/
  Contexts/
    Sales/
      Models/
      Actions/
      Events/
      Listeners/
      Routes/
      Controllers/
    Support/
      Models/
      Actions/
      Events/
      ...
```

Each context:
- Has its own Eloquent models (even if they map to different tables or the same tables with different perspectives)
- Defines its own routes and controllers
- May have its own database connection or schema
- Communicates with other contexts via events, message queues, or an anti-corruption layer

Contexts can share infrastructure (database, queue, mail) but should not share domain concepts directly.

## Patterns
- **Module Organization:** Directory-per-context within `app/Contexts/` or as separate packages.
- **Anti-Corruption Layer (ACL):** A facade/adapter that translates between contexts.
- **Context-Specific Models:** Different Eloquent models for different contexts, even for the same conceptual entity.
- **Event-Based Communication:** Contexts communicate by publishing and subscribing to events.
- **Domain Service Bridge:** A service that orchestrates across contexts through the ACL.
- **Shared Kernel as Package:** A shared library of base classes, interfaces, and value objects consumed by multiple contexts.

## Architectural Decisions
- Module boundaries: directory per context vs separate packages/repositories
- Database isolation: shared database vs separate databases per context
- Inter-context communication: direct calls (via ACL), events, message queues, or API calls
- Shared vs duplicate concepts (e.g., two contexts may each have their own User model)
- How to handle cross-context transactions (generally, avoid them)

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clear ownership and responsibilities | Initial overhead of context separation | Start with 2-3 contexts; split as needed |
| Autonomous development per context | Duplicated concepts across contexts | Duplication is acceptable; translation is worse |
| Isolated changes reduce regression risk | Cross-context queries require careful design | Use event projections for cross-context reads |
| Ubiquitous language is consistent per context | Context mapping requires upfront analysis | Evolve context boundaries iteratively |

## Performance Considerations
- Cross-context communication adds latency (queues, API calls). Keep hot paths in the same context.
- Context-specific database schemas may duplicate data across contexts.
- ACL translation layers may add CPU overhead; ensure they are efficient.
- Event-based communication across contexts introduces eventual consistency lag.

## Production Considerations
- Monitor cross-context event latency and failure rates.
- Context boundaries should align with deployment units (microservices or modular monolith with deployment isolation).
- Document the context map explicitly and review it quarterly.
- Use integration tests for inter-context contracts to catch translation errors.
- Ensure each context can be tested independently with its own test suite.

## Common Mistakes
- Making contexts too large (each context should be small enough for one team to reason about)
- Sharing database tables across contexts (creates hidden coupling)
- Using the same Eloquent model in multiple contexts (tempting but causes model bloat and ambiguous semantics)
- Skipping context mapping documentation (leads to confusion about which context owns what)
- Forcing all contexts into a single ubiquitous language (defeats the purpose of bounded contexts)

## Failure Modes
- **Context Bleed:** Concepts from one context leak into another through shared models or services. Mitigate by enforcing strict module boundaries and code review.
- **Coupled Contexts:** Two contexts that change together indicate poor boundary placement. Refactor to merge or define a clearer ACL.
- **Distributed Monolith:** Microservices with bounded contexts but runtime coupling (synchronous calls, shared databases). Enforce context autonomy.
- **Inconsistent Language:** The same term means different things in different contexts without explicit mapping. Document and translate through ACL.

## Ecosystem Usage
- Laravel modules: `nWIDart/laravel-modules`, `codedungeon/laravel-contexts`
- OSS modular Laravel: `laravel-actions` + directory-per-context structure
- Spatie's `laravel-beyond-crud` advocates for action/context separation
- Enterprise Laravel apps commonly organize by context as they grow
- `lorisleiva/laravel-actions` enables action-per-operation within contexts

## Related Knowledge Units

### Prerequisites
- active-record-domain-layer — domain entities and the Active Record pattern
- Laravel Modular Organization — namespaces, service providers, module structure
- DDD Strategic Design Fundamentals — ubiquitous language, domain vs subdomain

### Related Topics
- aggregate-roots
- aggregate-boundaries
- domain-repositories

### Advanced Follow-up Topics
- domain-services
- event-projections

## Research Notes
- Evans: *Domain-Driven Design* (2003), Chapters 3 and 14 on Bounded Context and Context Mapping
- Vaughn Vernon: *Implementing Domain-Driven Design* (2013), detailed context mapping strategies
- Eric Evans and Martin Fowler: "BoundedContext" pattern on martinfowler.com
- Sam Newman: *Building Microservices* — bounded contexts as microservice boundaries
- Community: "Modular Monolith" trend in Laravel — bounded contexts within a single application
