# Domain Overview

Application Architecture Patterns in Laravel encompasses the structural decisions and organizational strategies that govern how a Laravel codebase is arranged, how components communicate, and how business logic is separated from infrastructure concerns. This domain addresses the fundamental tension in Laravel development: the framework's default MVC structure is deliberately simple and productive for small-to-medium projects, but enterprise-scale applications require deliberate architectural decisions around module boundaries, layer separation, and code organization to prevent the degradation of maintainability as complexity grows. The domain spans from the simplest controller-thinning patterns (Services, Actions) through to full Clean Architecture/Hexagonal Architecture implementations, modular monolith designs, and event-driven architectures with CQRS.

The Laravel ecosystem occupies a unique position in this domain because the framework provides an opinionated default structure that is both its greatest strength and a source of architectural debate. Unlike unopinionated frameworks where every architectural decision must be made from scratch, Laravel developers must decide how far to deviate from the defaults and at what cost. The community has converged on several recurring patterns—Service Layer, Action classes, modular monoliths with bounded contexts, and Clean Architecture variants—each representing different points on the spectrum between simplicity and separation. The predominant recommendation emerging from community leaders and production experience is to stay close to Laravel's defaults while organizing code by domain within those defaults, adding abstraction layers only when they solve measurable problems rather than for architectural purity.

This domain intersects with several other knowledge domains including Domain-Driven Design (ubiquitous language, bounded contexts, aggregates), Software Design Patterns (SOLID principles, dependency injection, repository pattern), API Design (RESTful conventions, versioning, resource transformations), Testing Strategy (how architecture enables or impedes testability), and DevOps/Deployment (monolith vs. microservices deployment models). The architectural patterns chosen directly influence team velocity, onboarding time, refactoring safety, and operational complexity.

# Domain Scope

## What Belongs

- **Code Organization Strategies**: Directory structures, namespace conventions, module arrangements, file placement rules.
- **Layered Architectures**: Presentation/Application/Domain/Infrastructure separation, dependency rules, layer communication patterns.
- **Modular Monolith Design**: Module definition, inter-module contracts, shared kernels, module isolation, extraction paths.
- **Service Layer Patterns**: Service classes, action classes, use case classes, DTOs, orchestration vs. operation.
- **Business Logic Extraction**: Controller thinning strategies, where business rules live, domain services vs. application services.
- **Communication Patterns**: Events between modules, contracts/interfaces, direct method calls, message buses.
- **Architecture Enforcement**: CI guardrails, code review rules, architecture tests, dependency violation detection.
- **Pattern Selection Decision Frameworks**: When to use which pattern based on team size, project stage, complexity.

## What Does Not Belong

- **Specific DDD Tactical Patterns**: Entities, value objects, aggregates, repositories in the DDD sense (covered in Domain-Driven Design domain).
- **CQRS/Event Sourcing Implementation Details**: Separate domain, though architectural decisions enabling them are relevant.
- **Specific Package/Tool Usage**: How to configure nwidart/laravel-modules or any specific package (separate domain).
- **Detailed Testing Patterns**: Testing strategies belong in Testing domain, though architecture's impact on testability is noted.
- **Deployment Architecture**: Actual infrastructure decisions (covered in DevOps/Deployment domain).
- **Specific Laravel Features Usage**: Form requests, policies, scopes as features (covered in Laravel Fundamentals).
- **Performance Optimization**: Caching strategies, query optimization (separate domain).

## Related ECC Domains

- **Domain-Driven Design**: Tactical patterns, ubiquitous language, bounded contexts—overlaps heavily but DDD is the philosophy, architecture patterns are the structural manifestation.
- **Laravel Fundamentals**: Default MVC structure, service container, facades—the base that architecture patterns extend or deviate from.
- **API Design**: How architecture affects API versioning, resource transformation, request/response contracts.
- **Testing Strategy**: How architectural boundaries enable or impede different testing levels.
- **Database Design**: Schema organization per module, migration strategies, data ownership.
- **DevOps/Deployment**: Monolith vs. microservices operational concerns.

# Major Subdomains

## 1. Code Organization Standards

The principles and conventions for arranging source files, establishing namespaces, and maintaining consistency across the codebase. Covers default Laravel structure vs. alternatives, naming conventions, file placement rules, and the tradeoffs of different organizational axes (by layer vs. by feature vs. by domain).

Knowledge Units:
- Default Laravel directory structure strengths and limitations
- Layer-based organization (Controllers, Models, Services folders)
- Feature-based/vertical slice organization
- Domain-based organization (bounded contexts as top-level directories)
- Hybrid approaches (domains inside default structure)
- Naming conventions for classes, directories, namespaces
- PSR-4 autoloading implications for custom directory structures
- File placement decision rules

## 2. Layered Architecture Patterns

Architectures that separate code into distinct horizontal layers with controlled dependency directions. Encompasses traditional three-layer (Presentation/Business/Persistence), Clean Architecture (Domain/Application/Infrastructure/Presentation), Hexagonal/Ports-and-Adapters, and Onion Architecture variants as applied to Laravel.

