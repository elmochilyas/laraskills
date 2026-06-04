# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Record Set pattern (Laravel Collection)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Record Set represents tabular data as an in-memory collection of records that supports operations like filtering, sorting, aggregation, and transformation. Laravel's `Collection` class (and its lazy variant `LazyCollection`) is a sophisticated Record Set implementation that provides a fluent API over arrays of data. Collections form the backbone of data processing in Laravel, bridging database queries and application code with chainable, expressive methods.

---

# Core Concepts

- Tabular data: collection of homogeneous records (rows)
- Fluent operations: chainable filter, map, reduce
- Lazy vs eager: Collection (eager) vs LazyCollection (lazy streaming)
- Immutability: operations return new collection, don't modify original
- Higher-order messaging: `->each->method()` syntax for method calls on each item

---

# Mental Models

- **Spreadsheet**: Collection as in-memory spreadsheet you can filter, sort, group
- **Unix Pipes**: `cat | grep | sort | uniq` — chain transformations
- **SQL in Memory**: SELECT/WHERE/ORDER/GROUP BY on in-memory data

---

# Internal Mechanics

Collection wraps a PHP array. Each method (filter, map, sort) creates a new Collection instance. LazyCollection wraps an Iterator or Generator—operations are stacked but not executed until terminal method is called. PHP 8+ supports numerous array functions, but Collection provides OOP encapsulation and fluent interface.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Eager Collection (Collection) | In-memory array operations | Full feature set, predictable | Memory: entire dataset in memory |
| Lazy Collection (LazyCollection) | Streaming data processing | Memory efficient for large datasets | Some methods not available (sort, shuffle) |
| Database Collection (Eloquent) | Extended Collection for models | Relationship loading, model-specific | Coupled to Eloquent |

---

# Architectural Decisions

- Use Collection for: in-memory data transformation, filtering, grouping
- Use LazyCollection for: processing large files, DB results, CSV imports
- Use higher-order messages for: concise method calls on each item
- Avoid Collection for: very large datasets (use LazyCollection or DB pagination)
- Avoid excessive chaining: profile if chain has 15+ operations
- Prefer DB query over Collection for: filtering/sorting large datasets

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Expressive API for data transformation | Eager loading: memory for entire set | Out-of-memory for large datasets |
| Chainable, readable code | Debugging long chains is hard | Can't inspect intermediate state easily |
| LazyCollection for large data | Not all Collection methods available | Must convert to Collection when needed |
| Higher-order messaging | Magic-like behavior | Source of confusion for new team members |

---

# Performance Considerations

- Collection: all operations operate on loaded array — memory O(n)
- LazyCollection: processes one item at a time — memory O(1)
- Chaining overhead: each intermediate creates new Collection object
- Benchmark: 100k items Collection: ~50MB memory; LazyCollection: ~1MB
- Sorting: Collection sorts in memory; LazyCollection cannot sort
- Prefer DB-side filtering (where) over Collection filtering for large datasets

---

# Production Considerations

- Use `chunk()` or cursor() for large DB result sets
- Convert to LazyCollection for memory-sensitive operations
- Profile Collection-heavy operations with Telescope
- Avoid passing large Collections between requests (session, queue)
- Test with production-sized data to catch memory issues

---

# Common Mistakes

- Loading entire dataset into Collection when DB could filter → memory bloat
- Method chain too long with side effects → hard to debug
- Using Collection where LazyCollection is appropriate → memory issues
- Not understanding immutability → expecting chain to modify original
- Assuming Collection operations are as optimized as DB → performance surprises

---

# Failure Modes

- **Out of memory**: Collection of 1M+ rows exhausts memory limit
- **LazyCollection terminal method never called**: lazy operations stack but never execute
- **Method not available on LazyCollection**: trying to sort LazyCollection → exception
- **Collection mutation**: accidentally passing collection by reference and modifying
- **Chain debugging difficulty**: 20-method chain when one method returns wrong value

---

# Ecosystem Usage

- **Laravel Collections**: `Illuminate\Support\Collection`, `LazyCollection` — core data processing
- **Eloquent Collections**: `Illuminate\Database\Eloquent\Collection` — extended with model-specific methods
- **Laravel HTTP Client**: response->collect() returns collection
- **Laravel Validation**: `Validator::make($data, $rules)` validation as collection-like
- **Spatie/Laravel-Collection-Macros**: extended collection methods

---

# Related Knowledge Units

**Prerequisites**: PHP arrays, array functions | **Related**: LazyCollection (streaming vs eager), Eloquent Collections, Higher-order messages, Collection macros | **Advanced**: Collection internals, Custom collection classes, LazyCollection with generators

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

