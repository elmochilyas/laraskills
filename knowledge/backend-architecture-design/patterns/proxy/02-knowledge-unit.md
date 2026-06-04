# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Proxy pattern in PHP/Laravel context
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Proxy provides a surrogate or placeholder for another object to control access to it. In Laravel, proxies appear as lazy loading proxies for Eloquent relationships (which defer DB queries until accessed), as virtual proxies for expensive objects, and as protection proxies for authorization checks. The pattern enables deferred initialization, access control, and remote communication without changing the client's interface.

---

# Core Concepts

- Subject: the interface that both real object and proxy implement
- RealSubject: the actual object the proxy represents
- Proxy: controls access to RealSubject, implementing the same interface
- Types: Virtual Proxy (lazy creation), Protection Proxy (access control), Remote Proxy (network communication), Smart Reference (logging, reference counting)

---

# Mental Models

- **Credit Card**: Proxy for your bank account — authorizes access, tracks usage
- **Stunt Double**: Stand-in for the real actor during dangerous scenes
- **Lazy Loading Promise**: "I'll give you the real object when you actually use it"
- **Security Guard**: Checks credentials before granting access to the building

---

# Internal Mechanics

Proxy holds reference to RealSubject (or a factory to create it). Each method call on Proxy performs its control logic, then delegates to RealSubject. PHP's `__call()` magic method allows generic delegation. Virtual Proxy defers instantiation to first method call. Protection Proxy checks authorization before delegation. Lazy loading in Eloquent uses Doctrine's proxy pattern under the hood.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Virtual Proxy | Lazy initialization | Avoids expensive setup until needed | First call pays initialization cost |
| Protection Proxy | Access control | Authorization separated from business logic | Proxy must be kept in sync with permissions |
| Remote Proxy | Network transparency | Local interface for remote service | Network latency hidden from client |
| Smart Proxy | Reference counting/logging | Cross-cutting instrumentation | Overhead on every method call |

---

# Architectural Decisions

- Use Virtual Proxy for: expensive object construction (DB connection, large config, SDK client)
- Use Protection Proxy for: objects requiring authorization checks on every operation
- Use Remote Proxy for: local interface to remote/gRPC services
- Avoid Proxy when: the extra indirection provides no benefit
- Avoid Virtual Proxy for: objects always used after creation (just pay the cost once)
- Prefer: LazyLoading via PHP 8.1+ `LazyObject` rather than manual proxy implementation

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Deferred initialization | Proxy must implement full interface | Interface changes require proxy updates |
| Access control centralized | Proxy must stay in sync with real object | New methods without proxy = security gap |
| Client code unchanged | Transparent but confusing (which is proxy?) | Debugging: is this real or proxy? |
| Remote call transparent | Network errors become proxy errors | Error handling complexity increases |

---

# Performance Considerations

- Virtual Proxy adds null-check on every method call until initialized
- Protection Proxy adds authorization call on each method invocation
- Remote Proxy adds network latency and potential serialization overhead
- PHP 8.1 lazy objects: native proxy support, no custom classes needed
- Eloquent lazy loading: lazy proxies add per-property access check

---

# Production Considerations

- Monitor proxy initialization times — are virtual proxies actually saving cost?
- Log protection proxy authorization failures with context
- Test proxy behavior when underlying service fails (network, auth, initialization)
- Consider caching proxy decisions (authorization results, initialization flags)
- Document which objects are proxied and what proxy type is used

---

# Common Mistakes

- Not implementing full interface on Proxy → missing methods bypass proxy control
- Virtual Proxy that initializes anyway (defeats purpose)
- Protection Proxy with stale authorization logic → permissions changed but proxy didn't
- Remote Proxy without timeout/retry → hanging requests when remote is down
- Proxy that modifies behavior beyond control → confusing side effects
- Using Proxy when Decorator is appropriate (control vs enhancement)

---

# Failure Modes

- **Lazy initialization failure**: first access to proxy triggers expensive operation that fails
- **Authorization logic bypass**: developer calls real object directly instead of proxy
- **Remote proxy timeout**: network failure not handled → proxy hangs indefinitely
- **Memory: proxy preventing GC**: proxy holds reference to real object that could be freed
- **Transparent proxy confusion**: developer thinking they have real object but proxy's behavior differs

---

# Ecosystem Usage

- **Laravel Eloquent**: `Illuminate\Database\Eloquent\Model` uses `Illuminate\Database\Eloquent\Relations\Relation` as lazy loading proxy for relationships
- **Doctrine ORM**: sophisticated lazy loading proxy generation (used by some Laravel packages)
- **PHP 8.1+**: `LazyObject` and `GhostObject` virtual proxy support via `lazy_load()` attribute
- **Fake/Mock in tests**: PHPUnit mock objects are protection proxies (record + verify access)

---

# Related Knowledge Units

**Prerequisites**: Lazy loading, Object lifecycle | **Related**: Decorator (adds behavior vs controls access), Facade (simplifies vs controls), Virtual Proxy vs LazyObject | **Advanced**: PHP 8.1 lazy objects, Doctrine proxy generation, Ghost objects vs virtual proxies

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

