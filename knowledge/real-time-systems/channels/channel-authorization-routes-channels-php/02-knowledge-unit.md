# Metadata
Domain: Real-Time Systems
Subdomain: Channel Types & Authorization
Knowledge Unit: Channel Authorization (routes/channels.php)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Channel authorization in Laravel is configured in `routes/channels.php`, where `Broadcast::channel()` registers authorization callbacks for private and presence channels. Each callback receives the authenticated user and any wildcard parameters extracted from the channel name. The callback must return a truthy value (boolean, array, or model) for the subscription to be authorized. For presence channels, the callback must return an array with user data (at minimum `id` and `name`). The `Broadcast::routes()` method registers the `/broadcasting/auth` endpoint that invokes these callbacks. Channel patterns support wildcard parameters via `{param}` syntax, with optional constraints via regular expressions.

## Core Concepts
Authorization happens at subscription time: when Echo calls `Echo.private('orders.123')`, it POSTs to `/broadcasting/auth` with `channel_name=private-orders.123`. Laravel extracts the channel name without prefix (`orders.123`), matches it against registered patterns in `routes/channels.php`, extracts parameters (`123` as `{orderId}`), and calls the matching callback. The callback receives the authenticated `$user` and the extracted `$orderId`. If callback returns truthy, the subscription proceeds; if falsy, the client receives a 403.

## Mental Models
Each `Broadcast::channel()` registration is a guard for a specific channel pattern. The guard inspects who you are (`$user`) and what you're trying to access (channel parameters) and decides yes or no.

## Internal Mechanics
`Broadcast::routes()` is typically called in `routes/channels.php` and registers a `POST /broadcasting/auth` route with the `web` and `auth` middleware. When a request arrives, `BroadcastController::authenticate()` extracts the channel name, strips the `private-` or `presence-` prefix, iterates through registered channel patterns to find a match, extracts parameters from the channel name using the pattern, and invokes the callback with `$user` and extracted parameters. For private channels, it returns a Pusher-compatible auth response (app key + signature). For presence channels, it additionally serializes the user data returned by the callback.

## Patterns
- **Wildcard parameter extraction**: `Broadcast::channel('orders.{orderId}', fn($user, $orderId) => ...)` automatically extracts parameters
- **Model binding in callbacks**: Callbacks can type-hint models for parameter resolution (e.g., `Order $order`)
- **Gate/policy integration**: Callbacks commonly delegate to authorization gates or policies for complex logic
- **Custom guard support**: Use `Broadcast::channel('...', ..., ['guards' => ['sanctum']])` for API-driven apps

## Architectural Decisions
- **Dedicated routes file**: Separation of concerns—channel auth logic lives in its own file, not mixed with HTTP routes
- **Callback-based authorization**: Flexible—any logic can be represented, from simple ID checks to complex permission trees
- **Pattern matching over explicit channel map**: Supports dynamic channel names without configuration per-instance

## Tradeoffs
- **Auth endpoint latency**: Each private channel subscription adds HTTP round-trip; at scale, auth caching becomes necessary
- **Pattern matching overhead**: With many registered patterns, matching adds marginal CPU cost per subscription
- **No built-in caching**: Callbacks execute on every subscription; no framework-level caching for repeated authorizations
- **Callback exceptions**: Unhandled exceptions in callbacks result in 500 errors, blocking all subscriptions to that channel

## Performance Considerations
- Auth endpoint should be fast (typically <50ms); database queries in callbacks add latency for every subscription
- Reconnection storms trigger mass auth requests; optimize callbacks and consider caching authorization decisions
- Model route-model binding adds a database query per auth request; eager load relationships if needed
- Use simple ID comparisons where possible; avoid complex permission checks in hot auth paths

## Production Considerations
- Place `Broadcast::routes()` inside a route group with proper rate limiting middleware
- Set `authEndpoint` in Echo config to point to the correct URL (usually `/broadcasting/auth`)
- Configure `auth.headers` in Echo to send CSRF token and authentication credentials
- Use custom guards for API-driven apps (`Sanctum`, `Passport`, JWT)
- Add rate limiting to `/broadcasting/auth` to prevent abuse and mitigate reconnection storms
- Monitor auth endpoint response times and error rates via Laravel Pulse or APM

## Common Mistakes
- Forgetting to call `Broadcast::routes()` resulting in a 404 for the auth endpoint
- Not stripping the channel name prefix in the callback (the prefix is already removed before matching)
- Returning the entire user model from presence channel callbacks instead of a minimal data array
- Using `Exception` or `AuthenticationException` references without importing the class
- Registering channel patterns that conflict (e.g., `orders.{id}` and `orders.{slug}` can both match the same channel)

## Failure Modes
- **Unmatched channel**: No pattern matches the requested channel; client receives 403
- **Callback exception**: Exception in callback causes 500; all subscriptions to that pattern fail
- **Model binding failure**: Route model binding throws ModelNotFoundException; subscription fails
- **Session expiry**: User's session expires between page load and auth call; subscription fails despite valid credentials
- **Guard misconfiguration**: Auth guard fails to resolve user; all private channel subscriptions fail

## Ecosystem Usage
- Used by all Laravel applications with private or presence channel broadcasting
- Integrated with Laravel's auth system (web guard by default)
- Supports Sanctum, Passport, and custom guards for API authentication
- Works with Inertia.js applications through standard auth middleware
- Used by Laravel Notifications for the user-specific notification channel

## Related Knowledge Units
- K11: Public/Private/Presence Channel Patterns
- K29: Private Channel Auth with JWT/Sanctum
- K36: Auth Endpoint Optimization & Caching
- K24: WebSocket Security (TLS, CORS, Auth, CSWSH)

## Research Notes
`Broadcast::channel()` has been stable since Laravel 5.x. The `routes/channels.php` file is auto-created by `php artisan install:broadcasting`. The `Broadcast::routes()` method accepts an array of middleware options. Custom guard support was enhanced to support `sanctum` and `passport` guards. The `receivesBroadcastNotificationsOn` method on notifiable models allows customizing the notification channel name, which affects authorization callback matching.
