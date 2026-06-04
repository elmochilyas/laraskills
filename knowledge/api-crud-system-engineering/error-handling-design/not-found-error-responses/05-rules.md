# Phase 5: Rules — Not Found Error Responses

## Rule: Never Include the Searched Identifier in 404 Responses
---
## Category
Security
---
## Rule
Always exclude the searched ID, slug, or any user-supplied identifier from 404 response messages and details; use only generic messages like "The requested resource was not found."
---
## Reason
Including the identifier in the response enables enumeration attacks — an attacker can test if resource 42 exists by checking if the response echoes "User #42 not found" vs. "User #99 not found."
---
## Bad Example
```php
return new ErrorEnvelope(
    ErrorCodes::USER_NOT_FOUND,
    "User #{$userId} not found.", // Enables enumeration
    404,
);
```
---
## Good Example
```php
return new ErrorEnvelope(
    ErrorCodes::USER_NOT_FOUND,
    'The requested resource was not found.', // Generic — no identifier
    404,
);
```
---
## Exceptions
Admin-only endpoints where the authenticated user has full system access and enumeration is a desired debugging feature.
---
## Consequences Of Violation
Resource enumeration vulnerability; attackers can determine valid resource identifiers; compliance audit failure for PCI DSS 6.5.5.

---

## Rule: Always Use findOrFail() Instead of find() with Manual 404
---
## Category
Framework Usage | Reliability
---
## Rule
Always use Eloquent's `findOrFail()`, `firstOrFail()`, `resolveRouteBinding()` for model lookups; never use `find()` followed by manual `abort(404)`.
---
## Reason
`findOrFail()` throws a consistent `ModelNotFoundException` that is caught by the global handler and mapped to a standard 404 envelope. Manual `abort(404)` returns a generic Symfony response without the envelope.
---
## Bad Example
```php
$user = User::find($id);
if (! $user) {
    abort(404, 'User not found'); // Response bypasses handler
}
```
---
## Good Example
```php
$user = User::findOrFail($id); // Throws ModelNotFoundException → handler → 404 envelope
```
---
## Exceptions
When the not-found response needs to differ from the standard 404 envelope (e.g., returning empty state for search results).
---
## Consequences Of Violation
Inconsistent 404 responses across the API; some endpoints return the envelope, others return raw strings or arrays; missing error code.

---

## Rule: Use Model-Specific Error Codes for Domain-Specific 404s
---
## Category
Design | Maintainability
---
## Rule
Always map `ModelNotFoundException` to a model-specific error code by switching on `class_basename($e->getModel())`; never return a single generic `NOT_FOUND` for all models.
---
## Reason
Different resource types require different client-side handling — a user 404 vs. an order 404 triggers different UI flows and support actions. Model-specific codes enable this differentiation.
---
## Bad Example
```php
$this->renderable(function (ModelNotFoundException $e, $request) {
    return response()->json(
        new ErrorEnvelope(ErrorCodes::RESOURCE_NOT_FOUND, 'Not found.', 404),
        404,
    );
    // Same code for User, Order, Payment — client can't differentiate
});
```
---
## Good Example
```php
$this->renderable(function (ModelNotFoundException $e, Request $request) {
    $model = class_basename($e->getModel());
    $code = match ($model) {
        'User' => ErrorCodes::USER_NOT_FOUND,
        'Order' => ErrorCodes::ORDER_NOT_FOUND,
        'Payment' => ErrorCodes::PAYMENT_NOT_FOUND,
        default => ErrorCodes::RESOURCE_NOT_FOUND,
    };
    return response()->json(
        new ErrorEnvelope($code, 'The requested resource was not found.', 404),
        404,
    );
});
```
---
## Exceptions
Public APIs where revealing resource type helps attackers enumerate existence; omit `resource_type` and use generic code.
---
## Consequences Of Violation
Clients cannot differentiate resource types in 404 responses; incorrect support workflows; unable to show resource-specific error UI.

---

## Rule: Map NotFoundHttpException Separately for Invalid Routes
---
## Category
Framework Usage | Code Organization
---
## Rule
Always register a separate `renderable` callback for `NotFoundHttpException` (invalid routes) with code `ROUTE.NOT_FOUND`; never conflate model 404s with route 404s.
---
## Reason
Model 404 (resource not found) and route 404 (endpoint does not exist) have different root causes and client actions. Conflating them prevents monitoring teams from distinguishing client misconfiguration from missing data.
---
## Bad Example
```php
// Model 404 and route 404 both get the same code
$this->renderable(function (ModelNotFoundException $e, $request) { /* 404 */ });
$this->renderable(function (Throwable $e, $request) { /* 500 — routes get 500 */ });
```
---
## Good Example
```php
$this->renderable(function (ModelNotFoundException $e, Request $request) {
    return $request->expectsJson()
        ? new ErrorEnvelope($this->resolveModelCode($e), 'Resource not found.', 404)
        : null;
});
$this->renderable(function (NotFoundHttpException $e, Request $request) {
    return $request->expectsJson()
        ? new ErrorEnvelope(ErrorCodes::ROUTE_NOT_FOUND, 'This endpoint does not exist.', 404)
        : null;
});
```
---
## Exceptions
No common exceptions — model and route 404s must always be distinguishable.
---
## Consequences Of Violation
Monitoring cannot distinguish client typos from missing data; both appear as the same error code in dashboards.