Knowledge Units:
- Three-layer architecture: Presentation, Business Logic, Data Access
- Clean Architecture four-layer model: Domain, Application, Infrastructure, Presentation
- Hexagonal Architecture: Ports and Adapters pattern
- Dependency Rule: inward-pointing dependencies
- Framework independence of domain layer
- Layer communication protocols and contracts
- Transaction boundaries in layered architecture
- When layered architecture adds value vs. over-engineering
- Incremental migration from MVC to layered architecture
- Architecture test enforcement of layer boundaries

## 3. Modular Monolith Design

The practice of organizing a single Laravel deployment into explicit, self-contained modules that map to business domains, with controlled inter-module communication. Sits between standard monolith and microservices as the recommended starting architecture for most Laravel applications.

Knowledge Units:
- Module definition and boundaries
- Module internal structure conventions
- Inter-module communication via contracts
- Inter-module communication via events
- Shared kernel: what belongs in shared vs. modules
- Module autonomy: routes, migrations, tests per module
- Module discovery and registration mechanisms
- Module dependency management
- Migration path from modules to microservices
- Module isolation enforcement and violation detection
- Module versioning and compatibility
- Shared infrastructure concerns (auth, logging across modules)

## 4. Service Layer Pattern

The practice of extracting business logic from controllers into dedicated service classes. Covers the spectrum from simple service classes to the service-action-repository pyramid, including the roles of each layer and when each is appropriate.

Knowledge Units:
- Service classes: entity-oriented grouping of operations
- Action classes: single-operation-per-class pattern
- Use Case classes: business intent encapsulation with DTOs
- DTO (Data Transfer Object) pattern for structured input
- Repository pattern: data access abstraction (including debate)
- Service vs. Action vs. Use Case decision criteria
- Service layer call graph: Controller → Service → Action → Repository
- Transaction management across service boundaries
- Service binding strategies (singleton vs. transient)
- Interface contracts for services
- Testing implications of each pattern variant

## 5. Domain Boundaries and Bounded Contexts

The structural manifestation of DDD's bounded contexts within a Laravel application. Covers how to identify, define, and enforce boundaries between different business domains sharing the same codebase.

Knowledge Units:
- Bounded context identification heuristics
- Context mapping: relationships between bounded contexts
- Shared kernel: minimal shared code between contexts
- Anti-corruption layer pattern for legacy integration
- Module ownership: team-to-module mapping
- Database schema ownership per context
- Cross-context data access patterns
- Context-specific Eloquent models
- Evolutionary context boundaries: splitting and merging
- Integrating with external systems at context boundaries

## 6. Communication Patterns and Contracts

How different parts of a Laravel application communicate across architectural boundaries. Covers synchronous (direct calls, contracts) and asynchronous (events, queues) patterns, and the tradeoffs of each.

Knowledge Units:
- Interface/contract-based synchronous communication
- Domain events for decoupled module notification
- Event handling strategies (sync vs. queued)
- Message bus patterns for inter-module communication
- Circuit breaker pattern for module resilience
- Bridge/adapter pattern between modules
- Event versioning and schema evolution
- Direct service calls vs. event-driven design decision criteria
- CQRS as a communication pattern
- Facade pattern risks and alternatives

## 7. Architecture Enforcement and Governance

The tools, practices, and automated checks that ensure architectural decisions are consistently applied and boundaries are not violated over time.

Knowledge Units:
- Architecture testing: layer dependency tests
- CI pipeline architecture checks
- Code review architectural guardrails
- Static analysis rules for architecture enforcement
- Automated import violation detection
- Service provider binding documentation
- Architecture Decision Records (ADRs)
- Convention documentation and team onboarding
- Refactoring strategies for architectural remediation
- Architecture drift detection and response

# Complete Knowledge Inventory

## Subdomain: Code Organization Standards

| KU ID | Knowledge Unit | Difficulty |
|--------|---------------|-----------|
| COS-01 | Default Laravel directory structure and its design rationale | Foundation |
| COS-02 | Organizing by layer: app/Http, app/Models, app/Services | Foundation |
| COS-03 | PSR-4 autoloading configuration for custom directories | Foundation |
| COS-04 | Namespace conventions and directory-to-namespace mapping | Foundation |
| COS-05 | Organizing by feature/vertical slice within app/ | Intermediate |
| COS-06 | Organizing by domain: app/Domains/{Domain} structure | Intermediate |
| COS-07 | Hybrid: domains inside default Laravel structure | Intermediate |
| COS-08 | Feature-based naming conventions for classes and files | Intermediate |
| COS-09 | When to deviate from defaults: decision criteria | Advanced |
| COS-10 | Team-scale organizational strategies (10+ engineers) | Advanced |
| COS-11 | Monorepo vs. multi-repo organizational tradeoffs | Advanced |
| COS-12 | File placement decision trees and team conventions | Advanced |

## Subdomain: Layered Architecture Patterns

