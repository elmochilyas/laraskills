# Anti-Patterns: Ports and Adapters (Hexagonal Architecture)

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Ports and Adapters |
| Classification | Expert |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Port Explosion | Design | High |
| 2 | Leaky Port (SQL-Like Interface) | Architecture | High |
| 3 | No Contract Tests for Ports | Testing | Critical |
| 4 | Anemic Domain (Ports Without Logic) | Architecture | High |
| 5 | Mixed Driver/Driven Adapters | Code Organization | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Returning Eloquent Models From Adapter Methods | ports-and-adapters, eloquent-as-adapter | Critical |
| Scattered Port Bindings Across Providers | ports-and-adapters, framework-decoupling | High |
| Port Per Entity Instead of Per Aggregate Root | ports-and-adapters | High |
| Single Implementation Ports (YAGNI) | ports-and-adapters, when-repositories-help | Medium |
| Controller Calling Repository Directly | ports-and-adapters, action-class-patterns | Medium |

---

## Anti-Pattern 1: Port Explosion

### Category
Design — Interface Proliferation

### Description
Creating a separate port interface for every entity, value object, and minor data access concern, resulting in dozens of tiny interfaces. Child entities have their own repository ports, lookup tables have query ports, and every domain concept gets a dedicated interface regardless of aggregate boundary.

### Why It Happens
Developers apply the "one port per class" rule without understanding aggregate boundaries. Code generation tools scaffold a port for every model. Reviewers don't question the value of each port because "more abstraction is better."

### Warning Signs
- 30+ repository interfaces for a system with 5-6 aggregate roots
- `OrderLineRepository`, `OrderPaymentRepository`, `OrderShipmentRepository` — separate interfaces for child entities
- `StatusRepository`, `CategoryRepository`, `CountryRepository` — ports for lookup tables
- Port interfaces have only 1-2 methods and are used in exactly one place
- Developers cannot list the aggregate roots in the system

### Why Harmful
Port proliferation obscures the system's true aggregate boundaries. When every entity has a repository port, child entities can be persisted independently of their aggregate root, bypassing aggregate invariants. The port layer becomes noise — developers must understand 30+ ports instead of 5-6 aggregate boundaries.

### Real-World Consequences
A team creates `OrderRepository`, `OrderLineRepository`, `OrderPaymentRepository`, and `OrderShipmentRepository`. An `OrderLine` is persisted independently via its repository, bypassing `Order` invariants (e.g., total calculation, line count limits). A bug allows adding unlimited order lines because the `Order::addLine()` method (which enforces limits) is never called — the developer uses `OrderLineRepository::store()` directly.

### Preferred Alternative
One port per aggregate root. Child entities are accessed through their aggregate root's port. The aggregate root enforces transactional consistency.

### Refactoring Strategy
1. Identify all aggregate roots in the system (transactional boundaries)
2. Merge child entity ports into their aggregate root's port interface
3. Remove independent write methods for child entities (they cannot be persisted alone)
4. Update consuming code to access child entities through the aggregate root
5. For read-heavy queries on child entities, create read-only query objects (not write ports)

### Detection Checklist
- [ ] Port exists for every database table, not just aggregate roots
- [ ] Child entities have independent repository ports with write methods
- [ ] Team cannot articulate which entities are aggregate roots
- [ ] Port count > 2x the number of aggregate roots

### Related Rules/Skills/Decision Trees
- **Rule 2**: Limit ports to aggregate root boundaries (`05-rules.md`)
- **Decision 3**: One Port per Aggregate Root vs Per Entity (`07-decision-trees.md`)
- **Skill 1**: Implement a Port Interface with an Adapter (`06-skills.md`)

---

## Anti-Pattern 2: Leaky Port (SQL-Like Interface)

### Category
Architecture — Leaky Abstraction

### Description
Port interface methods are named after database operations or SQL concepts instead of domain concepts. A repository port has a generic `findWhere(array $criteria, array $orderBy)` method that mirrors Eloquent's `where()` builder, or a `search(string $query)` method that leaks full-text search implementation.

### Why It Happens
The port is designed from the adapter's perspective (what the database can do) rather than the domain's perspective (what the domain needs). Developers find it easier to write a generic `findWhere` than to name each domain-specific query.

### Warning Signs
- Port methods include `findWhere`, `findBy`, `orderBy`, `search`, `query`
- Port methods accept `array $criteria` or `array $filters` as a generic parameter
- Port has a `search(string $term)` method that couples to full-text indexes
- Repository interface has 20+ methods, many of which are lookup combinations
- Domain services call `$repository->findWhere(['status' => 'active', 'type' => 'premium'])` instead of `$repository->findActivePremium()`

### Why Harmful
The port provides no abstraction — it exposes the same query flexibility as direct Eloquent usage but with more indirection. A leaky port cannot be meaningfully implemented for a different backend (in-memory, file-based, API) because the backend would need to support arbitrary query criteria. The port fails its primary purpose: hiding infrastructure details.

