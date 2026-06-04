# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Service binding strategies: singleton vs. transient
Knowledge Unit ID: SLP-12
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Service binding strategies determine whether a service instance is shared (singleton) or created fresh per resolution (transient). Under default Laravel lifecycle (per-request), distinction is minor — garbage collected per request. Under Octane (per-worker), singletons persist across requests, making state management critical. Rule: default to transient. Use singleton only for services that are provably stateless (no mutable properties, no request-scoped dependencies).

---

# Core Concepts

- **Singleton**: One instance shared across entire application lifetime. Under Octane, persists across requests.
- **Transient**: New instance per resolution. Default behavior when no explicit binding.
- **Stateless service**: No mutable properties. All dependencies injected. Request-specific data passed as method arguments.

---

# When To Use

- Transient: default for all business services. Safe, negligible performance cost.
- Singleton: service is provably stateless (pure functions, no request-scoped state) and creating instances is measurable overhead.

---

# When NOT To Use

- Singleton for convenience without auditing for state.
- Singleton under Octane without confirming statelessness.
- Factory hierarchies when simple transient binding suffices.

---

# Best Practices

- **Default to transient for all business services.** WHY: The performance cost of transient resolution is negligible (~1-5μs). The safety benefit of avoiding state leaks (especially under Octane) is significant.
- **Audit singleton services for statelessness.** WHY: Under Octane, stateful singletons are a top-3 source of production bugs. Check for mutable properties, captured request context, and static properties that change per request.
- **Use factory pattern for stateful services.** WHY: A factory that produces fresh instances with request-scoped dependencies avoids singleton state leaks while providing needed context.

---

# Architecture Guidelines

- Default: `$this->app->bind(Service::class)` (transient).
- Explicit singleton: `$this->app->singleton(Service::class)` — only after audit.
- Under Octane, prefer transient for all business services.

---

# Performance Considerations

- Transient: ~1-5μs per resolution (Reflection, instantiation).
- Singleton: ~1μs after first (array lookup). Difference negligible for typical service counts.

---

# Security Considerations

- Stateful singletons under Octane can leak user data between requests — this is a security and compliance concern.

---

# Common Mistakes

1. **Singleton for convenience:** Binding as singleton "because it doesn't change." Cause: performance concern. Consequence: undetected state leaks under Octane. Better: transient by default.

2. **Stateful singleton under Octane:** Service stores `$this->user` or `$this->request`. Cause: convenience. Consequence: cross-request data contamination. Better: pass request data as method arguments.

3. **Factory misuse:** Complex factory hierarchies when simple transient binding suffices. Cause: over-engineering. Consequence: unnecessary complexity. Better: transient binding.

---

# Anti-Patterns

- **User data leak across requests**: Singleton storing authenticated user. Request A's data leaks to Request B.
- **Stale tenant context**: Singleton caching current tenant. After switch, returns old tenant.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-09 Dependency injection | SLP-13 Interface contracts | LAP-15 Octane compatibility |
| SLP-19 Octane service state | SLP-01 Service classes | AEG-09 Octane audit |

---

# AI Agent Notes

- Default to transient for all generated services.
- Only use singleton for provably stateless infrastructure services.
- Under Octane, flag any singleton with mutable properties as a bug.

---

# Verification

- [ ] All business services are bound as transient by default
- [ ] Singleton services are audited for statelessness
- [ ] No service stores mutable request-scoped state
- [ ] Under Octane, no stateful singletons exist
- [ ] Factory pattern used where request context is needed