| KU ID | Knowledge Unit | Difficulty |
|--------|---------------|-----------|
| LAP-01 | Three-layer architecture: Presentation, Business, Data | Foundation |
| LAP-02 | Clean Architecture layers: Domain, Application, Infrastructure, Presentation | Advanced |
| LAP-03 | Hexagonal/Ports and Adapters architecture concept | Advanced |
| LAP-04 | The Dependency Rule: inward-pointing dependencies | Advanced |
| LAP-05 | Domain layer: entities, value objects, domain services | Advanced |
| LAP-06 | Application layer: use cases, DTOs, application services | Advanced |
| LAP-07 | Infrastructure layer: Eloquent implementations, external adapters | Advanced |
| LAP-08 | Presentation layer: controllers, requests, resources, routes | Intermediate |
| LAP-09 | Framework independence of domain layer in practice | Expert |
| LAP-10 | Mapping between domain entities and Eloquent models | Expert |
| LAP-11 | Transaction boundaries in layered architecture | Expert |
| LAP-12 | Incremental migration from MVC to layered architecture | Expert |
| LAP-13 | Architecture tests to enforce layer boundaries | Expert |
| LAP-14 | Real-world tradeoffs: when Clean Architecture pays off | Expert |
| LAP-15 | Octane compatibility considerations for layered architecture | Expert |

## Subdomain: Modular Monolith Design

| KU ID | Knowledge Unit | Difficulty |
|--------|---------------|-----------|
| MMD-01 | Module vs. microservice: definition and key differences | Foundation |
| MMD-02 | Module boundary identification: bounded context heuristics | Intermediate |
| MMD-03 | Module internal structure conventions | Intermediate |
| MMD-04 | Module registration and discovery mechanisms | Intermediate |
| MMD-05 | Module autonomy: routes, migrations, config, tests per module | Intermediate |
| MMD-06 | Inter-module synchronous communication via contracts | Intermediate |
| MMD-07 | Inter-module asynchronous communication via events | Intermediate |
| MMD-08 | Shared kernel: what belongs in shared vs. modules | Intermediate |
| MMD-09 | Module dependency management and versioning | Advanced |
| MMD-10 | Cross-module data access: query patterns without JOINs | Advanced |
| MMD-11 | Module extraction path: from module to independent service | Advanced |
| MMD-12 | Module isolation enforcement: linting and CI rules | Advanced |
| MMD-13 | Database schema ownership per module | Advanced |
| MMD-14 | Multi-tenancy considerations in modular monolith | Expert |
| MMD-15 | Event sourcing and CQRS within modular monolith | Expert |
| MMD-16 | Testing strategies for modular monolith | Expert |
| MMD-17 | Modular monolith vs. microservices decision framework | Advanced |

## Subdomain: Service Layer Pattern

| KU ID | Knowledge Unit | Difficulty |
|--------|---------------|-----------|
| SLP-01 | Service classes: grouping operations by entity | Foundation |
| SLP-02 | Action classes: single-operation-per-class pattern | Foundation |
| SLP-03 | Controller thinning: what to extract and what to keep | Foundation |
| SLP-04 | Service-Action-Repository pyramid architecture | Intermediate |
| SLP-05 | DTO pattern: structured data transfer between layers | Intermediate |
| SLP-06 | Use Case classes with DTO contracts | Intermediate |
| SLP-07 | Service class naming conventions and method design | Intermediate |
| SLP-08 | Action class naming: verb-noun commands | Intermediate |
| SLP-09 | Dependency injection for services and actions | Intermediate |
| SLP-10 | Service vs. Action vs. Use Case: decision criteria | Advanced |
| SLP-11 | Transaction management: where transactions belong | Advanced |
| SLP-12 | Service binding strategies: singleton vs. transient | Advanced |
| SLP-13 | Interface contracts for services: when and why | Advanced |
| SLP-14 | Repository pattern debate: when it adds value vs. overhead | Advanced |
| SLP-15 | Repository pattern: feature-oriented vs. generic | Advanced |
| SLP-16 | Query objects as alternative to repositories | Intermediate |
| SLP-17 | Service layer testing strategies | Intermediate |
| SLP-18 | Avoiding anemic domain model in service-layer architectures | Expert |
| SLP-19 | Service layer in Octane: state management considerations | Expert |

## Subdomain: Domain Boundaries and Bounded Contexts

| KU ID | Knowledge Unit | Difficulty |
|--------|---------------|-----------|
| DBC-01 | Bounded context identification: language, teams, data | Intermediate |
| DBC-02 | Context mapping: relationships between contexts | Advanced |
| DBC-03 | Shared kernel design: minimal shared code | Intermediate |
| DBC-04 | Anti-corruption layer pattern | Advanced |
| DBC-05 | Eloquent model ownership per context | Intermediate |
| DBC-06 | Database schema organization per bounded context | Advanced |
| DBC-07 | Cross-context queries without database JOINs | Advanced |
| DBC-08 | Evolutionary boundaries: splitting a monolithic model | Advanced |
| DBC-09 | Team-to-context mapping: Conway's Law in practice | Advanced |
| DBC-10 | Integrating legacy systems at context boundaries | Expert |
| DBC-11 | Multi-context transactions and saga patterns | Expert |
| DBC-12 | Eventual consistency across context boundaries | Expert |

## Subdomain: Communication Patterns and Contracts

