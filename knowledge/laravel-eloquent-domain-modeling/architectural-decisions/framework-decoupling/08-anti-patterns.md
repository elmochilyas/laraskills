# Anti-Patterns: Framework Decoupling

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Architectural Decisions |
| Knowledge Unit | Framework Decoupling |
| Classification | Advanced |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Pseudo-Decoupling | Architecture | High |
| 2 | Adapter Proliferation | Design | Medium |
| 3 | Mapping Hell | Performance | High |
| 4 | Domain-Resistant Architecture | Cultural | Medium |
| 5 | Port Ownership Inversion | Architecture | Critical |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| Using Carbon in Domain Code Instead of DateTimeImmutable | framework-decoupling, eloquent-as-adapter | Medium |
| Returning Eloquent Collection From Domain Services | framework-decoupling, ports-and-adapters | High |
| Facade Usage in Domain Logic | framework-decoupling, action-class-patterns | Critical |
| Scattered Port Wires Across Controllers | framework-decoupling, ports-and-adapters | High |
| Abstracting Without Variation (YAGNI Interfaces) | framework-decoupling, when-repositories-help | Medium |

---

## Anti-Pattern 1: Pseudo-Decoupling

### Category
Architecture — Illusion of Separation

### Description
The directory structure follows hexagonal architecture conventions (Domain, Infrastructure, Application layers) but domain code still uses Facades, `app()`, Carbon, Eloquent Collections, or `Illuminate\*` imports. The structure suggests decoupling, but the code is fully coupled to Laravel — the team has the "tax" of the architecture without the benefits.

### Why It Happens
The project started with good intentions but newcomers (or tight deadlines) introduced framework imports into the domain layer. Without automated enforcement (PHPStan rules), the boundary erodes gradually. Code review misses violations because reviewers focus on logic, not import statements.

### Warning Signs
- `Domain/` namespace contains `use Illuminate\Support\Facades\*`
- Domain services call `Cache::remember()`, `Event::dispatch()`, or `Log::info()` directly
- Domain models use `Carbon\Carbon` for date fields
- Domain service return types include `Illuminate\Support\Collection`
- `Domain/` files contain `app()` or `resolve()` calls
- PHPStan is not configured with domain purity rules

### Why Harmful
The architecture provides no real benefit — domain tests still require Laravel kernel bootstrap, frameworks are not swappable, and business logic remains coupled to Laravel. However, developers still pay the indirection cost (interfaces, adapters, mapping). The pseudo-decoupled codebase is harder to navigate than a straightforward MVC project because abstractions add files without adding value. New developers struggle to understand the architecture because the directory structure lies about the actual coupling.

### Real-World Consequences
A project with `Domain/`, `Infrastructure/`, and `Application/` directories has 120+ files. Despite the structure, the domain layer calls `Cache::remember()` directly, uses Carbon extensively, and returns Eloquent Collections. When the team needs to upgrade from Laravel 10 to 11, every domain file must be reviewed because of undocumented coupling. The test suite requires RefreshDatabase for 80% of domain tests. The architecture provides zero migration benefit.

### Preferred Alternative
Either commit fully to decoupling (zero `Illuminate\*` in domain, enforced by PHPStan) or abandon the pretense and use a simpler architecture (Active Record with models as domain entities). The worst approach is the hybrid.

### Refactoring Strategy
1. Install and configure PHPStan with domain purity rules
2. Run analysis and generate a violation report — do not suppress with baseline
3. For each violation, extract the framework dependency behind a domain-owned interface
4. Create an adapter in Infrastructure/ for each extracted interface
5. Replace Facade calls with injected domain-owned port interfaces
6. Once violations are resolved, enforce the purity rules in CI

### Detection Checklist
- [ ] `Domain/` has `use Illuminate\*` imports
- [ ] Domain code calls Facades or `app()` directly
- [ ] Domain models use Carbon instead of DateTimeImmutable
- [ ] PHPStan has no domain purity rules configured
- [ ] Domain unit tests require RefreshDatabase or Laravel bootstrap