---

## Rule: Include resource_type in 404 Detail (Unless Hiding for Security)
---
## Category
Design | Maintainability
---
## Rule
Always include `detail.resource_type` in 404 responses indicating which model class was not found (e.g., "User", "Order"); only omit it for public APIs where resource type enumeration is a concern.
---
## Reason
The `resource_type` field tells the client what kind of resource is missing without revealing the identifier, enabling context-appropriate error UI.
---
## Bad Example
```php
// No resource_type — client doesn't know what was missing
'detail' => []
```
---
## Good Example
```php
// resource_type included for internal/private APIs
'detail' => ['resource_type' => 'User']
// For public APIs:
'detail' => [] // Omitted to prevent resource type enumeration
```
---
## Exceptions
Public APIs where revealing resource type enables enumeration of domain structure; document the security decision.
---
## Consequences Of Violation
Clients cannot show resource-specific error messages; or (if omitted without intention) clients lack context to guide users.

---

## Rule: Choose and Apply a Consistent 404 vs 403 Hiding Strategy Per Resource
---
## Category
Architecture | Security
---
## Rule
Always document and apply a consistent strategy per resource type for whether denied access returns 403 or 404; never vary the response per-endpoint for the same resource type.
---
## Reason
Inconsistent 403/404 responses across endpoints for the same resource type enable attackers to map existence by observing status code differences.
---
## Bad Example
```php
// GET /api/users/{id} returns 403 for hidden user
// PUT /api/users/{id} returns 404 for hidden user
// Inconsistency lets attacker map existence
```
---
## Good Example
```php
// Documented per-resource strategy:
// User resources: 403 for known hidden, 404 for unknown
// Payment resources: 404 always (hidden entirely)
// Applied consistently across all endpoints for each type
```
---
## Exceptions
No common exceptions — consistency must be maintained across all endpoints for each resource type.
---
## Consequences Of Violation
Resource enumeration vulnerability; attackers can determine existence of resources by testing different HTTP methods on the same endpoint.

---

## Rule: Return 404 with Archived Flag for Soft-Deleted Resources (When Authorized)
---
## Category
Design | Security
---
## Rule
Always return 404 with `detail.archived: true` for soft-deleted resources only when the authenticated user is authorized to know about archival; otherwise return a standard 404 with no archival hint.
---
## Reason
Exposing `archived: true` tells the client the resource existed but was deleted — useful for authorized users, but information leak for unauthorized users (they learn the resource once existed).
---
## Bad Example
```php
// Archived flag returned without checking authorization
'detail' => ['resource_type' => 'User', 'archived' => true]
// Unauthorized user learns the user existed
```
---
## Good Example
```php
// Authorized user sees archival detail
return response()->json(
    new ErrorEnvelope(ErrorCodes::USER_NOT_FOUND, 'Resource not found.', 404, [
        'resource_type' => 'User',
        'archived' => true, // Only for authorized users
    ]),
    404,
);
// Unauthorized user sees standard 404 without archival flag
```
---
## Exceptions
Resources with no sensitivity (public profiles); archival flag can be returned to all users.
---
## Consequences Of Violation
Soft-delete status leaks resource existence information; attackers can determine which resources have been deleted and when.

---

## Rule: Log 404s with URL and Resource Type Internally
---
## Category
Maintainability | Security
---
## Rule
Always log 404 occurrences internally with URL, resource type, and requested identifier for debugging; never include the identifier in the response to the client.
---
## Reason
Internal logging of 404 context is essential for debugging (broken links, scanner detection, client errors) without exposing the identifier to the client and enabling enumeration.
---
## Bad Example
```php
// Logged at DEBUG but not accessible internally
// Or identifier logged but also in response — security issue
```
---
## Good Example
```php
// Log internally with full context
Log::info('Resource not found', [
    'model_type' => class_basename($e->getModel()),
    'model_ids' => $e->getIds(),
    'url' => request()->fullUrl(),
    'method' => request()->method(),
    'user_id' => request()->user()?->id,
]);
// Response contains only generic message and resource_type
```
---
## Exceptions
No common exceptions — always log internally what you cannot expose in the response.
---
## Consequences Of Violation
Either security vulnerability (identifier in response) or debugging blind spot (not logging identifier internally).
