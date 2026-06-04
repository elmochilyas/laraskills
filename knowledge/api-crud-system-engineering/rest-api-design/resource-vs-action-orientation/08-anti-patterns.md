# Resource vs Action Orientation: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | rest-api-design |
| Knowledge Unit | resource-vs-action-orientation |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Pure REST Dogma** — Force-fitting all operations into CRUD patterns regardless of suitability
2. **RPC with No Pattern** — Action endpoints scattered without structure or consistency
3. **POST for Reads** — Using POST for read operations where GET with query parameters works
4. **Hidden State Machines** — PATCH that triggers complex side effects without documentation
5. **Overloaded POST Endpoints** — A single POST endpoint that handles creation, updates, and actions

## Repository-Wide Anti-Patterns

- Not documenting action endpoints with clear side effect descriptions in OpenAPI
- Using `Route::apiResource()` for resources where some operations don't fit CRUD
- Inconsistent paradigm choice — some resources pure REST, others RPC with no discernible pattern
- Leaking internal implementation as API resources

---

## 1. Pure REST Dogma

### Category
Over-Engineering

### Description
Requiring every operation to be expressed as a resource CRUD operation, even when the operation has no natural resource representation or involves complex cross-resource side effects.

### Why It Happens
Architectural purity — "true REST requires resource orientation for everything." Developers create unnatural resource abstractions to avoid "impure" action endpoints.

### Warning Signs
- Complex multi-step workarounds to avoid simple action endpoints
- Resources named after operations (`/activateSubscription`) to fit CRUD
- PATCH endpoints that trigger extensive side effects (emails, charges, notifications) without documentation
- Client code must orchestrate multiple CRUD calls to achieve a single business operation

### Why Harmful
Unnatural abstractions make the API harder to understand and use. Clients must perform multiple requests to achieve what a single action endpoint would provide. Side effects are hidden behind PATCH semantics.

### Real-World Consequences
A team models order cancellation as `PATCH /orders/42 {status: "cancelled"}`. But cancellation also requires refund, inventory restock, customer notification, and analytics recording. The PATCH handler does all this silently. A client developer assumes it's a simple status update and doesn't handle potential side effects.

### Preferred Alternative
Use PATCH for simple state transitions without side effects. Use action endpoints for operations with complex business logic: `POST /orders/42/cancel`.

### Refactoring Strategy
1. Identify PATCH endpoints with complex side effects
2. Extract action endpoints for operations with side effects beyond state change
3. Keep PATCH for simple field updates only
4. Document side effects in OpenAPI for each action endpoint
5. Add tests verifying that PATCH operations don't trigger unexpected side effects

### Detection Checklist
- [ ] PATCH endpoints trigger emails, charges, or notifications
- [ ] Controllers named after business operations, not resources
- [ ] Multiple CRUD calls needed for a single business operation
- [ ] Clients are surprised by PATCH side effects
- [ ] Unnatural resource abstractions exist

### Related Rules/Skills/Trees
- Rule: API-ARCH-005 (Pragmatic Action Endpoints)
- Skill: rest-purity-vs-pragmatic
- Tree: pragmatic-design

---

## 2. RPC with No Pattern

### Category
Inconsistency

### Description
Action endpoints exist arbitrarily without structure — some under resources, others at root level, some using POST, others using GET, with no consistent naming convention.

### Why It Happens
Each developer adds action endpoints as needed without consulting a style guide. There's no established pattern for naming or placing action endpoints.

### Warning Signs
- Action endpoints in inconsistent locations (`/cancelOrder`, `/users/cancel`, `/api/v1/cancel`)
- Some action endpoints use POST, others GET, others PUT
- No clear naming convention for action verbs
- Same action available via multiple URL patterns
- Style guide doesn't address action endpoints

### Why Harmful
Clients cannot predict how to perform actions — they must check documentation for every single action endpoint. The API feels inconsistent and amateurish.

### Real-World Consequences
A developer needs to cancel an order. They look at existing patterns and find: `/invoices/send`, `/api/users/activate`, `/api/v1/deactivateProduct`, `POST /orders/cancel`. Each follows a different convention. The developer creates `GET /orders/cancelOrder` because they saw the GET pattern once.

### Preferred Alternative
Establish a consistent pattern: action endpoints go under their related resource, use POST, and use clear verb names: `POST /resources/{id}/action`.

### Refactoring Strategy
1. Audit all action endpoints for consistency
2. Move all action endpoints under their related resource
3. Standardize on POST for action endpoints
4. Use consistent verb naming (simple imperative: cancel, send, activate)
5. Document the action endpoint pattern in the style guide

### Detection Checklist
- [ ] Action endpoints in inconsistent locations
- [ ] No standard HTTP method for action endpoints
- [ ] Inconsistent verb naming
- [ ] Same action has multiple URL patterns
- [ ] Style guide doesn't specify action endpoint conventions

### Related Rules/Skills/Trees
- Rule: API-CONSISTENCY-003 (Action Endpoint Convention)
- Skill: resource-naming-conventions
- Tree: api-consistency

---

## 3. POST for Reads

### Category
Cache Bypass

### Description
Using POST requests for read-only operations — searching, listing, or retrieving data — where GET with query parameters would be semantically correct and cacheable.

### Why It Happens
POST requests support request bodies, making complex queries easier to structure. Developers choose POST because it's simpler to pass nested filter objects in JSON.

