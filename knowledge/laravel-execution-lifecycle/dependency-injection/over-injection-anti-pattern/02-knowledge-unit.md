# Over-Injection Anti-Pattern

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Dependency Injection
- **Last Updated:** 2026-06-02

## Executive Summary
Over-Injection Anti-Pattern occurs when a class receives more constructor dependencies than it should, typically because it is doing too many things. A class with 7+ constructor parameters (the "code smell" threshold) is a strong indicator of violated Single Responsibility Principle. The class is orchestrating multiple concerns rather than owning a single one. Over-injection increases coupling, reduces cohesion, bloats test setup, and makes the class harder to reason about. The solution is not to switch from constructor injection to service locator (which hides the problem), but to refactor the class into smaller, focused classes — each with their own narrow set of dependencies.

## Core Concepts
- **Constructor Parameter Count:** A widely-accepted heuristic that a constructor with more than 3-4 parameters warrants scrutiny, and more than 7 is almost always a design problem (exceptions exist for configuration objects and value objects).
- **Multiple Responsibilities:** An over-injected class typically handles persistence, logging, notification, caching, formatting, and business logic — each concern requiring its own dependency. The class should be split by responsibility.
- **Test Setup Bloat:** Each additional constructor parameter requires a mock or stub in the test. An over-injected class produces tests with 7+ lines of mock setup before any assertion, obscuring the actual test logic.
- **False Necessity:** Many over-injected classes have dependencies that are only used by one method or one code path. These should be moved to method injection or extracted to a collaborator class.
- **God Class Precursor:** Over-injection is an early warning sign of a God Class — a class that centralizes too much logic and becomes a maintenance bottleneck.

## Mental Models
- **Tool Belt Analogy:** A class with too many dependencies is like a handyman wearing 15 tools on their belt. Some tools are used daily, some are used once a year. The belt is heavy, and the handyman looks ridiculous. Split into specialists — the plumber only carries pipe wrenches.
- **Spaghetti Junction Model:** The constructor parameter list is like a highway interchange. A few off-ramps (dependencies) is manageable. 15 off-ramps creates a spaghetti junction where no one can follow the traffic flow gracefully.
- **Zombie Dependencies Model:** Dependencies that are injected into the constructor but only used in edge-case methods are "zombie dependencies" — they come to life (instantiated, memory allocated) for every object, but rarely serve their purpose. This wastes resources and confuses readers.

## Internal Mechanics
Over-injection is not a framework mechanic — it is a code design issue that manifests through the existing injection infrastructure. The relevant container behavior:

1. When the container resolves an over-injected class, it resolves all constructor parameters eagerly, even if the class only uses some of them in a given request.
2. Each dependency requires a `make()` call, which may trigger recursive resolution for the dependency's own dependencies.
3. The resolution cost scales linearly with the number of constructor parameters.
4. In tests, each dependency must be mocked or provided, increasing test setup time proportionally.
5. For singleton-bound dependencies, the resolution cost is paid once, but the object reference is retained in the class for its lifetime.

## Patterns
- **Facade Pattern Misuse:** A class uses 8+ facades in its methods instead of injecting dependencies. While this avoids explicit constructor bloat, it hides dependencies and makes testing harder. This is "over-injection disguised as service locator."
- **Grab-Bag Service Class:** A single `OrderService` that handles validation, pricing, discount logic, inventory check, payment processing, notification, and logging — requiring 7-8 injected services. This should be split into `OrderValidator`, `OrderPricer`, `OrderInventory`, `OrderPayment`, `OrderNotifier`.
- **Data-Only Dependency:** Injecting `$request` entirely just to call `$request->input('name')`. The controller action should receive `$name` directly or extract the data before injection.
- **Event-Driven Over-injection:** A listener that receives 5 dependencies to handle an event that only uses 2 of them. The unused dependencies are for "future features" that were never implemented. Prefer method injection for listener-specific dependencies.
- **Config Array Injection:** Injecting `$config` (the entire application config) into a class that only needs `config('services.stripe.secret')`. Use `$this->app->when(Class::class)->needs('$stripeSecret')->give(config('services.stripe.secret'))`.

## Architectural Decisions
- **Why not use method injection as the default:** Method injection is appropriate for dependencies used in a single method. Using it for dependencies used across multiple methods moves the problem from constructor bloat to repetitive method signatures. The root cause — too many responsibilities — is not solved by changing injection style.
- **Why over-injection is worse than service locator for testability:** Over-injection at least makes dependencies visible. Service locator hides them. Both are bad, but over-injection is easier to refactor because the dependency list is explicit.
- **Why not extract to a parameter object:** Wrapping 8 constructor parameters into a `Configuration` object simply moves the bloat to another class. It reduces the parameter count but doesn't reduce the responsibilities. Only refactor when the grouping is conceptually coherent.
- **Why 3-4 is the recommended limit:** This is not an arbitrary rule. Classes with 1-2 dependencies tend to have high cohesion. 3-4 is manageable. 5+ correlates with decreased testability and increased defect rates in empirical studies (see Research Notes).

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Constructor injection makes deps visible | Too many deps = class does too much | Harder to understand and maintain |
| Splitting classes improves cohesion | More files, more indirection | Navigation overhead in large codebases |
| Tests with few mocks are more readable | Splitting a class requires changing callers | Refactoring cost in established codebases |
| Dependency count is a quality metric | No universal threshold (context matters) | Can lead to dogmatic rules that ignore nuance |

