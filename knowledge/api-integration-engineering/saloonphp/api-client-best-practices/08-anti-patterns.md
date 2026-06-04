# ECC Anti-Patterns — API Client Best Practices

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 02-saloonphp |
| **Knowledge Unit** | API Client Best Practices |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Controller God Class — API Calls in Controllers
2. Leaky Abstraction — Returning Raw HTTP Responses
3. Singleton Abuse with Stateful Services
4. Over-Engineering Simple Integrations
5. No Exception Mapping — Guzzle Exceptions Leaking Everywhere

---

## Repository-Wide Anti-Patterns

- Fat Controllers
- God Services
- Premature Abstraction
- Overengineering

---

## Anti-Pattern 1: Controller God Class — API Calls in Controllers

### Category
Code Organization | Testing

### Description
Making Http facade calls directly inside controller methods instead of delegating to a service class. Controllers become god classes mixing HTTP concerns with presentation logic.

### Why It Happens
Developers add an API call to a controller for quick feature delivery. The pattern is copied for subsequent endpoints. No one refactors to extract service classes.

### Warning Signs
- `Http::get()`, `Http::post()` calls in controller methods
- Controller has more than 3 external API dependencies
- No service classes exist for API integrations

### Why It Is Harmful
Controllers are untestable without real HTTP calls. API configuration is duplicated across controller methods. Changing the API provider means editing every controller that uses it. Controllers violate SRP.

### Real-World Consequences
Stripe webhook endpoint changes URL. Developer must find and update 12 controllers that call Stripe. Three are missed — payment processing silently fails for 2 days until a customer notices.

### Preferred Alternative
Delegate all API communication to dedicated service classes. Keep controllers focused on HTTP request/response handling.

### Refactoring Strategy
1. Identify all controllers with API calls
2. Create service classes for each external API
3. Move API calls from controllers to service classes
4. Inject service classes into controllers
5. Remove all `Http::` calls from controllers

### Detection Checklist
- [ ] `Http::` calls in controller methods
- [ ] No service class for the API integration
- [ ] Controller has API configuration (URLs, keys)

### Related Rules
Never Call APIs Directly in Controllers (05-rules.md)

### Related Skills
Apply Best Practices for SaloonPHP API Client Architecture (06-skills.md)

### Related Decision Trees
Client Architecture Pattern (07-decision-trees.md)

---

## Anti-Pattern 2: Leaky Abstraction — Returning Raw HTTP Responses

### Category
Maintainability | Architecture

### Description
Service methods return raw HTTP Response objects or decoded arrays, leaking transport-layer details to callers who then depend on HTTP response structure.

### Why It Happens
Developers take the path of least resistance: `return $this->http->get(...)->json()`. Callers consume the returned array directly.

### Warning Signs
- Service method return type is `array` or `Response`
- Callers access `$response['data']` or `$response->json()`
- HTTP response structure referenced in business logic

### Why It Is Harmful
Callers are coupled to HTTP response structure. Changing API provider requires updating all callers. No type safety. API response changes break callers silently.

### Real-World Consequences
Email service changes response from `{"id": "msg_123"}` to `{"message_id": "msg_123"}`. Service returns raw array. All `$result['id']` references in controllers return null. 3 controllers silently fail to log sent email IDs.

### Preferred Alternative
Return typed DTOs from all service methods. Map API responses inside the service.

### Refactoring Strategy
1. Create DTO classes for each service method return type
2. Add factory methods (`fromResponse()`, `fromArray()`) to DTOs
3. Map API responses to DTOs inside service methods
4. Update return types to DTOs
5. Remove array key access from callers

### Detection Checklist
- [ ] Service methods return `array` or `Response`
- [ ] Callers access array keys from service results
- [ ] No DTO mapping in service methods

### Related Rules
Return Typed DTOs, Not Raw Responses (05-rules.md)

### Related Skills
Apply Best Practices for SaloonPHP API Client Architecture (06-skills.md)

### Related Decision Trees
Client Architecture Pattern (07-decision-trees.md)

---

## Anti-Pattern 3: Singleton Abuse with Stateful Services

### Category
Architecture | Reliability

### Description
Registering a stateful API service class as a singleton when it holds per-request mutation state (request counters, cached responses that should be per-request).

### Why It Happens
Developers read "register service as singleton for connection reuse" and apply it to services that also hold mutable state.

### Warning Signs
- Service holds request counters, temporary caches, or operation state
- Request state leaks between requests
- Unexpected behavior on second request in same process

### Why It Is Harmful
State from the first request leaks into the second request in the same process. Request counters are wrong. Temporary caches serve stale data. Debugging becomes a nightmare.

