# Phase 1 Domain Discovery: Backend Architecture & Design

## Domain Overview

This domain encompasses the foundational architectural patterns, design principles, and structural decision-making frameworks that govern backend system construction in PHP/Laravel environments. It exists at the intersection of classical software engineering theory (GoF patterns, Martin Fowler's enterprise patterns, Eric Evans' DDD) and modern PHP ecosystem practices (PSR standards, Laravel conventions, Spatie ecosystem). The domain covers how backend systems are decomposed, how components communicate, how business logic is organized, and how architectural decisions are captured and communicated.

Unlike framework-specific knowledge (Laravel's Eloquent, routing, middleware), this domain addresses the substrate upon which framework usage sits — the architectural reasoning that determines whether a system evolves gracefully or decays into a big ball of mud. It is the domain concerned with coupling, cohesion, boundaries, contracts, and the long-term maintainability characteristics of PHP applications operating at enterprise scale.

## Domain Scope

### Included (In-Scope)

- **GoF Design Patterns in PHP** — Creational (Factory, Abstract Factory, Singleton, Builder, Prototype), Structural (Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy), Behavioral (Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor) — specifically their application in PHP/Laravel contexts including limitations imposed by PHP's runtime model
- **Enterprise Application Architecture Patterns** — Martin Fowler's catalog: Layer Supertype, Service Layer, Repository, Data Mapper, Unit of Work, Identity Map, Lazy Load, Transaction Script, Domain Model, Table Module, Gateway patterns, plugins and their applicability in PHP
- **SOLID Principles** — Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion as applied in PHP projects; common PHP-specific SOLID violations (God objects in Eloquent models, leaky abstractions in service providers)
- **GRASP Patterns** — Information Expert, Creator, Controller, Low Coupling, High Cohesion, Polymorphism, Pure Fabrication, Indirection, Protected Variations; responsibility-driven design
- **CQRS** — Command Query Responsibility Segregation; command bus patterns, query handlers, read model optimization, write model integrity, eventual consistency considerations in PHP, Laravel's built-in command bus vs dedicated packages
- **Event Sourcing** — Append-only event stores, aggregate reconstruction from event streams, event versioning, snapshots, projections, upcasting, event store implementations (EventStoreDB/Kurrent, PostgreSQL-based, Kafka-based)
- **Hexagonal Architecture (Ports & Adapters)** — Primary/driving ports, secondary/driven ports, adapter implementations, dependency inversion at architectural scale, application core isolation
- **Onion Architecture / Clean Architecture** — Dependency rule, entity layer, use case layer, interface adapter layer, framework/infrastructure layer; implementations in PHP
- **Service Layer vs Domain Model** — Transaction Script vs Domain Model decision heuristics, anemic domain model anti-pattern, rich domain model implementation
- **DTOs vs Value Objects** — Data Transfer Objects as boundary artifacts, Value Objects as domain citizens, immutability, self-validation, Spatie Laravel Data package patterns
- **Anti-Corruption Layer** — Context mapping, translation between bounded contexts, facade/adapter implementation, legacy system integration
- **Architectural Decision Records (ADRs)** — Nygard format, MADR, Y-Statements, ADR lifecycle, tooling (adr-tools, log4brains), integration with C4 models
- **Monolith vs Modular Monolith vs Microservices** — Decomposition strategies (by business capability, by subdomain), strangler fig pattern, when to decompose, organizational alignment (Conway's Law)
- **Service Decomposition** — Domain-driven decomposition, event-driven decomposition, business capability decomposition, hybrid approaches
- **Bounded Context Mapping** — Partnership, Shared Kernel, Customer-Supplier, Conformist, Anticorruption Layer, Open-Host Service, Published Language, Separate Ways
- **Event Storming** — Big Picture, Process Modeling, Software Design variants; domain events, commands, aggregates, policies, read models, external systems, hot spots
- **Contract Testing** — Consumer-driven contracts, provider-side verification, Pact framework, contract evolution, breaking change detection
- **Coupling and Cohesion** — Types of coupling (content, common, external, control, stamp, data), types of cohesion (coincidental, logical, temporal, procedural, communicational, sequential, functional); measurement and trade-off analysis

### Excluded (Out-of-Scope)

- Laravel-specific implementation details (facades, service providers, artisan commands)
- PHP language features themselves (type system, JIT, Fibers, enums — except where they constrain architectural patterns)
- Database-specific optimization (indexing, query optimization, schema design)
- Deployment/DevOps concerns (Docker, CI/CD, server configuration)
- Security-specific patterns (authentication, authorization, encryption) — these are covered in a separate domain
- Frontend/API consumer patterns
- Specific package/library recommendations beyond architectural relevance
- Testing methodologies themselves (covered in Testing domain)
- Performance profiling and tuning
- Cloud infrastructure decisions

## Major Subdomains

### 1. Design Patterns & Principles
GoF patterns adapted for PHP's class model, enterprise patterns from Fowler's catalog, SOLID/GRASP principles, pattern language for communicating architectural intent. This subdomain forms the vocabulary for all other architectural discussion.

### 2. Command Query Separation
CQRS in its various forms (from simple method-level separation to full event-sourced systems), command/query handlers, buses, middleware pipelines, read model strategies (denormalized tables, materialized views, in-memory caches).

### 3. Event-Driven Architecture
Event sourcing, domain events, integration events, event buses, event stores, message brokers, event versioning, event schema registries, idempotent consumers, outbox pattern, saga pattern, choreography vs orchestration.

### 4. Architectural Styles
Hexagonal/Clean/Onion architecture, layered architecture, modular monolith, microservices. The comparative analysis of these styles, their trade-offs, and their applicability to different classes of PHP applications.

### 5. Domain-Driven Design
Strategic DDD (bounded contexts, context maps, ubiquitous language), tactical DDD (aggregates, entities, value objects, domain services, domain events), DDD lifecycle (event storming to code), anti-corruption layer.

### 6. Architectural Governance
ADRs, architecture fitness functions, dependency analysis, modularity metrics, C4 modeling for architecture documentation, architecture reviews, RFC processes.

### 7. Service Decomposition
Decomposition strategies, bounded context identification, aggregate boundaries, module boundaries in monoliths, service boundaries in distributed systems, data ownership, transactional boundaries.

### 8. Coupling & Cohesion Analysis
Static analysis of dependency graphs, circular dependency detection, package coupling metrics (afferent/efferent coupling, instability, abstractness), modularity assessment, architectural smell detection.

## Complete Knowledge Inventory

### Design Patterns in PHP

| Pattern | Domain Application | PHP/Laravel Considerations | Maturity |
|---------|-------------------|---------------------------|----------|
| Singleton | Configuration, service containers | Generally considered anti-pattern; Laravel container makes largely obsolete | Mature |
| Factory | Object creation abstraction | Static factories vs Factory pattern; Laravel's container auto-resolution | Mature |
| Abstract Factory | Family of related objects | Useful in multi-driver implementations (cache/store/queue) | Mature |
| Builder | Complex object construction | Query builders, DTO builders, test data builders | Mature |
| Prototype | Object cloning | Shallow vs deep clone concerns in PHP | Mature |
| Adapter | Third-party integration | Driver-based architecture throughout Laravel ecosystem | Mature |
| Bridge | Abstraction/implementation decoupling | Less common in PHP; applicable in middleware/API versioning | Mature |
| Composite | Tree structures | Form handling, menu/UI structures | Mature |
| Decorator | Dynamic responsibility addition | Middleware pattern, Laravel pipeable decorators | Mature |
| Facade | Simplified interface | Laravel Facades (note: architectural distinction from Adapter) | Mature |
| Proxy | Lazy loading, access control | Lazy loading proxies, virtual proxies, protection proxies | Mature |
| Chain of Responsibility | Request processing pipeline | Laravel middleware, pipeline pattern | Mature |
| Command | Action encapsulation | Laravel command bus, queued jobs | Mature |
| Observer | Event notification | Laravel events/listeners, subscriber pattern | Mature |
| Strategy | Algorithm interchangeability | Payment gateway selection, shipping calculator variations | Mature |
| Template Method | Algorithm skeleton | Service base classes, typical in framework base classes | Mature |
| State | State-dependent behavior | Order workflow state machines | Mature |

### Enterprise Patterns (Fowler)

| Pattern | Category | PHP Relevance |
|---------|----------|--------------|
| Transaction Script | Domain Logic | Quick CRUD applications; testable but not scalable for complex logic |
| Domain Model | Domain Logic | Complex business logic; may conflict with Eloquent's ActiveRecord pattern |
| Table Module | Domain Logic | Single object handling table operations; less common in Laravel |
| Service Layer | Domain Logic | Application boundary; Laravel service classes, encapsulating use cases |
| Repository | Data Source | Abstraction over persistence; debate over necessity with Eloquent |
| Data Mapper | Data Source | Full mapping layer; Eloquent is closer to ActiveRecord than Data Mapper |
| Unit of Work | Data Source | Eloquent's auto-change tracking; identity map behavior |
| Identity Map | Data Source | Eloquent's key-based object caching |
| Lazy Load | Data Source | Eloquent relationship lazy loading; N+1 problem awareness |
| Record Set | Data Source | Laravel Collection as enhanced record set |
| Gateway | Data Source | Table Data Gateway; Eloquent Model as active record + gateway hybrid |
| Layer Supertype | Base Functionality | Inherited base classes; Eloquent Model, custom abstract classes |
| Registry | Base Functionality | Service container; application registry patterns |
| Front Controller | Web Presentation | Laravel's index.php router; all requests through single entry point |

### SOLID Application

| Principle | PHP/Laravel Violations | Correction Strategy |
|-----------|----------------------|---------------------|
| SRP | God Model classes (User handles Auth, Profile, Settings); Fat controllers | Context-specific models (AdminUser, CustomerUser); Action classes |
| OCP | Switch/if-else chains on type; Hardcoded driver selection | Strategy pattern; Pipeline pattern; Service container tag resolution |
| LSP | Subtypes violating base contracts; Overly restrictive child classes | Interface segregation before inheritance; Design by Contract |
| ISP | Fat interfaces with unused methods; Monolithic repository interfaces | Role interfaces; Mini-interfaces per consumer |
| DIP | Eloquent model dependency in services; Direct third-party SDK usage | Repository/interface abstraction; Anti-corruption layer |

### GRASP Patterns

| Pattern | Description | Architectural Value |
|---------|-------------|---------------------|
| Information Expert | Assign responsibility to class with needed data | Foundation for rich domain model |
| Creator | Assign creation responsibility based on containment/aggregation/usage | Aggregate roots as factories |
| Controller | First object beyond UI that handles system operations | Application services, use case interactors |
| Low Coupling | Minimize dependencies between classes | Interface abstractions, dependency injection |
| High Cohesion | Keep related responsibilities together | Bounded contexts, aggregate design |
| Polymorphism | Handle variation based on type | Strategy pattern, state pattern |
| Pure Fabrication | Non-domain class for low coupling/high cohesion | Repository, service classes, DTOs |
| Indirection | Mediate between components | Adapter, facade, mediator patterns |
| Protected Variations | Shield from variation impact | Anti-corruption layer, published language |

### CQRS Maturity Levels

| Level | Characteristic | When Appropriate |
|-------|---------------|-----------------|
| 0 - Method Separation | Different methods for read/write in same service | Simple CRUD with clear intent |
| 1 - Separate Models | Different read/write models (DTO vs Entity) | Complex reads with performance needs |
| 2 - Separate Storage | Read-optimized persistence separate from write store | High-read-volume systems |
| 3 - Event Sourced | Commands produce events; reads from projections | Audit-heavy, temporal query requirements |
| 4 - Fully Independent | Independent deployment, scaling of read/write | Massive scale, separate teams |

### Event Sourcing Components

| Component | Purpose | Implementation Considerations |
|-----------|---------|------------------------------|
| Event Store | Append-only event repository | Dedicated (EventStoreDB) vs relational (PostgreSQL event tables) |
| Aggregate | Command handler, event producer | State reconstruction via event replay; snapshot support |
| Projection | Read model builder | Synchronous vs asynchronous; rebuildable from event stream |
| Event Bus | Event distribution | In-process (Laravel events) vs message broker (RabbitMQ, Kafka) |
| Snapshot | Performance optimization for long-lived aggregates | Frequency strategy, storage separate from event stream |
| Upcaster | Event schema migration | Version-aware deserialization; backwards compatibility |
| Dead Letter | Failed event handling | Retry policy, manual intervention queue, alerting |
| Event Schema Registry | Contract management | Proliferation of event types; schema evolution governance |

### Hexagonal Architecture Layers

| Layer | Contents | Dependencies |
|-------|----------|--------------|
| Domain Core | Entities, value objects, domain services, domain events, repository interfaces | None (pure PHP) |
| Application | Use cases, DTOs, application services, command/query handlers, event subscribers | Domain Core (interfaces) |
| Infrastructure (Adapters) | Repository implementations, HTTP clients, mail drivers, queue adapters, file systems | Domain Core (interfaces); external libs |
| UI/Framework | Controllers, CLI commands, scheduled tasks, providers, middleware | Application layer (via ports) |

### Architectural Decision Record Types

| Format | Structure | Best For |
|--------|-----------|----------|
| Nygard | Title, Status, Context, Decision, Consequences | General purpose; most widely adopted |
| MADR | YAML front matter; structured decision, options, outcome | Larger projects; requires more detail |
| Y-Statement | "In the context of... facing... we decided for... to achieve... accepting..." | Quick decisions; lightweight |
| Outcome-First | Outcome, Decision, Tradeoffs, Reasoning Chain | Async teams; busy stakeholders |
| Tyree-Akerman | Issue, Decision Group, Assumptions, Constraints, Positions, Argument, Implications | Formal/complex decisions; regulated environments |

### Bounded Context Relationship Patterns

| Pattern | Collaboration Type | Integration Burden | Example Use Case |
|---------|-------------------|-------------------|------------------|
| Partnership | High (two teams coordinate) | Medium | Shared workflow between two peer teams |
| Shared Kernel | High (shared model subset) | High | Common value objects across contexts |
| Customer-Supplier | Medium (upstream-downstream) | Low | API provider/consumer within org |
| Conformist | Low (downstream conforms) | Low | Consuming well-established external API |
| Anti-Corruption Layer | Medium (translation layer) | Medium-High | Legacy system integration |
| Open-Host Service | Low (upstream publishes protocol) | Medium | Multi-consumer public API |
| Published Language | Low (shared protocol/format) | Low | Industry-standard formats (ISO, XML) |
| Separate Ways | None (independent) | None | Unrelated bounded contexts |

### Coupling Types

| Type | Coupling Strength | Description | Detection |
|------|------------------|-------------|-----------|
| Content Coupling | Strongest | Module modifies internal data of another | Direct property access on external classes |
| Common Coupling | Very Strong | Shared global state | Static properties, globals, singletons |
| External Coupling | Strong | Shared external format/protocol | Tight coupling to file format, DB schema |
| Control Coupling | Moderate | Passing flags to control behavior | Boolean parameters, mode enums |
| Stamp Coupling | Moderate | Passing data structures with unused elements | Fat DTOs passed between layers |
| Data Coupling | Weakest | Only passing necessary data | Well-typed parameters, minimal interfaces |

### Cohesion Types

| Type | Cohesion Level | Description |
|------|---------------|-------------|
| Functional | Strongest | All elements contribute to single well-defined function |
| Sequential | Strong | Output of one is input to another |
| Communicational | Strong | Same data; different operations |
| Procedural | Moderate | Execution order grouping |
| Temporal | Moderate | Same time but not functionally related |
| Logical | Weak | Category grouping (all utilities) |
| Coincidental | Weakest | Arbitrary grouping |

## Knowledge Classification

### Deep Knowledge (Well-Established, Extensively Documented)
- GoF Design Patterns — comprehensive literature, decades of practice
- SOLID Principles — universal acceptance, well-understood
- Martin Fowler's Enterprise Patterns — foundational text, extensively codified
- Layered Architecture — default for most applications
- Repository Pattern — extensively debated in PHP community
- Service Layer Pattern — widely implemented
- MVC/MVP/MVVM — framework standard patterns

### Moderate Knowledge (Established but Evolving)
- CQRS — growing adoption in Laravel ecosystem; well-documented but situational
- Hexagonal Architecture — increasingly discussed for PHP; good reference implementations exist
- Event Sourcing — well-understood theory; PHP implementations less mature than JVM/.NET
- DDD Tactical Patterns — growing Laravel adoption; Spatie ecosystem support
- ADRs — adopted in some teams; not yet universal
- Event Storming — known methodology; applied in some teams

### Emerging Knowledge (Active Development, Limited PHP Documentation)
- Vertical Slice Architecture — recent interest in PHP community; less established than hexagonal
- Contract Testing with PHP — Pact PHP implementation; limited adoption
- Event Sourcing with MySQL/PostgreSQL — debated approaches; no clear standard
- Architecture Fitness Functions — theory from Evans/ThoughtWorks; limited PHP tooling
- Self-Validating Architecture via PHPStan/PHPCS custom rules — emerging practice
- Modular Monolith patterns — growing interest as alternative to microservices

### Shallow Knowledge (Identified but Underexplored)
- C4 Modeling in PHP projects — few examples in ecosystem
- Architecture Decision Records tooling for PHP — limited native tools
- Bounded Context mapping visualization — few tools; mostly manual
- Coupling metrics integration into CI — few PHP-specific implementations
- Event schema registry implementations — not PHP-native; Kafka Schema Registry primary
- Service decomposition heuristics for Laravel applications — mostly paper theory, few case studies

### Controversial/Debated Knowledge
- Repository pattern necessity with Eloquent — active community debate
- ActiveRecord vs Data Mapper in Laravel — Eloquent is ActiveRecord; push toward Data Mapper patterns
- CQRS overengineering risk — when is separation justified
- Value object overhead vs raw type simplicity
- Service granularity — how fine should services be
- Domain Events vs Laravel Events distinction — terminology collision
- DDD organizational prerequisites — can DDD succeed without domain experts
- Event Sourcing for non-audit requirements — practical vs theoretical benefits
- Anti-corruption layer every boundary vs selective application

## Dependency Map

### Intra-Domain Dependencies

```
SOLID/GRASP Principles
  ├── Design Patterns (GoF patterns embody SOLID principles)
  ├── Enterprise Patterns (Fowler extends patterns to application scale)
  └── CQRS/Event Sourcing (requires SOLID for maintainable separation)

Design Patterns
  ├── Hexagonal Architecture (ports are interfaces; adapters implement patterns)
  ├── Anti-Corruption Layer (uses facade, adapter, translator patterns)
  ├── Service Layer (facade pattern at application boundary)
  └── Repository Pattern (mediator/collection pattern)

CQRS
  ├── Event Sourcing (natural complement; not required but common)
  ├── Hexagonal Architecture (natural host for CQRS)
  ├── DTOs (query results as DTOs)
  └── Domain Events (commands produce events)

Event Sourcing
  ├── Event Storming (domain event discovery)
  ├── CQRS (projections are read models)
  ├── Aggregate Design (aggregate as event producer)
  └── Event Versioning (schema evolution strategy)

Hexagonal Architecture
  ├── Dependency Injection (wiring ports to adapters)
  ├── DTOs vs Value Objects (boundary objects)
  ├── Anti-Corruption Layer (adapter as ACL)
  └── Contract Testing (testing adapter contracts)

DDD
  ├── Bounded Context Mapping (strategic relationships)
  ├── Event Storming (tactical discovery)
  ├── Hexagonal Architecture (natural implementation style)
  ├── Anti-Corruption Layer (context integration)
  └── CQRS (tactical refinement)

Architectural Governance
  ├── ADRs (decision documentation)
  ├── Coupling/Cohesion Analysis (measuring architecture health)
  ├── Contract Testing (service boundary contracts)
  └── Architecture Fitness Functions (automated governance)

Service Decomposition
  ├── DDD Bounded Contexts (decomposition boundaries)
  ├── Coupling/Cohesion (measure decomposition quality)
  ├── Event Storming (discover service boundaries)
  └── Contract Testing (inter-service contract enforcement)
```

### External Domain Dependencies

```
Backend Architecture & Design ←→ PHP Language Features
  (type system, readonly properties, promotion, enums, named arguments)
  
Backend Architecture & Design ←→ Laravel Framework
  (service container, facades, Eloquent, events, queues, bus — the architectural substrate)

Backend Architecture & Design ←→ Testing
  (contract testing, unit testing domain logic, integration testing of adapters)

Backend Architecture & Design ←→ Database Design
  (transactional boundaries, projection storage, event store design)

Backend Architecture & Design ←→ DevOps/Deployment
  (service deployment independence, infrastructure boundaries)

Backend Architecture & Design ←→ API Design
  (CQRS read/write endpoints, contract testing, versioning strategy)
```

## Missing Knowledge Risk Analysis

### Critical Gaps (High Impact, Low Coverage)

| Gap | Impact | Mitigation Strategy |
|-----|--------|---------------------|
| Event Sourcing in PHP/Laravel production case studies | Teams may adopt without understanding failure modes | Cross-reference Java/.NET cases; extract language-agnostic lessons |
| Contract testing adoption data in PHP | May waste effort on inappropriate contract testing | Use consumer-driven contracts only at critical boundaries |
| Architecture fitness functions in PHP | Architectural decay undetected until manual review | Implement PHPStan/PHPCS custom rules; dependency analysis tools |

### Moderate Gaps (Medium Impact, Partial Coverage)

| Gap | Impact | Mitigation Strategy |
|-----|--------|---------------------|
| ADR tooling integration for PHP | Manual ADR maintenance overhead | Adapt existing MADR/adr-tools; evaluate log4brains |
| C4 modeling examples in PHP | Architectural diagrams lack ecosystem context | Create canonical PHP examples for C4 model |
| Service decomposition heuristics for Laravel | Over- or under-decomposition | Combine DDD bounded context analysis with organizational factors |
| Vertical slice architecture in Laravel | Missing alternative to layered/hexagonal | Document as emerging pattern; track community experiments |

### Low Risk Gaps (Awareness Sufficient)

| Gap | Reasoning |
|-----|-----------|
| Full GoF pattern PHP implementations | Well-documented across multiple sources |
| SOLID violation detection | PHPStan, Phan, Psalm detect most violations |
| Fowler catalog pattern selection | Well-documented decision criteria in primary source |

## Research Findings

### Pattern Language Convergence (2024-2026)

The PHP ecosystem is undergoing a significant architectural maturation. Several distinct trends emerge:

1. **DDD Adoption Accelerating**: The Laravel community has moved from asking "should we use DDD?" to "how best to implement DDD within Laravel's conventions." The Spatie Laravel Data package and growing ecosystem of DDD-aligned tools indicate sustained momentum. Multiple dedicated publications (Pragmatic DDD with Laravel, DDD in Laravel guides) show the community demand.

2. **CQRS as a Spectrum**: Rather than a binary choice, CQRS is increasingly understood as a spectrum (from method-level separation to full event-sourced systems). This nuanced understanding reduces the overengineering risk that previously plagued CQRS adoption. Practitioners recommend applying CQRS selectively to bounded contexts that benefit, not as a system-wide pattern.

3. **Modular Monolith Renaissance**: After a decade of microservices dominance, the industry pendulum is swinging back. The modular monolith is now recognized as a superior starting point for most applications. Conference talks and industry analysis consistently recommend monolith-first with clean modular boundaries, then extract microservices when the monolith's constraints become the binding limitation.

4. **Event Sourcing Maturation**: EventStoreDB rebranding to Kurrent and the stabilization of gRPC clients across languages indicate event sourcing infrastructure maturity. However, PHP-specific tooling remains behind JVM/.NET ecosystems. The consensus is clear: event sourcing is powerful but should be applied selectively, not universally.

5. **Vertical Slice Architecture Emerging**: As an alternative to both layered and hexagonal architectures, vertical slice organizes code around features rather than technical layers. This is gaining traction in PHP for its pragmatic alignment with how teams actually work (feature teams, squad ownership). The trade-off is potential code duplication across slices, which is increasingly seen as acceptable compared to premature abstraction.

6. **ADR Practice Standardization**: Architecture Decision Records are transitioning from "nice-to-have" to "standard practice" in mature teams. Multiple formats (Nygard, MADR, Y-Statement) now serve different contexts. The key insight from practitioners is that ADR maintenance discipline matters more than format choice. Teams with >50 ADRs report that supersession hygiene is the biggest challenge.

7. **Governance Through Static Analysis**: The trend toward encoding architecture rules in static analysis (PHPStan level max, custom rules) represents a shift from documentation-only governance to executable governance. This is among the most significant emerging practices in the PHP ecosystem, enabling automated enforcement of architectural boundaries.

### Industry Consensus Points

- **Start monolithic, stay modular**: Decompose into services only when organizational or technical scale demands it. Premature microservices are the dominant source of architectural failure.
- **Interfaces everywhere, but judiciously**: Port/adapter interfaces at system boundaries are valuable; interfaces for every class are overengineering.
- **Value objects over primitive obsession**: Strongly typed value objects (Email, Money, OrderStatus) reduce defects significantly. The overhead is justified in all but the simplest CRUD applications.
- **Domain events as backbone**: Even without full event sourcing, domain events provide auditability, integration hooks, and future-proofing.
- **Commands and Queries should be explicit**: Separating intention (Command) from data retrieval (Query) reduces ambiguity and improves testability regardless of CQRS architecture depth.

### Key Sources Analysis

| Source | Authority Level | Coverage | Notable Contributions |
|--------|----------------|----------|----------------------|
| Martin Fowler (bliki, EAA) | Foundational | Enterprise patterns, CQRS, DDD, ADRs | Originator of many patterns |
| Eric Evans (DDD Blue Book) | Foundational | DDD strategic & tactical | Bounded contexts, aggregates, ubiquitous language |
| Robert C. Martin (Clean Architecture) | High | SOLID, Clean Architecture | Dependency rule, use case boundaries |
| Craig Larman (Applying UML and Patterns) | High | GRASP patterns | Responsibility-driven design foundation |
| Vaughn Vernon (Implementing DDD) | High | DDD tactical implementation | Aggregate design guidance, event sourcing |
| PHP-FIG (PSR Standards) | Standards Body | Interoperability | PSR-4, PSR-7, PSR-11, PSR-14, PSR-20 |
| Spatie Team | Ecosystem Leaders | Laravel packages | Laravel Data, Ray, architectural patterns |
| Matthias Noback | Subject Matter Expert | Design patterns, DDD in PHP | DTO vs Value Object, testing, object design |
| Laravel Community (Laracon talks) | Ecosystem Voices | Applied patterns | CQRS implementations, hexagonal Laravel |

## Future Expansion Opportunities

### Near-Term (Addressable Now)
- **PHP Architecture Playbook**: Curated decision tree mapping business characteristics → architectural style → pattern selection → implementation guidelines
- **Architecture Fitness Function Examples**: Collection of PHPStan/PHPCS rules that encode architectural constraints (e.g., "domain layer must not depend on infrastructure")
- **ADR Templates for PHP Projects**: Pre-populated ADR templates with PHP/Laravel-specific context (e.g., "Use Eloquent vs Repository decision ADR")
- **Decomposition Heuristics Checklist**: Decision framework for monolith vs modular vs microservices with PHP-specific considerations (Octane compatibility, Horizon queues)

### Medium-Term (Requires Community Building)
- **Event Sourcing in Laravel Reference Architecture**: Canonical example with documented trade-offs, projection strategies, snapshot policies
- **PHP Contract Testing Patterns**: Consumer-driven contract patterns specific to PHP API providers/consumers
- **Vertical Slice Architecture Patterns for PHP**: Documented slice boundaries, slice communication patterns, Laravel discovery implications
- **C4 Model Templates for Laravel Projects**: Context, Container, Component, Code diagrams specific to Laravel's architectural conventions

### Long-Term (Ecosystem Evolution Needed)
- **PHP-Native Event Store Implementation**: Beyond relational database event tables; purpose-built PHP event store
- **Automated Architecture Compliance Tools**: Full toolchain for verifying architectural rules against PHP codebases (beyond what PHPStan custom rules provide)
- **Service Decomposition Simulation**: Tooling to simulate decomposition strategies before committing to architectural split

## Sources Consulted

- Fowler, M. (2002). *Patterns of Enterprise Application Architecture*. Addison-Wesley.
- Evans, E. (2003). *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley.
- Martin, R.C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
- Larman, C. (2004). *Applying UML and Patterns: An Introduction to Object-Oriented Analysis and Design and Iterative Development*. Prentice Hall.
- Vernon, V. (2013). *Implementing Domain-Driven Design*. Addison-Wesley.
- Noback, M. various works on DDD, value objects, and testing in PHP.
- Brandolini, A. (2013-2023). Event Storming methodology and workshops.
- PHP-FIG. PHP Standards Recommendations. https://www.php-fig.org/psr/
- Nygard, M. (2011). Documenting Architecture Decisions. https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
- AWS Architecture Blog. (2025). Master architecture decision records: Best practices.
- Microsoft Azure Architecture Center. Microservices architecture guidance, DDD patterns, CQRS/Event Sourcing reference architectures.
- Various authors. (2024-2026). r/PHP, r/laravel discussions on architecture patterns, CQRS, DDD adoption practices.
- Khononov, V. (2021). *Learning Domain-Driven Design*. O'Reilly.
- Cockburn, A. (2005). Hexagonal Architecture (Ports and Adapters) original proposal.
- Various Laracon/PHP UK conference talks (2024-2026) on architecture patterns.
