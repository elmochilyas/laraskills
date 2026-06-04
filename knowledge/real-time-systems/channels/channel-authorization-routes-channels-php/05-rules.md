## Always Register `Broadcast::routes()` with Proper Middleware
---
## Framework Usage
---
Always call `Broadcast::routes()` inside a route group with authentication and rate-limiting middleware.
---
Without middleware, the `/broadcasting/auth` endpoint is accessible to unauthenticated users and unprotected against abuse, allowing unauthorized channel subscriptions and DoS attacks.
---
```php
Broadcast::routes(); // No middleware — open to all
```
---
```php
Broadcast::routes(['middleware' => ['auth:sanctum', 'throttle:100,1']]);
```
---
Public-channel-only applications with no private/presence subscriptions. No common exceptions.
---
Unauthorized channel access; auth endpoint DoS vulnerability.

## Always Use Wildcard Parameters in Channel Patterns
---
## Design
---
Always use `{param}` wildcards in `Broadcast::channel()` patterns instead of hardcoded channel names.
---
Hardcoded channel names require a separate `Broadcast::channel()` registration for every channel instance, making the codebase unmaintainable as channels proliferate.
---
```php
Broadcast::channel('order-1', fn($u) => $u->id === 1);
Broadcast::channel('order-2', fn($u) => $u->id === 2); // Unmaintainable
```
---
```php
Broadcast::channel('orders.{orderId}', fn($user, $orderId) => $user->id === (int)$orderId);
```
---
Static channels like global announcements that have exactly one instance. No common exceptions.
---
Unmaintainable channel registrations; pattern proliferation.

## Never Return the Entire User Model from Presence Auth Callbacks
---
## Security
---
Always return only required user fields (`id`, `name`, `avatar_url`) from presence channel authorization callbacks.
---
The return value of a presence channel auth callback is broadcast to all channel members. Returning the entire User model exposes PII such as email, phone, and address to every subscriber.
---
```php
Broadcast::channel('chat.{id}', fn($user, $id) => $user); // Entire User model broadcast
```
---
```php
Broadcast::channel('chat.{id}', fn($user, $id) => [
    'id' => $user->id, 'name' => $user->name, 'avatar' => $user->avatar_url,
]);
```
---
No common exceptions; presence user data should always be minimal.
---
PII exposure to all channel members; compliance violations.

## Always Add `->where()` Constraints to Disambiguate Overlapping Patterns
---
## Security
---
Always use regex constraints on channel patterns that could overlap with other patterns.
---
Overlapping channel patterns without constraints can cause incorrect authorization callback matching, potentially granting access to unauthorized channels.
---
```php
Broadcast::channel('orders.{id}', fn($u, $id) => ...);
Broadcast::channel('orders.{slug}', fn($u, $slug) => ...); // Both match "orders.123"
```
---
```php
Broadcast::channel('orders.{id}', ...)->where('id', '[0-9]+');
Broadcast::channel('orders.{slug}', ...)->where('slug', '[a-z-]+'); // No overlap
```
---
Channel namespaces with no natural pattern overlap. No common exceptions.
---
Authorization bypass; wrong callback execution.

## Always Delegate Complex Authorization to Gates or Policies
---
## Maintainability
---
Always delegate complex authorization logic to Laravel Gates or Policies instead of inline callback logic.
---
Auth callbacks with complex permission trees, multiple role checks, and database queries become untestable monoliths. Gates and policies provide testable, reusable authorization.
---
```php
Broadcast::channel('admin.alerts', function ($user) {
    $role = $user->roles()->with('permissions')->first();
    return $role && $role->permissions->contains('name', 'view-alerts');
});
```
---
```php
Broadcast::channel('admin.alerts', fn($user) => $user->can('view-alerts'));
```
---
Simple ID comparison callbacks. No common exceptions for complex logic.
---
Untestable auth logic; code duplication; maintenance burden.

## Never Return `true` Unconditionally from Auth Callbacks
---
## Security
---
Never return `true` from a channel authorization callback without checking user authorization.
---
Returning `true` unconditionally allows any authenticated user to subscribe to any channel with a matching pattern, bypassing all authorization.
---
```php
Broadcast::channel('orders.{id}', fn($user, $id) => true); // Any user, any order
```
---
```php
Broadcast::channel('orders.{id}', fn($user, $id) => $user->id === (int)$id); // Scoped access
```
---
Global announcement channels where all authenticated users should have access. No common exceptions for sensitive channels.
---
Unauthorized data access; data leakage across user boundaries.
