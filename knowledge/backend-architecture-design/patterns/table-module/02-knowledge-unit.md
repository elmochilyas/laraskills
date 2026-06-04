# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Table Module pattern in PHP/Laravel context
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Table Module organizes business logic as a single class that handles all operations on a database table, combining data access and business rules for that table. It sits between Transaction Script (procedural per use case) and Domain Model (rich per object). In Laravel, this pattern maps to service classes that manage operations for a specific table/model. It's less common than Transaction Script or Domain Model but useful for moderate-complexity logic where a table is the natural organizational unit.

---

# Core Concepts

- One class per database table
- Class handles business logic for that table's data
- Usually works with a Record Set (multiple rows)
- Stateless: methods receive data, process, return results
- Table-based organization, not object-based

---

# Mental Models

- **Table as Unit**: Every table gets its own logic handler
- **Table Service**: A service class named after the table (UserTableService)
- **Bridge between Script and Model**: More organized than Transaction Script, less rich than Domain Model

---

# Internal Mechanics

Table Module receives a Record Set (Collection of rows) and operates on it. Methods implement business rules, validation, calculations relevant to that table. In Laravel, this often manifests as a service class injected with a repository or query builder, exposing table-level operations like `getActiveUsers()`, `applyDiscountToAll()`, `validateBulkImport()`.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Table Service | Single class per table operations | Organized by table, not by use case | Can grow large if table has many operations |
| Active Record (Eloquent) | Row-level operations with embedded logic | Per-row convenience | Table-level logic needs separate class |
| Repository + Table Module | Repository for data, Table Module for logic | Separation of concerns | Two classes per table |

---

# Architectural Decisions

- Use when: business logic is naturally organized by table/entity
- Use for: moderate complexity operations on a single table
- Use for: bulk operations on all rows of a table
- Use for: reports/analytics on specific table data
- Avoid for: cross-table business logic (mixes responsibilities)
- Avoid for: complex domain rules with state-dependent behavior (use Domain Model)

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single place for table operations | Table with many operations = large class | SRP concerns |
| Works well with Record Sets | Not object-oriented | Procedural style with class overhead |
| Easy to test (inputs in, outputs out) | No encapsulation of business state | All state passed explicitly |
| Familiar to SQL-oriented developers | Doesn't model domain concepts | Gaps between table names and business concepts |

---

# Performance Considerations

- Row Set operations: can efficiently process multiple rows
- Bulk operations: update all matching rows in single query
- Memory: avoid loading entire table when only subset needed
- Pagination: Table Module can encapsulate pagination logic

---

# Production Considerations

- Keep Table Module focused on single table operations
- Move cross-table logic to Service Layer
- Combine with Repository for data access separation
- Table Module methods should be transactional where needed

---

# Common Mistakes

- Table Module growing to handle every operation → god class
- Mixing Table Module concerns (validation, formatting, persistence) → SRP violation
- Table Module calling other Table Modules → tight coupling
- Table Module becoming Transaction Script in disguise → no organizational benefit

---

# Failure Modes

- **Table Module god class**: 50+ methods on one class → unmaintainable
- **Cross-table dependency**: Table Module A calls Table Module B → tangled dependencies
- **Anemic Table Module**: just CRUD wrappers → no business logic value

---

# Ecosystem Usage

- Less common in modern Laravel; most projects use Service Layer patterns
- Found in legacy PHP applications transitioning from procedural to OO
- Some report/analytics packages use table-module-like organizations

---

# Related Knowledge Units

**Prerequisites**: Row Data Gateway, Record Set | **Related**: Transaction Script (use case vs table organization), Domain Model (object vs table orientation), Service Layer (application boundary) | **Advanced**: Table Module refactoring to Domain Model, Combining with Repository

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