| KU ID | Knowledge Unit | Difficulty |
|--------|---------------|-----------|
| CPC-01 | Interface contract definition for inter-module calls | Intermediate |
| CPC-02 | Domain events: definition, dispatch, handling | Intermediate |
| CPC-03 | Synchronous vs. queued event handling | Intermediate |
| CPC-04 | Event design: naming, payload, versioning | Advanced |
| CPC-05 | Message bus implementation patterns | Advanced |
| CPC-06 | Circuit breaker pattern for module resilience | Expert |
| CPC-07 | Bridge/adapter pattern between modules | Intermediate |
| CPC-08 | CQRS: command/query separation as communication pattern | Advanced |
| CPC-09 | Event sourcing fundamentals and architectural implications | Expert |
| CPC-10 | Outbox pattern for reliable event publishing | Expert |
| CPC-11 | Distributed tracing considerations for event-driven architecture | Expert |
| CPC-12 | Facade pattern: risks and appropriate use | Intermediate |

## Subdomain: Architecture Enforcement and Governance

| KU ID | Knowledge Unit | Difficulty |
|--------|---------------|-----------|
| AEG-01 | Architecture testing with Pest/PHPUnit | Intermediate |
| AEG-02 | Layer dependency enforcement in CI | Advanced |
| AEG-03 | PHPStan/Psalm custom rules for architecture | Advanced |
| AEG-04 | Code review architectural checklists | Intermediate |
| AEG-05 | Automated import violation detection | Advanced |
| AEG-06 | Architecture Decision Records (ADRs) | Intermediate |
| AEG-07 | Team convention documentation | Foundation |
| AEG-08 | Architecture drift detection strategies | Advanced |
| AEG-09 | Refactoring strategies for architectural remediation | Expert |
| AEG-10 | Onboarding documentation for architectural conventions | Intermediate |

# Knowledge Classification

## Foundation
- COS-01: Default Laravel directory structure
- COS-02: Organizing by layer (Http, Models, Services)
- COS-03: PSR-4 autoloading configuration
- COS-04: Namespace conventions and mapping
- LAP-01: Three-layer architecture concept
- MMD-01: Module vs. microservice distinction
- SLP-01: Service classes concept
- SLP-02: Action classes concept
- SLP-03: Controller thinning fundamentals
- AEG-07: Team convention documentation
- AEG-10: Onboarding documentation

## Intermediate
- COS-05: Feature-based organization
- COS-06: Domain-based organization
- COS-07: Hybrid domain-default structure
- COS-08: Feature-based naming conventions
- LAP-08: Presentation layer design
- MMD-02: Module boundary identification
- MMD-03: Module internal structure
- MMD-04: Module registration/discovery
- MMD-05: Module autonomy (routes, migrations, tests)
- MMD-06: Inter-module sync communication
- MMD-07: Inter-module async communication
- MMD-08: Shared kernel design
- SLP-04: Service-Action-Repository pyramid
- SLP-05: DTO pattern
- SLP-06: Use Case classes
- SLP-07: Service naming/method design
- SLP-08: Action naming conventions
- SLP-09: DI for services/actions
- SLP-16: Query objects as alternative
- SLP-17: Service layer testing
- DBC-01: Bounded context identification
- DBC-03: Shared kernel design
- DBC-05: Eloquent model ownership per context
- CPC-01: Interface contracts
- CPC-02: Domain events basics
- CPC-03: Sync vs. queued events
- CPC-12: Facade pattern risks
- AEG-04: Code review architectural checklists
- AEG-06: Architecture Decision Records

## Advanced
- COS-10: Team-scale organizational strategies (10+)
- COS-11: Monorepo vs. multi-repo tradeoffs
- COS-12: File placement decision trees
- COS-09: When to deviate from defaults
- LAP-02: Clean Architecture four-layer model
- LAP-03: Hexagonal/Ports and Adapters
- LAP-04: Dependency Rule
- LAP-05: Domain layer design
- LAP-06: Application layer design
- LAP-07: Infrastructure layer design
- MMD-09: Module dependency management
- MMD-10: Cross-module data access
- MMD-11: Module extraction path
- MMD-12: Module isolation enforcement
- MMD-13: Database schema ownership per module
- MMD-17: Modular monolith vs. microservices decision framework
- SLP-10: Service vs. Action vs. Use Case decision criteria
- SLP-11: Transaction management
- SLP-12: Service binding strategies
- SLP-13: Interface contracts for services
- SLP-14: Repository pattern debate
- SLP-15: Feature-oriented vs. generic repositories
- DBC-02: Context mapping
- DBC-04: Anti-corruption layer
- DBC-06: DB schema per context
- DBC-07: Cross-context queries
- DBC-08: Evolutionary boundaries
- DBC-09: Team-to-context mapping
- CPC-04: Event design, payload, versioning
- CPC-05: Message bus patterns
- CPC-08: CQRS pattern
- AEG-02: Layer dependency enforcement in CI
- AEG-03: PHPStan/Psalm custom rules
- AEG-05: Automated import violation detection
- AEG-08: Architecture drift detection

## Expert
- LAP-09: Framework independence of domain layer
- LAP-10: Domain entity to Eloquent mapping
- LAP-11: Transaction boundaries in layered architecture
- LAP-12: Incremental migration to layered architecture
- LAP-13: Architecture tests for boundaries
- LAP-14: Clean Architecture real-world tradeoffs
- LAP-15: Octane compatibility
- MMD-14: Multi-tenancy in modular monolith
- MMD-15: Event sourcing/CQRS in modular monolith
- MMD-16: Testing strategies for modular monolith
- SLP-18: Avoiding anemic domain model
- SLP-19: Service layer in Octane
- DBC-10: Legacy integration at context boundaries
- DBC-11: Multi-context transactions and sagas
- DBC-12: Eventual consistency across contexts
- CPC-06: Circuit breaker pattern
- CPC-09: Event sourcing fundamentals
- CPC-10: Outbox pattern
- CPC-11: Distributed tracing for event-driven
- AEG-09: Refactoring for architectural remediation