### Real-World Consequences
An `InvoiceRepository` port has `findWhere(array $criteria, array $orderBy, int $limit)` and is used across 15 places with different criteria combinations. When security requires tenant filtering on all queries, the team must audit all 15 call sites. An in-memory test adapter must implement a mini query engine to support arbitrary `findWhere` calls. The adapter is 500 lines of code and has its own bugs.

### Preferred Alternative
Name port methods using domain concepts: `findOverdueSince(DateTimeImmutable $since)`, `findByCustomerId(int $customerId)`, `findAllActive()`. Each method captures a specific domain query need.

### Refactoring Strategy
1. Audit all call sites of generic port methods (`findWhere`, `findBy`)
2. For each unique query pattern, create a dedicated domain-named method
3. Replace generic method calls with the new domain-specific methods
4. Remove the generic method from the port interface
5. Update all adapters (production and test) to implement the new methods
6. Add contract tests for each new method

### Detection Checklist
- [ ] Port has `findWhere`, `findBy`, `search`, or `query` methods
- [ ] Port methods accept `array $criteria` as a parameter
- [ ] In-memory test adapter is complex (50+ lines per method)
- [ ] Port interface has 15+ methods indicating generic query combinations

### Related Rules/Skills/Decision Trees
- **Rule 1**: Design port interfaces around domain concepts (`05-rules.md`)
- **Decision 2**: Port Design — Domain Concepts vs Adapter Capabilities (`07-decision-trees.md`)
- **Skill 1**: Implement a Port Interface with an Adapter (`06-skills.md`)

---

## Anti-Pattern 3: No Contract Tests for Ports

### Category
Testing — Behavioral Drift

### Description
The port has multiple adapter implementations (production Eloquent adapter + in-memory test adapter), but there are no contract tests that run the same test suite against all adapters. The in-memory adapter drifts behaviorally from the production adapter, passing tests in CI but failing in production.

### Why It Happens
Teams create in-memory adapters for test speed but don't create a shared test suite. Developers test the production adapter through integration tests and the in-memory adapter through unit tests, without cross-validating behavior. Over time, the adapters diverge.

### Warning Signs
- Eloquent adapter and in-memory adapter have separate, non-shared test suites
- Tests for the in-memory adapter are simpler (no database constraints, no transactions)
- Production bugs involve behavior that "worked in tests" because the in-memory adapter behaves differently
- Adding a feature requires updating both adapters but only the production adapter is tested
- Developers avoid the in-memory adapter for complex query tests

### Why Harmful
The in-memory adapter gives false confidence. Tests pass, but the production adapter fails for the same scenario. The primary benefit of the port/adapter pattern (testability through substitution) is compromised. Production bugs that could have been caught by contract tests are found only after deployment.

### Real-World Consequences
An `InvoiceRepository` port has `findOverdue()` that the Eloquent adapter implements correctly. The in-memory adapter returns overdue invoices without checking the due date (returns all invoices). Domain service tests use the in-memory adapter and pass. In production, the `SendOverdueRemindersAction` sends notices to all customers instead of only overdue ones. The bug is caught by customer complaints, not by tests. Contract tests would have caught the behavioral drift.

### Preferred Alternative
Create an abstract contract test class that defines the port's behavioral contract and run it against every adapter implementation. Use the same test scenarios for all adapters.

### Refactoring Strategy
1. Create an abstract `{Port}ContractTest` class with test methods covering every port method
2. Include tests for happy path, edge cases (null, empty, not found), and error conditions
3. Define an abstract factory method `createRepository(): PortInterface`
4. Create concrete test classes for each adapter that extend the contract test
5. Run all concrete tests in CI — any adapter failure breaks the build
6. When adding a new port method, add the contract test first

### Detection Checklist
- [ ] Port has multiple adapters but no shared contract test
- [ ] In-memory adapter tests are not run against Eloquent adapter
- [ ] Production adapter uses features (database constraints, transactions) not tested in-memory
- [ ] Adding a new adapter requires creating separate tests

### Related Rules/Skills/Decision Trees
- **Rule 3**: Write contract tests that run against every adapter of a port (`05-rules.md`)
- **Rule 7**: Ensure every port has at least two implementations (`05-rules.md`)
- **Skill 2**: Write Contract Tests for a Port (`06-skills.md`)

---

## Anti-Pattern 4: Anemic Domain (Ports Without Logic)

### Category
Architecture — Empty Abstraction

### Description
The domain layer consists almost entirely of port interfaces with no domain logic. All business rules live in controllers, services, or adapters. The ports abstract everything, but the domain has nothing meaningful to protect. The directory structure suggests complex architecture, but the domain is just a collection of interfaces.

### Why It Happens
Teams adopt hexagonal architecture before the domain has meaningful business rules. The CRUD-heavy application has no complex invariants, yet the full port/adapter scaffolding is built. "Architecture first, domain later" leads to empty abstractions.

### Warning Signs
- Domain layer has 20+ interface files but fewer than 5 concrete domain classes
- Domain services are just pass-throughs: call repository, return result
- Most "domain methods" are simple getters or delegated queries
- Business rules (validation, calculations) exist only in controllers or form requests
- Adding a new field requires changes only in infrastructure (no domain logic changes)
- Domain model classes have no methods with conditional logic

