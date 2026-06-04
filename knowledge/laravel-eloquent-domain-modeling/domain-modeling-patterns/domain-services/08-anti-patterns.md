# Domain Services — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Domain Modeling Patterns |
| Knowledge Unit | Domain Services |
| Focus | Anti-patterns in domain service design and usage |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Vague or Generic Service Names | Maintainability | Medium |
| 2 | Stateful Domain Services with Mutable Properties | Architecture | Critical |
| 3 | Concrete Coupling in Service Dependencies | Architecture | High |
| 4 | Infrastructure Leakage in Domain Layer | Architecture | Critical |
| 5 | Bloated Multi-Responsibility Service Classes | Design | High |
| 6 | HTTP Responses from Domain Services | Architecture | High |

## Repository-Wide Cross-Cutting Patterns

- The most common anti-pattern is creating services with vague names like `OrderService` or `OrderHelper` that accumulate unrelated methods
- Stateful services with mutable properties introduce hidden dependencies between method calls and race conditions in concurrent requests
- Domain services that directly call HTTP APIs, run raw DB queries, or perform file I/O couple the domain layer to infrastructure

---

## 1. Vague or Generic Service Names

### Category
Maintainability

### Description
Naming domain service classes with vague or generic terms like `OrderService`, `OrderHelper`, or `OrderManager`. The name communicates nothing about the process the service performs, requiring developers to read the implementation to understand its purpose.

### Why It Happens
Developers follow the convention of appending "Service" to an entity name. `Manager` and `Helper` are common "catch-all" suffixes. The team may not have established naming conventions for domain services.

### Warning Signs
- `OrderService` — could mean anything related to orders
- `OrderHelper` — "helper" suggests no clear responsibility
- `OrderManager` — "manager" is meaningless and accumulates anything
- `UserService` — generic entity-based service name
- A class named `*Service` that has more than 3-4 public methods doing different things
- New team members asking "what does this service do?"

### Why Harmful
- The name doesn't communicate the service's purpose in the domain language
- Vague names invite adding unrelated methods, leading to bloated classes
- Developers don't know when to use the service vs. put logic on the model
- Code reviews cannot evaluate the service's responsibility from its name alone
- The ubiquitous language is not reflected in the codebase structure

### Consequences
- `OrderService` accumulates methods for pricing, shipping, discounts, and fraud — four unrelated responsibilities
- New developers must read the entire file to understand what it does
- No clear guidance on where to add new functionality
- Merge conflicts increase as multiple developers add methods to the same "service"
- The service becomes an anti-pattern itself — a god class

### Preferred Alternative
```php
class OrderFulfillmentService { ... }    // Process: fulfilling orders
class PricingCalculator { ... }          // Process: calculating prices
class FraudDetectionService { ... }      // Process: detecting fraud
class ShippingCostCalculator { ... }     // Process: calculating shipping
```

### Refactoring Strategy
1. Identify services with vague names (`*Service`, `*Helper`, `*Manager`)
2. List all public methods and group them by business process
3. Rename the service to reflect its dominant process
4. Split unrelated methods into separate services with verb-based names
5. Update all callers to use the new service names
6. Remove the old service class

### Detection Checklist
- [ ] Search for `*Service`, `*Helper`, `*Manager` class names in the domain layer
- [ ] Count public methods on each service — more than 3 suggests vagueness
- [ ] Check whether the name describes a process (verb) or an entity (noun)
- [ ] Review if multiple business processes are inside one class
- [ ] Verify each service name would make sense to a domain expert

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Name Domain Services as Verbs Describing a Process |
| Skill | `06-skills.md` — Design a Domain Service for Cross-Aggregate Orchestration |
| Knowledge | `04-standardized-knowledge.md` — Domain Services |

---

## 2. Stateful Domain Services with Mutable Properties

### Category
Architecture

### Description
Domain service classes that store mutable state in class properties, accumulating data across method calls instead of operating solely on parameters. This creates hidden dependencies between method invocations and order-dependent behavior.

### Why It Happens
Developers carry patterns from stateful objects (models, controllers) into domain services. Accumulating results in a property may seem simpler than returning values. The developer may not recognize that services should be stateless.

### Warning Signs
- Mutable `private` or `protected` properties in service classes
- Service methods that read or write class properties between calls
- Calling the same service method twice producing different results without different parameters
- Tests that must call methods in a specific order to pass
- Service instances reused across requests causing unexpected behavior
- Properties like `$total`, `$result`, `$accumulator`, `$processed` in services

