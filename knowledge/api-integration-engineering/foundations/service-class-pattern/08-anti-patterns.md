# ECC Anti-Patterns — Service Class Pattern for API Communication

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | Service Class Pattern for API Communication |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Mixing Business Logic with API Communication in Service Class
2. Returning Raw Response Objects Instead of Typed DTOs
3. No Interface — Tight Coupling to Implementation
4. Instantiating HTTP Client Inside Service Instead of Constructor Injection
5. God Service Class — Multiple Providers in One Class

---

## Repository-Wide Anti-Patterns

- God Services
- Fat Controllers
- Overengineering

---

## Anti-Pattern 1: Mixing Business Logic with API Communication in Service Class

### Category
Code Organization | Architecture

### Description
Putting business rules (discount calculations, eligibility checks, validation) inside the API service class alongside HTTP communication code.

### Why It Happens
Developers think "all Stripe-related code goes in StripeService." They don't separate integration concerns from business logic.

### Warning Signs
- Service class has business logic (calculations, conditionals about business rules)
- Service class imports Eloquent models
- Service class methods do more than call API + map response

### Why It Is Harmful
Business logic is coupled to the API transport layer. Changing the API provider means rewriting business logic. Testing business logic requires API mocking. Violates Single Responsibility.

### Real-World Consequences
`StripeService::charge()` calculates tax, applies discounts, checks fraud scores, then calls Stripe. Migrating to Braintree requires rewriting all business logic because it's mixed with Stripe HTTP calls.

### Preferred Alternative
Keep service classes focused on API communication only. Business logic goes in dedicated domain services or action classes.

### Refactoring Strategy
1. Identify business logic in API service classes
2. Extract business rules to domain services or action classes
3. API service class becomes a thin HTTP communication layer
4. Inject API service into domain services where needed
5. Write separate tests for business logic (no HTTP mocking needed)

### Detection Checklist
- [ ] Service class contains business conditionals
- [ ] Service class imports Eloquent models
- [ ] Service class methods contain logic beyond API call + response mapping

### Related Rules
Handle Errors Within the Service Boundary (05-rules.md)

### Related Skills
Structure API Integration Logic with Service Classes (06-skills.md)

### Related Decision Trees
Error Boundary Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: Returning Raw Response Objects Instead of Typed DTOs

### Category
Maintainability | Testing

### Description
Service methods return raw HTTP response (`json()`, `array()`, or `Response` object) instead of typed DTOs or collections.

### Why It Happens
Returning `$response->json()` is the fastest path. DTO creation seems like unnecessary boilerplate.

### Warning Signs
- Service method return type is `array` (not typed DTO)
- Callers access data with string keys: `$result['name']`
- No DTO classes defined

### Why It Is Harmful
Callers are coupled to response structure. Key typos cause runtime errors. No IDE autocompletion. API response changes require changes across the entire codebase.

### Real-World Consequences
Stripe adds a `data` envelope to charge responses. All `$charge['id']` references become `$charge['data']['id']`. Developer must hunt down 50+ array key accesses. Three are missed, causing production errors.

### Preferred Alternative
Return typed DTOs or collections from all service methods.

### Refactoring Strategy
1. Create DTO classes for each API response type
2. Add `fromResponse()` factory method to each DTO
3. Map API responses to DTOs inside service methods
4. Update service method return types to DTOs
5. Replace array access in callers with typed property access

### Detection Checklist
- [ ] Service methods return `array` type
- [ ] No DTO classes exist
- [ ] Callers use string key access

### Related Rules
Return DTOs, Never Raw Response Objects (05-rules.md)

### Related Skills
Structure API Integration Logic with Service Classes (06-skills.md)

### Related Decision Trees
Interface Contract Design (07-decision-trees.md)

---

## Anti-Pattern 3: No Interface — Tight Coupling to Implementation

### Category
Architecture | Testing

### Description
Using the service class directly (concrete class) instead of programming to an interface. Makes mocking and provider swapping difficult.

### Why It Happens
Defining interfaces for every service seems like Java-style ceremony. Laravel's automatic resolution makes concrete classes work without interfaces.

### Warning Signs
- Service classes have no corresponding interface
- `new StripeService(...)` or `app(StripeService::class)` without interface binding
- Tests mock the concrete service class (requires full instantiation)

