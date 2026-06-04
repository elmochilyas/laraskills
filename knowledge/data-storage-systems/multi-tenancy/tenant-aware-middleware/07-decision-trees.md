# 5-6 Tenant Aware Middleware - Decision Trees

## Middleware Chain Order for Tenant Initialization

---

## Decision Context

Ordering tenant-aware middleware in the global middleware pipeline — IdentifyTenant must run before SetTenantConnection, which must run before session and auth middleware.

---

## Decision Criteria

* performance: middleware adds minimal overhead per request
* architectural: tenant must be resolved before session/auth depend on it
* maintainability: tenant middleware must be early in pipeline
* security: public routes must skip tenant middleware

---

## Decision Tree

Where should tenant middleware run?

↓

Does the route need tenant context?

YES → Is this a web route (not API)?

    YES → IdentifyTenant → SetTenantConnection → StartSession → Authenticate
    
        ↓
        IdentifyTenant: resolve tenant from subdomain/domain/header
        SetTenantConnection: update database config, purge, reconnect
        StartSession: session may depend on tenant-specific config
        Authenticate: user scoped to tenant
        
NO → API route?

    → IdentifyTenant → Authenticate → SetTenantConnection
    API routes authenticate before setting connection
    Tenant ID may come from JWT claims

NO → Public route (login, registration, webhook)?

    → Skip tenant middleware entirely
    Use middleware exclusions: $middleware->except(['login', 'register', 'webhooks.*'])
    Public routes don't have tenant context

---

## Recommended Default

**Default:** IdentifyTenant → SetTenantConnection → (web: StartSession) → Authenticate in kernel
**Reason:** Middleware must respect dependency order. Session and auth may depend on tenant resolution. Public routes must be excluded to avoid redirect loops.

---

## CurrentTenant Singleton vs Request Attribute

---

## Decision Context

Storing the resolved tenant context for the current request — via a Laravel singleton bound in the container, or via `$request->attributes()`.

---

## Decision Criteria

* performance: both are in-memory and instant
* architectural: singleton is accessible anywhere (controllers, services, models)
* maintainability: singleton is more ergonomic; attributes are request-scoped
* security: singleton must be unset after request (Octane)

---

## Decision Tree

How to store current tenant context?

↓

Using Octane (persistent workers)?

YES → Use singleton with middleware cleanup

    ↓
    app()->singleton(CurrentTenant::class);
    Middleware: before set, after forget
    Octane workers persist across requests — must reset
    
    ↓
    CurrentTenant data object:
    - id, name, database config, feature flags
    
    ↓
    Access: app(CurrentTenant::class)->id
    Cleanup: middleware terminates → app()->forgetInstance(CurrentTenant::class)

NO → PHP-FPM (non-persistent)?

    YES → Singleton (simpler, no cleanup needed)
    
        ↓
        PHP-FPM creates new container per request
        No cross-request state to clean
        Singleton is automatically fresh per request

NO → Using request attributes?

    → $request->attributes->set('tenant', $tenant)
    More explicit, less magic
    Only accessible where Request is available
    More testable (mock the request attribute)

---

## Recommended Default

**Default:** Singleton for Octane (with middleware cleanup); singleton for PHP-FPM (no cleanup needed)
**Reason:** Singleton provides ergonomic access from any context. Octane requires explicit cleanup. Request attributes are better for testability but less convenient.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Tenant Resolution Strategies
* Implement Tenant-Aware Middleware
