# Resource vs Action Orientation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** Resource vs Action Orientation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Resource-oriented APIs model the world as nouns (resources) with a uniform set of operations via HTTP methods. Action-oriented (RPC-style) APIs model the world as verbs (operations) with arbitrary endpoints that invoke specific behavior. The choice between these paradigms is the most fundamental API design decision because it determines URL structure, method usage, status code selection, and client integration patterns.

A pure resource-oriented API expresses every operation as a CRUD-like action on a resource: `POST /users` creates, `GET /users/42` reads, `PATCH /users/42` updates. An action-oriented API expresses operations as named procedures: `POST /users/activate`, `POST /users/deactivate`, `POST /users/42/send-welcome-email`. Most production APIs sit on a spectrum between the two, using resource orientation as the default with pragmatic action endpoints where the resource model creates awkward abstractions.

In Laravel, resource controllers (`Route::resource()`) naturally enforce resource orientation by mapping standard CRUD operations to controller methods. Action-oriented endpoints require explicit route definitions and often use single-action controllers or invokable classes.

---

## Core Concepts

### Resource Orientation
- Everything is a resource identified by a URI
- Operations are limited to HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Actions that don't map to CRUD become sub-resources or resource state changes
- Example: `POST /orders/42/cancel` (cancel as a sub-resource) vs `PATCH /orders/42` with `{status: "cancelled"}`

### Action Orientation (RPC)
- Endpoints represent operations, not resources
- HTTP methods are typically POST for everything
- URIs read as verb phrases: `/users/activate`, `/reports/generate`, `/payments/refund`
- Operations can have arbitrary side effects and return results unrelated to the resource

