# Decomposition: Channel Authorization Routes Channels Php

## Topic Overview
Channel authorization in Laravel is configured in `routes/channels.php`, where `Broadcast::channel()` registers authorization callbacks for private and presence channels. Each callback receives the authenticated user and any wildcard parameters extracted from the channel name. The callback must return a truthy value (boolean, array, or model) for the subscription to be authorized. For presence channels, the callback must return an array with user data (at minimum `id` and `name`). The `Broadc...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
channel-types-authorization/K12-channel-authorization-routes-channels-php/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Channel Authorization Routes Channels Php
- **Purpose:** Channel authorization in Laravel is configured in `routes/channels.php`, where `Broadcast::channel()` registers authorization callbacks for private and presence channels. Each callback receives the authenticated user and any wildcard parameters extracted from the channel name. The callback must return a truthy value (boolean, array, or model) for the subscription to be authorized. For presence channels, the callback must return an array with user data (at minimum `id` and `name`). The `Broadc...
- **Difficulty:** Intermediate
- **Dependencies:
  - K11: Public/Private/Presence Channel Patterns
  - K29: Private Channel Auth with JWT/Sanctum
  - K36: Auth Endpoint Optimization & Caching
  - K24: WebSocket Security (TLS, CORS, Auth, CSWSH)

## Dependency Graph
**Depends on:**
  - K11: Public/Private/Presence Channel Patterns
  - K29: Private Channel Auth with JWT/Sanctum
  - K36: Auth Endpoint Optimization & Caching
  - K24: WebSocket Security (TLS, CORS, Auth, CSWSH)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Wildcard parameter extraction**: `Broadcast::channel('orders.{orderId}', fn($user, $orderId) => ...)` automatically extracts parameters**Model binding in callbacks**: Callbacks can type-hint models for parameter resolution (e.g., `Order $order`)**Gate/policy integration**: Callbacks commonly delegate to authorization gates or policies for complex logic**Custom guard support**: Use `Broadcast::channel('...', ..., ['guards' => ['sanctum']])` for API-driven apps**Dedicated routes file**: Separation of concerns—channel auth logic lives in its own file, not mixed with HTTP routes**Callback-based authorization**: Flexible—any logic can be represented, from simple ID checks to complex permission trees**Pattern matching over explicit channel map**: Supports dynamic channel names without configuration per-instance**Auth endpoint latency**: Each private channel subscription adds HTTP round-trip; at scale, auth caching becomes necessary**Pattern matching overhead**: With many registered patterns, matching adds marginal CPU cost per subscription**No built-in caching**: Callbacks execute on every subscription; no framework-level caching for repeated authorizations**Callback exceptions**: Unhandled exceptions in callbacks result in 500 errors, blocking all subscriptions to that channelAuth endpoint should be fast (typically <50ms); database queries in callbacks add latency for every subscriptionReconnection storms trigger mass auth requests; optimize callbacks and consider caching authorization decisionsModel route-model binding adds a database query per auth request; eager load relationships if neededUse simple ID comparisons where possible; avoid complex permission checks in hot auth pathsPlace `Broadcast::routes()` inside a route group with proper rate limiting middlewareSet `authEndpoint` in Echo config to point to the correct URL (usually `/broadcasting/auth`)Configure `auth.headers` in Echo to send CSRF token and authentication credentialsUse custom guards for API-driven apps (`Sanctum`, `Passport`, JWT)Add rate limiting to `/broadcasting/auth` to prevent abuse and mitigate reconnection stormsMonitor auth endpoint response times and error rates via Laravel Pulse or APMForgetting to call `Broadcast::routes()` resulting in a 404 for the auth endpointNot stripping the channel name prefix in the callback (the prefix is already removed before matching)Returning the entire user model from presence channel callbacks instead of a minimal data arrayUsing `Exception` or `AuthenticationException` references without importing the classRegistering channel patterns that conflict (e.g., `orders.{id}` and `orders.{slug}` can both match the same channel)**Unmatched channel**: No pattern matches the requested channel; client receives 403**Callback exception**: Exception in callback causes 500; all subscriptions to that pattern fail**Model binding failure**: Route model binding throws ModelNotFoundException; subscription fails**Session expiry**: User's session expires between page load and auth call; subscription fails despite valid credentials**Guard misconfiguration**: Auth guard fails to resolve user; all private channel subscriptions failUsed by all Laravel applications with private or presence channel broadcastingIntegrated with Laravel's auth system (web guard by default)Supports Sanctum, Passport, and custom guards for API authenticationWorks with Inertia.js applications through standard auth middlewareUsed by Laravel Notifications for the user-specific notification channelK11: Public/Private/Presence Channel PatternsK29: Private Channel Auth with JWT/SanctumK36: Auth Endpoint Optimization & CachingK24: WebSocket Security (TLS, CORS, Auth, CSWSH)

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization