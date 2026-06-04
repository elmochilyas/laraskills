# ECC Anti-Patterns — HTTP Client Wrapper

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | HTTP Client Wrapper |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Direct HTTP Calls in Controllers Without a Wrapper
2. Returning Raw HTTP Response Objects Instead of Typed Data
3. Hardcoded URLs and Credentials in Wrapper Classes
4. Propagating Raw HTTP Exceptions to Callers
5. Instantiating Http Facade Inside Methods (No Constructor Injection)

---

## Repository-Wide Anti-Patterns

- Fat Controllers
- God Services
- Hidden Database Queries

---

## Anti-Pattern 1: Direct HTTP Calls in Controllers Without a Wrapper

### Category
Code Organization | Testing

### Description
Calling `Http::get()` or `Http::post()` directly inside controller methods instead of delegating to a dedicated service class.

### Why It Happens
The simplest path to "make it work." Adding a service class feels like unnecessary ceremony, especially for a single endpoint.

### Warning Signs
- `Http::get()` or `Http::post()` calls in controller methods
- Duplicated HTTP configuration (base URL, headers) across controllers
- No testable abstraction for API calls

### Why It Is Harmful
HTTP logic is mixed with request handling, making controllers untestable without real HTTP calls. Configuration is duplicated across controllers. Changing the API endpoint requires hunting down every controller that calls it.

### Real-World Consequences
Stripe API base URL changes from `v1` to `v2`. Developer must find and update 15 controllers that all call `Http::withToken(...)->post(...)`. Three are missed, causing production errors.

### Preferred Alternative
Create a service class (or Saloon connector) that wraps all HTTP calls for a given API. Inject it into controllers.

### Refactoring Strategy
1. Identify all endpoints for each external API
2. Create a service class per API (e.g., `StripeService`)
3. Move all HTTP calls into the service class
4. Inject the service into controllers
5. Replace controller HTTP calls with service method calls

### Detection Checklist
- [ ] `Http::` calls in controller methods
- [ ] No dedicated service class for API integration
- [ ] Duplicated API configuration across files

### Related Rules
Never Make API Calls Directly in Controllers (05-rules.md)

### Related Skills
Create Type-Safe HTTP Client Wrappers for External APIs (06-skills.md)

### Related Decision Trees
Wrapper Implementation Approach (07-decision-trees.md)

---

## Anti-Pattern 2: Returning Raw HTTP Response Objects Instead of Typed Data

### Category
Maintainability | Testing

### Description
Returning `Response` objects or raw arrays from wrapper methods, forcing callers to deal with HTTP-level data structures and key-based access.

### Why It Happens
Developers treat the API response as "good enough" and skip the mapping step. Returning `->json()` is the path of least resistance.

### Warning Signs
- Wrapper methods return `array` or `Response` type
- Callers access data with `$data['name']` string keys
- No typed DTOs or collections in the service layer

### Why It Is Harmful
Runtime errors from key typos, no IDE autocompletion, brittle code that breaks when the API response structure changes. Refactoring requires hunting down all key accesses.

### Real-World Consequences
API adds a nested `data.` envelope. Every `$response['id']` becomes `$response['data']['id']`. Developer must find and update 50+ call sites. Three are missed, causing production errors.

### Preferred Alternative
Map API responses to typed DTOs or value objects within the wrapper. Return typed collections for lists.

### Refactoring Strategy
1. Create DTO classes for each API response shape
2. Add a `fromResponse(array $data): static` factory method to each DTO
3. Map responses to DTOs inside wrapper methods
4. Update callers to use typed properties
5. Remove raw array access from the codebase

### Detection Checklist
- [ ] Wrapper methods return `array` type
- [ ] Callers access data with string keys
- [ ] No DTO or value object classes exist

### Related Rules
Return Typed Data, Not Raw Response Objects (05-rules.md)

### Related Skills
Create Type-Safe HTTP Client Wrappers for External APIs (06-skills.md)

### Related Decision Trees
Wrapper Implementation Approach (07-decision-trees.md)

---

## Anti-Pattern 3: Hardcoded URLs and Credentials in Wrapper Classes

### Category
Security | Maintainability

### Description
Embedding API base URLs, API keys, and other credentials directly in the wrapper class code rather than externalizing them to configuration files.

### Why It Happens
Developers hardcode values "temporarily" during development and never extract them. The pattern is copied from example code that uses inline credentials.

### Warning Signs
- `Http::baseUrl('https://api.stripe.com/v1')` in service class
- API keys and secrets in PHP source files
- No `config/services/{service}.php` file exists