### Why Harmful
- Race conditions in concurrent requests when a service instance is shared
- Order-dependent test failures — tests must call methods in the exact sequence
- Hidden state makes the service's behavior non-deterministic
- The service cannot be safely used as a singleton or across requests
- Debugging requires tracking property mutations across multiple method calls

### Consequences
- A `PricingCalculator` accumulating totals in a property gives wrong results on the second call
- Tests that pass in isolation but fail when run in a different order
- Production bugs that only manifest under concurrent load
- Developers add other stateful properties over time, compounding the problem
- The service cannot be safely injected as a shared dependency

### Preferred Alternative
```php
class PricingCalculator
{
    public function calculate(Order $order): Money
    {
        $totalCents = $order->items->sum(
            fn ($item) => $item->unit_price_cents * $item->quantity
        );
        return new Money($totalCents, $order->currency);
    }
}
```

### Refactoring Strategy
1. Identify mutable properties in domain service classes
2. Convert each property to a local variable or return value
3. If state is needed across methods, consider returning a value object that carries the state
4. Remove all mutable class properties
5. Make constructor-injected dependencies `private readonly` (or `private` with no setter)
6. Verify the service produces the same output for the same input regardless of call order

### Detection Checklist
- [ ] Search for `private $`, `protected $` in domain service classes
- [ ] Check if properties are assigned after constructor (mutable state indicator)
- [ ] Review tests — are they order-dependent?
- [ ] Verify the service can be called multiple times with same parameters/objects and produce the same result
- [ ] Check if the service is used as a singleton or shared instance

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep Domain Services Stateless |
| Skill | `06-skills.md` — Design a Domain Service for Cross-Aggregate Orchestration |
| Knowledge | `04-standardized-knowledge.md` — Domain Services |

---

## 3. Concrete Coupling in Service Dependencies

### Category
Architecture

### Description
Domain services type-hinting constructor parameters with concrete Eloquent model classes, repository implementations, or infrastructure classes instead of domain interfaces. This couples the service to the ORM and prevents unit testing without a database.

### Why It Happens
Using concrete types is the path of least resistance in Laravel — models are always available and autocompletable. Interface-based programming requires creating interfaces first, which feels like extra work. The developer may not be practicing dependency inversion.

### Warning Signs
- `private EloquentOrderRepository $repo` — concrete repository implementation
- `private MailService $mailer` — infrastructure service injected into domain service
- `private User $userModel` — Eloquent model as a dependency
- Constructor injection of `Model` or `Builder` types
- The service requires a database connection in unit tests
- Switching persistence requires changing the service constructor

### Why Harmful
- Domain service cannot be unit-tested without booting Laravel and the database
- The domain layer gains a compile-time dependency on the ORM
- Switching from Eloquent to a different ORM or event store requires changing domain services
- The service's dependencies are not interchangeable — no polymorphism
- Infrastructure changes propagate to domain layer changes

### Consequences
- Unit tests become integration tests — slow and brittle
- The domain layer cannot be extracted into a standalone package
- Swapping to an in-memory repository for testing requires changing service constructors
- Developers avoid writing tests because setup is too heavy
- The dependency inversion principle is violated throughout the domain layer

### Preferred Alternative
```php
interface OrderRepository { ... }
interface InventoryService { ... }
interface PricingCalculator { ... }

class OrderFulfillmentService
{
    public function __construct(
        private OrderRepository $repo,      // Domain interface
        private InventoryService $inventory, // Domain interface
        private PricingCalculator $pricing,  // Domain interface
    ) {}
}
```

### Refactoring Strategy
1. Identify concrete types in domain service constructor signatures
2. Create interfaces for each concrete dependency used by domain services
3. Replace concrete type-hints with interface type-hints in domain service constructors
4. Ensure existing implementations implement the new interfaces
5. Update tests to use mock implementations of the interfaces
6. Register interface-to-implementation bindings in the service container

### Detection Checklist
- [ ] Check constructor parameters of domain services for concrete Eloquent types
- [ ] Search for `Eloquent` or `Model` in type-hints of domain service constructors
- [ ] Review unit tests — do they require a database connection?
- [ ] Verify that domain services reference interfaces, not implementations
- [ ] Check if the service container binds interfaces to implementations

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Inject Domain Interfaces, Not Concrete Implementations |
| Skill | `06-skills.md` — Design a Domain Service for Cross-Aggregate Orchestration |
| Decision Tree | `07-decision-trees.md` — Domain Service vs Model Method vs Action Class |