### Why It Is Harmful
Swapping providers (Stripe → Braintree) requires changing all callers. Mocking concrete classes in tests requires resolving all constructor dependencies. Coupling to implementation reduces flexibility.

### Real-World Consequences
Company migrates from Stripe to Braintree. Since there's no `PaymentGateway` interface, every controller, job, and command that references `StripeService` must be updated. 50 files need changes. 5 are missed, causing production errors.

### Preferred Alternative
Define an interface for each service. Bind interface to implementation in the ServiceProvider.

### Refactoring Strategy
1. Create an interface with the service's public method signatures
2. Implement the interface in the service class
3. Register interface-to-implementation binding
4. Update callers to type-hint the interface
5. Write tests mocking the interface (not concrete class)

### Detection Checklist
- [ ] No interface for service class
- [ ] Callers type-hint concrete class
- [ ] Provider swap requires changing multiple files

### Related Rules
Define Interface Per Service (05-rules.md)

### Related Skills
Structure API Integration Logic with Service Classes (06-skills.md)

### Related Decision Trees
Interface Contract Design (07-decision-trees.md)

---

## Anti-Pattern 4: Instantiating HTTP Client Inside Service Instead of Constructor Injection

### Category
Testing | Architecture

### Description
Creating a new HTTP client (`new Client()`, `Http::withToken(...)`, `new StripeConnector()`) inside service methods instead of injecting via constructor.

### Why It Happens
Inline instantiation is shorter and doesn't require modifying the constructor. Developers don't consider testability.

### Warning Signs
- `Http::` facade calls in service methods (not using `$this->http`)
- `new Client()` or `new StripeConnector()` inside methods
- Tests can't inject fake HTTP client

### Why It Is Harmful
Services can't be tested without real HTTP calls. Tests are slow, flaky, and environment-dependent. Changing HTTP client implementation requires modifying the service.

### Real-World Consequences
Team wants to add request logging middleware. Since the Guzzle client is created inside the method, they must modify the service class. They add the configuration to all 15 methods. One is missed. Half the requests are unlogged.

### Preferred Alternative
Inject HTTP client (Http facade, Guzzle client, or Saloon connector) via constructor.

### Refactoring Strategy
1. Add `private Http $http` constructor parameter
2. Replace `Http::` facade calls with `$this->http->`
3. Register service in container for automatic resolution
4. Update tests to inject fake HTTP client
5. Remove inline HTTP client creation

### Detection Checklist
- [ ] `Http::` facade called in service methods (not `$this->http`)
- [ ] No HTTP client constructor parameter
- [ ] Tests can't inject fake client

### Related Rules
Inject Http Client Via Constructor (05-rules.md)

### Related Skills
Structure API Integration Logic with Service Classes (06-skills.md)

### Related Decision Trees
Service Class vs Saloon Decision (07-decision-trees.md)

---

## Anti-Pattern 5: God Service Class — Multiple Providers in One Class

### Category
Code Organization | Maintainability

### Description
Creating one service class that handles multiple external providers (e.g., `PaymentService` with both `stripeCharge()` and `paypalCharge()` methods).

### Why It Happens
Developers think "all payment-related code goes in PaymentService." They don't recognize each provider as a separate integration.

### Warning Signs
- Service class name is generic, methods prefixed by provider name
- Service class has >20 methods
- Multiple provider configurations injected into one class

### Why It Is Harmful
Violates Single Responsibility. Changes to Stripe integration risk breaking PayPal. The class becomes a god class. Merge conflicts when multiple developers work on different providers simultaneously.

### Real-World Consequences
`PaymentService` has `stripeCharge()`, `paypalCharge()`, `squareCharge()`. A developer fixes Stripe's error handling and accidentally changes the shared `$http` client configuration. PayPal and Square break simultaneously.

### Preferred Alternative
One service class per external provider. Use an interface for the common contract.

### Refactoring Strategy
1. Split god service into one class per provider
2. Define a common interface for the operation
3. Create a factory or strategy pattern for provider selection
4. Register each service independently in the container
5. Update callers to use the provider-specific service or strategy

### Detection Checklist
- [ ] Service class methods are prefixed by provider name
- [ ] Multiple provider configurations in one class
- [ ] Service class has >15 methods

### Related Rules
One Service Class Per External System (05-rules.md)

### Related Skills
Structure API Integration Logic with Service Classes (06-skills.md)

### Related Decision Trees
Interface Contract Design (07-decision-trees.md)