### Related Rules/Skills/Decision Trees
- **Rule 3**: Enforce domain purity with static analysis rules (`05-rules.md`)
- **Rule 4**: Domain services use only domain-defined interfaces (`05-rules.md`)
- **Rule 8**: Use native PHP arrays over Eloquent Collection (`05-rules.md`)
- **Skill 2**: Refactor Domain Code to Remove Framework Dependencies (`06-skills.md`)

---

## Anti-Pattern 2: Adapter Proliferation

### Category
Design — Unnecessary Abstraction

### Description
Every interface in the domain layer has exactly one adapter implementation with no realistic plan to ever have a second. Interfaces exist for simple concerns (`MathCalculator`, `StringFormatter`, `DateRangeGenerator`) that have no variation and no infrastructure dependency to abstract.

### Why It Happens
The team adopts "interface-first" design dogmatically: every class gets an interface. Code generation tools or strict coding standards require an interface per service. Developers create interfaces pre-emptively "in case we need to swap implementations later."

### Warning Signs
- 50+ interfaces in `Domain/Contracts/` but only 55 total implementations
- Interface names mirror class names exactly: `InvoiceServiceInterface`, `InvoiceService`
- Interfaces have a single method with no implementation complexity
- No in-memory or test adapter exists for most interfaces
- Developers complain about "jumping through interfaces" to understand code flow
- New services are created with an interface by default, not by conscious decision

### Why Harmful
Every interface increases cognitive load: developers must navigate to the interface, find the implementation binding, and read the concrete class. The indirection adds no value when there's only one implementation. Teams spend time maintaining interface files (updating docblocks, renaming) without receiving testability or swap benefits.

### Real-World Consequences
A project has 80 interfaces in `Domain/Contracts/`, 75 of which have exactly one implementation. A developer tracing a bug in `InvoiceTotalsCalculator` must open: `InvoiceTotalsCalculatorInterface.php` (interface), check `DomainServiceProvider.php` (binding), find `EloquentInvoiceTotalsCalculator.php` (implementation). The interface adds 30 seconds of navigation per lookup across 10 lookups per day = 5 minutes wasted daily per developer. With 10 developers, that's nearly an hour of collective productivity lost every day.

### Preferred Alternative
Only create an interface when:
- A second implementation exists (production + test)
- The interface abstracts an infrastructure concern (repository, mailer, clock)
- A second implementation is planned within the current quarter

### Refactoring Strategy
1. Audit all interfaces in `Domain/Contracts/`
2. Identify interfaces with exactly one implementation and no planned alternative
3. For each, consider inlining: remove the interface, rename the implementation to match, and update bindings to use the concrete class
4. Keep interfaces for infrastructure concerns (repositories, mailers, clocks) and those with test fakes
5. Add a coding standard: "No interface without two implementations or a documented infrastructure boundary"

### Detection Checklist
- [ ] Interface has exactly one implementation class
- [ ] No in-memory or test adapter exists for the interface
- [ ] Interface name mirrors implementation name (e.g., `XInterface`/`X`)
- [ ] Interface has 1-2 trivial methods
- [ ] Team has no documented criteria for when to create interfaces

### Related Rules/Skills/Decision Trees
- **Rule 6**: Question every domain interface — only abstract when variation exists (`05-rules.md`)
- **Decision 1**: Decouple Domain from Framework vs Stay Coupled (`07-decision-trees.md`)

---

## Anti-Pattern 3: Mapping Hell

### Category
Performance — Excessive Transformation Overhead

### Description
The mapping layer between domain objects and infrastructure representations grows so complex that it requires 10+ mapper classes, nested conversion logic, and extensive testing. The mapping cost exceeds the benefit of decoupling. Developers spend more time writing and debugging mappers than the business logic itself.

### Why It Happens
The domain model and database schema diverge significantly (different structures, naming conventions, data types). Every query and save operation requires bidirectional transformation. Value objects, embedded types, and polymorphic associations add mapping complexity.

### Warning Signs
- Mapper classes exceed 1000 lines total
- Mapper tests are the largest test suite in the project
- Mapping bugs appear in every release
- Developers avoid adding fields to domain models because of mapper impact
- Mapping performance appears in profiling results (top 5 slowest operations)
- Mapper round-trip tests (save → retrieve → assert) are flaky

