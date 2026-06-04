# Resource vs Action Orientation

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: resource-vs-action-orientation
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Resource-oriented APIs model the world as nouns (resources) with a uniform set of operations via HTTP methods. Action-oriented (RPC-style) APIs model the world as verbs (operations) with arbitrary endpoints that invoke specific behavior. The choice between these paradigms is the most fundamental API design decision because it determines URL structure, method usage, status code selection, and client integration patterns.

The most successful production APIs are pragmatic hybrids — resource-oriented for the core domain model with carefully justified action endpoints for operations that cross resource boundaries or have no natural resource representation.

## Core Concepts
- **Resource Orientation**: Everything is a resource identified by a URI. Operations limited to HTTP methods (GET, POST, PUT, PATCH, DELETE). Actions become sub-resources or resource state changes.
- **Action Orientation (RPC)**: Endpoints represent operations. HTTP methods are typically POST. URIs read as verb phrases: `/users/activate`, `/reports/generate`.
- **State Transition via PATCH**: `PATCH /orders/42` with `{status: "cancelled"}` — pure REST approach to changing resource state.
- **Action as Sub-resource**: `POST /orders/42/cancel` — action-like but modeled as child resource. Pragmatic REST.
- **Controller Resources**: Singletons that don't fit CRUD — `/profile`, `/settings`. Still resource-oriented.
- **Batch Operations**: `POST /users/batch/activate` — inherently action-oriented because they span multiple resources.

## When To Use
- **Resource orientation**: Core CRUD operations, stable domain models, read-heavy operations benefiting from HTTP caching
- **Action orientation**: Operations crossing resource boundaries, operations with no natural resource representation, complex business workflows with side effects, legacy system integration
- **State transition via PATCH**: Simple state changes on existing resources (status updates, flag toggles)
- **Action as sub-resource**: Operations with business rules beyond simple state changes (cancellation with refunds, notifications)

## When NOT To Use
- **Force-fitting all operations into CRUD**: Produces unnatural abstractions. Some operations are actions — model them as such.
- **POST for everything action-oriented**: Loses all HTTP semantics. Use GET for read-only action endpoints (search).
- **Mixed paradigm without documentation**: Some endpoints pure REST, others RPC, with no pattern. Confuses clients.
- **Action endpoints for simple state changes**: `POST /orders/42/cancel` when `PATCH /orders/42 {status: "cancelled"}` suffices.
- **Resource endpoints for operations with non-standard response behaviors**: If the response doesn't match the resource representation, it's probably an action.

## Best Practices (WHY)
- **Default to resource orientation**: CRUD patterns are predictable and leverage HTTP caching and idempotency naturally. Use the decision framework: can the operation be expressed as Create/Read/Update/Delete? Does it have a clear resource identity? Is it idempotent?
- **Use action endpoints for operations with side effects**: When a state change triggers external effects (refunds, emails, inventory updates), an action endpoint makes the side effects explicit. A simple PATCH implies "just change the field."
- **Use clear verb names for action endpoints**: `POST /invoices/{invoice}/send`, `POST /reports/generate`. Avoid ambiguous names like `POST /invoices/{invoice}/process`.
- **Keep action endpoints under their related resource**: `POST /users/{user}/restore` is better than `POST /restore-user`. The path conveys the context.
- **Document resource vs action endpoints clearly**: Specify which endpoints are standard CRUD and which are action endpoints with custom behavior.

## Architecture Guidelines
- Use `Route::apiResource()` for resource-oriented CRUD. Add action endpoints as explicit POST routes alongside resource routes.
- For simple state transitions, prefer PATCH with validated status fields. Reserve action endpoints for operations with side effects beyond state change.
- Use single-action controllers (`__invoke`) for action-oriented endpoints — keeps each operation in its own class.
- Batch operations are action-oriented by nature — use `POST /resources/batch/{action}` with clear naming.
- Search endpoints: prefer GET with query parameters. Switch to POST only when query complexity exceeds URL length limits.

## Performance
- Resource-oriented GET endpoints can be cached at CDN and reverse proxy levels — significant performance advantage.
- Action-oriented POST endpoints are not cacheable by HTTP intermediaries. Convert read-heavy action endpoints to resource orientation where possible.
- Batch action endpoints can process operations in a single transaction, reducing round-trips compared to multiple individual requests.
- Resource-oriented APIs produce more predictable OpenAPI specs and better SDK generation — reducing integration effort.