### Why Harmful
The architecture costs (interfaces, adapters, mapping) are paid without receiving value. The domain is supposed to be the protected, valuable center of the application, but there's nothing valuable to protect. Developers pay the indirection tax for every change without receiving any benefit. The architecture is overhead, not investment.

### Real-World Consequences
A project has `Domain/Contracts/OrderRepository.php`, `Domain/Models/Order.php` (plain PHP with getters/setters only), `Infrastructure/Persistence/EloquentOrderRepository.php`, and `Infrastructure/Drivers/Http/OrderController.php`. The Order domain model has no business methods — all validation, total calculation, and status management lives in the controller. Adding a discount feature requires changes only in the controller. The domain layer is a wasteland of interfaces.

### Preferred Alternative
Start simple (Eloquent models as domain) and extract ports/adapters only when domain complexity justifies the indirection. The domain should contain meaningful business logic worth protecting.

### Refactoring Strategy
1. Identify all business rules currently in controllers and application services
2. Move each rule into a domain model method or domain service
3. Remove port interfaces that abstract only CRUD operations (YAGNI)
4. Keep ports for genuine infrastructure concerns (payment gateways, external APIs)
5. Read-only entities (lookup tables) don't need domain ports

### Detection Checklist
- [ ] Domain models have no business methods — only getters/setters
- [ ] All business logic lives in controllers or application services
- [ ] Port count significantly exceeds domain model count
- [ ] Removing the domain layer would not affect feature delivery

### Related Rules/Skills/Decision Trees
- **Rule 6**: Question every domain interface (`05-rules.md`)
- **Decision 1**: Hexagonal Architecture vs Simple MVC (`07-decision-trees.md`)

---

## Anti-Pattern 5: Mixed Driver/Driven Adapters

### Category
Code Organization — Structural Confusion

### Description
All adapter classes (controllers, repositories, mailers, CLI commands) are mixed together in a single `Adapters/` directory without distinguishing between inbound (driver) adapters that initiate calls and outbound (driven) adapters that implement domain ports. The dependency direction is not visible at the filesystem level.

### Why It Happens
The initial project setup uses a flat structure for simplicity. As the project grows, new adapters are added to the same directory because "that's where adapters go." No one splits the directory because the boundary between driver and driven is unclear.

### Warning Signs
- Single `Adapters/` or `Infrastructure/` directory contains controllers, repositories, and mailers
- New team members place HTTP controllers next to database repositories
- Architectural documentation must describe which adapters are inbound vs outbound
- Import statements mix driver adapters (Http, Console) with driven adapters (Persistence, Mail)
- Static analysis rules cannot target specific adapter types by path

### Why Harmful
Mixed directories obscure the architecture's dependency direction. In hexagonal architecture, inbound adapters depend on the domain, while the domain depends on outbound adapters. When they're mixed, code review cannot quickly verify the dependency direction. New adapters may be placed in the wrong category, introducing architectural violations that are hard to detect.

### Real-World Consequences
A flat `Infrastructure/` directory contains `StripePaymentGateway.php` (outbound), `OrderController.php` (inbound), `EloquentInvoiceRepository.php` (outbound), `SendOverdueRemindersCommand.php` (inbound). A new developer adds `InvoiceCsvExporter.php` to the directory, not realizing it should be an outbound adapter with a domain port. The exporter bypasses the domain and directly queries Eloquent models. The violation isn't caught because the directory structure doesn't communicate boundaries.

### Preferred Alternative
Separate adapters into `Infrastructure/Drivers/` (inbound) and `Infrastructure/Driven/` (outbound). Group drivers by protocol (Http, Console, Queue) and driven by concern (Persistence, Mail, Payment).

### Refactoring Strategy
1. Create `Infrastructure/Drivers/Http/`, `Infrastructure/Drivers/Console/`, `Infrastructure/Drivers/Queue/` directories
2. Create `Infrastructure/Driven/Persistence/`, `Infrastructure/Driven/Mail/`, `Infrastructure/Driven/Payment/` directories
3. Move each adapter class to its appropriate directory
4. Update namespace declarations and imports throughout the codebase
5. Add an architecture test that verifies all adapters are in the correct directory based on their role
6. Update documentation and PR templates to reference the new structure

### Detection Checklist
- [ ] Single `Adapters/` or `Infrastructure/` directory contains both inbound and outbound adapters
- [ ] Controllers and repositories exist in the same directory namespace
- [ ] No `Drivers/` or `Driven/` subdirectories exist
- [ ] Team cannot immediately tell which adapters initiate calls vs respond to them

### Related Rules/Skills/Decision Trees
- **Rule 8**: Separate driver adapters (inbound) from driven adapters (outbound) (`05-rules.md`)
- **Decision 4**: Single Service Provider vs Scattered Bindings (`07-decision-trees.md`)
- **Skill 3**: Set Up Service Provider Wiring (`06-skills.md`)
