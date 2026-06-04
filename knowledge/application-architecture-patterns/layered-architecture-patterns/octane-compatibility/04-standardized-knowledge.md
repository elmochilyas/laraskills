# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Octane compatibility considerations for layered architecture
Knowledge Unit ID: LAP-15
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Laravel Octane changes the memory model from "per-request" to "per-worker." Objects instantiated once persist across requests. This impacts layered architecture: services with request-scoped state become buggy, singletons must be stateless, and injecting user/tenant context into services creates cross-request contamination. Every architectural layer must be audited for request-scoped state.

---

# Core Concepts

- **Default Laravel**: Objects created and destroyed per request. State is safe.
- **Octane**: Application boots once. Objects persist across requests. State leaks possible.
- **Stateless**: No mutable properties — safe for Octane singletons.
- **Stateful**: Mutable properties changing during request — unsafe as singleton.
- **Request-scoped dependencies**: `$request->user()`, tenant context, locale must be fetched fresh each request.

---

# When To Use

- Any application running under Laravel Octane
- Migrating existing application to Octane
- Designing new application that may use Octane

---

# When NOT To Use

- Standard Laravel (PHP-FPM) — the per-request model makes this less critical
- Short-lived scripts or single-request contexts

---

# Best Practices

- **Bind services as transient by default.** WHY: `$this->app->bind()` (transient) creates a new instance per request. Only use `->singleton()` after auditing the class for mutable state.
- **Never store request context on service instances.** WHY: Setting `$this->user = Auth::user()` on a service means request B sees request A's user. Pass context as method parameters.
- **Use the Context object pattern.** WHY: Pass request context (user, tenant, locale) as a value object through the call chain instead of storing on services.
- **Audit all services for mutable properties before Octane migration.** WHY: Common stateful patterns — `$this->user`, `$this->tenant`, static properties — cause cross-request contamination.
- **Prefer action classes for Octane-safe operations.** WHY: Action classes with no constructor state naturally receive all input via `execute()` parameters.

---

# Architecture Guidelines

- Domain entities should receive context as method parameters, not via injected services.
- Stateless service pattern: all dependencies injected in constructor; all request-specific data passed as method parameters.
- Factory pattern for request-scoped services: use closure factory to create instances with per-request configuration.
- Transient service binding creates more GC pressure but is safe — profile before optimizing singleton vs. transient.

---

# Performance Considerations

- Octane's performance benefit comes from avoiding framework bootstrap per request — stateless services support this.
- Transient binding creates more objects per request (GC pressure) vs. singleton (shared instance).
- Performance difference between singleton and transient is typically negligible — profile before optimizing.

---

# Security Considerations

- Stateful services under Octane can cause user data leaks across requests.
- Multi-tenant applications are especially vulnerable — tenant context on singleton services leaks tenant A data to tenant B.

---

# Common Mistakes

1. **Storing `Auth::user()` in constructor.** Cause: convenience — capturing context at injection time. Consequence: captures user from first request on that worker, not current request. Better: fetch user fresh in each method call.

2. **Using singletons for everything.** Cause: habit from traditional Laravel. Consequence: safe in per-request model, breaks under Octane. Better: default to transient.

3. **Static state on service classes:** `public static $currentUser`. Cause: convenience for global access. Consequence: globally shared across all requests on same worker. Better: pass context explicitly.

4. **Silent corruption:** Stateful services work in development (single request) but fail intermittently in production (Octane, multiple requests per worker). Cause: undiscovered during testing. Consequence: intermittent, hard-to-reproduce bugs.

---

# Anti-Patterns

- **User data leak**: Request A creates invoice as Admin User A. Request B (same worker) uses User A's identity.
- **Tenant cross-contamination**: Multi-tenant app with tenant context on singleton leaks data.
- **Singleton-as-default**: Binding all services as singletons without audit.

---

# Examples

Safe stateless service:
```php
class CreateInvoiceUseCase {
    public function __construct(private InvoiceRepository $invoices, private EventBus $events) {}
    public function execute(CreateInvoiceDto $dto, User $user): Invoice {
        $invoice = Invoice::create($user, ...);
        $this->invoices->save($invoice);
        return $invoice;
    }
}
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-06 Application layer | SLP-19 Octane service state | SLP-12 Service binding strategies |
| Octane architecture basics | SLP-09 Dependency injection | SLP-18 Anemic domain model |

---

# AI Agent Notes

- Never generate service classes with mutable state (properties that change after construction).
- Pass request context (user, tenant) as method parameters, not constructor injection.
- Default to transient binding for all generated service classes.

---

# Verification

- [ ] All service classes are audited for mutable state
- [ ] No service stores `Auth::user()`, tenant, or request context as property
- [ ] Request context is passed as method parameters
- [ ] Singleton binding is only used for provably stateless classes
- [ ] Octane-specific tests verify stateless behavior
- [ ] Multi-tenant data isolation is verified under Octane