### Warning Signs
- POST endpoints that don't create or modify resources
- POST requests used for search or filtering
- GET with query parameters would work but isn't used
- CDN caching is ineffective for read-heavy endpoints
- API client must POST to list resources

### Why Harmful
POST responses are not cacheable by HTTP intermediaries. Every read request hits the server, increasing server load and response latency. The API loses the most significant performance benefit of HTTP.

### Real-World Consequences
A search endpoint uses POST with a JSON body for complex filters. The CDN cannot cache POST responses. At 100 requests/second, the server handles all traffic. Switching to GET with query parameters would allow CDN caching with 95% cache hit rate.

### Preferred Alternative
Use GET with query parameters for read operations. Use POST only when query complexity exceeds URL length limits (~2000 characters) or for operations that modify state.

### Refactoring Strategy
1. Identify POST endpoints that only read data
2. Convert to GET with query parameters
3. Implement URL-safe serialization for complex filters
4. Add CDN caching for converted endpoints
5. Test that response is cached after conversion

### Detection Checklist
- [ ] POST endpoints without side effects
- [ ] POST used for search or listing
- [ ] GET with query parameters would work
- [ ] No caching for read-heavy endpoints
- [ ] POST search endpoints have high request volume

### Related Rules/Skills/Trees
- Rule: API-HTTP-005 (GET for Read Operations)
- Skill: http-method-semantics
- Tree: performance-optimization

---

## 4. Hidden State Machines

### Category
Documentation Gap

### Description
PATCH endpoints that accept state transitions but trigger complex side effects beyond the state change — sending emails, charging credit cards, updating external systems — without documenting these effects.

### Why It Happens
"PATCH is for updates" — developers use PATCH for state changes without considering that some state changes have broader business implications.

### Warning Signs
- PATCH `status` field triggers emails, charges, or notifications
- Client code handles side effects because the API doesn't document them
- PATCH endpoint documentation just says "update the resource"
- Side effects discovered during testing, not documented
- Business logic in PATCH handlers goes beyond field updates

### Why Harmful
Clients are unaware of the consequences of their requests. A simple "change status" call may charge a credit card or send a legal notification. This creates business risk and legal liability.

### Real-World Consequences
A client calls `PATCH /subscriptions/42 {status: "cancelled"}` expecting to cancel. The PATCH handler also charges an early termination fee and sends a cancellation email. The client was not aware of the fee, and the customer is charged unexpectedly.

### Preferred Alternative
Use PATCH only for simple field updates without side effects. Use action endpoints (`POST /subscriptions/42/cancel`) for operations with business consequences. Document all side effects in OpenAPI.

### Refactoring Strategy
1. Audit PATCH endpoints for undocumented side effects
2. Extract complex operations to action endpoints
3. Document all side effects in OpenAPI operation descriptions
4. Add tests verifying simple PATCH updates don't trigger side effects
5. Create an action endpoint naming convention for operations with side effects

### Detection Checklist
- [ ] PATCH triggers effects beyond field update
- [ ] Side effects not documented in OpenAPI
- [ ] Clients unaware of PATCH consequences
- [ ] Business logic in PATCH handlers
- [ ] State transitions with financial or legal implications

### Related Rules/Skills/Trees
- Rule: API-DOC-002 (Side Effect Documentation)
- Skill: resource-vs-action-orientation
- Tree: api-documentation

---

## 5. Overloaded POST Endpoints

### Category
Ambiguous Behavior

### Description
A single POST endpoint that handles multiple operations — sometimes creating a resource, sometimes updating, sometimes triggering an action — based on request body fields or internal state.

### Why It Happens
"One endpoint to rule them all" — developers try to reduce endpoint count by combining create, update, and action logic into a single POST handler.

### Warning Signs
- POST endpoint has complex branching logic based on state or fields
- Same POST URL creates in one context and updates in another
- Client must understand endpoint internals to use it correctly
- POST endpoint rarely follows idempotency or caching rules
- Response format varies based on what the endpoint decided to do

### Why Harmful
Clients cannot predict what the endpoint will do. Testing is complex because the same request may produce different behaviors. Caching and idempotency are impossible because the operation is ambiguous.

### Real-World Consequences
A `POST /orders` endpoint creates an order normally, but if the body contains an `order_id`, it updates the existing order. A client sends a create request with `order_id: null` (thinking null means "no ID"), accidentally updating a different order.

### Preferred Alternative
Use separate endpoints for separate operations: `POST /orders` for creation, `PUT/PATCH /orders/{id}` for updates, `POST /orders/{id}/action` for actions.

### Refactoring Strategy
1. Split overloaded POST into separate endpoints per operation
2. Each endpoint has clear, single-purpose behavior
3. Add versioning if splitting requires URL changes
4. Update client code to use appropriate endpoints
5. Add tests for each endpoint independently

### Detection Checklist
- [ ] POST endpoint handles create AND update
- [ ] POST behavior varies by request body content
- [ ] Same URL produces different results in different contexts
- [ ] Endpoint logic has conditionals based on operation type
- [ ] Response format varies per invocation

### Related Rules/Skills/Trees
- Rule: API-DESIGN-004 (Single Responsibility Endpoints)
- Skill: resource-vs-action-orientation
- Tree: api-structure