### Real-World Consequences
`StripeService` is registered as singleton and has a `$requestCount` property. After processing 100 requests, the counter is at 100. The monitoring dashboard shows "100 requests since deploy" when it should show "100 requests in last minute."

### Preferred Alternative
Register stateless services (connectors, wrappers) as singletons. Stateful services (per-request tracking) should be transient.

### Refactoring Strategy
1. Identify mutable state in singleton services
2. Move per-request state to request-scoped services or use `Context`
3. Keep stateless configuration as singleton
4. Verify no state leaks between requests

### Detection Checklist
- [ ] Singleton service has mutable properties
- [ ] State from previous request visible in current request
- [ ] Service registered as singleton but holds per-request data

### Related Rules
Inject Http Facade Via Constructor (05-rules.md)

### Related Skills
Apply Best Practices for SaloonPHP API Client Architecture (06-skills.md)

### Related Decision Trees
Client Architecture Pattern (07-decision-trees.md)

---

## Anti-Pattern 4: Over-Engineering Simple Integrations

### Category
Maintainability | Architecture

### Description
Creating interfaces, factories, repositories, and DTOs for a simple single-endpoint API integration. Abstract factory patterns for a single concrete implementation.

### Why It Happens
Teams apply enterprise patterns uniformly regardless of integration complexity. The architecture astronaut writes abstract code for "what if we switch providers."

### Warning Signs
- Interface with one implementation for a simple API call
- Abstract factory for a single provider
- Repository pattern wrapping a single HTTP endpoint
- 10+ files for a single API call (interface, service, DTO, config, factory, tests)

### Why It Is Harmful
Every change requires modifying multiple files. New developers spend more time navigating abstractions than understanding the integration. Velocity drops.

### Real-World Consequences
A single `GET /countries` endpoint has: `CountryServiceInterface`, `CountryService`, `CountryDTO`, `CountryServiceFactory`, `CountryServiceProvider`, tests for each. Adding a timeout requires changing 3 files. The team avoids touching this code.

### Preferred Alternative
Match abstraction level to integration complexity. Single endpoint → single service class with Http facade. Add abstraction as complexity grows.

### Refactoring Strategy
1. Identify over-engineered simple integrations
2. Remove unnecessary interfaces (single implementation)
3. Merge DTO into service method return
4. Remove factory pattern (no provider switching)
5. Simplify until each file has clear, necessary purpose

### Detection Checklist
- [ ] Interface with single implementation
- [ ] Factory pattern for single provider
- [ ] 5+ files for a single-endpoint integration
- [ ] Abstract layers with no concrete benefit

### Related Rules
Design Patterns Appropriately (05-rules.md) — referenced in knowledge unit anti-patterns section

### Related Skills
Apply Best Practices for SaloonPHP API Client Architecture (06-skills.md)

### Related Decision Trees
Client Architecture Pattern (07-decision-trees.md)

---

## Anti-Pattern 5: No Exception Mapping — Guzzle Exceptions Leaking Everywhere

### Category
Architecture | Security

### Description
Letting Guzzle HTTP exceptions propagate from service classes to controllers and views. Business logic catches transport-level exceptions.

### Why It Happens
Developers call `->throw()` on Http responses and let exceptions bubble up uncaught. No try-catch in the service layer.

### Warning Signs
- `catch (GuzzleException $e)` or `catch (RequestException $e)` in controllers
- Import statements for Guzzle exception classes in business code
- HTTP-level error messages shown to users

### Why It Is Harmful
Couples business logic to HTTP transport. HTTP error details (IP addresses, internal endpoints, stack traces) may leak to users. Swapping Guzzle breaks all error handling.

### Real-World Consequences
Stripe returns 503. `GuzzleException` propagates to the view. The error message includes the Stripe internal endpoint URL and the Guzzle version. Security audit flags information leakage. PCI compliance is at risk.

### Preferred Alternative
Map HTTP errors to domain-specific exceptions inside the service class.

### Refactoring Strategy
1. Add try-catch around all HTTP calls in service classes
2. Create domain exception classes per error scenario
3. Map HTTP status codes to domain exceptions
4. Update controllers to catch domain exceptions
5. Remove all `catch (GuzzleException)` from business code

### Detection Checklist
- [ ] Guzzle exceptions caught in controllers
- [ ] HTTP-level error details in user-facing errors
- [ ] No domain exception mapping in service layer

### Related Rules
Map HTTP Errors to Domain Exceptions (05-rules.md)

### Related Skills
Apply Best Practices for SaloonPHP API Client Architecture (06-skills.md)

### Related Decision Trees
Testing Approach (07-decision-trees.md)