### Why Harmful
Mapping overhead reduces development velocity and introduces bugs. When mappers are complex, developers resist evolving the domain model because "the mapper change is too expensive." The adapter pattern, which should enable domain model evolution, actually inhibits it. Complex mapping code is itself a source of bugs — type conversion errors, null handling, collection mapping.

### Real-World Consequences
A team's `OrderMapper` is 400 lines with 15 methods handling bidirectional mapping between `Order` (domain) and `EloquentOrder` (infrastructure), including nested mapping for order lines, payments, shipments, and discount applications. Adding a `priority` field to orders requires: add column to migration, add field to Eloquent model, add to domain model constructor, add to mapper `toDomain()`, add to mapper `fromDomain()`, add mapper test. A 5-minute change takes 2 hours. The mapper becomes the bottleneck for all feature work.

### Preferred Alternative
Keep domain models and database representations close to reduce mapping complexity. Use database views or read models for presentations that differ structurally. Consider keeping domain and Eloquent models aligned when mapping cost exceeds architectural benefit.

### Refactoring Strategy
1. Identify the most complex mappers (most lines, most bugs)
2. Assess whether the domain model and database schema could be aligned to reduce mapping
3. Simplify value object mapping with `fromArray()` / `toArray()` conventions
4. Use a mapping library (AutoMapper+, hand-written trait) for repetitive field mapping
5. Add automated round-trip tests that validate save → retrieve → assert equality
6. Document the mapping cost and revisit the "separated model" decision quarterly

### Detection Checklist
- [ ] Total mapper code exceeds 1000 lines
- [ ] Mapper tests exceed 500 lines
- [ ] Mapping errors are tracked as recurring bug type
- [ ] Profiling shows mapping in top 10 time consumers
- [ ] Team complains about mapper maintenance in retrospectives

### Related Rules/Skills/Decision Trees
- **Skill 1**: Define a Domain Port and Wire an Adapter (`06-skills.md`)
- **Decision 1**: Decouple Domain from Framework vs Stay Coupled (`07-decision-trees.md`)

---

## Anti-Pattern 4: Domain-Resistant Architecture

### Category
Cultural — Developer Rejection

### Description
The team perceives framework decoupling as unnecessary overhead imposed by "architecture astronauts." Developers actively work around the architecture (using Facades directly, bypassing repository interfaces, adding `use Illuminate\*` in domain code) because they don't believe the benefits justify the cost.

### Why It Happens
The architecture was imposed top-down without team buy-in. The team's primary experience is with simple MVC/Laravel conventions, and they lack training on hexagonal architecture. The short-term costs (more files, more indirection) are visible, while the long-term benefits (testability, maintainability) are abstract.

### Warning Signs
- Developers frequently ask "Why do we need this interface?"
- Code review comments include "This belongs in the domain" but violations recur
- PRs consistently add framework imports to domain code
- Velocity metrics show slower delivery for features requiring new adapters
- Onboarding documentation for new devs includes "Just put it in Infrastructure for now"
- Architecture violations are accepted with "We'll fix it later"

### Why Harmful
Architecture is a team sport — if developers don't believe in the constraints, they will subvert them. Enforcing architecture through code review becomes exhausting and conflicts escalate. Eventually, the architecture erodes completely, but the directory structure and interfaces remain as a confusing fossil layer. The team ends up with a codebase that is neither architecturally pure nor straightforward MVC.

### Real-World Consequences
A team of 8 developers has 3 "architecture champions" who enforce decoupling and 5 who resist it. Code reviews on domain-boundary violations take 3 rounds per PR. The resisters learn to make violations subtle: using Carbon "because DateTimeImmutable doesn't support this format," adding Facades "temporarily." The architecture champions burn out from policing, and after 6 months, the baseline has 200+ suppressed PHPStan violations.

### Preferred Alternative
Build team buy-in before enforcing decoupling. Start with the most valuable decoupling (persistence, external services) and defer lower-value abstractions. Make the architecture's benefits visible through faster test execution and easier changes.

