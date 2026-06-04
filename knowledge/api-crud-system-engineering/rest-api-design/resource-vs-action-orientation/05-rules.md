# Resource vs Action Orientation

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: resource-vs-action-orientation
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Default To Resource Orientation
---
## Category
Architecture
---
## Rule
Always default to resource-oriented design for all endpoints — use action-oriented endpoints only when the operation cannot be expressed as CRUD, has no natural resource identity, or involves complex side effects beyond state change.
---
## Reason
Resource orientation leverages HTTP caching, idempotency, and uniform interface semantics. CRUD patterns are predictable and well-understood by all HTTP clients. Action endpoints trade these benefits for expressiveness. The decision framework should default to resource orientation and require justification for each deviation.
---
## Bad Example
```php
// Action endpoint where PATCH suffices
Route::post('users/{user}/activate', [UserController::class, 'activate']);
// Simple status change could be PATCH with { "status": "active" }
```

## Good Example
```php
// Resource-oriented state transition
Route::patch('users/{user}', [UserController::class, 'update']);
// PATCH with { "status": "active" } — simple, cacheable, idempotent
```

## Exceptions
Operations with complex side effects (cancellation with refunds, sending notifications, triggering external workflows). These benefit from explicit action endpoints that make side effects visible.

## Consequences Of Violation
Over-engineered action endpoints for simple state changes; bypassed HTTP caching for read-like operations; inconsistent API surface when some state changes use PATCH and others use POST actions with no pattern.
---

## Use PATCH For Simple State Transitions
---
## Category
Design
---
## Rule
Always use PATCH with validated status fields for simple resource state transitions — never create action endpoints for operations that only change a single field.
---
## Reason
Simple state changes (activate, deactivate, archive, mark-as-read) are field updates on a resource. PATCH with a status field correctly models this with proper HTTP semantics. Creating action endpoints for these introduces unnecessary complexity, bypasses PATCH's idempotency guarantees, and proliferates endpoints.
---
## Bad Example
```php
Route::post('users/{user}/deactivate', [UserController::class, 'deactivate']);
// Action endpoint for a single field change
```

## Good Example
```php
Route::patch('users/{user}', [UserController::class, 'update']);
// Controller validates the state transition
$validated = $request->validate([
    'status' => 'required|in:active,inactive',
]);
$user->update($validated);
```

## Exceptions
When the state transition triggers side effects beyond changing the field (e.g., deactivating a user triggers session invalidation, email notification, and billing pause). In that case, an action endpoint makes the side effects explicit.

## Consequences Of Violation
Endpoint proliferation from one endpoint per state; inconsistent pattern (some transitions are PATCH, others are POST); clients must learn individual action endpoints instead of using standard update patterns.
---

## Use Action Endpoints For Operations With Side Effects
---
## Category
Architecture
---
## Rule
Always use explicit action endpoints (POST) for operations that trigger side effects beyond the resource state change — never hide side effects inside PATCH or PUT handlers.
---
## Reason
A PATCH that changes `status` to `cancelled` implies "just change the field." If cancellation also triggers refund processing, inventory restoration, and email notification, those side effects are hidden from the client. An action endpoint `POST /orders/{order}/cancel` makes the side effects explicit in the endpoint name, allowing clients to understand the operation's scope.
---
## Bad Example
```php
// PATCH hides cancellation side effects
Route::patch('orders/{order}', [OrderController::class, 'update']);
// Client sends { "status": "cancelled" }
// Controller also processes refund, restores inventory — hidden side effects
```

## Good Example
```php
// Action endpoint makes side effects explicit
Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);
// Client knows cancellation involves more than status change
public function cancel(Order $order)
{
    $order->cancel(); // encapsulates refund, inventory, notification
    return new OrderResource($order);
}
```

## Exceptions
Side effects that are universally implied by the state change (e.g., "shipped" implies inventory deduction). Document implied side effects in the endpoint description.