## Enterprise
- (No KUs at Enterprise tier in this domain — enterprise emerges from combination of Expert-tier KUs across subdomains with specific scaling constraints)

# Dependency Map

## Learning Dependency Graph (must-learn-before → can-learn)

```
Foundation Tier (No dependencies)
  COS-01 → COS-02, COS-03, COS-04
  COS-01 → SLP-01, SLP-02, SLP-03
  LAP-01 → LAP-02, LAP-03
  MMD-01 → MMD-02

Intermediate Tier
  COS-02, COS-03, COS-04 → COS-05, COS-06, COS-07, COS-08
  SLP-01, SLP-02 → SLP-04, SLP-05, SLP-06, SLP-07, SLP-08, SLP-09
  SLP-03 → SLP-10, SLP-11
  SLP-04 → SLP-16, SLP-17
  MMD-02, MMD-03 → MMD-04, MMD-05
  MMD-06, MMD-07 → CPC-01, CPC-02, CPC-03
  DBC-01 → DBC-03, DBC-05
  AEG-04, AEG-06 → AEG-07, AEG-10

Advanced Tier
  COS-05, COS-06 → COS-09, COS-10, COS-11, COS-12
  LAP-02 → LAP-04, LAP-05, LAP-06, LAP-07, LAP-08
  LAP-03 → LAP-04, LAP-05, LAP-06, LAP-07
  MMD-04, MMD-05 → MMD-09, MMD-10, MMD-11, MMD-12, MMD-13
  MMD-06, MMD-07 → MMD-17
  SLP-10, SLP-11, SLP-12 → SLP-13, SLP-14, SLP-15
  DBC-01 → DBC-02, DBC-04, DBC-06, DBC-07, DBC-08, DBC-09
  CPC-04 → CPC-05
  CPC-02 → CPC-08
  AEG-02 → AEG-03, AEG-05
  LAP-08, LAP-05, LAP-06 → AEG-01

Expert Tier
  LAP-04, LAP-05 → LAP-09, LAP-10, LAP-11, LAP-12, LAP-13, LAP-14, LAP-15
  MMD-09, MMD-10, MMD-11 → MMD-14, MMD-15, MMD-16
  SLP-10, SLP-11, SLP-12, SLP-13 → SLP-18, SLP-19
  DBC-04, DBC-06, DBC-07 → DBC-10, DBC-11, DBC-12
  CPC-05, CPC-08 → CPC-06, CPC-09, CPC-10, CPC-11
  AEG-03, AEG-05 → AEG-08, AEG-09
  MMD-17 → (context bridge to Microservices domain)
  CPC-09 → (context bridge to Event Sourcing domain)
```

## Cross-Domain Dependencies
- DDD tactical patterns (Entities, Value Objects, Aggregates) are prerequisites for LAP-05, LAP-09, LAP-10
- Laravel Service Container knowledge is prerequisite for SLP-09, SLP-12, SLP-13
- PHP namespace/autoloading fundamentals are prerequisite for all COS KUs
- Testing fundamentals are prerequisite for AEG-01

# Missing Knowledge Risk Analysis

## What Developers Commonly Miss or Misunderstand

### 1. Architecture as Ceremony vs. Architecture as Solution
The most pervasive mistake: adopting Clean Architecture, Hexagonal Architecture, or Repository Pattern because "that's what enterprise codebases do" without first identifying a concrete problem these patterns solve. Developers create elaborate folder structures with interfaces, DTOs, and use cases for simple CRUD applications, paying the complexity tax without receiving any benefit. The repository pattern is especially prone to this—countless Laravel projects have `UserRepositoryInterface` → `EloquentUserRepository` → `AppServiceProvider` bindings that simply wrap `User::find()`, adding three files of indirection for zero behavioral value. The correct approach is to start with Laravel defaults and introduce abstraction only when a measurable problem emerges (duplicated query logic, need to swap persistence, multi-source data).

### 2. The Myth of "Database Portability"
Developers cite "what if we switch from MySQL to MongoDB" as justification for repository interfaces. In practice, this almost never happens. Eloquent's relational semantics (foreign keys, JOINs, eager loading) permeate the application code. A repository interface does not make a database switch trivial—it provides a starting point for a massive rewrite. The repository pattern justifies itself through testability, centralized query logic, and navigability, not database portability. Teams that understand this make better decisions about when and where to apply the pattern.

### 3. Contaminated Domain Layer
In Clean Architecture implementations, domain classes are meant to have zero framework dependencies. The most common violation: Eloquent models (which extend `Illuminate\Database\Eloquent\Model`) placed in the Domain layer. Eloquent models are infrastructure—they couple domain logic to the ORM, the database connection, and Laravel itself. True domain-layer separation requires either mapping between domain entities and Eloquent models (explicit mapping layer) or accepting a "Laravel-first" domain that uses Eloquent but remains HTTP-independent. The latter is more practical for most teams but should be a conscious tradeoff, not an oversight.