---

## 4. Infrastructure Leakage in Domain Layer

### Category
Architecture

### Description
Domain services that directly make HTTP calls, execute raw database queries, perform file I/O, or interact with external APIs. Infrastructure concerns are mixed with domain logic, destroying the layer separation that makes domain services valuable.

### Why It Happens
Developers optimize for convenience over architecture. It's faster to call an HTTP client directly than to create an interface and implementation. The team may not distinguish between domain services and application services. Deadlines pressure cutting corners.

### Warning Signs
- `HttpClient`, `Http`, `GuzzleHttp` injected into a domain service
- `DB::select()`, `DB::statement()` called directly in domain service methods
- File operations (`Storage`, `File`, `file_put_contents`) in domain service code
- External API calls embedded in domain service method bodies
- `Cache::get()`, `Cache::put()` used directly in domain service methods
- Domain service cannot be used without network access or database connection

### Why Harmful
- Domain logic is untestable without the external system available
- Changes to infrastructure (API endpoints, storage paths) require modifying domain logic
- The domain layer is coupled to specific external services
- Domain services cannot be reused in different hosting environments
- Security vulnerabilities: API keys and endpoints embedded in domain code

### Consequences
- Tests that call external APIs are slow, flaky, and require network access
- When the fraud API changes its endpoint, domain service code must change
- The domain package can never be extracted to a standalone library
- Rate limiting and timeout logic is mixed with business rules
- Domain logic cannot be executed offline or in batch jobs without the external service

### Preferred Alternative
```php
interface FraudCheckProvider
{
    public function check(int $amountCents, string $currency): FraudResult;
}

class FraudDetectionService
{
    public function __construct(
        private FraudCheckProvider $provider,
        private OrderRepository $orders,
    ) {}

    public function isSuspicious(Order $order): bool
    {
        $threshold = $this->orders->averageOrderAmount() * 3;
        if ($order->total_cents > $threshold) {
            return true; // Domain rule: orders > 3x average are flagged
        }
        return $this->provider->check(
            $order->total_cents, $order->currency
        )->isFraud;
    }
}
```

### Refactoring Strategy
1. Identify infrastructure calls (HTTP, DB, file, cache, queue) in domain services
2. Extract the infrastructure operation behind a domain interface
3. Replace the direct call with a call to the interface method
4. Create an infrastructure-layer implementation of the interface
5. Inject the implementation through the service container
6. Move the infrastructure implementation to the infrastructure layer

### Detection Checklist
- [ ] Search for `HttpClient`, `DB::`, `Storage::`, `Cache::` in domain service files
- [ ] Check constructor parameters for infrastructure classes (HTTP clients, mailers)
- [ ] Review whether the service can be unit-tested without infrastructure setup
- [ ] Verify the service directory is in the domain layer, not the infrastructure layer
- [ ] Check if external API endpoints or credentials are hardcoded in the service

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Ensure Domain Services Contain Domain Logic, Not Infrastructure |
| Skill | `06-skills.md` — Design a Domain Service for Cross-Aggregate Orchestration |
| Decision Tree | `07-decision-trees.md` — Domain Service vs Model Method vs Action Class |

---

## 5. Bloated Multi-Responsibility Service Classes

### Category
Design

### Description
A single domain service class that handles multiple unrelated business processes — calculating shipping, applying discounts, validating addresses, and checking fraud all in one class. Violates the Single Responsibility Principle and creates a "god service."

### Why It Happens
Starting with a single service is easier than creating multiple small classes. The team uses "Service" as a container for all operations related to an entity. Adding a new method to an existing service feels less costly than creating a new class. The vague naming pattern enables the accumulation.

### Warning Signs
- A service with 4+ public methods that are not internally cohesive
- Import statements from unrelated domain areas in one service file
- Constructor with 5+ dependencies (different services, different repositories)
- A class named `OrderService` with methods for pricing, shipping, fraud, and validation
- Team members cannot agree on what belongs in the service
- The class file exceeds 200 lines with multiple method groups

### Why Harmful
- Constructor accumulates dependencies for all responsibilities, making instantiation heavy
- Tests for one method must set up dependencies for all methods
- Changing one responsibility risks breaking others
- The class becomes a deployment bottleneck — multiple developers modify it
- New team members cannot understand the class boundaries