### Refactoring Strategy
1. Hold an architecture review session discussing the actual costs and benefits
2. Identify the 2-3 most painful coupling points and fix them first (demonstrate value)
3. Pair architecture champions with resisters on refactoring tasks
4. Measure and share metrics: domain test execution time, number of framework dependencies removed, number of tests written without RefreshDatabase
5. Make architecture violations visible in CI but allow a grace period for legacy code
6. Celebrate wins when the architecture enables a change that would be harder in MVC

### Detection Checklist
- [ ] Team velocity slowed after introducing hexagonal architecture
- [ ] Code review conflicts about architecture violations
- [ ] Developers express frustration about the architecture in retrospectives
- [ ] Architecture champion dependency is high (only 1-2 devs enforce it)
- [ ] Onboarding docs contain "workaround" instructions

### Related Rules/Skills/Decision Trees
- **Decision 1**: Decouple Domain from Framework vs Stay Coupled (`07-decision-trees.md`)
- **Skill 1**: Define a Domain Port and Wire an Adapter (`06-skills.md`)

---

## Anti-Pattern 5: Port Ownership Inversion

### Category
Architecture — Dependency Direction Violation

### Description
Domain port interfaces are defined in the infrastructure layer rather than the domain layer. The domain layer must import infrastructure concepts to depend on these interfaces, violating the Dependency Inversion Principle. The architecture's dependency arrow points the wrong direction.

### Why It Happens
During refactoring, developers extract an interface from an existing infrastructure class for convenience, leaving it in the infrastructure package. The domain service that needs the interface must then `use Infrastructure\Contracts\InvoiceRepository` instead of `use Domain\Contracts\InvoiceRepository`.

### Warning Signs
- Interfaces in `Infrastructure\Contracts\` or `App\Contracts\` are imported by domain services
- `Domain/` namespace has `use App\Contracts\*` or `use Infrastructure\Contracts\*` imports
- Infrastructure package has no dependency on Domain (should be the reverse)
- Port interface method names sound like database operations (`findWhere`, `save`, `delete`)
- Renaming an infrastructure concept requires updating domain code

### Why Harmful
The domain layer depends on infrastructure, which makes the domain non-swappable and couples business logic to storage concepts. If the infrastructure interface changes, domain code must change. The fundamental benefit of the adapter pattern (domain doesn't know about infrastructure) is lost.

### Real-World Consequences
An `InvoiceRepository` interface is defined in `Infrastructure\Contracts\` because the original Eloquent `InvoiceRepository` was extracted from a controller. A domain `BillingService` imports `Infrastructure\Contracts\InvoiceRepository`. When the team wants to switch from MySQL to PostgreSQL, the `InvoiceRepository` interface must change, which forces changes in the domain `BillingService` — the opposite of what should happen.

### Preferred Alternative
All domain ports must be defined in the domain layer (`Domain\Contracts\`). Infrastructure adapters implement domain-owned interfaces. The domain layer must never import anything from infrastructure.

### Refactoring Strategy
1. Identify all interfaces in infrastructure that domain services depend on
2. Move each interface to `Domain\Contracts\` in the appropriate domain namespace
3. Update infrastructure adapters to implement the domain-owned interface
4. Update domain service imports to use `Domain\Contracts\*` instead of `Infrastructure\Contracts\*`
5. Add PHPStan rule: domain namespace must not import from infrastructure namespace

### Detection Checklist
- [ ] `Domain/` imports from `Infrastructure/` or `App/Contracts/`
- [ ] Port interfaces live in infrastructure directory
- [ ] Infrastructure package does not depend on domain package
- [ ] Interface method names sound like database or HTTP operations

### Related Rules/Skills/Decision Trees
- **Rule 1**: Define domain ports in the domain layer, not infrastructure (`05-rules.md`)
- **Decision 4**: Domain-Owned Port vs Infrastructure-Owned Interface (`07-decision-trees.md`)
- **Skill 1**: Define a Domain Port and Wire an Adapter (`06-skills.md`)
