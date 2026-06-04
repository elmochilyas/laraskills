## Rule 1: Front Controller handles all requests through a single entry point
---
## Category
Architecture
---
## Rule
All incoming HTTP requests are routed through a single handler (Front Controller) that dispatches to the appropriate action.
---
## Reason
Centralized request handling enables consistent application of cross-cutting concerns (auth, logging, routing) in one place.
---
## Bad Example
```
Each PHP file is an entry point: /public/index.php, /public/login.php, /public/orders.php
Cross-cutting logic duplicated in each file.
```
---
## Good Example
```
/public/index.php — single entry point
All requests go through the Front Controller (Laravel handles this)
```
---
## Exceptions
When there are non-HTTP entry points (CLI commands, queue workers) that have different cross-cutting concerns.
---
## Consequences Of Violation
Duplicated cross-cutting logic, security gaps, inconsistent behavior.
---
## Rule 2: Front Controller delegates request handling, not implements it
---
## Category
Architecture
---
## Rule
The Front Controller should identify the appropriate action/handler and delegate; it should not contain business logic.
---
## Reason
Business logic in the Front Controller cannot be reused and is not testable without HTTP.
---
## Bad Example
```php
// index.php
$action = $_GET['action'] ?? 'home';
if ($action === 'create_order') {
    $order = new Order(/* ... */);
    $order->save();
    // business logic in front controller
}
```
---
## Good Example
```php
// Laravel routes/web.php
Route::post('/orders', [OrderController::class, 'store']);
// Front Controller delegates to controller
```
---
## Exceptions
Middleware logic (auth, CSRF) that is genuinely cross-cutting.
---
## Consequences Of Violation
Untestable logic, HTTP coupling, logic scattered.
---
## Rule 3: Use middleware pipeline for cross-cutting concerns in Front Controller
---
## Category
Architecture
---
## Rule
Implement cross-cutting concerns (auth, logging, rate limiting, CORS) as middleware that wraps the request handling.
---
## Reason
Adding cross-cutting logic directly to the Front Controller makes it monolithic and hard to compose/test.
---
## Bad Example
```php
// Front Controller with inline cross-cutting
$user = auth_user();
if (!$user) { redirect('/login'); }
log_request();
$response = handle_request();
log_response($response);
```
---
## Good Example
```php
// Middleware pipeline
class AuthMiddleware { /* ... */ }
class LoggingMiddleware { /* ... */ }
class RateLimitMiddleware { /* ... */ }
// Applied declaratively via routing configuration
```
---
## Exceptions
When the cross-cutting concern is specific to a single route (handle it in the controller).
---
## Consequences Of Violation
Monolithic Front Controller, hard to add/remove cross-cutting concerns.