## Consequences Of Violation
Hidden side effects surprise clients; audit trails cannot distinguish "update any field" from "cancel order"; testing complexity increases when one endpoint handles both simple and complex operations.
---

## Nest Action Endpoints Under Their Related Resource
---
## Category
Code Organization
---
## Rule
Always nest action endpoints under their related resource path (`/orders/{order}/cancel`) — never use top-level action paths (`/cancel-order`) for operations that belong to a specific resource.
---
## Reason
Nesting under the resource provides context for the action. `/orders/{order}/cancel` clearly communicates "cancel this specific order." A top-level `/cancel-order` requires additional parameters to identify the resource, and scatters action endpoints across the URL namespace. Nesting keeps actions grouped with their resources.
---
## Bad Example
```php
// Top-level action — no resource context
Route::post('cancel-order', [OrderController::class, 'cancel']);
// Requires order ID in body — implicit resource reference
```

## Good Example
```php
// Nested under resource — clear context
Route::post('orders/{order}/cancel', [OrderController::class, 'cancel']);
// Resource identified in path — explicit and discoverable
```

## Exceptions
Operations that don't belong to a single resource (system-wide actions, maintenance operations, batch operations across resources). These naturally live at a higher level.

## Consequences Of Violation
Scattered action endpoints with no organizational pattern; unclear resource context for operations; clients must parse action names to guess which resource they apply to.
---

## Use Single-Action Controllers For Action Endpoints
---
## Category
Code Organization
---
## Rule
Always use single-action controllers (with `__invoke`) for action-oriented endpoints — never add action methods to existing resource controllers.
---
## Reason
Mixing CRUD methods with action methods in the same controller violates the Single Responsibility Principle and creates large, hard-to-maintain controllers. Single-action controllers keep each operation in its own class with focused dependencies, easier testing, and clear naming that matches the endpoint.
---
## Bad Example
```php
// Mixed CRUD and action methods in one controller
class OrderController extends Controller
{
    public function index() { ... }
    public function store() { ... }
    public function cancel(Request $request, Order $order) { ... } // action mixed with CRUD
    public function refund(Request $request, Order $order) { ... } // another action
}
```

## Good Example
```php
// Single-action controller for cancel
class CancelOrderController extends Controller
{
    public function __invoke(Order $order)
    {
        $order->cancel();
        return new OrderResource($order);
    }
}

// Route
Route::post('orders/{order}/cancel', CancelOrderController::class);
```

## Exceptions
When the action is trivial (2-3 lines) and creating a separate controller feels like over-engineering. Inline the action in the route's closure or use a dedicated method with a clear docblock.

## Consequences Of Violation
Bloated resource controllers; hard-to-test mixed responsibilities; unclear boundaries between CRUD and actions; naming collisions when action names are also CRUD terms.
---

## Use GET For Read-Only Action Endpoints
---
## Category
Performance
---
## Rule
Always use GET for read-only action endpoints (search, reports, summaries) — never use POST for operations that don't modify server state.
---
## Reason
GET is cacheable by HTTP intermediaries; POST is not. Read-only actions that use POST bypass all caching infrastructure, increasing server load and latency. GET with query parameters handles search and report generation. Only switch to POST when query complexity exceeds URL length limits.
---
## Bad Example
```php
// POST for read-only report generation
Route::post('reports/summary', [ReportController::class, 'summary']);
// Not cacheable — unnecessary server load for repeated reports
```

## Good Example
```php
// GET for read-only report
Route::get('reports/summary', [ReportController::class, 'summary']);
// GET /reports/summary?period=2026-06&department=sales
// Cacheable — CDN can serve repeated requests
```

## Exceptions
When the query complexity exceeds URL length limits (~2KB-8KB). Use POST and add `Cache-Control` headers to enable response caching at the application level.

