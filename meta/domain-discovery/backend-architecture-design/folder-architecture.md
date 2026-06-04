# Backend Architecture & Design — Folder Architecture

## Knowledge Unit Structure

```
backend-architecture-design/
│
├── domain-analysis.md                           # This file — domain overview, scope, inventory
│
├── patterns/
│   ├── overview.md                              # Pattern classification, selection criteria
│   ├── gof-creational/
│   │   ├── singleton.md                         # Singleton pattern analysis
│   │   ├── factory-method.md                    # Factory Method
│   │   ├── abstract-factory.md                  # Abstract Factory
│   │   ├── builder.md                           # Builder
│   │   └── prototype.md                         # Prototype
│   ├── gof-structural/
│   │   ├── adapter.md                           # Adapter pattern
│   │   ├── bridge.md                            # Bridge pattern
│   │   ├── composite.md                         # Composite pattern
│   │   ├── decorator.md                         # Decorator pattern
│   │   ├── facade.md                            # Facade pattern
│   │   ├── flyweight.md                         # Flyweight pattern
│   │   └── proxy.md                             # Proxy pattern
│   ├── gof-behavioral/
│   │   ├── chain-of-responsibility.md           # Chain of Responsibility
│   │   ├── command.md                           # Command pattern
│   │   ├── interpreter.md                       # Interpreter pattern
│   │   ├── iterator.md                          # Iterator pattern
│   │   ├── mediator.md                          # Mediator pattern
│   │   ├── memento.md                           # Memento pattern
│   │   ├── observer.md                          # Observer pattern
│   │   ├── state.md                             # State pattern
│   │   ├── strategy.md                          # Strategy pattern
│   │   ├── template-method.md                   # Template Method
│   │   └── visitor.md                           # Visitor pattern
│   ├── enterprise-fowler/
│   │   ├── domain-logic-patterns.md             # Transaction Script, Domain Model, Table Module, Service Layer
│   │   ├── data-source-patterns.md              # Repository, Data Mapper, Unit of Work, Identity Map, Lazy Load
│   │   ├── web-presentation-patterns.md         # MVC, Front Controller, Application Controller, Page Controller
│   │   ├── distribution-patterns.md             # Remote Facade, Data Transfer Object
│   │   └── offline-concurrency.md               # Optimistic/Pessimistic Offline Lock, Coarse-Grained Lock
│   └── pattern-selection-guide.md               # When to use which pattern; decision trees
│
├── solid-principles/
│   ├── overview.md                              # SOLID in PHP/Laravel context
│   ├── single-responsibility.md                 # SRP — violation patterns, correction strategies
│   ├── open-closed.md                           # OCP — extension mechanisms in Laravel
│   ├── liskov-substitution.md                   # LSP — PHP interface contract design
│   ├── interface-segregation.md                 # ISP — role interfaces, mini-interfaces
│   └── dependency-inversion.md                  # DIP — abstraction ownership, dependency injection
│
├── grasp-patterns/
│   ├── overview.md                              # GRASP principles overview
│   ├── information-expert.md                    # Responsibility assignment by data ownership
│   ├── creator.md                               # Object creation responsibility
│   ├── controller.md                            # System operation handling
│   ├── low-coupling.md                          # Inter-module dependency minimization
│   ├── high-cohesion.md                         # Intra-module responsibility focus
│   ├── polymorphism.md                          # Type-based variation handling
│   ├── pure-fabrication.md                      # Non-domain service classes
│   ├── indirection.md                           # Mediation layer patterns
│   └── protected-variations.md                  # Variation isolation strategies
│
├── cqrs/
│   ├── overview.md                              # CQRS concepts, maturity levels
│   ├── command-bus.md                           # Command bus architecture, middleware
│   ├── query-handling.md                        # Query handlers, read model strategies
│   ├── read-models.md                           # Denormalized tables, materialized views, cached projections
│   ├── eventual-consistency.md                  # Consistency models, stale reads, reconciliation
│   ├── cqrs-without-event-sourcing.md           # CQRS as separate pattern from event sourcing
│   └── cqrs-selection-criteria.md               # When to apply CQRS (and when not to)
│
├── event-sourcing/
│   ├── overview.md                              # Event sourcing principles, append-only store
│   ├── event-store.md                           # Event store design, storage strategies
│   ├── aggregates.md                            # Aggregate state reconstruction, event replay
│   ├── projections.md                           # Projection types, rebuildability
│   ├── event-versioning.md                      # Schema evolution, upcasting, versioning strategies
│   ├── snapshots.md                             # Snapshot policies, performance considerations
│   ├── event-bus-integration.md                 # In-process vs message broker distribution
│   ├── idempotency.md                           # Idempotent consumers, deduplication
│   └── event-sourcing-case-selection.md         # Appropriate use cases, common anti-patterns
│
├── hexagonal-architecture/
│   ├── overview.md                              # Ports & Adapters philosophy, dependency rule
│   ├── driving-ports.md                         # Input ports, use case interfaces
│   ├── driven-ports.md                          # Output ports, repository interfaces
│   ├── adapters/
│   │   ├── driving-adapters.md                  # Controllers, CLI, queue consumers as adapters
│   │   └── driven-adapters.md                   # Database, HTTP, mail, file system adapters
│   ├── application-core.md                      # Pure domain + use case layer
│   ├── dependency-injection-wiring.md           # Wiring adapters to ports via container
│   └── hexagonal-vs-layered.md                  # Comparison, migration strategies
│
├── clean-onion-architecture/
│   ├── overview.md                              # Clean/Onion architecture concepts
│   ├── dependency-rule.md                       # Inward dependency direction
│   ├── entity-layer.md                          # Enterprise business rules
│   ├── use-case-layer.md                        # Application business rules
│   ├── interface-adapter-layer.md               # Controller, presenter, gateway interfaces
│   └── framework-layer.md                       # Framework-specific outer ring
│
├── ddd-strategic/
│   ├── overview.md                              # Strategic DDD — big picture modeling
│   ├── bounded-contexts.md                      # Identifying, modeling, documenting contexts
│   ├── ubiquitous-language.md                   # Cultivating shared language
│   ├── context-mapping.md                       # Relationship patterns between contexts
│   ├── context-map-patterns/
│   │   ├── partnership.md                       # Peer coordination
│   │   ├── shared-kernel.md                     # Common model subset
│   │   ├── customer-supplier.md                 # Upstream/downstream
│   │   ├── conformist.md                        # Downstream adopts upstream
│   │   ├── anti-corruption-layer.md             # Translation boundary
│   │   ├── open-host-service.md                 # Published protocol
│   │   ├── published-language.md                # Shared format
│   │   └── separate-ways.md                     # No integration
│   └── subdomain-types.md                       # Core, supporting, generic subdomains
│
├── ddd-tactical/
│   ├── overview.md                              # Tactical DDD — implementation patterns
│   ├── aggregates.md                            # Aggregate design, boundaries, invariants
│   ├── entities.md                              # Entity identity, lifecycle
│   ├── value-objects.md                         # Immutability, equality, self-validation
│   ├── domain-services.md                       # Stateless domain operations
│   ├── domain-events.md                         # Domain event modeling and publishing
│   ├── repositories.md                          # Repository abstraction boundaries
│   ├── domain-model-design.md                   # Rich vs anemic, persistence ignorance
│   └── modules.md                               # Module structure guidelines
│
├── architectural-decision-records/
│   ├── overview.md                              # ADR purpose, formats, lifecycle
│   ├── formats/
│   │   ├── nygard.md                            # Classic Nygard format
│   │   ├── madr.md                              # Markdown ADR format
│   │   ├── y-statement.md                       # Y-Statement format
│   │   ├── outcome-first.md                     # Outcome-First format
│   │   └── tyree-akerman.md                     # Formal decision analysis
│   ├── lifecycle.md                             # Proposed → Accepted → Superseded/Deprecated
│   ├── tooling.md                               # adr-tools, log4brains, custom workflows
│   ├── adr-vs-other-documentation.md            # When ADR vs when wiki/readme/spec
│   └── adr-hygiene.md                           # Writing discipline, review cadence, supersession
│
├── service-decomposition/
│   ├── overview.md                              # Decomposition strategies overview
│   ├── decomposition-strategies/
│   │   ├── by-business-capability.md            # Business capability decomposition
│   │   ├── by-subdomain.md                      # DDD subdomain decomposition
│   │   ├── by-entity-boundaries.md              # Aggregate/entity-driven decomposition
│   │   ├── strangler-fig.md                     # Incremental migration
│   │   └── hybrid-strategies.md                 # Combining approaches
│   ├── monolith-modular.md                      # Well-structured monolith patterns
│   ├── monolith-to-microservices.md             # Extraction patterns, migration paths
│   ├── data-ownership.md                        # Database-per-service, shared database trade-offs
│   ├── transactional-boundaries.md              # ACID vs eventual consistency across services
│   └── organizational-alignment.md              # Conway's Law, team topology
│
├── anti-corruption-layer/
│   ├── overview.md                              # ACL concepts from Eric Evans
│   ├── translation-strategies.md                # Facade, Adapter, Translator patterns
│   ├── legacy-integration.md                    # Modern<->legacy translation
│   ├── third-party-isolation.md                 # External API protection
│   ├── boundary-definition.md                   # When an ACL is needed
│   └── testing-acl.md                           # Testing translation layers
│
├── event-storming/
│   ├── overview.md                              # Event Storming methodology
│   ├── workshop-formats/
│   │   ├── big-picture.md                       # Exploratory, full domain scope
│   │   ├── process-modeling.md                  # Focused on specific process
│   │   └── software-design.md                   # Detailed system design
│   ├── notation-guide.md                        # Color coding, sticky note semantics
│   ├── facilitation-guide.md                    # Running effective workshops
│   ├── output-artifacts.md                      # From stickies to code boundaries
│   └── digital-tools.md                         # Miro, Mural, specialized tools
│
├── dto-vs-value-objects/
│   ├── overview.md                              # DTO vs VO distinctions
│   ├── data-transfer-objects.md                 # DTO purpose, structure, best practices
│   ├── value-objects.md                         # VO immutability, self-validation, domain logic
│   ├── when-to-use.md                           # Decision guide for each type
│   └── transformation-strategies.md             # Mapping between DTOs, VOs, Entities
│
├── contract-testing/
│   ├── overview.md                              # Consumer-driven contract testing
│   ├── consumer-side.md                         # Contract definition, pacts
│   ├── provider-side.md                         # Contract verification
│   ├── pact-implementation.md                   # Pact framework in PHP
│   ├── contract-evolution.md                    # Versioning, compatibility, breaking changes
│   └── contract-testing-vs-integration-tests.md # When to use which
│
├── coupling-cohesion/
│   ├── overview.md                              # Coupling and cohesion fundamentals
│   ├── coupling-types.md                        # Content → Data coupling spectrum
│   ├── cohesion-levels.md                       # Coincidental → Functional cohesion spectrum
│   ├── measurement-techniques.md                # Metrics, static analysis
│   ├── architectural-smells.md                  # Identifying high coupling/low cohesion
│   └── refactoring-strategies.md                # Reducing coupling, increasing cohesion
│
├── architecture-governance/
│   ├── overview.md                              # Governing architectural decisions
│   ├── architecture-fitness-functions.md        # Automated architecture verification
│   ├── dependency-analysis.md                   # Tools and patterns for dependency tracking
│   ├── boundary-enforcement.md                  # Enforcing module/context boundaries
│   ├── ci-architecture-checks.md                # Build pipeline architecture verification
│   └── architectural-reviews.md                 # Review processes and checklists
│
├── c4-modeling/
│   ├── overview.md                              # C4 model for architecture documentation
│   ├── context-diagrams.md                      # Level 1 — system relationships
│   ├── container-diagrams.md                    # Level 2 — high-level technology decisions
│   ├── component-diagrams.md                    # Level 3 — internal component breakdown
│   └── code-diagrams.md                         # Level 4 — class/pattern relationships
│
└── decision-trees/
    ├── architectural-style-selection.md         # Monolith vs modular vs microservices
    ├── cqrs-decision-framework.md               # When to apply CQRS (levels 0-4)
    ├── event-sourcing-assessment.md             # Event sourcing suitability evaluation
    ├── repository-pattern-needs.md              # When to add repository abstraction
    ├── ddd-investment-level.md                  # How much DDD formality to apply
    └── service-boundary-evaluation.md           # Decomposition decision support
```

