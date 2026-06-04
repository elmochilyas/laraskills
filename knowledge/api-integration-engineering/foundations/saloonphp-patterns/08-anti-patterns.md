# ECC Anti-Patterns — SaloonPHP Request Patterns

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | SaloonPHP Request Patterns |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Multiple Endpoints in a Single Request Class (SRP Violation)
2. No DTOs — Raw Array Responses Throughout Codebase
3. Tight Coupling Between Connector and Specific Request Classes
4. Skipping MockClient — Testing Against Real API
5. No Pipeline Configuration — Duplicated Middleware Per Request

---

## Repository-Wide Anti-Patterns

- God Services
- Premature Abstraction

---

## Anti-Pattern 1: Multiple Endpoints in a Single Request Class (SRP Violation)

### Category
Code Organization | Maintainability

### Description
Creating one Request class for multiple API endpoints (e.g., `UserRequest` handles both `GET /users` and `GET /users/{id}`). Conditionals inside the class determine which endpoint is called.

### Why It Happens
Developers group "related" endpoints together to reduce file count, not realizing each endpoint has unique URL, method, parameters, and response shape.

### Warning Signs
- `resolveEndpoint()` uses conditional logic (if/switch) based on constructor parameters
- Same Request class used for different HTTP methods
- Request class constructor takes multiple optional parameters

### Why It Is Harmful
Violates Single Responsibility Principle. The class becomes a dumping ground for all related endpoints. Testing one endpoint requires constructing parameters for others. API contract is unclear.

### Real-World Consequences
`ChargeRequest` handles `GET /charges/{id}`, `GET /charges`, `POST /charges`, and `POST /charges/{id}/refund`. A new developer adds a parameter for refund reason, accidentally breaking the list charges endpoint. The bug reaches production because the request class is too complex to reason about.

### Preferred Alternative
One Request class per unique HTTP method + endpoint combination.

### Refactoring Strategy
1. Identify Request classes with conditional `resolveEndpoint()` logic
2. Split into individual classes per endpoint
3. Use base/abstract classes for shared configuration
4. Update all callers to use the specific request class

### Detection Checklist
- [ ] Request class uses conditional logic for endpoint resolution
- [ ] Multiple HTTP methods in one Request class
- [ ] Request class has many optional constructor parameters

### Related Rules
One Request Class Per Endpoint (05-rules.md)

### Related Skills
Structure API Clients with SaloonPHP Connector/Request Pattern (06-skills.md)

### Related Decision Trees
Request Class Design (07-decision-trees.md)

---

## Anti-Pattern 2: No DTOs — Raw Array Responses Throughout Codebase

### Category
Maintainability | Testing

### Description
Using `$response->array()` or `$response->json()` directly instead of implementing `createDtoFromResponse()` and returning typed DTOs through `->dto()`.

### Why It Happens
`->array()` returns data immediately without the overhead of creating a DTO class. Developers prioritize speed of implementation.

### Warning Signs
- `->array()` or `->json()` called on Saloon responses
- No `createDtoFromResponse()` implementation in Request classes
- Array key access (`$data['name']`) throughout the codebase

### Why It Is Harmful
Array key typos are runtime errors. No IDE autocompletion. API response structure changes require hunting down every key access. No type safety.

### Real-World Consequences
Stripe changes `charge.status` to `charge.charging_status` in a new API version. All `$charge['status']` references still compile fine but return null in production. Checkout flow silently breaks.

### Preferred Alternative
Implement `createDtoFromResponse()` on every Request class. Return typed DTOs.

### Refactoring Strategy
1. Create DTO classes for each endpoint response shape
2. Implement `createDtoFromResponse()` on all Request classes
3. Replace `->json()`/`->array()` calls with `->dto()`
4. Remove raw array access from callers

### Detection Checklist
- [ ] `->array()` or `->json()` used instead of `->dto()`
- [ ] No DTO classes exist
- [ ] Array key access (`['key']`) in business logic

### Related Rules
Always Use DTOs for Response Mapping (05-rules.md)

### Related Skills
Structure API Clients with SaloonPHP Connector/Request Pattern (06-skills.md)

### Related Decision Trees
DTO vs Raw Response Return (07-decision-trees.md)

---

## Anti-Pattern 3: Tight Coupling Between Connector and Specific Request Classes

### Category
Architecture | Maintainability

### Description
Connector class directly depends on specific Request implementations, creating bidirectional coupling. The connector can't be used without knowing its internal request classes.

### Why It Happens
Developers create a connector with methods like `createCharge()` that instantiate and send specific Request classes internally.

### Warning Signs
- Connector class imports and instantiates specific Request classes
- Connector methods named after operations (not just configuration)
- Adding a new endpoint requires modifying the Connector