## Consequences Of Violation
Uncached read-heavy endpoints increase server load; CDN cannot cache report responses; mobile clients consume more data on repeated requests; higher latency for common queries.
---

## Document Side Effects For Action Endpoints
---
## Category
Maintainability
---
## Rule
Always document all side effects of action endpoints in OpenAPI operation descriptions — never leave clients unaware of external operations triggered by an endpoint.
---
## Reason
Action endpoints by definition do more than change resource state — they trigger refunds, send emails, call webhooks, update inventory. Clients need to know about these side effects to understand the full impact of calling the endpoint. Undocumented side effects lead to surprise charges, unintended notifications, and support tickets.
---
## Bad Example
```php
/**
 * Cancel an order.
 * @bodyParam ... No mention of refunds, notifications, or inventory effects
 */
Route::post('orders/{order}/cancel', ...);
```

## Good Example
```php
/**
 * Cancel an order and process refund.
 * Side effects:
 * - Processes full refund to original payment method
 * - Sends cancellation email to customer
 * - Restores inventory quantities
 * - Updates subscription status if applicable
 */
Route::post('orders/{order}/cancel', ...);
```

## Exceptions
When side effects are universally understood for the operation name (sending an email for "send" action). Even then, documenting them prevents assumptions.

## Consequences Of Violation
Client surprise from unexpected charges or emails; support tickets from confused customers; integration tests that don't account for side effects; compliance issues from undocumented data processing.
---

## Use Batch Action Endpoints For Multi-Resource Operations
---
## Category
Architecture
---
## Rule
Always use batch action endpoints (`POST /resources/batch/{action}`) for operations affecting multiple resources — never require clients to send N individual requests.
---
## Reason
Individual requests for batch operations create N round-trips, N authentication checks, and N database transactions, multiplying latency and failure points. A single batch request with an array of resource identifiers processes in one round-trip with a single transaction, reducing latency and improving atomicity.
---
## Bad Example
```php
// Client must send 1000 individual DELETE requests to clear a queue
DELETE /items/1
DELETE /items/2
// ... 998 more requests
```

## Good Example
```php
// Single batch request
POST /items/batch/delete
{ "ids": [1, 2, 3, ..., 1000] }
```

## Exceptions
When the batch operation requires individual authorization per item and cannot be batch-authorized. Even then, consider batch endpoint with per-item status responses (207 Multi-Status).

## Consequences Of Violation
N round-trips instead of 1; multiplied authentication overhead; no atomicity across the batch; increased network congestion and latency.
---

## Apply The Decision Framework Before Creating Action Endpoints
---
## Category
Architecture
---
## Rule
Always apply the four-question decision framework before creating an action endpoint: (1) Can it be expressed as CRUD? (2) Does it have a clear resource identity? (3) Is it idempotent? (4) Is it a simple state change? — if 3+ answers are yes, use resource orientation.
---
## Reason
The decision framework prevents both over-engineering (action endpoints for simple status changes) and under-engineering (force-fitting complex workflows into CRUD). It provides a repeatable, objective criterion that any team member can apply consistently.
---
## Bad Example
```php
// Action endpoint created without framework — should have been PATCH
Route::post('users/{user}/mark-as-read', [UserController::class, 'markAsRead']);
// Decision: CRUD? Yes (update). Identity? Yes. Idempotent? Yes. Simple? Yes. = Resource-oriented
```

## Good Example
```php
// Framework applied correctly
// Cancel order: CRUD? No (side effects). Identity? Yes (order). Idempotent? No (refund once). Simple? No (complex workflow). = Action-oriented
Route::post('orders/{order}/cancel', CancelOrderController::class);
```

## Exceptions
When experience dictates that the framework's recommendation is wrong for the specific use case. Document the exception and the reasoning.

## Consequences Of Violation
Inconsistent endpoint design across the API; unnecessary action endpoints; force-fit CRUD for complex workflows; no repeatable decision process for new endpoints.
---