### Why It Is Harmful
Credentials committed to version control are a security breach. Environment-specific values (dev vs prod URLs) require code changes. Rolling credentials means modifying source code.

### Real-World Consequences
Developer commits API key to a public repository. Key is compromised within hours. Thousands of dollars in fraudulent charges. Post-mortem blames hardcoded credentials.

### Preferred Alternative
Externalize all configuration to `config/services/{service}.php` using environment variables.

### Refactoring Strategy
1. Create `config/services/{service}.php` for each external API
2. Move all credential-dependent values to config files
3. Add `.env` entries with appropriate defaults
4. Update wrapper classes to use `config()` instead of literal values
5. Remove all hardcoded URLs, keys, and secrets from source code

### Detection Checklist
- [ ] API keys or secrets in source files
- [ ] Base URLs hardcoded in wrapper classes
- [ ] No service config file exists

### Related Rules
Centralize Configuration in Config Files (05-rules.md)

### Related Skills
Create Type-Safe HTTP Client Wrappers for External APIs (06-skills.md)

### Related Decision Trees
Wrapper Implementation Approach (07-decision-trees.md)

---

## Anti-Pattern 4: Propagating Raw HTTP Exceptions to Callers

### Category
Architecture | Maintainability

### Description
Letting Guzzle exceptions (`RequestException`, `ConnectException`, `GuzzleException`) propagate out of the wrapper to caller code. Business logic must catch transport-level exceptions.

### Why It Happens
Developers call `->throw()` on the response and let exceptions bubble up naturally without catching and transforming them.

### Warning Signs
- `catch (GuzzleException $e)` or `catch (RequestException $e)` in business logic
- No wrapper-level try-catch around HTTP calls
- Domain code imports Guzzle exception classes

### Why It Is Harmful
Business logic is coupled to the HTTP transport layer. Swapping Guzzle for a different client breaks all exception handling. The domain layer can't be tested without HTTP mocking.

### Real-World Consequences
Team migrates from Guzzle to a custom HTTP client. Every `catch (GuzzleException $e)` in the codebase must be updated. Three are missed, causing unhandled exception crashes in production.

### Preferred Alternative
Catch HTTP exceptions inside the wrapper and throw domain-specific exceptions (e.g., `PaymentFailedException`, `RateLimitExceededException`).

### Refactoring Strategy
1. Add try-catch around all HTTP calls in wrappers
2. Map HTTP status codes to domain exception classes
3. Document the exception contract for each wrapper method
4. Update callers to catch domain exceptions
5. Remove all `catch (GuzzleException)` from business logic

### Detection Checklist
- [ ] Guzzle exceptions caught in business logic
- [ ] No wrapper-level error transformation
- [ ] Domain code depends on HTTP transport

### Related Rules
Map HTTP Errors to Domain Exceptions (05-rules.md)

### Related Skills
Create Type-Safe HTTP Client Wrappers for External APIs (06-skills.md)

### Related Decision Trees
Error Handling Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: Instantiating Http Facade Inside Methods (No Constructor Injection)

### Category
Testing | Architecture

### Description
Using `Http::` facade directly inside service methods instead of injecting the Http instance via constructor. Prevents proper mocking in tests.

### Why It Happens
The Http facade's static API makes it convenient to call directly. Developers don't realize it also supports instance injection.

### Warning Signs
- `Http::withToken(...)->get(...)` in service class methods
- No Http instance property in the service class
- Tests use `Http::fake()` globally instead of injecting

### Why It Is Harmful
Tests must use global `Http::fake()` which affects all HTTP calls, not just those from the service under test. Sequential call faking requires global sequencing that breaks when tests run in parallel.

### Real-World Consequences
Test suite has flaky failures because `Http::fake()` from one test leaks into another. Debugging takes days. Team starts avoiding integration tests.

### Preferred Alternative
Inject the Http facade via constructor: `public function __construct(private Http $http) {}`.

### Refactoring Strategy
1. Add `private Http $http` constructor parameter to service classes
2. Replace `Http::` facade calls with `$this->http->` instance calls
3. Register services in the container for automatic resolution
4. Update tests to inject fake Http instance

### Detection Checklist
- [ ] `Http::` facade used in service class methods
- [ ] No constructor injection of Http
- [ ] Tests use global `Http::fake()` instead of per-service injection

### Related Rules
Inject Http Facade Via Constructor (05-rules.md)

### Related Skills
Create Type-Safe HTTP Client Wrappers for External APIs (06-skills.md)

### Related Decision Trees
Testing Strategy (07-decision-trees.md)
