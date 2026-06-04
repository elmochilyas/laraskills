# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Channel Types & Authorization
**Knowledge Unit:** Channel Authorization (routes/channels.php)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Auth callback complexity: simple vs gate/policy delegation | maintainability |
| 2 | Model binding vs manual parameter resolution | performance |
| 3 | Guard configuration: single vs multi-guard | security |

---

# Architecture-Level Decision Trees

---

## Auth Callback Complexity

---

## Decision Context

Whether to implement authorization logic directly in the callback or delegate to Gates/Policies.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Authorization logic involves more than a simple ID comparison?
↓
YES → Logic shared with other authorization contexts (HTTP controllers, policies)?
    ↓
    YES → **Delegate to Gate/Policy** — single source of truth for authorization
    NO → Complex but unique to channel auth?
        ↓
        YES → **Delegate to Gate** for testability and separation
        NO → Simple ID comparison
NO → **Simple callback** — `$user->id === (int) $orderId`

---

## Rationale

Auth callbacks should be minimal and fast. Complex permission trees (role checks, team membership, multi-tenant scoping) belong in dedicated authorization classes that can be unit-tested independently.

---

## Recommended Default

**Default:** Simple callbacks for straightforward authorization; delegate to Gates for complex logic
**Reason:** Auth callbacks execute on every subscription; keeping them fast prevents subscription bottlenecks.

---

## Risks Of Wrong Choice

Inline complex logic makes callbacks untestable and slow; subscription latency degrades under load.

---

## Related Rules

Keep Auth Callbacks Minimal and Fast

---

## Related Skills

Authorize Private and Presence Channels in routes/channels.php

---

---

## Model Binding vs Manual Parameter Resolution

---

## Decision Context

Whether to use implicit route-model binding in auth callbacks or manually resolve parameters.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Auth callback needs to query the database to check authorization?
↓
YES → Accepting the database query cost per subscription?
    ↓
    YES → **Use model binding** — cleaner code, automatic 404 for missing models
    NO → **Use simple ID comparison** — avoid query entirely if possible
NO → Authorization determined by ID comparison alone?
    ↓
    YES → **Manual parameter resolution** — no database query needed
    NO → **Use model binding** with caching

---

## Rationale

Model binding adds an automatic database query on every auth request. For simple ID comparisons, this is wasteful. For complex authorization needing model data, binding is cleaner but should be cached.

---

## Recommended Default

**Default:** Manual ID comparison without model binding
**Reason:** Auth callbacks are hot paths — minimizing database queries prevents bottlenecks during reconnection storms.

---

## Risks Of Wrong Choice

Model binding on every auth request creates database load proportional to subscription rate. During reconnection storms, this compounds into cascading database failure.

---

## Related Rules

Minimize Database Queries in Auth Callbacks

---

## Related Skills

Authorize Private and Presence Channels in routes/channels.php

---

---

## Guard Configuration: Single vs Multi-Guard

---

## Decision Context

Which authentication guards to use for channel authorization.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Application serves both web (session) and API (token) clients?
↓
YES → **Multi-guard** — `['guards' => ['sanctum', 'web']]` — resolves both
NO → API-only application?
    ↓
    YES → **Sanctum guard** for SPA/API tokens
    NO → Session-only web application?
        ↓
        YES → **Default web guard** — no guard config needed
        NO → OAuth2 API?
            ↓
            YES → **Passport guard**

---

## Rationale

Channel auth resolves the authenticated user via the guard before calling the authorization callback. Multi-guard configuration enables a single auth endpoint to serve both session-based web clients and token-based API clients.

---

## Recommended Default

**Default:** Multi-guard `['sanctum', 'web']` for modern Laravel applications
**Reason:** Supports both session (Inertia/Livewire) and API (SPA/mobile) clients through the same channel auth endpoint.

---

## Risks Of Wrong Choice

Single guard configuration blocks API clients from private channels if the wrong guard is configured. Missing guard config defaults to `web`, causing silent 401s for token-authenticated clients.

---

## Related Rules

Always Configure Guards Option for API-Driven Applications

---

## Related Skills

Configure Private Channel Auth with JWT/Sanctum