## Performance Considerations
- **Eager resolution cost:** Over-injected classes resolve all dependencies at construction time. Dependencies used only in one rare code path are still resolved on every instantiation, wasting CPU if the class is created on every request (controllers, commands).
- **Memory overhead:** Each injected dependency is a reference stored as a class property. 10 dependencies = 10 object references × property memory, plus the resolved instances themselves (unless shared singletons).
- **Test performance:** Each over-injected class multiplies mock creation time in the test suite. With 100 over-injected classes and 10 tests each, the cumulative mock setup overhead is significant.
- **Resolution chain impact:** A controller with 8 dependencies may trigger 15-20 `make()` calls (including dependency-of-dependency resolutions) on every request. In a typical Laravel app, this is microseconds, but in a high-throughput Octane scenario, the cost compounds.

## Production Considerations
- **Establish a team convention on max constructor parameters:** Use a CI tool (PHPStan, PHP_CodeSniffer) to enforce a maximum of 4-5 constructor parameters. Configure an exclusion path for value objects and configuration holders.
- **Code review for injection count:** Make constructor parameter count a standard review item — if a PR adds a 6th parameter, ask the author to justify it or refactor.
- **Monitor for "dependency creep":** A class that starts with 2 dependencies and grows to 6 over successive commits is suffering from dependency creep. Schedule a refactoring sprint.
- **Log and dashboard injection counts:** Use static analysis to generate a class-level report of dependency counts. Highlight outliers for technical debt tracking.

## Common Mistakes
- **Adding dependencies instead of extracting collaborators:** A class with `OrderController` has 4 deps. Instead of extracting `OrderPricer` and `OrderNotifier`, the developer adds a 5th dep. The class continues to grow.
- **The "just one more" fallacy:** Each new feature adds one more dependency to an existing class. Individually, each addition is reasonable. Cumulatively, the class becomes unmaintainable.
- **Mixing domain logic with infrastructure concerns:** A service class that injects `Logger`, `Mailer`, `Event`, `Cache`, and `DB` alongside domain services has at least three concerns (logging, infrastructure, business logic) that should be separate.
- **Over-injection in command handlers:** Console command `handle()` methods sometimes receive 6+ dependencies. The command should delegate to a service class that is tested separately.
- **Over-injection in Eloquent models:** A model accessing `app('mailer')` in a model event, or injecting the container. Models should not receive services — use observers or dedicated service classes.

## Failure Modes
- **Constructor becomes untestable:** With 8+ dependencies, writing tests for the class becomes cumbersome. Developers start skipping tests or writing "integration-style" tests that resolve from the real container, reducing test isolation.
- **Constructor is "too big to mock":** Developers resort to `$this->app->make(Class::class)` in tests to avoid mock setup, defeating the purpose of unit testing.
- **Implicit over-injection through facades:** A class uses 8 facades but has an empty constructor. The over-injection is hidden, but the class is still doing too much. It becomes untestable for different reasons (service locator coupling).
- **Regression through dependency addition:** Adding a new dependency to an over-injected class that is tested with `app()->make()` causes no test failure, but silently makes the class larger. The only signal is the constructor line count.

## Ecosystem Usage
- **Laravel core:** Some core classes approach the over-injection boundary. For example, the `Router` constructor takes 8+ parameters in early Laravel versions. Later versions refactored routing into smaller classes (`RouteRegistrar`, `RouteCollection`, `RouteGroup`).
- **Common community experience:** Developer forums and code review discussions frequently highlight "too many dependencies in controller" as a code smell. The consensus recommendation is to extract service classes.
- **spatie/laravel-medialibrary:** The `Media` model avoids over-injection by using a dedicated `MediaRegenerator` job class rather than putting regeneration logic on the model itself. This is an example of the "extract collaborator" approach.
- **Package development pattern:** Well-architected packages limit each service class to 2-3 dependencies and use dedicated facade or injection interfaces for consumers, avoiding the temptation to add all dependencies to a single gateway class.

## Related Knowledge Units

### Prerequisites
- **Constructor Injection** — the mechanism that enables over-injection (and whose discipline prevents it)
- **Method Injection** — the pattern to use for action-specific dependencies
- **SOLID Principles** — especially Single Responsibility Principle violated by over-injection

### Related Topics
- **Service Locator Anti-Pattern** — the false solution to over-injection (hiding deps instead of reducing them)
- **Facade Architecture** — facade overuse as a hidden form of over-injection
- **Injection Guidelines by Class Type** — guidance on appropriate dependency counts per class type

### Advanced Follow-up Topics
- **Testing with the Container** — how over-injection makes test setup bloated and brittle
- **HTTP Kernel Internals** — how controller action classes can replace over-injected controllers
- **Legacy Kernel Migration** — refactoring over-injected classes as part of upgrade process

## Research Notes
- The "3-4 parameter maximum" heuristic comes from Robert C. Martin's "Clean Code" and is supported by studies on cognitive load — humans can hold roughly 4-7 items in working memory. Constructor parameters consumed at the same time compete for this capacity.
- A 2011 study by Yamashita and Moonen (in "Exploring the Impact of Inter-Smell Relations on Maintainability") found a statistically significant correlation between high constructor parameter counts and increased defect density.
- In Laravel specifically, the "Fat Controllers" anti-pattern is a special case of over-injection, where controllers grow to 6+ dependencies and hundreds of lines. The standard Laravel remedy is "thin controllers, thick models" (though this also has issues) or extracting action classes.
- There is no hard Laravel-imposed limit on constructor parameters. A class with 15 parameters will resolve correctly if all are resolvable. The container does not warn or fail. Enforcement must come from developer discipline and tooling.
- PHPStan's `checkTooManyArguments` (not specific to constructors) and custom rules can flag classes with excessive constructor parameters. Laravel IDE Helper generates meta files that improve static analysis of resolved classes.