### 4. The God Service Class
Service classes start clean but accumulate methods over time until `UserService` handles registration, password reset, profile updates, email verification, notification preferences, and social login links. This recreates the fat controller problem in a different file. The signal to split is when a service class has multiple unrelated responsibilities or when its constructor grows beyond 3-4 dependencies. Action classes (one class per operation) are the natural remedy, but teams must recognize when a service class has crossed from "organized" to "dumping ground."

### 5. Module Boundary Bleeding in Modular Monoliths
Teams adopt modular monolith structure but continue writing cross-module Eloquent queries: `Order::whereIn('product_id', Product::where('vendor_id', $x)->pluck('id'))`. This completely defeats module isolation. The module boundary is not a folder—it's a runtime constraint. True module isolation means Module A cannot directly access Module B's database tables. Communication must go through contracts (interfaces) or events. Without enforcement (architecture tests, CI checks), modular structure degrades into a "distributed monolith" within a single codebase.

### 6. Transaction Scope Confusion
A recurring debate: where do database transactions belong? Common mistakes include putting `DB::transaction()` in controllers (presentation layer concern), in actions (too granular, prevents composition), or in repositories (data access layer should not own orchestration). The emerging consensus places transaction boundaries in the service/use-case layer, where the business operation is coordinated. Controllers should not manage transactions. Individual actions should not manage transactions. The orchestrating service or use case should.

