# Domain Overview

Laravel Eloquent & Domain Modeling covers how to design, structure, and use Eloquent models to represent and enforce business domain logic in production Laravel applications. This domain bridges the framework's Active Record ORM (Eloquent) with software design principles for domain modeling — including tactical Domain-Driven Design patterns, architectural decision-making, and production-hardened query strategies. It encompasses model design, relationships, lifecycle management, casting/value objects, query scoping, factories, serialization, and the architectural patterns that determine how models interact with the rest of the application.

---

# Domain Scope

## What Belongs

- **Eloquent Model Design** — base Model class, configuration surface, naming conventions, mass assignment, primary key strategies (UUIDs, ULIDs, auto-increment)
- **Relationships** — all 11 relationship types, pivot models, intermediary table design, eager/constrained/lazy loading
- **Query Strategy** — Eloquent Builder vs Query Builder decision framework, local/global scopes, custom query builders
- **Model Lifecycle** — 21 model events, dispatch ordering, observer pattern, boot trait convention, quiet operations
- **Attribute & Casting System** — accessors, mutators, built-in casts, custom cast classes, value object integration, runtime casting
- **Factories & Seeders** — factory definition, states, sequences, relationship factories, seeder organization, environment-specific seeding
- **Serialization** — toArray/toJson, API Resources (JsonResource, ResourceCollection), conditional attributes, hidden/visible, appended attributes
- **Domain Modeling Patterns** — Active Record as domain layer, trait decomposition, state machines, domain events, aggregate boundaries, bounded contexts
- **Performance & Data Integrity** — N+1 prevention, eager loading strategy, chunkById/lazy/cursor, database constraints via Eloquent, concurrency handling
- **Soft Deletes & Pruning** — SoftDeletes trait, querying trashed models, Prunable/MassPrunable
- **Architectural Decisions** — fat models vs action classes, repository debate, CQRS-lite, hexagonal architecture with Eloquent

## What Does NOT Belong

- **Raw SQL / Query Builder deep tuning** — belongs to Data & Storage Systems domain
- **Database administration** — indexes, replication, sharding, partitioning — belongs to Data & Storage Systems domain
- **Database migrations schema design** (table creation syntax) — partial overlap but primarily in Data & Storage Systems
- **General application architecture** without Eloquent coupling (e.g., generic service layer patterns, dependency injection fundamentals)
- **Testing methodologies** (unit testing, feature testing, mocking) — belongs to Testing & Quality domain
- **Deployment, CI/CD, infrastructure** — belongs to Deployment & Infrastructure domain
- **Security-specific patterns** (authentication, authorization, encryption) — belongs to Security & Identity Engineering domain
- **Queue/Job fundamentals** — belongs to Async & Distributed Systems domain

---

# Major Subdomains

1. **Model Design & Conventions** — How models are defined, configured, and organized; the Model class configuration surface, PHP 8 attribute registration, naming conventions, model file organization strategies
2. **Relationships Engineering** — Complete coverage of all relationship types, pivot/intermediary models, eager loading strategies, relationship aggregate methods (withCount, withSum, etc.), inverse relations, scoped relationships
3. **Attribute System & Value Objects** — Accessors, mutators, built-in cast types, custom caster interfaces (CastsAttributes, CastsInboundAttributes, Castable), runtime casting, value object casting, encrypted/array/collection casts
4. **Query Strategy** — Eloquent Builder API, Query Builder vs Eloquent decision framework, local/global scopes, dynamic scopes, custom builder pattern, subquery strategies, higher-order messages
5. **Model Lifecycle Management** — 21-model event system, dispatch ordering, observer pattern, observer registration (service provider vs attribute), boot trait convention, quiet operations, model broadcasting
6. **Factories & Seeders** — Factory definition, states, sequences, relationship factories (has, for, hasAttached), factory callbacks, recycle pattern, seeder organization, environment-specific seeding
7. **Serialization & API Design** — toArray/toJson internals, hidden/visible control, appends, API Resources (JsonResource, ResourceCollection), conditional attributes (when, whenHas, whenLoaded, whenCounted), DTO alternatives
8. **Domain Modeling Patterns** — Active Record as domain layer strategy, trait decomposition for cross-cutting concerns, state machine pattern (Spatie and custom), domain events vs model events, tactical DDD with Eloquent (aggregate roots, bounded contexts, domain services)
9. **Performance & Data Integrity** — N+1 detection and prevention, eager loading strategy, constrained loading, chunkById/lazyById/cursor streaming, database constraint integration, unique enforcement, concurrency handling (optimistic locking, upsert, firstOrCreate race conditions)
10. **Soft Deletes & Pruning** — SoftDeletes trait, query scoping (withTrashed, onlyTrashed), restoration, force deletion, Prunable/MassPrunable traits, artisan prune commands
11. **Architectural Decisions** — Fat models vs action/service classes, repository pattern debate, query objects, CQRS-lite read/write separation, hexagonal/ports-and-adapters with Eloquent as adapter