### Why It Is Harmful
Connector becomes a god class. Adding endpoints requires modifying the connector. The connector can't be reused with different request strategies. Testing requires the full connector setup.

### Real-World Consequences
Team adds 15 endpoints. The StripeConnector has 25 methods, each instantiating a different request class. Every new endpoint needs a connector method. The connector has 500 lines and violates SRP.

### Preferred Alternative
Keep connector focused on configuration (base URL, auth, headers, middleware). Let consumers instantiate and send Request classes directly.

### Refactoring Strategy
1. Remove endpoint-specific methods from Connector
2. Keep only configuration, auth, and middleware in Connector
3. Create a Service class that combines Connector + specific Requests
4. Inject Connector into Service class

### Detection Checklist
- [ ] Connector has methods beyond configuration
- [ ] Connector instantiates Request classes
- [ ] Adding an endpoint requires modifying Connector

### Related Rules
One Connector Per External Service (05-rules.md)

### Related Skills
Structure API Clients with SaloonPHP Connector/Request Pattern (06-skills.md)

### Related Decision Trees
Connector Architecture Decision (07-decision-trees.md)

---

## Anti-Pattern 4: Skipping MockClient — Testing Against Real API

### Category
Testing | Reliability

### Description
Writing tests that make real HTTP calls to external APIs instead of using Saloon's MockClient with fake responses.

### Why It Happens
Developers don't know about MockClient. Real API testing seems more "correct" because it validates against actual endpoints.

### Warning Signs
- Tests create real Connector instances without MockClient
- Test suite makes network calls (visible in debug output)
- Tests fail when network/VPN is unavailable

### Why It Is Harmful
Tests are slow (network latency), flaky (network issues, rate limits), environment-dependent, and risk hitting production APIs. They can't test error scenarios (timeout, 500, 429) deterministically.

### Real-World Consequences
CI runs 200 integration tests that each make real API calls. Average test time: 15 minutes. Tests fail randomly due to Stripe rate limits. Developers ignore failing tests. A real bug in error handling goes undetected for 2 weeks.

### Preferred Alternative
Always use Saloon's MockClient with fixture-based fake responses in tests.

### Refactoring Strategy
1. Identify all tests making real API calls
2. Create MockClient with fixture responses based on real API recordings
3. Replace real connector instantiation with mocked connector
4. Add error scenario tests using mock responses
5. Ensure `preventStrayRequests()` catches unmocked requests

### Detection Checklist
- [ ] Tests create real connectors without MockClient
- [ ] Tests make network calls
- [ ] Error scenarios not tested

### Related Rules
Use MockClient for Testing (05-rules.md)

### Related Skills
Structure API Clients with SaloonPHP Connector/Request Pattern (06-skills.md)

### Related Decision Trees
Connector Architecture Decision (07-decision-trees.md)

---

## Anti-Pattern 5: No Pipeline Configuration — Duplicated Middleware Per Request

### Category
Architecture | Maintainability

### Description
Configuring middleware (auth, logging, retry) on individual Request classes instead of in the Connector's pipeline. Configuration is duplicated across all requests.

### Why It Happens
Developers configure auth in the Request constructor because it's the "simplest place." They don't realize the Connector's `bootConnector()` method is for this purpose.

### Warning Signs
- Auth tokens configured in Request classes, not Connector
- Logger instantiated in multiple Request classes
- `withTokenAuth()` called on individual request instances

### Why It Is Harmful
Adding a new middleware requires updating all existing Request classes. Inconsistent middleware application — some requests may miss logging or auth. Configuration is scattered.

### Real-World Consequences
Team adds logging middleware to ListChargesRequest but forgets to add it to GetChargeRequest. Half the API calls go unlogged. When debugging an incident, only half the timeline is visible.

### Preferred Alternative
Configure all global middleware (auth, logging, retry, error handling) in the Connector's `bootConnector()` method.

### Refactoring Strategy
1. Move auth configuration from Request classes to Connector
2. Move logging middleware to Connector pipeline
3. Move retry/error handling to Connector pipeline
4. Remove duplicated middleware from individual Request classes
5. Verify all requests pass through the configured pipeline

### Detection Checklist
- [ ] Auth/logger configured in Request classes
- [ ] Multiple Request classes have the same middleware setup
- [ ] Adding middleware requires editing many files

### Related Rules
Use Pipelines for Cross-Cutting Concerns (05-rules.md)

### Related Skills
Structure API Clients with SaloonPHP Connector/Request Pattern (06-skills.md)

### Related Decision Trees
Connector Architecture Decision (07-decision-trees.md)