### Consequences
- `OrderService` with dependencies on `PricingCalculator`, `ShippingApi`, `FraudProvider`, `AddressValidator`, `DiscountService`, `PaymentGateway`
- A change to shipping logic requires deploying a new version of the entire service
- Tests for `applyDiscount` must mock payment and shipping dependencies
- Merge conflicts are common — two developers adding features to the same service
- The service violates every principle of cohesion and separation of concerns

### Preferred Alternative
```php
class ShippingCostCalculator { public function calculate(Order $order): Money {} }
class DiscountApplier { public function apply(Order $order, Coupon $coupon): void {} }
class AddressValidator { public function validate(Order $order): ValidationResult {} }
class FraudDetectionService { public function check(Order $order): FraudResult {} }
```

### Refactoring Strategy
1. List all public methods on the bloated service and group by business process
2. Create a new service class for each distinct process (verb-based name)
3. Move grouped methods to their new service classes
4. Distribute dependencies across the new services (each gets only its needed dependencies)
5. Update callers to inject and use the specific service they need
6. Remove the original bloated service class
7. Verify each new service has 1-2 public methods at most

### Detection Checklist
- [ ] Count public methods on each service — more than 3 signals bloat
- [ ] Review constructor parameter count — 5+ suggests multiple responsibilities
- [ ] Check if the class file has multiple "sections" of related methods
- [ ] Ask: "Can this service be described with a single verb phrase?"
- [ ] Verify each responsibility would be independently testable

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — One Domain Service per Business Process |
| Knowledge | `04-standardized-knowledge.md` — Domain Services |
| Skill | `06-skills.md` — Design a Domain Service for Cross-Aggregate Orchestration |

---

## 6. HTTP Responses from Domain Services

### Category
Architecture

### Description
Domain service methods that return HTTP response objects (`JsonResponse`, `Response`, redirects) instead of domain objects, value objects, or primitives. This couples the domain layer to the web framework and prevents the service from being used outside HTTP contexts.

### Why It Happens
Developers build services "top-down" from controllers, writing the service to return exactly what the controller needs. The `response()->json()` helper is readily available. The developer may not consider non-HTTP usage (CLI, queues, API clients).

### Warning Signs
- Return type of `JsonResponse`, `Response`, `RedirectResponse` in domain service methods
- `response()->json(...)` or `response()->make(...)` calls in service code
- Service methods that return arrays with HTTP status codes
- The service cannot be called from a queue job without modifying it
- CLI commands that wrap service calls to extract data from response objects
- Controllers that pass service response data directly to the view without transformation

### Why Harmful
- The domain service is coupled to Laravel's HTTP layer
- The service cannot be used from CLI commands, queue jobs, or API clients without change
- Testing requires mocking HTTP response objects
- Domain logic is mixed with HTTP formatting and status codes
- The service's return type is framework-specific, limiting reuse

### Consequences
- A `PricingCalculator` returning `JsonResponse` cannot be reused in an invoice generation command
- Queue jobs must unwrap response objects to get the actual data
- API clients calling the service through a different protocol get HTTP artifacts
- Unit tests must set up HTTP mocks to test domain calculations
- Extracting the domain into a standalone package requires removing all HTTP dependencies

### Preferred Alternative
```php
class PricingCalculator
{
    public function calculate(Order $order): Money
    {
        $totalCents = $order->items->sum(
            fn ($i) => $i->unit_price_cents * $i->quantity
        );
        return new Money($totalCents, $order->currency);
    }
}

// Controller transforms the domain result:
return response()->json([
    'total' => $calculator->calculate($order)->toArray(),
]);
```

### Refactoring Strategy
1. Identify HTTP response types in domain service method signatures
2. Determine the actual domain data being returned
3. Change the return type to a domain object, value object, or primitive
4. Remove HTTP-related calls (`response()`, `json()`) from the service
5. Move HTTP response construction to the controller or HTTP layer
6. Update all callers to transform the domain result if needed

### Detection Checklist
- [ ] Search for `JsonResponse`, `Response`, `RedirectResponse` in domain service return types
- [ ] Search for `response()->json()` and `response()->make()` in domain service files
- [ ] Review service callers for non-HTTP usage (CLI, queues, tests)
- [ ] Check if tests mock HTTP responses for domain logic
- [ ] Verify the service can be called without a web request context

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Return Domain Objects, Not HTTP Responses |
| Skill | `06-skills.md` — Design a Domain Service for Cross-Aggregate Orchestration |
| Knowledge | `04-standardized-knowledge.md` — Domain Services |