## Security
- Action endpoints with side effects must have strict authorization checks — the verb nature may hide the impact from casual review.
- Batch action endpoints must validate every item individually — a single item failure should not roll back the entire batch unless atomicity is required.
- Action endpoints that accept arbitrary parameters are more vulnerable to parameter injection — validate rigorously.
- PATCH for state transitions must validate that the requested state transition is valid (e.g., cannot cancel a shipped order).

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Force-fitting all ops into CRUD | Modeling complex workflows as resource state changes | Wanting "pure REST" | Awkward abstractions, multi-step workarounds | Accept action endpoints for complex operations |
| POST for everything action-oriented | All action endpoints use POST even for reads | POST is the most flexible method | Loses caching, idempotency, safety guarantees | Use GET for read-only action endpoints |
| Leaking implementation as resources | Exposing DB operations as API resources | Convenient mapping to CRUD | API exposes internal concerns, not domain | Design resources around the domain, not the database |
| Dual-nature endpoints | Single endpoint serving both resource and action purposes | Combining create-and-send, or save-and-publish | Hidden state machines; clients can't predict behavior | Split into separate resource and action endpoints |
| Inconsistent paradigm across API | Some resources pure REST, others RPC with no pattern | Ad-hoc decisions per developer | Clients must learn per-endpoint behavior | Establish style guide with clear decision criteria |
| Action endpoint without side effect documentation | POST endpoint that triggers complex workflows without documentation | Focus on response body | Clients unaware of side effects (emails, charges) | Document side effects in OpenAPI operation description |

## Anti-Patterns
- **Pure REST Dogma**: Forcing all operations into CRUD creates unnatural abstractions. Accept action endpoints.
- **RPC with No Pattern**: Action endpoints scattered without structure. Keep them under their related resource.
- **POST for Reads**: Using POST for search when GET with query parameters works. Loses caching.
- **Hidden State Machines**: PATCH that triggers complex side effects without documentation.
- **Overloaded POST Endpoints**: Single POST endpoint that sometimes creates, sometimes updates, sometimes performs actions.

## Examples
```php
// Resource-oriented CRUD (default)
Route::apiResource('orders', OrderController::class);

// Action-oriented endpoint alongside resource
Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);

// Resource-oriented state transition (PATCH)
public function update(Request $request, Order $order)
{
    $validated = $request->validate([
        'status' => 'required|in:confirmed,shipped,delivered',
    ]);
    $order->update($validated);
    return new OrderResource($order);
}

// Action-oriented with single-action controller
Route::post('invoices/{invoice}/send', SendInvoiceController::class);

// Batch action endpoint
Route::post('users/batch/activate', [UserBatchController::class, 'activate']);

// Decision framework per endpoint:
// 1. Can it be expressed as Create/Read/Update/Delete?
// 2. Does it have a clear resource identity?
// 3. Is it idempotent?
// 4. Is it a simple state change?
// If 3+/4 yes → resource-oriented. Otherwise → consider action-oriented.
```

## Related Topics
- **Prerequisites**: rest-architectural-constraints, url-structure-design, http-method-semantics
- **Related**: resourceful-routing, resource-naming-conventions, rest-purity-vs-pragmatic
- **Advanced**: cqrs-command-pattern, graphql

## AI Agent Notes
- Default to resource orientation for all endpoints. Use action endpoints only for operations with complex side effects.
- Prefer PATCH for state transitions — use action endpoints when side effects go beyond state change.
- Use `Route::apiResource()` for CRUD; add action endpoints as explicit POST routes.
- Use single-action controllers (`__invoke`) for action endpoints.
- Document action endpoints with clear descriptions of side effects.
- Batch operations are action-oriented by nature — use `POST /resources/batch/{action}`.

## Verification
- CRUD operations use resource-oriented endpoints with standard HTTP methods.
- Action endpoints have clear verb names and are nested under their related resource.
- Action endpoints are justified — simple state changes use PATCH instead.
- All action endpoints document their side effects in OpenAPI.
- GET is used for read-heavy action endpoints where possible (search, reports).
- The API follows a consistent paradigm — resources or actions are not mixed arbitrarily.