## Architectural Decision Flow

```
Project Characteristics
        │
        ▼
Architectural Style Selection
  (decision-tree/architectural-style-selection.md)
        │
        ├── Simple CRUD → Standard Laravel MVC + patterns/
        │                          │
        │                          └── solid-principles/ + grasp-patterns/
        │
        ├── Complex Business Logic → ddd-strategic/ + ddd-tactical/
        │                                │
        │                                ├── Event Storming for discovery
        │                                ├── Bounded context identification
        │                                └── hexagon/clean for implementation
        │
        ├── High Read/Write Asymmetry → cqrs/
        │                                │
        │                                ├── cqrs-selection-criteria.md
        │                                └── Level 1-3 depending on needs
        │
        ├── Audit/Temporal Requirements → event-sourcing/
        │                                    │
        │                                    └── event-sourcing-case-selection.md
        │
        └── Multiple Teams → service-decomposition/
                                │
                                └── decomposition-strategies/
                                    ├── by-subdomain.md
                                    ├── by-business-capability.md
                                    └── strangler-fig.md

After Selection → Architectural Governance
                    │
                    ├── architecture-decision-records/
                    │   └── Document every significant decision
                    │
                    ├── coupling-cohesion/
                    │   └── Monitor architectural health
                    │
                    └── architecture-governance/
                        └── Enforce boundaries via fitness functions
```

## Legend

- `overview.md` — Domain overview, key concepts, classification
- `*.md` — Specific knowledge unit for a sub-topic
- `decision-trees/` — Decision support for architectural choices
- `*-selection-*.md` — Criteria for when to apply a given pattern
- Each knowledge unit follows consistent structure: definition, applicability, implementation considerations, trade-offs, PHP/Laravel-specific notes, further reading