### 7. Event Proliferation and Opacity
Teams over-use events to the point where understanding a request flow requires tracing through 5-6 event-listener chains. Events are valuable for true decoupling (cross-module communication, side effects that shouldn't block the response) but harmful when used as the default communication mechanism within a module. Direct method calls are simpler, traceable, and type-safe. Events should be chosen deliberately for decoupling, not as a default architectural style.

### 8. Architecture Without Enforcement
The most elegant folder structure is meaningless without automated enforcement. Teams design a Clean Architecture or modular monolith structure, then a year later discover infrastructure imports in domain classes and cross-module Eloquent queries everywhere. Architecture tests (Pest/PHPUnit), static analysis rules (PHPStan), and CI checks are not optional—they are what make the architecture real. Without them, architecture is aspirational.

### 9. Octane Compatibility Blind Spots
Laravel Octane changes the memory model: services that were once instantiated per-request are now persistent across requests. Service classes holding request-scoped state (authenticated user, tenant context) cause bugs when Octane reuses instances. Teams adopting Octane must audit their service layer for state, prefer transient bindings for stateful services, and ensure singleton services are stateless. This is frequently overlooked until production bugs emerge.

### 10. Over-investment in "Microservices-readiness"
Teams spend months building an abstract, interface-driven, event-saturated architecture in anticipation of someday splitting into microservices. The irony: the modular monolith is already the recommended architecture—it provides isolation without distribution cost. Building for "future microservices" by adding abstraction layers that are not currently needed delays shipping, increases complexity, and often makes the wrong tradeoffs because the actual splitting conditions are unknown. The correct approach is a clean modular monolith with explicit module boundaries and contracts, then extract when a specific scaling constraint justifies it.

### 11. Action Classes Calling Other Action Classes
An architectural anti-pattern in the Pulsar and Clean Service-Action conventions: if Action A calls Action B, the call graph becomes opaque, testing becomes coupled, and the service layer loses its coordination role. The convention is that Services (or Use Cases) orchestrate, and Actions are leaf-node operations. Actions should not depend on other Actions—if they do, the logic should be extracted to a Service or the actions should be composed at the orchestration layer.

# Research Findings

## Recurring Recommendations

1. **Start with Laravel defaults, organize by domain within them.** The strongest cross-cutting recommendation from community leaders (Benjamin Crozat, Laravel Daily, Tighten, Spatie) is to stay close to Laravel's default structure as long as possible, while grouping code by business domain within the `app/` directory. This avoids both the "one giant flat directory" problem and the "cathedral of abstractions" problem.

2. **Modular monolith first, microservices later (if ever).** For teams under 15-30 engineers, a well-structured modular monolith is the recommended architecture. The consensus from production experience reports (AcquaintSoft, Internative, Deploynix) is that 40%+ of microservices implementations should have stayed monolithic. The modular monolith provides domain isolation without distribution complexity.

3. **Add abstraction layers only when they solve a real problem.** The community has converged on "problem-first architecture" rather than "pattern-first architecture." Don't add repositories until query duplication or multi-source data emerges. Don't add Clean Architecture until business logic is genuinely complex enough to warrant framework independence. Don't add events until you have cross-module concerns that need decoupling.

4. **Services orchestrate, Actions operate.** The emerging consensus on the Service-Action distinction: Service classes coordinate workflows and manage transactions; Action classes perform single business operations. This avoids both the god service class and the fragmented action-over-everything extremes.

5. **Architecture must be enforced to be real.** Without automated enforcement, every architecture degrades over time. Architecture tests, CI lint rules, and code review checklists are the only things that prevent "architecture drift." Several packages and patterns exist specifically for this (Modulate's violation checker, Clean Architecture's Pest tests, PHPStan custom rules).

## Pattern Tradeoffs

### Layered Architecture (Clean/Hexagonal)
- **Pros**: Framework-independent business logic, explicit separation of concerns, testability, adapters are swappable
- **Cons**: High initial complexity, mapping overhead between layers, requires discipline to maintain, often over-engineered for CRUD-heavy apps
- **Best for**: Products with long lifespans, complex business rules, multiple delivery mechanisms, team scale >10 engineers
- **Community position**: Recommended for complex domains, but "Clean Architecture Lite" (domain + application without full Ports/Adapters) is more common in practice than full implementations

### Modular Monolith
- **Pros**: Single deployment, domain isolation, clear ownership, migration path to microservices, simpler than distributed systems
- **Cons**: Module boundary enforcement is ongoing work, shared database couples domains at the data layer, risk of "distributed monolith" within one codebase
- **Best for**: Teams of 10-50 engineers, products expected to live 5+ years, multiple business domains sharing one deployment
- **Community position**: The consensus recommended starting architecture for serious Laravel applications

### Service Layer with Actions
- **Pros**: Thin controllers, testable business logic, clear responsibility per class, low ceremony
- **Cons**: Can lead to class explosion, no framework independence (Eloquent still used), risk of anemic domain model
- **Best for**: Most Laravel applications, especially teams of 3-20 engineers
- **Community position**: The "sweet spot" for most teams—more structure than default MVC, less than full Clean Architecture

### Repository Pattern
- **Pros**: Centralized query logic, swappable data sources, testable via mocking
- **Cons**: Over-engineering for single-database apps, wrapper-around-Eloquent syndrome, ceremony without value in most cases
- **Best for**: Multi-source data applications, teams that need strict data access boundaries, DDD-heavy architectures
- **Community position**: Heavily debated, with Taylor Otwell and many community leaders considering it unnecessary for most Laravel apps; the nuance is "use feature-oriented, not generic repositories, and only when they solve a real problem"

### Event-Driven Architecture
- **Pros**: Loose coupling between modules, async processing, scalability, clear side-effect boundaries
- **Cons**: Opacity in request flow, debugging complexity, eventual consistency challenges, overused as default communication
- **Best for**: Cross-module notifications, workflows that span multiple domains, asynchronous side effects
- **Community position**: Valuable for cross-module communication, but over-used within single modules where direct calls are simpler

## Common Misconceptions

1. **"Microservices are more sophisticated than a monolith."** A clean modular monolith demonstrates stronger architectural discipline than a premature microservices architecture. Microservices solve organizational problems (team independence), not technical problems.
2. **"Repository pattern is required for clean architecture."** Clean Architecture requires dependency inversion, which is typically achieved through interfaces, but those interfaces can be at any boundary—not necessarily a repository.
3. **"We need interfaces for every service class."** If there is only one implementation and no planned alternative, an interface adds ceremony without value. Add interfaces when variation exists or is imminent.
4. **"Validation belongs in the domain layer."** Input validation (format, required fields) belongs in presentation boundaries (Form Requests). Business invariant validation belongs in domain/application. Mixing them creates confusion about responsibility.
5. **"Actions should own transactions."** Per emerging consensus (Pulsar, Clean Service-Action), transactions belong at the orchestration layer (Service or Use Case), not in individual Actions.
6. **"Module = microservice readiness."** Modules in a modular monolith share a database, process space, and deployment. A module boundary is a code convention, not a network boundary. Extraction to a microservice requires additional work around APIs, data ownership, and deployment.

## Production Considerations

- **Works for Octane but requires audit**: Stateful services, static properties, and request-scoped singletons are all problematic with persistent application servers.
- **Database schema ownership per module**: When modules share a database, table naming conventions (e.g., `orders_` prefix) and schema-per-tenant (for multi-tenancy) prevent cross-module coupling at the data layer.
- **CI enforcement is mandatory**: Without `modulate:lint`, architecture tests, or PHPStan rules, architectural boundaries degrade within weeks.
- **Onboarding cost of complex architecture**: New developers joining a Clean Architecture project face a steeper learning curve than a standard Laravel project. Documentation, ADRs, and clear conventions mitigate this.
- **Testing pyramid shifts with architecture**: Domain-layer logic enables rapid unit tests. Application-layer logic enables use-case-level tests. Infrastructure-layer testing requires integration tests. Good architecture shifts the testing pyramid toward more unit tests and fewer slow feature tests.

## Open Debates in the Community

1. **Interface-per-service**: Some practitioners insist every service class should have an interface; others argue it's YAGNI until a second implementation exists.
2. **Eloquent in Domain**: Strict Clean Architecture says no; pragmatic Laravel DDD says yes, as long as it's not HTTP-coupled.
3. **Actions calling Actions**: Pulsar explicitly forbids it; other conventions allow it for composition.
4. **Single service provider vs. per-module**: nwidart/laravel-modules requires per-module providers; some teams prefer a single application registry.
5. **DTO necessity**: Some teams use typed DTOs for every inter-layer transfer; others use arrays until complexity demands types.

## Tools Worth Knowing

- **nwidart/laravel-modules**: Most popular module package, dynamic discovery, industry standard
- **Modulate**: Newer package with built-in violation checker, cleaner extraction path, stricter conventions
- **shahmy/laravel-ddd-toolkit**: Artisan commands for DDD scaffolding, bounded contexts, VSCode extension integration
- **ElberCanoles/laravel-clean-architecture**: Generates full CQRS architectures with architecture tests, mapper classes
- **andrebhas/laravel-brick**: Bridges, circuit breakers, async cross-module communication
- **mghrby/modular-ddd**: Complete DDD with event sourcing, CQRS, multi-tier caching, health monitoring

# Future Expansion Opportunities

1. **Laravel 13+ Container Scoping**: New framework feature for genuinely isolated domain boundaries within a single codebase, enabling separate service providers, config, and test suites per domain. As this matures, it may change how modular monoliths are implemented.

2. **Octane-Native Architecture Patterns**: As Octane adoption grows, architecture patterns that are explicitly Octane-compatible (stateless services, context-safe singletons) will emerge as a distinct subdomain.

3. **AI-Assisted Architecture Migration**: Tools that can automatically detect architecture violations and suggest refactoring paths (similar to Modulate's violation checker but more advanced).

4. **Architecture Migration Playbooks**: Codified strategies for migrating from MVC to modular monolith to Clean Architecture, with automated tooling support.

5. **Cross-Module Observability**: Standardized approaches to tracing and debugging requests that cross module boundaries within a monolith, potentially using OpenTelemetry instrumentation.

6. **Domain Event Schema Registries**: As event-driven architecture grows within modular monoliths, schema registries and version negotiation for domain events will become more important within single codebases.

7. **Feature Flag-Integrated Architecture**: Patterns for combining feature flags with modular architecture to enable safe, incremental architectural changes in production.

8. **AI-Generated Module Scaffolding**: Based on business requirement descriptions, systems could propose module boundaries, contracts, and event schemas, accelerating architectural decision-making.

# Sources Consulted

## Tier 1: Official Laravel Resources
- Laravel Documentation: Directory Structure, Service Container, Events, Queues
- Laravel News: Controller refactoring patterns and community patterns coverage
- Taylor Otwell's public statements on repository pattern and framework philosophy

## Tier 2: Community Leaders and Educators
- Benjamin Crozat (benjamincrozat.com): "20 Laravel Best Practices for 2026"
- Povilas Korop (Laravel Daily): Service vs. Action class guidance, repository pattern position
- Laravel News (PovilasKorop): "Restructuring a Laravel Controller using Services, Events, Jobs, Actions"
- Tighten Blog: General Laravel architecture guidance and conventions
- Spatie Team: Open source package architecture conventions

## Tier 3: Open Source Implementations
- theaddresstech/laravel-modular-ddd: Complete modular DDD with CQRS, event sourcing
- hussiensulyman/modulate: Modular monolith scaffolding with built-in violation checking
- andrebhas/laravel-brick: Modular monolith with bridges, circuit breakers, async support
- shahmy/laravel-ddd-toolkit: DDD scaffolding with bounded contexts
- ElberCanoles/laravel-clean-architecture: Clean Architecture with CQRS and architecture tests
- FaranAli9/laravel-pulsar: Service-oriented architecture with action pattern
- mghrby/modular-ddd: Production-ready DDD with event sourcing
- morphling-dev/3d: Morphling 3D architectural framework for Laravel
- sinakhaghani/laravel-hexagonal-architecture-example: Hexagonal architecture example
- ldaidone/laravel-ddd-starter: DDD starter kit with pre-built structure
- lauchoit/laravel-hex-mod: Hexagonal architecture scaffolding

## Tier 4: Community Discussions and Articles
- Shazeedul Karim: "Modular Monolith with Clean Architecture in Laravel" (blog.shazeedul.dev)
- Ahmed Ebead: "Laravel Enterprise Architecture Patterns" (Medium)
- Daniele Barbaro: "A Year of Hexagonal Architecture in Laravel" (Medium)
- Ratheepan Jayakkumar: "Clean Service-Action Architecture" (Medium)
- internative.net: "Microservices vs Monolith: Decision Framework for CTOs 2026"
- AcquaintSoft: "Laravel Microservices 2026: When to Use, When to Avoid"
- Harry Es Pant: "Exploring Modular Monolithic Architecture" (Medium)
- Ann R.: "How to Introduce Bounded Contexts Into an Existing Laravel App" (Level Up Coding)
- Hafiq Iqmal: "The Repository Pattern in Laravel Is Almost Always Wrong" (CodeToDeploy)
- Sadique Ali: "I Rebuilt a Laravel App With the Repository Pattern" (Apna Hive)
- Gun Gun Priatna: "Service Class, Action Class, and Use Case Class" (QadrLabs)
- Nabil Hassen: "Service Pattern in Laravel: Why It Is Meaningless"
- Ilyas Kazi: "Laravel Actions vs Services — Deep Dive" (Medium)
- Adriana Eka Prayudha: "Service Layer vs Action Pattern vs Jobs in Laravel" (Medium)
- DigitalCodeLabs: "Monolith vs. Micro-services: Is Laravel Still the King?"
- nabilhassen.com: "Service Pattern in Laravel — Why it is meaningless"
- dev.to: "Clean Architecture in Laravel: Structuring Large-Scale Applications"
- Reddit r/laravel: Discussions on repository pattern, modular monolith tradeoffs
- Laravel GitHub Discussions: Architecture patterns and best practices discourse