### Hybrid Approaches
- **Action as sub-resource:** `POST /users/42/avatar` for avatar upload (action-like, but modeled as child resource)
- **State transition via PATCH:** `PATCH /orders/42` with status change (pure REST)
- **Helper endpoints:** `POST /emails/send` for email sending (action because email isn't a resource you CRUD)
- **Controller resource with custom methods:** Adding `POST /users/42/restore` alongside resourceful routes

### When Action Orientation is Appropriate
- Operations that span multiple resources (transfer, merge, batch operations)
- Operations with no natural resource representation (email sending, report generation)
- Operations that are inherently procedural (workflow transitions with complex validation)
- Legacy system integration where existing behavior is procedural

---

## Mental Models

### The "Noun vs Verb" Lens
URLs should answer "what thing?" (noun/resource) not "what action?" (verb/operation). `GET /users/42/invoices` answers "what thing?" — invoices belonging to user 42. `POST /invoices/42/send` answers "what action?" — sending invoice 42.

### The Form Analogy
Resource-oriented APIs work like a collection of forms that fit a standard envelope. You fill out the form (representation) and submit it via a standard method (HTTP verb). Action-oriented APIs work like a phone system where each extension does something different.

### The Database Operations Model
Resource-oriented APIs map to CRUD: Create (POST), Read (GET), Update (PUT/PATCH), Delete (DELETE). If the operation maps cleanly to one of these, it's a resource. If it doesn't, it's likely an action.

---

## Internal Mechanics

### Laravel Resource Controller Mapping
```php
Route::resource('users', UserController::class);
// Maps to: index, create, store, show, edit, update, destroy
```

Adding action-oriented endpoints alongside resources:
```php
Route::resource('users', UserController::class);
Route::post('users/{user}/restore', [UserController::class, 'restore'])->name('users.restore');
Route::post('users/{user}/send-verification', [UserController::class, 'sendVerification']);
```

### Single Action Controllers for Action Endpoints
```php
Route::post('emails/send', SendEmailController::class);
// App/Http/Controllers/SendEmailController.php — single __invoke method
```

### Invokable Controller Pattern
Laravel's invokable controllers (`__invoke`) are well-suited for action-oriented endpoints where the operation doesn't belong to a standard resource lifecycle.

---

## Patterns

### State Transition via PATCH (Pure REST)
```php
// Controller
public function update(Request $request, Order $order) {
    $order->update($request->validate(['status' => 'required|in:cancelled,shipped,delivered']));
    return new OrderResource($order);
}

// Route: PATCH /orders/{order}
```
Prefer this over `POST /orders/{order}/cancel`.

### Action as Controlled Sub-resource (Pragmatic REST)
```php
// Controller
public function cancel(Order $order) {
    $order->cancel(); // Domain logic with validation
    return new OrderResource($order);
}

// Route: POST /orders/{order}/cancel
```
Use when the action has business rules that don't fit a simple state update (side effects, notifications, complex validation).

### Batch Operation Endpoint (Pragmatic Action)
```php
Route::post('users/batch/activate', [UserBatchController::class, 'activate']);
Route::post('users/batch/deactivate', [UserBatchController::class, 'deactivate']);
```
Batch operations are inherently action-oriented because they span multiple resources.

### Search as Resource-Oriented Action
```php
// Pure REST: GET /users?filter[status]=active&search=john
// Pragmatic: POST /users/search (when query parameters are complex)
Route::post('users/search', [UserController::class, 'search']);
```

---

## Architectural Decisions

### Resource vs Action for Each Endpoint
Decision framework:
1. Can the operation be expressed as "Create/Read/Update/Delete [something]"?
2. Does the operation have a clear resource identity?
3. Is the operation idempotent or safe?
4. Can the operation be a state change on an existing resource?

If 3/4 answers are "yes": resource-oriented. Otherwise: consider action-oriented.

### Custom Controller Methods vs Single Action Controllers
Custom resource controller methods are appropriate when the action is tightly coupled to a resource lifecycle (restore, archive). Single action controllers are appropriate when the action crosses resource boundaries or has independent business logic (send email, generate report).

### Naming Convention for Action Endpoints
Action endpoints should use verb phrases in the URI: `POST /invoices/{invoice}/send`, `POST /reports/generate`. Avoid ambiguous names like `POST /invoices/{invoice}/process` — prefer specific verbs.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Resource orientation: predictable URL patterns | Action endpoints for non-CRUD operations feel "bolted on" | Client must know which resources have extra actions |
| Resource orientation: leverages HTTP caching naturally | Some business operations don't map to CRUD | Complex operations become multi-step REST workflows |
| Action orientation: expressive endpoint names | Inconsistent URL patterns across the API | Higher learning curve for new API consumers |
| Action orientation: natural for domain operations | Bypasses HTTP method semantics | All operations become POST — no idempotency guarantees |
| Hybrid approach: best fit for each operation | No consistent pattern for clients | API documentation becomes essential for discoverability |

---

## Performance Considerations

### Action Endpoint Caching
Action-oriented POST endpoints are not cacheable by HTTP intermediaries. Resource-oriented GET endpoints can be cached at the CDN or reverse proxy level. Converting read-heavy action endpoints to resource orientation can significantly improve caching behavior.

### Batch Action Performance
Action-oriented batch endpoints (POST /users/batch/activate) can process operations in a single transaction, reducing database round-trips compared to multiple resource-oriented requests. However, this trades granular error handling for bulk performance.

---

## Production Considerations

### API Documentation Clarity
Mixed resource/action APIs require clear documentation. Document which endpoints are resource-oriented (standard CRUD) and which are action-oriented (custom behavior). Group action endpoints under their related resource in API docs.

### Client SDK Generation
Resource-oriented APIs produce more predictable OpenAPI specifications, leading to better SDK generation. Action-oriented endpoints with varying request shapes complicate generated clients.

### Versioning Strategy
Action-oriented endpoints are more likely to change between API versions because the "action" concept evolves. Resource-oriented endpoints change less frequently because the resource model is more stable.

---

## Common Mistakes

### Force-Fitting All Operations into CRUD
Why it happens: Developers want a "pure REST API." Why it's harmful: Produces unnatural abstractions like `/users/{user}/activation` with POST for activation when the operation is clearly a procedure. Better approach: Accept that some operations are actions and model them as action endpoints with clear naming.

### Leaking Implementation Actions as Resources
Why it happens: The database operations (INSERT, SELECT, UPDATE, DELETE) map conveniently to HTTP methods. Why it's harmful: The API exposes internal implementation concerns rather than the domain model. Better approach: Design resources around the domain, not the database schema.

### Using POST for Everything in Action Orientation
Why it happens: Action endpoints default to POST since it's the most flexible method. Why it's harmful: Loses all HTTP semantics — caching, idempotency, safety. Better approach: Use GET for read-only action endpoints that are safe and idempotent (e.g., `GET /users/search?q=term`).

---

## Failure Modes

### Resource Abstraction Leak
An operation initially modeled as a resource state change (`PATCH /order {status: cancelled}`) becomes complex as cancellation logic grows (notifications, refunds, inventory restocking). The simple PATCH accumulates side effects, violating the principle of least surprise.

### Dual-Nature Endpoint Confusion
When a single endpoint serves both resource and action purposes (e.g., `POST /invoices` creates an invoice but also sends it if a flag is set), clients cannot predict behavior. This creates hidden state machines in the API.

---

## Ecosystem Usage

### Stripe API
Stripe is predominantly resource-oriented (`/customers`, `/charges`, `/invoices`) with some action endpoints (`/charges/{id}/capture`, `/invoices/{id}/send`). Action endpoints use clear verb naming and are documented as exceptions to the resource pattern.

### GitHub API
GitHub leans toward resource orientation but has many action endpoints for operations like starring (`PUT /user/starred/{owner}/{repo}`), forking (`POST /repos/{owner}/{repo}/forks`), and merging (`POST /repos/{owner}/{repo}/merges`).

### Slack API
Slack's API is predominantly action-oriented — `chat.postMessage`, `conversations.invite`, `users.lookupByEmail`. This reflects Slack's RPC heritage and aligns with their operation-focused domain.

---

## Related Knowledge Units

### Prerequisites
- REST Architectural Constraints — Uniform interface constraint
- URL Structure Design — URI patterns for resource and action endpoints
- HTTP Method Semantics — Method selection for each paradigm

### Related Topics
- Resourceful Routing — Laravel's resource-oriented routing
- Resource Naming Conventions — Pluralization and path patterns
- REST Purity vs Pragmatic — When to deviate from pure REST

### Advanced Follow-up Topics
- CQRS and Command Pattern — Action-oriented architecture at the application level
- GraphQL — Query/mutation model vs resource/action

---

## Research Notes

### Source Analysis
- Fielding, Roy T. "REST APIs must be hypertext-driven." 2008 blog post clarifying that RPC-style endpoints violate REST
- Battle, R. et al. "REST vs RPC in API Design." Empirical comparison of developer productivity with each paradigm

### Key Insight
The most successful production APIs are pragmatic hybrids — resource-oriented for the core domain model with carefully justified action endpoints for operations that cross resource boundaries or have no natural resource representation.

### Version-Specific Notes
- Laravel's resourceful routing (all versions) naturally enforces resource orientation
- No framework-level change between Laravel 10-13 regarding resource vs action support
