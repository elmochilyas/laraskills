# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Data Mapper pattern in PHP/Laravel context
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Data Mapper is a layer that transfers data between objects and a database while keeping them independent of each other and the mapper itself. Unlike Active Record (Eloquent), where objects carry both data and persistence logic, Data Mapper provides complete separation of concerns. In Laravel, full Data Mapper is not natively implemented — Eloquent is ActiveRecord — but the pattern appears in projects using Doctrine ORM or custom mapping layers. The pattern's value is persistence ignorance; its cost is significant infrastructure complexity.

---

# Core Concepts

- Separation: domain objects know nothing about database
- Mapper: handles all SQL/storage operations
- Identity: mapper tracks object identity separately from database identity
- Metadata: mapping configuration between object fields and columns
- Unit of Work: often paired with mappers for transactional integrity

---

# Mental Models

- **Translator**: Mapper translates between object language (methods, properties) and database language (columns, tables)
- **Bilingual Dictionary**: Mapping definitions are the dictionary between two worlds
- **Hibernate/Doctrine**: Full ORMs that implement Data Mapper pattern

---

# Internal Mechanics

Mapper class receives domain objects to save or hydrates domain objects from DB rows. It contains SQL or uses a query interface. Mapping metadata (field → column) can be defined in attributes, XML, YAML, or PHP arrays. PHP 8 attributes make metadata configuration cleaner. The mapper must handle inheritance, associations, and identity map.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Full Data Mapper (Doctrine) | Complete ORM mapping | True persistence ignorance | Heavyweight, complex setup |
| Custom Mapper | Lightweight manual mapping | Full control, no magic | Manual work, duplicated mapping |
| Metadata-driven Mapper | Attribute-based mapping | Declarative, less code | Reflection overhead |
| Table Data Gateway | Single table operations | Simple, explicit | Doesn't handle object graphs |

---

# Architectural Decisions

- Use Data Mapper when: persistence ignorance is a requirement (Hexagonal/Clean Architecture)
- Use when: domain model is complex with deep inheritance
- Use when: Eloquent's ActiveRecord pattern creates problems (testing, SRP)
- Use for: event-sourced aggregates (mapping events to domain objects)
- Avoid for: simple CRUD — Eloquent ActiveRecord is significantly simpler
- Avoid for: teams without dedicated infrastructure for mapping layer

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Complete persistence ignorance | Complex mapping infrastructure | More code, steeper learning curve |
| Domain model is pure PHP (testable, no framework coupling) | Object-relational impedance mismatch | Complex mapping for object graphs |
| Persistence strategies swappable | Must maintain mapping layer | Every schema change = mapping update |
| Ideal for hexagonal/clean architecture | Not the Laravel way | Fights framework defaults |

---

# Performance Considerations

- Mapping overhead: each object hydrated via reflection or constructor
- Lazy loading: proxy objects for associations (Doctrine uses proxy pattern)
- Batch operations: Data Mapper inserts often less efficient than SQL bulk inserts
- Hydration: complex object graphs require multiple queries
- Identity Map: prevents duplicate objects in memory but adds tracking overhead

---

# Production Considerations

- Caching mapping metadata (Doctrine uses metadata cache)
- Migrations: Data Mapper doesn't auto-migrate like Eloquent
- Debugging: mapping issues are harder to debug than Active Record
- Profiling: dedicated SQL logging for mapper-generated queries
- Training: team must understand mapping configuration

---

# Common Mistakes

- Data Mapper for every table → overengineering for CRUD-only tables
- Mapping leaks into domain objects → domain depends on mapping details (field names, types)
- Not using Identity Map → duplicate objects for same DB row
- Complex mapping for simple cases → unnecessary indirection
- Mixing Data Mapper and Active Record in same project → inconsistent patterns

---

# Failure Modes

- **Lazy loading N+1**: mapper lazy-loads associations → unexpected query explosion
- **Stale identity map**: mapper caches object but DB was updated externally → stale data
- **Mapping misconfiguration**: field type mismatch → data corruption silently
- **Transaction not integrated**: mapper operates outside transaction → partial persistence

---

# Ecosystem Usage

- **Doctrine ORM**: full Data Mapper implementation for PHP, usable with or without Laravel
- **Laravel Doctine**: Doctrine integration package for Laravel
- **Eloquent**: ActiveRecord, NOT Data Mapper — important distinction
- **Custom mapping layers**: some Hexagonal Laravel projects implement custom Data Mappers

---

# Related Knowledge Units

**Prerequisites**: Persistence ignorance, Hexagonal Architecture | **Related**: Active Record (opposite approach), Identity Map, Unit of Work, Repository (collection abstraction vs full mapper) | **Advanced**: ORM internals, Metadata-driven mapping with PHP 8 attributes, Proxy/lazy loading generation

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

