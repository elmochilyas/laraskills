# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Gateway patterns in PHP/Laravel context
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Gateway provides an object that encapsulates access to an external system or resource, hiding its complexity and providing a simple application-facing interface. Fowler defines several gateway types: Table Data Gateway (single table operations), Row Data Gateway (single row operations), and Service Gateway (external service access). In Laravel, Eloquent models function as a hybrid of Active Record and Table/Row Data Gateway. Gateway patterns are essential for isolating external system dependencies and providing test seams.

---

# Core Concepts

- Encapsulated access: gateway hides how data is retrieved/stored
- Simple interface: application-facing methods, not system-specific
- No business logic: gateway is purely data access, not domain rules
- Types: Table Data Gateway, Row Data Gateway, Service Gateway (external API)

---

# Mental Models

- **Adapter for Data**: Gateway adapts a data source to application-friendly interface
- **Pay Phone**: You interact with simple interface, gateway handles all the signaling
- **Receptionist**: You ask for something, receptionist knows how to get it from various places

---

# Internal Mechanics

Table Data Gateway class has CRUD methods for a single table. Row Data Gateway wraps a single row with column accessors. Service Gateway wraps HTTP calls to external APIs. In Laravel, these patterns often blend: Eloquent model is Row Data Gateway (row access) + Table Data Gateway (query building) + Active Record (business logic).

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Table Data Gateway | Single table operations | Clean API per table | Each table needs its own gateway |
| Row Data Gateway | Single row as object | Natural OOP per row | Overhead: one object per row |
| Service Gateway | External API access | Isolates network/sdk complexity | Must handle network failures |
| Table Module + Gateway | Gateway for data, module for logic | Separation of concerns | Two classes per table |

---

# Architectural Decisions

- Use Table Data Gateway for: direct table operations without full ORM
- Use Row Data Gateway for: row-level operations with calculated fields
- Use Service Gateway for: all external service access (API, SDK)
- Use Gateway at: system boundaries where external systems are accessed
- Gateway vs Repository: Gateway is data-access focused; Repository is domain-collection focused
- Consider: wrapping Eloquent models in custom Gateway if Eloquent methods need restriction

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Isolates external system changes | Extra abstraction layer | More files to maintain |
| Testable via gateway mocking | Must design gateway interface upfront | Interface changes when external system evolves |
| Clean application-facing API | Gateway may mirror all external features | Feature parity maintenance burden |
| Single point for caching/retry | Gateway becomes complex if too many concerns | Leaky abstraction |

---

# Performance Considerations

- Gateway overhead: one method call delegation — negligible
- Service Gateway: network latency is the dominant cost
- Table Data Gateway: native SQL vs ORM — ORM adds mapping overhead
- Consider caching layer between application and gateway for repeated access patterns

---

# Production Considerations

- Implement retry logic in Service Gateway for transient failures
- Log gateway calls with timing for monitoring
- Handle gateway exceptions and translate to application exceptions
- Test gateway with actual external system in integration tests
- Version gateway interface if external system versioning is needed

---

# Common Mistakes

- Gateway with business logic → mixes data access and domain rules
- Gateway exposing external system types in its interface → leaky abstraction
- Gateway that doesn't handle failures → exceptions propagate to application layer
- One giant gateway for all external access → SRP violation
- Gateway without interface → can't mock in tests

---

# Failure Modes

- **External system down**: service gateway not handling → cascade failure
- **Rate limit exceeded**: gateway doesn't implement backoff → blocked requests
- **Stale data**: gateway caches but never invalidates → stale results
- **API change**: gateway not updated when external API changes → broken integration
- **Connection leak**: gateway establishes connections but doesn't release → resource exhaustion

---

# Ecosystem Usage

- **Eloquent ORM**: hybrid Table Data Gateway + Row Data Gateway + Active Record
- **Laravel HTTP Client**: `Http::fake()` for testing — wraps Guzzle/PSR-18
- **Laravel Socialite**: OAuth service gateways
- **Laravel Cashier**: subscription gateway wrapping Stripe API
- **Spatie packages**: many provide service gateways for external APIs

---

# Related Knowledge Units

**Prerequisites**: Adapter pattern, Data Source patterns | **Related**: Repository (collection abstraction vs table gateway), Adapter (interface translation vs data access), Table Data Gateway vs Data Mapper | **Advanced**: Service Gateway with circuit breaker, Gateway caching strategies, Multi-source gateway patterns

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

