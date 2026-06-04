# Standardized Knowledge: Channel Authorization (routes/channels.php)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Channel Types & Authorization |
| Knowledge Unit ID | K12 |
| Knowledge Unit | Channel Authorization (routes/channels.php) |
| Difficulty | Intermediate |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

Channel authorization in Laravel is configured in `routes/channels.php`, where `Broadcast::channel()` registers authorization callbacks for private and presence channels. Each callback receives the authenticated user and any wildcard parameters extracted from the channel name. The callback must return a truthy value for the subscription to be authorized. For presence channels, the callback must return an array with user data. The `Broadcast::routes()` method registers the `/broadcasting/auth` endpoint that invokes these callbacks. Channel patterns support wildcard parameters via `{param}` syntax.

## Core Concepts

Authorization happens at subscription time: when Echo calls `Echo.private('orders.123')`, it POSTs to `/broadcasting/auth` with `channel_name=private-orders.123`. Laravel extracts the channel name without prefix, matches it against registered patterns in `routes/channels.php`, extracts parameters, and calls the matching callback. The callback receives the authenticated `$user` and extracted parameters. If callback returns truthy, the subscription proceeds; if falsy, the client receives a 403.

The `Broadcast::routes()` method registers a `POST /broadcasting/auth` route with the `web` and `auth` middleware. `BroadcastController::authenticate()` strips the prefix, matches patterns, extracts parameters, and invokes the callback.

## When To Use

- All applications using private or presence channel broadcasting
- Applications needing granular per-channel access control beyond simple authentication
- Multi-tenant applications where channel access must be scoped per tenant
- API-driven applications using Sanctum, Passport, or JWT authentication

## When NOT To Use

- Public-only broadcasting applications (no private/presence channels)
- Applications where all authenticated users have equal access to all channels (use a blanket callback)

## Best Practices (WHY)

- **Dedicated routes file**: Separating channel auth from HTTP routes keeps concerns isolated and maintainable
- **Wildcard parameter extraction**: `Broadcast::channel('orders.{orderId}', fn($user, $orderId) => ...)` automatically extracts parameters without manual parsing
- **Model binding**: Type-hinting models in callbacks enables automatic model resolution via route-model binding
- **Gate/policy delegation**: Delegating complex authorization to gates or policies keeps callbacks simple and testable
- **Custom guard support**: Use `['guards' => ['sanctum']]` for API-driven apps where session auth is unavailable

## Architecture Guidelines

- `Broadcast::routes()` should be called inside a route group with proper rate limiting middleware
- Place `Broadcast::routes()` in a separate service provider or in `routes/channels.php`
- Pattern matching supports regex constraints: `'orders.{id}'` with `->where('id', '[0-9]+')`
- Register broader patterns before narrower ones to ensure correct matching order
- Handle auth failures gracefully—log them, don't silently swallow

## Performance Considerations

- Auth endpoint should be fast (<50ms typical); database queries in callbacks add latency for every subscription
- Reconnection storms trigger mass auth requests—optimize callbacks aggressively
- Model route-model binding adds a database query per auth request
- Use simple ID comparisons where possible; avoid complex permission checks in hot auth paths
- No built-in caching; developers must implement caching manually for repeated authorizations

## Security Considerations

- Unmatched channel patterns result in a 403—not a 404—to avoid channel name enumeration
- Callback exceptions result in 500 errors, blocking all subscriptions to that channel pattern
- Pattern conflicts (e.g., `orders.{id}` and `orders.{slug}` both matching the same channel) can cause authorization bypass
- Session expiry between page load and auth call results in failed subscription despite valid credentials
- Guard misconfiguration causes all private channel subscriptions to fail silently

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Forgetting `Broadcast::routes()` | Omission in service provider or channels file | 404 on auth endpoint; all private subscriptions fail | Verify `Broadcast::routes()` is called in `routes/channels.php` |
| Not stripping channel name prefix in callback | Assuming prefix is passed to callback | Pattern never matches because prefix is already removed | Use unprefixed channel name in `Broadcast::channel()` patterns |
| Returning entire User model from presence callbacks | Convenience | Exposes PII to all channel members | Return array with only `id` and `name` |
| Conflicting channel patterns | Registering overlapping patterns without constraints | Wrong callback or authorization bypass | Add `->where()` constraints to disambiguate |
| Not catching callback exceptions | Unhandled exceptions in auth logic | 500 errors block all subscriptions | Wrap logic in try-catch or use Gates with fallthrough |

## Anti-Patterns

- **Monolithic auth callback**: One callback handling authorization for all channels via string parsing—defeats pattern matching
- **Returning `true` unconditionally**: Allows any authenticated user access to any channel—bypasses authorization
- **Database queries in every callback**: Queries on every subscription cause cascading failures during reconnection storms
- **Auth callback in web routes file**: Mixing channel auth with HTTP routes creates confusion and maintenance issues

## Examples

```php
// routes/channels.php
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return $user->id === Order::findOrFail($orderId)->user_id;
});

// With model binding
Broadcast::channel('orders.{order}', function ($user, \App\Models\Order $order) {
    return $user->id === $order->user_id;
});

// With custom guard
Broadcast::channel('admin.alerts', function ($user) {
    return $user->hasRole('admin');
}, ['guards' => ['sanctum']]);

// Presence channel returning user data
Broadcast::channel('chat.{roomId}', function ($user, $roomId) {
    if ($user->canJoinRoom($roomId)) {
        return ['id' => $user->id, 'name' => $user->name, 'avatar' => $user->avatar_url];
    }
});
```

## Related Topics

- K11: Public/Private/Presence Channel Patterns
- K29: Private Channel Auth with JWT/Sanctum
- K36: Auth Endpoint Optimization & Caching
- K24: WebSocket Security (TLS, CORS, Auth, CSWSH)

## AI Agent Notes

- The channel name passed to `Broadcast::channel()` does NOT include the `private-` or `presence-` prefix
- Auth callbacks run in the context of a standard HTTP request with full middleware stack
- Multiple guards can be specified as an array; Laravel tries each in order until one resolves a user
- The auth endpoint is rate-limit-able via standard Laravel middleware

## Verification

- [ ] `Broadcast::routes()` is called in the application
- [ ] All private and presence channel patterns have corresponding auth callbacks
- [ ] Auth callbacks return correct truthy/falsy values for authorized/unauthorized users
- [ ] Presence channel callbacks return array with at minimum `id` field
- [ ] Custom guards resolve users correctly for API-driven requests
- [ ] Rate limiting is applied to the `/broadcasting/auth` endpoint
- [ ] No conflicting channel patterns exist in `routes/channels.php`
