# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service layer in Octane: state management considerations
Knowledge Unit ID: SLP-19
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Overview

Laravel Octane fundamentally changes assumptions about service layer state. Under Octane's persistent worker model, services are resolved once per worker, not once per request. Services with mutable properties, captured request context, or static state cause cross-request contamination. Solution: services must be stateless. All request-specific data (user, tenant) must be passed as method parameters, not stored as service properties. Default to transient binding and audit for mutable state.

---

# Core Concepts

- **Stateless service contract**: No mutable properties, no captured request context, all request data as method parameters, constructor dependencies are stateless injectable services.
- **Pure function ideal**: Service methods should produce the same result given the same arguments, regardless of when called or by which request.
- **Transient by default, singleton by proof**: Bind every service as transient unless provably stateless.

---

# When To Use

- Every application running under Octane (or planning to).
- Applications using FPM that may migrate to Octane later (build stateless from start).

---

# When NOT To Use

- FPM-only applications with no plan to use Octane (stateless still recommended for correctness).

---

# Best Practices

- **All request-specific data must be method arguments, not service properties.** WHY: Storing `$this->user = Auth::user()` on a service leaks that user across requests under Octane. Pass user, tenant, locale as parameters.
- **Default to transient binding for all services.** WHY: No performance penalty for transient under Octane. Safety is more valuable than micro-optimization.
- **Use context object pattern.** WHY: A `RequestContext` value object containing user, tenant, locale simplifies method signatures while keeping request data explicit.
- **Audit existing services before enabling Octane.** WHY: Look for mutable properties, static state, `Auth::user()` in constructors, factory closures capturing request state.

---

# Architecture Guidelines

- Stateless service: constructor dependencies are stateless services. Request data is method parameters.
- Escaping the stateless rule: use factory pattern to create services per-request that receive context.
- Singleton only for provably stateless services (pure functions, no request-scoped dependencies).

---

# Performance Considerations

- Transient resolution under Octane creates more objects per request than singletons. PHP 8+ handles this well — difference is <50μs per resolution.
- Stateless services are the correct tradeoff: negligible performance cost vs. preventing state leak bugs.

---

# Security Considerations

- Stateful singletons under Octane can leak user data between requests — this is a critical security and compliance concern.
- Tenant cross-contamination in multi-tenant apps is a data privacy violation.

---

# Common Mistakes

1. **Assuming Octane doesn't change service behavior:** "It works in development (single request) so it should work in production." Cause: unawareness. Consequence: production-only bugs. Better: build stateless from the start.

2. **Storing Auth user in service property:** `$this->user = Auth::user()` in constructor or setter. Cause: convenience. Consequence: user data leaks across requests. Better: pass user as method argument.

3. **Singleton for performance without audit:** Binding as singleton to "improve performance" without verifying statelessness. Cause: premature optimization. Consequence: undetected state leaks. Better: transient by default.

---

# Anti-Patterns

- **User data leak across requests**: Request A's admin user leaked to Request B.
- **Tenant cross-contamination**: Tenant context stored on service leaks to other tenants. Data privacy violation.
- **Intermittent unreproducible bugs**: Bugs appear in Octane production but not in FPM development.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-15 Octane compatibility | SLP-12 Service binding strategies | LAP-09 Framework independence |
| SLP-09 Dependency injection | SLP-18 Anemic domain model | AEG-09 Refactoring remediation |

---

# AI Agent Notes

- All generated services must be stateless: no mutable properties, no captured request context.
- Default to transient binding for all services.
- Request-specific data (user, tenant) as method parameters only.
- Generate context objects for complex request state.

---

# Verification

- [ ] No mutable properties on services
- [ ] No captured request context (Auth::user() stored on service)
- [ ] All services bound as transient by default
- [ ] Request-specific data passed as method arguments
- [ ] Audit confirms no static state varies per request