---

# Complete Knowledge Inventory

## Subdomain 1: Model Design & Conventions

- Model Class Fundamentals
- Model Configuration Properties ($table, $primaryKey, $incrementing, $keyType, $timestamps, $dateFormat, $connection)
- Mass Assignment Protection ($fillable, $guarded, forceCreate)
- Primary Key Strategies (auto-increment, UUID, ULID, version 7 UUID, string IDs)
- Table Naming Conventions
- Foreign Key Conventions
- Pivot Table Naming Conventions
- Model Directory Organization (app/Models, subdirectories)
- PHP 8 Attribute Registration (#[ObservedBy], #[ScopedBy], #[CollectedBy], #[UseFactory])
- Lazy Loading Prevention (preventLazyLoading, shouldBeStrict)
- Strict Mode Configuration
- Custom Collection Classes (HasCollection, #[CollectedBy])
- Custom Builder Classes (HasBuilder, #[UseEloquentBuilder])
- Timestamp Customization (CREATED_AT, UPDATED_AT constants)
- Default Attribute Values ($attributes property)
- Connection Routing

## Subdomain 2: Relationships Engineering

- Relationship Type Decision Tree
- HasOne (1:1)
- HasMany (1:N)
- BelongsTo (N:1 inverse)
- BelongsToMany (N:N via pivot)
- HasOneThrough (1:1 through intermediate)
- HasManyThrough (1:N through intermediate)
- MorphOne (polymorphic 1:1)
- MorphMany (polymorphic 1:N)
- MorphTo (polymorphic owner side)
- MorphToMany (polymorphic N:N)
- HasOneOfMany (latestOfMany, oldestOfMany, ofMany)
- Fluent Through Relationships (Laravel 11+)
- Pivot Table Design
- Custom Pivot Models
- MorphPivot Models
- Pivot Attributes (withPivot, withTimestamps)
- Custom Pivot Accessor (as method)
- Pivot Events (attaching, attached, detaching, detached, updating, updated)
- Eager Loading Fundamentals (with, load, loadMissing)
- Constrained Eager Loading (nested constraints, select sub-constraints)
- Nested Eager Loading Depth Management
- Lazy Eager Loading (load, loadMissing on collections)
- Relationship Existence Queries (has, whereHas, doesntHave, whereDoesntHave)
- Relationship Absence Queries
- Morph Relationship Queries (whereMorphHas, whereMorphDoesntHave)
- whereBelongsTo (convenience method)
- Subquery Loading (withCount, withSum, withAvg, withMin, withMax, withExists)
- Aggregate Loading on Collections (loadCount, loadSum, etc.)
- Default Model Pattern (withDefault — Null Object)
- Scoped Relationships (withAttributes)
- Inverse Relations (SupportsInverseRelations — Laravel 11)
- Chaperone Method (Laravel 11+)
- Relationship Touch (touch method on parent)

## Subdomain 3: Attribute System & Value Objects

- Accessor Fundamentals (Attribute::make with get closure)
- Mutator Fundamentals (Attribute::make with set closure)
- Multi-Attribute Mutators (returning array from set closure)
- Cached Attributes (shouldCache)
- Accessor Caching (withoutObjectCaching)
- Built-in Cast Types Overview (all 18+ types)
- Primitive Casts (int, bool, float, string, array, object, collection)
- Date/Time Casts (date, datetime, immutable_date, immutable_datetime, timestamp)
- Encrypted Casts (encrypted, encrypted:array, encrypted:collection, encrypted:object)
- Enum Casts
- Hashed Cast (inbound only)
- Decimal Cast
- AsStringable Cast
- AsArrayObject / AsEncryptedArrayObject Casts
- AsCollection / AsEncryptedCollection Casts
- AsEnumArrayObject / AsEnumCollection Casts
- Custom CastsAttributes Interface
- Custom CastsInboundAttributes Interface
- Custom Castable Interface (self-defining casts on value objects)
- Cast Parameters (passing arguments to custom casts)
- SerializesCastableAttributes Interface
- Runtime Casting (withCasts, mergeCasts)
- Value Object Fundamentals with Eloquent
- Immutable Value Object Patterns
- Value Object Casting via Castable Interface
- Money Pattern (value object + cast)
- Email/Address Value Objects

## Subdomain 4: Query Strategy

- Eloquent Builder API Fundamentals
- Builder Query Methods (where, orWhere, whereIn, whereBetween, whereNull, etc.)
- Higher Order Messages (each, map, filter on builder proxies)
- Query Builder vs Eloquent Performance Characteristics
- Query Builder vs Eloquent Decision Framework
- Hybrid Strategies (Eloquent scopes + Query Builder hydration)
- toBase Method (skip model hydration)
- Local Scopes (scope methods)
- Dynamic Scopes (parameterized scope methods)
- Global Scopes (Scope interface, class-based)
- Global Scope Registration (#[ScopedBy], addGlobalScope)
- Global Scope Suppression (withoutGlobalScope, withoutGlobalScopes)
- SoftDeletingScope (framework bundled global scope)
- Custom Builder Pattern (extending Eloquent Builder)
- Domain-Specific Query Methods on Custom Builders
- Subquery Selects
- Subquery Where Clauses
- Raw Expressions in Queries
- JSON Column Queries
- Full Text Search Queries (whereFullText — MySQL/PostgreSQL)
- Union Queries
- Where Clauses on Relationship Columns (whereRelation)
- Conditional Clauses (when, unless on builder)

## Subdomain 5: Model Lifecycle Management

- Model Event Catalog (21 events — retrieved, creating, created, updating, updated, saving, saved, deleting, deleted, trashing, restoring, restored, forceDeleting, forceDeleted, replicating, booting, booted, retrieving, pivotAttaching, pivotAttached, pivotDetaching, pivotDetached, pivotUpdating, pivotUpdated)
- Event Dispatch Order
- Event Propagation (returning false to halt)
- Observer Pattern Fundamentals
- Observer Class Methods (map to events)
- Observer Registration via Service Provider
- Observer Registration via #[ObservedBy] Attribute
- Observer Registration Ordering
- Observer Anti-Patterns (overuse, hidden side effects)
- Boot Trait Convention (boot{TraitName} static method)
- Initialize Trait Convention (initialize{TraitName})
- Trait Boot Ordering
- Quiet Operations (saveQuietly, deleteQuietly, forceDeleteQuietly, restoreQuietly)
- Transactional Operations (withoutEvents callback)
- Event Dispatcher Management (getEventDispatcher, setEventDispatcher, flushEventListeners)
- Manual Event Firing (fireModelEvent)
- Custom Model Events
- Model Broadcasting (BroadcastsEvents, BroadcastsEventsAfterCommit)
- Model Event Testing (Model::withoutEvents, event faking)
- Replicating Event Handling

## Subdomain 6: Factories & Seeders

- Factory Class Convention (Database\Factories\{Model}Factory)
- HasFactory Trait
- Factory Definition Method
- Factory States (state method, state classes)
- Factory Sequences (Sequence, CrossJoinSequence)
- Factory Callbacks (afterMaking, afterCreating)
- Factory Configure Method
- HasOne/HasMany Factory Relationships (has method, magic has{Relation})
- BelongsTo Factory Relationships (for method, magic for{Relation})
- BelongsToMany Factory Relationships (hasAttached)
- Recycle Pattern (recycle method)
- Factory States — Trashed (built-in soft delete support)
- Factory Count
- Factory make vs create
- Factory raw
- Factory Overriding Attributes
- Factory Model Discovery (newFactory method)
- Cross-Join Sequences
- Seeder Organization (DatabaseSeeder, calling multiple seeders)
- Seeder Call and CallSilent
- Environment-Specific Seeding
- Migration + Seed Strategy (migrate:fresh --seed)
- Seed Data for Testing Environments
- Sequential vs Random Data Generation

## Subdomain 7: Serialization & API Design

- toArray Method Internals
- toJson Method
- jsonSerialize Interface
- attributesToArray (without relations)
- Hidden Attributes ($hidden, makeHidden, setHidden)
- Visible Attributes ($visible, makeVisible, setVisible)
- Appended Attributes ($appends, append, setAppends)
- Date Serialization Format (serializeDate, date:format cast)
- API Resources — JsonResource Fundamentals
- API Resources — ResourceCollection
- Conditional Attribute Inclusion (when)
- whenHas (attribute exists check)
- whenNotNull
- whenLoaded (relationship loaded check)
- whenCounted
- whenAggregated
- whenPivotLoaded
- mergeWhen
- Resource Wrapping (withoutWrapping, data key)
- Resource Pagination (paginationInformation)
- Additional Metadata (with, additional)
- Resource Response Customization (withResponse)
- API Resource Collections (collection method)
- DTO Patterns as Serialization Layer
- Spatie Laravel Data Package
- API Resources vs DTOs Decision

## Subdomain 8: Domain Modeling Patterns

- Active Record as Domain Layer (embracing Eloquent as the domain entity)
- Domain Methods on Models (isPublished, hasExpired, markAsPaid — expressive behavior)
- Aggregate Boundaries with Eloquent
- Trait Decomposition for Cross-Cutting Concerns
- Spatie Package Trait Conventions (HasRoles, InteractsWithMedia, HasTranslations, LogsActivity)
- State Machine Pattern Fundamentals
- Spatie Model States Package
- Custom State Machine Implementation
- State Transition Guards
- State Validation
- Domain Events vs Model Events
- Dispatching Domain Events from Model Operations
- Domain Event Listeners and Projections
- Bounded Contexts with Laravel Modules
- Tactical DDD Patterns Overview
- Repository Pattern in DDD Context
- Domain Services
- Consistency Boundaries (aggregate roots)

## Subdomain 9: Performance & Data Integrity

- N+1 Query Detection (Debugbar, Telescope, query counting)
- Lazy Loading Violations (preventLazyLoading, custom handlers)
- N+1 Prevention Strategies (eager load before access)
- Constrained Eager Loading for Column Reduction
- Selecting Only Needed Columns
- $with Property Blast Radius
- Chunking vs Cursor Decision
- chunkById (safe for mutating tables)
- lazy / lazyById / lazyByIdDesc
- cursor (memory-efficient, single query)
- Cursor Limitations (eager loading incompatibility)
- Database Constraint Integration (foreign keys, unique constraints in Eloquent)
- Unique Enforcement (firstOrCreate, createOrFirst, upsert)
- firstOrCreate Race Conditions
- createOrFirst (atomic create-or-first — Laravel 10.20+)
- upsert for Bulk Operations
- Optimistic Locking Pattern
- Pessimistic Locking (lockForUpdate, sharedLock)
- Query Count Testing
- Subquery Optimization

## Subdomain 10: Soft Deletes & Pruning

- SoftDeletes Trait
- SoftDeletingScope (global scope)
- deleted_at Column Convention
- Querying Soft-Deleted Models (withTrashed, onlyTrashed, withoutTrashed)
- Restoring Soft-Deleted Models
- Force Deleting
- Soft Delete Event Lifecycle (trashing, restoring)
- Soft Delete Relationships Handling
- Prunable Trait (prunable, pruning, prune methods)
- MassPrunable Trait
- Prune Artisan Command (model:prune, --model flag)
- Pruning Schedule Configuration

## Subdomain 11: Architectural Decisions

- Fat Models vs Action Classes
- Action Class Pattern (single-invokable classes)
- When Actions Are Justified (cross-aggregate operations)
- When Model Methods Suffice (within-aggregate logic)
- Repository Pattern Debate
- When Repositories Add Value (multiple data sources)
- When Repositories Are Overengineering (single Active Record source)
- Query Object Pattern (alternative to repositories)
- Service Class Organization
- CQRS-Lite with Eloquent (separate read/write models)
- Hexagonal Architecture / Ports & Adapters
- Eloquent as Infrastructure Adapter
- Framework Decoupling Considerations
- Team and Project Size Factors in Decisions

---

# Knowledge Classification

| Knowledge Unit | Classification |
|---|---|
| Model Class Fundamentals | Foundation |
| Model Configuration Properties | Foundation |
| Mass Assignment Protection | Foundation |
| Table/Foreign Key Conventions | Foundation |
| Relationship Type Decision Tree | Foundation |
| HasOne / HasMany / BelongsTo | Foundation |
| BelongsToMany | Intermediate |
| Eager Loading Fundamentals | Foundation |
| Local Scopes | Foundation |
| Global Scopes | Intermediate |
| Accessor Fundamentals | Foundation |
| Mutator Fundamentals | Foundation |
| Built-in Cast Types (primitives) | Foundation |
| Encrypted Casts | Intermediate |
| Eloquent Builder API | Foundation |
| Higher Order Messages | Intermediate |
| Query Builder vs Eloquent Decision | Intermediate |
| N+1 Detection and Prevention | Foundation |
| chunk vs cursor Decision | Intermediate |
| Model Events Overview (retrieved, creating, created, etc.) | Foundation |
| Observer Pattern | Intermediate |
| Observer Registration | Foundation |
| Boot Trait Convention | Advanced |
| Factory Definition | Foundation |
| Factory States | Intermediate |
| Factory Relationships | Intermediate |
| API Resources — JsonResource | Intermediate |
| API Resources — Conditional Attributes | Intermediate |
| Custom Casts (CastsAttributes) | Advanced |
| Value Object Casting | Advanced |
| Custom Query Builders | Advanced |
| State Machine Pattern | Advanced |
| Spatie Model States | Advanced |
| Domain Events vs Model Events | Advanced |
| HasOneOfMany (latestOfMany, oldestOfMany) | Advanced |
| Fluent Through Relationships | Intermediate |
| Pivot Events | Intermediate |
| Inverse Relations | Intermediate |
| Chaperone Method | Intermediate |
| Runtime Casting (withCasts) | Advanced |
| Castable Interface (self-defining casts) | Expert |
| createOrFirst (atomic) | Advanced |
| Upsert Patterns | Advanced |
| Optimistic/Pessimistic Locking | Advanced |
| Subquery Selects and Where | Advanced |
| Global Scope Suppression | Intermediate |
| Trait Decomposition Pattern | Intermediate |
| Aggregate Boundaries | Expert |
| Bounded Contexts | Expert |
| Tactical DDD with Eloquent | Expert |
| Repository/Query Object Patterns | Advanced |
| CQRS-Lite | Expert |
| Hexagonal Architecture with Eloquent | Expert |
| Event Sourcing with Eloquent | Enterprise |
| Multi-Tenant Domain Modeling | Enterprise |
| Domain Event Projections | Enterprise |

---

# Dependency Map

```
Model Design & Conventions
├── Model Configuration Properties
│   └── Mass Assignment Protection
├── Primary Key Strategies
│   └── Relationship Foreign Keys (depends on key type)
└── Model Organization (directory, traits)
    └── Trait Decomposition Pattern (depends on boot/inject conventions)

Model Design & Conventions
↓
Relationships Engineering
├── Relationship Fundamentals (HasOne, HasMany, BelongsTo)
│   ├── HasOneOfMany, HasManyThrough
│   └── Eager Loading
│       ├── Constrained Eager Loading
│       │   └── N+1 Prevention
│       ├── Aggregate Methods (withCount, withSum)
│       └── Lazy Eager Loading
├── BelongsToMany (depends on pivot table design)
│   ├── Custom Pivot Models
│   ├── Pivot Attributes
│   └── Pivot Events
└── Polymorphic Relationships
    └── MorphToMany, MorphPivot

Relationships Engineering + Model Design
↓
Query Strategy
├── Eloquent Builder API
│   └── Higher Order Messages
├── Local Scopes → Dynamic Scopes
├── Global Scopes (depends on Scope interface)
│   └── Global Scope Suppression
├── Custom Builders (depends on HasBuilder trait)
└── Query Builder vs Eloquent (depends on performance understanding)
    └── Hybrid Strategies
    └── toBase Usage

Model Design & Conventions
↓
Attribute System & Value Objects
├── Accessors → Mutators → Cached Attributes
├── Built-in Casts → Custom Casts
│   ├── CastsAttributes Interface
│   ├── CastsInboundAttributes Interface
│   └── Castable Interface
├── Runtime Casting
└── Value Object Casting (advanced, depends on Castable)

Relationships Engineering + Query Strategy + Attribute System
↓
Serialization
├── toArray/toJson (depends on attributes + relations)
│   ├── Hidden/Visible
│   └── Appends (depends on accessors)
├── API Resources
│   ├── Conditional Attributes
│   └── Pagination
└── DTOs (depends on value objects)

Model Design → Model Lifecycle
├── Model Events → Event Dispatch Order → Event Control (quiet operations)
├── Observers (depends on events)
├── Boot Trait Convention (depends on trait system)
└── Domain Events (advanced, depends on event understanding)

Model Lifecycle + Model Design
↓
Factories & Seeders
├── Factory Definition → Factory States → Factory Sequences
├── Factory Relationships (depends on relationship types)
│   ├── has/hasAttached → Circular Dependency Resolution
│   └── Recycle Pattern
└── Seeders (depends on factories + model events)

Model Design → Soft Deletes & Pruning
├── SoftDeletes Trait → SoftDeletingScope
├── Querying Soft Deletes → Restoration → Force Delete
└── Prunable → MassPrunable

Relationships + Query Strategy + Model Lifecycle
↓
Domain Modeling Patterns
├── Active Record as Domain Layer
│   ├── Domain Methods on Models
│   ├── Aggregate Boundaries
│   └── Trait Decomposition
├── State Machines (depends on custom casts + lifecycle)
├── Domain Events (depends on model events)
└── Tactical DDD
    ├── Bounded Contexts
    ├── Aggregate Roots
    ├── Repositories
    └── Domain Services

All Above → Architectural Decisions
├── Fat Models vs Actions
├── Repository Debate
├── CQRS-Lite
└── Hexagonal Architecture

All Above → Performance & Data Integrity
├── N+1 Prevention (depends on eager loading + relationships)
├── Chunking/Streaming (depends on query strategy)
├── Data Constraints (depends on model design)
└── Concurrency (depends on events + database)
```

---

# Missing Knowledge Risk Analysis

## Most Commonly Forgotten Areas

1. **N+1 in nested/indirect contexts** — Developers catch N+1 in controllers but miss it in Blade components, API Resources, accessors, and queued jobs. The `$with` property on models is especially dangerous because it fires on every query context (Nova, Filament, CLI, tests) silently.

2. **$with property blast radius** — Often used for convenience without understanding that every query from any context inherits the eager loads, creating hidden performance drains across admin panels, APIs, and background jobs.

3. **Eager loading column constraints** — Developers eager load entire relationship tables when only 1-2 columns are needed. Combined with missing foreign keys in constrained eager loads, this creates silent empty-relation bugs.

4. **chunk() mutation problem** — Using `chunk()` instead of `chunkById()` on tables being mutated mid-iteration causes skipped and duplicate rows. This is a production-only issue not visible in small test datasets.

5. **cursor() + lazy loading** — `cursor()` is incompatible with eager loading, so accessing any unloaded relationship inside the iteration loop re-introduces the N+1 that was being avoided.

6. **firstOrCreate race conditions** — Under concurrent load, `firstOrCreate` throws `UniqueConstraintViolationException`. Developers don't know about `createOrFirst()` (Laravel 10.20+) or explicit locking strategies.

7. **Boot trait ordering** — Multiple traits can define the same `boot{TraitName}` hook, but execution order depends on trait composition order. Unexpected side effects when traits register conflicting event listeners.

8. **Observer side effect opacity** — Observers make model operations non-local. A `User::create()` might trigger activity logging, cache flushing, API calls, and notifications through observer chains. Developers new to a codebase don't know where side effects originate.

9. **Model event halt propagation** — Returning `false` from an event handler halts the save operation. This is rarely documented explicitly and can cause inexplicable save failures when observers return null instead of nothing.

10. **Relationship naming collisions with casts() method** — Laravel 11 deprecated the `$casts` property in favor of `casts()` method. If a model has a relationship named `casts()`, the method signature conflicts — a refactoring hazard when upgrading.

11. **Pivot table model choice** — Developers use default `Pivot` when they need `MorphPivot`, or don't create custom pivot models when the pivot table has extra attributes. Leads to type confusion and data access bugs.

12. **Soft delete relationship behavior** — HasMany relationships on soft-deleted models behave differently. Developers often forget to add `->withTrashed()` to relationship definitions for associated soft-deletable models.

---

# Research Findings

## Recurring Expert Recommendations

- **Enable lazy loading prevention** in all non-production environments via `Model::preventLazyLoading()` or `Model::shouldBeStrict()`
- **Use Eloquent as the domain layer** — don't wrap it in repositories unless you genuinely have multiple data sources
- **Decompose model behavior into traits** using the `boot{TraitName}` convention (Spatie pattern)
- **Prefer custom Builders** over scattered `scope` methods for models with complex query APIs
- **Use `chunkById()` not `chunk()`** when the query set may mutate during iteration
- **Constrain eager loads** to only the columns needed, and always include foreign keys
- **Use `withCount()`/`withSum()`** instead of loading full relationship collections for scalar aggregates
- **Test Eloquent queries with a real database** — mocking Eloquent queries gives false confidence
- **Profile queries** before optimizing (Telescope, Debugbar)
- **Use `toBase()`** when you need Eloquent scoping without model hydration overhead
- **Keep domain logic on models** within aggregate boundaries; extract cross-aggregate logic to action classes

## Recurring Architectural Patterns

- **Trait decomposition**: Every concern extracted to a trait. Spatie packages (HasRoles, InteractsWithMedia, HasTranslations) and framework core (HasTimestamps, SoftDeletes) follow this.
- **Custom Builders**: Extending `Illuminate\Database\Eloquent\Builder` for domain-specific query methods (e.g., `PostBuilder::published()->withAuthor()->recent()`).
- **Action classes**: Single-invokable classes (`__invoke`) for business operations that cross aggregate boundaries.
- **Fluent domain APIs**: Methods returning `$this` for method chaining on models (e.g., `$user->assignRole('admin')->givePermissionTo('edit')`).
- **State machines**: Explicit state classes with transition guards (Spatie `laravel-model-states`).
- **Value object casting**: Immutable domain primitives (Money, Email, Address) via custom Eloquent casts.
- **CQRS-lite**: Eloquent for writes, plain queries or Query Builder for reads/reports.
- **PHP 8 Attribute configuration**: Moving from property declarations to attributes (`#[ObservedBy]`, `#[ScopedBy]`, `#[CollectedBy]`, `#[UseEloquentBuilder]`).

## Recurring Tradeoffs

| Tradeoff | Context | Guidance |
|---|---|---|
| Fat models vs Action classes | Where to place business logic | Models for within-aggregate logic; Actions for cross-aggregate or multi-model operations |
| Eloquent vs Query Builder | Query performance vs expressiveness | Eloquent for domain (90%), Query Builder for data processing/reports (10%) |
| Observers vs Explicit events | Traceability vs convenience | Observers for universal side effects (logging, cache flush); explicit dispatch for business workflows |
| Repository pattern vs Direct Eloquent | Abstraction vs simplicity | Skip repositories unless multiple data sources exist today |
| API Resources vs DTOs | Type safety vs convention | Resources for simple APIs; DTOs (spatie/laravel-data) for complex typed contracts |
| Global vs Local scopes | Automatic vs explicit | Avoid global scopes beyond SoftDeletes; they make queries non-obvious |
| $with property vs manual with() | Convenience vs control | Avoid $with on models; use explicit with() per query context |
| UUID vs Auto-increment PKs | Distribution vs performance | UUIDs for distributed systems; auto-increment for single-node apps |
| JSON columns vs Normalized tables | Schema flexibility vs queryability | JSON for simple translatable/structured data; normalized tables for query-heavy paths |

## Recurring Misconceptions

- **"Eloquent is slow"** — The problem is almost always N+1 queries or unconstrained eager loading, not the ORM itself. With proper query strategy, Eloquent overhead is negligible for typical page loads.
- **"Repository pattern is always needed for testability"** — In-memory SQLite testing with `RefreshDatabase` makes mock-based testing arguments obsolete for most applications.
- **"Global scopes are safe and transparent"** — Global scopes silently modify every query on a model, including admin panels, APIs, and background jobs. They are the #1 cause of "missing data" bugs.
- **"`$with` is just a convenience"** — `$with` runs on every query, from every context. It is a hidden performance contract with your entire application.
- **"`chunk()` is safe for all iteration"** — `chunk()` uses offset-based pagination internally, which duplicates/skips rows when the dataset is being mutated.
- **"`cursor()` is always better than `chunk()`"** — `cursor()` holds the connection open for the entire iteration, can't eager load, and keeps all models in memory until iteration completes.
- **"Model events are for domain logic"** — Model events are infrastructure concerns (persistence lifecycle). Domain logic belongs in domain events or explicit method calls.
- **"Soft deletes are free"** — Soft deletes add `IS NULL` checks to every query via a global scope, can cause index degradation, and create relationship logic complexity.

---

# Future Expansion Opportunities

1. **Event Sourcing with Eloquent** — Using Eloquent models as event stores, projection builders, and read models in event-sourced systems. Spatie's `laravel-event-sourcing` package is the reference.

2. **Eloquent with CQRS/Full Command-Query Separation** — Beyond CQRS-lite into full command/query responsibility segregation with separate read models and command handlers.

3. **Multi-Tenant Domain Modeling** — Row-level vs database-level tenancy strategies, tenant-scoped global scopes, tenant-aware relationships and queries.

4. **Eloquent in Event-Driven Architecture** — Using Eloquent models as event producers in larger event-driven systems, async projection maintenance.

5. **Data Warehouse / BI Integration from Eloquent** — Materialized view strategies, read model optimization for analytics, ETL pipeline design from Eloquent sources.

6. **LLM/Training Data Pipelines from Eloquent** — Structuring Eloquent queries for training data extraction, dataset versioning, production inference pipelines.

---

# Sources Consulted

## Tier 1 — Framework Truth

- **Laravel Documentation**: Eloquent ORM (all sections — Getting Started, Relationships, Collections, Mutators/Casts, Serialization, API Resources, Scopes, Events, Factories, Seeders, Soft Deletes)
- **Laravel Source Code**: `Illuminate/Database/Eloquent/` namespace — Model.php, Builder.php, Collection.php, Concerns/*.php, Relations/*.php, Casts/*.php, Attributes/*.php, Factories/*.php, SoftDeletes.php
- **Laravel Release Notes**: v9, v10, v11 Change Logs and Upgrade Guides
- **Laravel News**: Feature announcements, deprecation notices, new method coverage

## Tier 2 — Expert Production Usage

- **Laravel Daily** (Povilas Korop): Eloquent patterns, model design, query optimization tutorials
- **Spatie Blog**: Package architecture posts (laravel-model-states, laravel-data, laravel-translatable, laravel-medialibrary, laravel-permission, laravel-activitylog)
- **Tighten Blog** (Matt Stauffer, Adam Wathan): Eloquent best practices, TLint, CRUDdy by Design
- **Beyond Code / Laravel Beyond CRUD**: Tactical DDD with Laravel series, domain-driven design patterns
- **Laracon Talks**: Taylor Otwell keynotes, Adam Wathan ("Resisting Complexity", "CRUDdy By Design"), community talks on actions, DTOs, state machines
- **Laravel News**: Community best practice roundups, package highlights, PHP 8+ patterns

## Tier 3 — Production Repositories

- **Laravel Framework**: `illuminate/database` source — structure and conventions
- **Spatie Packages**: laravel-permission, laravel-medialibrary, laravel-activitylog, laravel-translatable, laravel-model-states
- **Koel**: Music streaming app (17k+ stars) — Eloquent model organization, custom builders
- **Monica CRM**: Relationship management, complex Eloquent models
- **Laravel Jetstream**: First-party authentication scaffolding — Eloquent teams/permissions patterns
- **Laravel Horizon**: Queue monitoring — Eloquent read models for monitoring data
- **Laravel Pulse**: Application monitoring — Eloquent for aggregated metrics

## Tier 4 — Community Intelligence

- **Reddit** (r/laravel, r/PHP): Common mistakes, architectural debates
- **GitHub Discussions** (laravel/framework): Feature requests, pattern debates
- **GitHub Issues** (laravel/framework, spatie packages): Bug patterns, edge cases
- **Stack Overflow**: Most frequent Eloquent questions (N+1, relationship queries, casting)
- **Laravel News Discussions**: Community comments on best practice articles
