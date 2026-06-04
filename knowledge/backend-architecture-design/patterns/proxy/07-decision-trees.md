# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Proxy pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Proxy type — Virtual Proxy vs Protection Proxy vs Remote Proxy
* Decision 2: Proxy vs Decorator
* Decision 3: Proxy vs PHP 8.1 lazy objects

---

# Architecture-Level Decision Trees

---

## Decision: Proxy Type — Virtual Proxy vs Protection Proxy vs Remote Proxy

---

## Decision Context

Choose which type of Proxy to use based on the access control need: deferring expensive initialization (Virtual), controlling access (Protection), or abstracting remote communication (Remote).

---

## Decision Criteria

* performance considerations: Virtual Proxy defers cost until access; Protection Proxy adds auth check per call; Remote Proxy adds network overhead
* architectural considerations: each proxy type solves a different coupling problem
* security considerations: Protection Proxy enforces access control at method granularity; Virtual/Remote have minimal security role
* maintainability considerations: each proxy type has different invariants and maintenance patterns

---

## Decision Tree

Is the real object expensive to create and may not be needed?
↓
YES → Virtual Proxy (lazy initialization — create real object only when first accessed)
    ↓
    Examples: heavy report generator, image processor, large configuration parser, Eloquent lazy loading
    ↓
    Is the proxy used in a long-running process (Octane)?
    YES → Ensure virtual proxy doesn't hold references across requests
        ↓
        Octane: virtual proxy initialized in request A — ensure it's not reused for request B
        Use scoped binding for virtual proxies in Octane
        NO → Standard virtual proxy — single initialization, cached for lifetime
    NO → Is the real object accessed conditionally (might not be accessed at all)?
        YES → Virtual Proxy (saves construction cost when access doesn't happen)
            ↓
            Example: `ReportGeneratorProxy` — report only generated if user clicks "export"
            NO → Eager initialization may be simpler (if always accessed)
NO → Is access control required per method or per call?
    YES → Protection Proxy (authorize each method invocation against current context)
        ↓
        Examples: admin-only operations, feature-flag-gated methods, tier-based access
        ↓
        Is authorization context injected (not static)?
        YES → Protection Proxy receives current user/context via constructor
            ↓
            `class AdminReportProxy extends ReportProxy { public function __construct(private Report $report, private User $user) {} }`
            `function generateReport() { $this->authorize('admin'); return $this->report->generateReport(); }`
            NO → Protection Proxy with hardcoded check — inflexible, prefer context-injectable
    NO → Is the real object on a different system (network service, API)?
        YES → Remote Proxy (abstract remote communication details)
            ↓
            Examples: API client that handles HTTP, serialization, retries, timeouts
            ↓
            Does the remote proxy need to handle network failures?
            YES → Remote Proxy implements retry logic, circuit breaker, timeouts
                ↓
                Proxy hides network complexity behind the same interface as local service
                NO → Simple HTTP client may suffice — proxy may be over-engineering
    NO → No proxy needed — direct access to the real object is sufficient

---

## Rationale

Virtual Proxy is the most common in Laravel (Eloquent lazy loading, expensive service initialization). Protection Proxy is useful for cross-cutting authorization. Remote Proxy is rare in Laravel (API clients are usually adapters, not proxies). Choose based on the specific access control need.

---

## Recommended Default

**Default:** Virtual Proxy for expensive, conditionally-accessed objects. Protection Proxy for method-level authorization. Remote Proxy for network service abstraction when the interface must match the local service.
**Reason:** Virtual Proxy provides clear performance benefits. Protection Proxy centralizes access control. Remote Proxy is specialized and rarely the right default.

---

## Risks Of Wrong Choice

Virtual Proxy for cheap objects: no benefit, adds complexity. Protection Proxy where middleware suffices: middleware checks before controller; Protection Proxy checks at method level — use middleware for controller-level auth. Remote Proxy for simple HTTP client: over-engineering for single-API services.

---

## Related Rules

- Rule 1: Virtual Proxy for expensive object creation that may not be accessed
- Rule 2: Protection Proxy for method-level access control (not controller-level)

---

## Related Skills

- Implement Virtual Proxy
- Implement Protection Proxy
- Implement Remote Proxy

---

## Decision: Proxy vs Decorator

---

## Decision Context

Choose between Proxy (controls access to an object) and Decorator (adds behavior to an object) when wrapping an object.

---

## Decision Criteria

* performance considerations: both add one delegation per call — identical overhead
* architectural considerations: Proxy controls (manages access/lifetime); Decorator extends (adds behavior)
* security considerations: Proxy (especially Protection) enforces security; Decorator may introduce security behaviors
* maintainability considerations: Proxy focuses on access; Decorator focuses on enhancement — different change drivers

---

## Decision Tree

Does the wrapper control when/how the real object is accessed (rather than what it does)?
↓
YES → Proxy (the wrapper's purpose is access management, not behavior extension)
    ↓
    Proxy decides: create? authorize? connect remotely? cache the result?
    Examples:
    → Virtual Proxy: "Do I create the object now?"
    → Protection Proxy: "Is the caller allowed to call this?"
    → Remote Proxy: "How do I connect and handle failures?"
    ↓
    Is the wrapper transparent (same interface, no additional behavior)?
    YES → Proxy (the wrapper adds control, not behavior)
        ↓
        Proxy's methods delegate 100% to real object after control check
        NO → Does the wrapper add behavior before/after delegation?
            YES → Decorator (adds cross-cutting behavior — logging, caching, validation)
                ↓
                Decorator's methods: log before, delegate, log after
                Proxy's methods: check access, delegate (no behavior modification)
                NO → Proxy (pure access control)
NO → Decorator (adds cross-cutting behavior around the core)
    ↓
    Key distinction:
    → Proxy: "I control whether/how the call reaches the real object"
    → Decorator: "The call reaches the real object, and I add behavior around it"
    ↓
    Examples of Decorator: LoggingDecorator, CachingDecorator, ValidationDecorator
    Examples of Proxy: LazyLoadingProxy, AuthorizationProxy, RemoteProxy
    ↓
    Still unsure? Ask: "If I remove this wrapper, would behavior change (behavior) or would just access/lifetime change (control)?"
    If behavior changes → Decorator
    If only access/lifetime changes → Proxy

---

## Rationale

The distinction: Proxy controls access to the object (when, how, who). Decorator extends behavior (what happens before/after). In practice, the line can blur — a Protection Proxy that logs access attempts is also doing decoration. Use the primary purpose to decide: if controlling access is the goal, it's a Proxy. If enhancing behavior is the goal, it's a Decorator.

---

## Recommended Default

**Default:** Decorator when adding cross-cutting behaviors. Proxy when controlling access, lifetime, or location of the real object. When in doubt, the primary purpose determines the classification.
**Reason:** Decorator and Proxy have different change patterns and maintenance concerns. Correct classification guides future changes correctly.

---

## Risks Of Wrong Choice

Proxy where Decorator needed: controlling access when you should be adding behavior — missing behavior extension. Decorator where Proxy needed: adding behavior around something that should be lazily created — defeats lazy initialization. Mixed Proxy-Decorator: class with dual responsibility — harder to test, maintain, and reason about.

---

## Related Rules

- Rule 3: Proxy = control access/lifetime; Decorator = add behavior
- Rule 4: A class should be primarily Proxy or Decorator — not both

---

## Related Skills

- Distinguish Proxy vs Decorator
- Implement Proxy
- Implement Decorator

---

## Decision: Proxy vs PHP 8.1 Lazy Objects

---

## Decision Context

Choose between a custom Virtual Proxy class and PHP 8.1+ native lazy objects (`ReflectionGenerator::newLazyProxy()`, `LazyObject`).

---

## Decision Criteria

* performance considerations: PHP 8.1 lazy objects use internal implementation (no PHP class delegation); custom proxy uses manual method delegation
* architectural considerations: PHP lazy objects are transparent (no proxy class needed); custom proxy is explicit
* security considerations: lazy objects don't enforce access control (purely virtual); custom proxy can combine virtual + protection
* maintainability considerations: PHP lazy objects require no maintenance per interface method; custom proxy must be updated when interface changes

---

## Decision Tree

Is the Proxy purely for lazy initialization (no access control, no remote abstraction)?
↓
YES → Consider PHP 8.1 lazy objects (simpler, zero boilerplate)
    ↓
    PHP 8.1+ lazy objects: `$proxy = ReflectionGenerator::newLazyProxy(fn() => new RealObject())`
    No proxy class needed — intercepts all method calls via internal PHP mechanism
    ↓
    Does the team use PHP 8.1+ and understand lazy objects?
    YES → PHP lazy objects are the default for pure virtual proxies
        ↓
        Zero boilerplate — no proxy class, no method delegation, no maintenance
        ↓
        Does the lazy object need to be serializable (cached)?
        YES → Custom proxy (PHP lazy objects have serialization limitations)
            ↓
            Lazy objects may not serialize/deserialize correctly
            Custom proxy can implement `Serializable` or handle `__serialize()`/`__unserialize()`
            NO → PHP lazy objects — simpler, no serialization concern
        NO → Custom proxy (for compatibility with PHP < 8.1 or team preference)
NO → Does the Proxy need to combine lazy initialization with protection/remote logic?
    YES → Custom proxy (PHP lazy objects don't support access control)
        ↓
        PHP lazy objects only defer creation — they don't authorize or translate
        For combined virtual + protection: custom proxy wrapping a lazy object or vice versa
        ↓
        Example: `class ProtectedProxy { public function __construct(private LazyObject $lazy) {} }`
        NO → Does the Proxy need to work with a specific interface (type safety)?
            YES → Custom proxy (PHP lazy objects are untyped; may need `implements Interface`)
                ↓
                PHP lazy objects produce `stdClass`-like proxies — no interface type enforcement
                Custom proxy `implements Interface` provides full type safety
                NO → PHP lazy objects (no interface requirement — duck typing is acceptable)
NO → Custom proxy (PHP lazy objects are only for pure virtual proxying)
    ↓
    Protection proxy, remote proxy, caching proxy — all require custom classes
    PHP lazy objects solve only lazy initialization

---

## Rationale

PHP 8.1 lazy objects are superior for pure lazy initialization — they require zero boilerplate, no proxy class, and no method delegation maintenance. Custom virtual proxies are only needed when combining lazy initialization with other proxy concerns (protection, remote), or when PHP 8.1+ is not available.

---

## Recommended Default

**Default:** PHP 8.1+ lazy objects for pure virtual proxies. Custom proxy class when combining virtual with protection/remote logic, or when interface type safety is required.
**Reason:** PHP lazy objects eliminate proxy class boilerplate entirely. Custom proxies only justified when they serve multiple proxy purposes.

---

## Risks Of Wrong Choice

PHP lazy objects for combined concerns: can't add authorization or remote translation — need custom code. Custom proxy for pure lazy init: boilerplate (N methods × delegations) that PHP lazy objects handle automatically. PHP lazy objects in PHP < 8.1: syntax error. PHP lazy objects with serialization: unexpected failures when persisting to cache/session.

---

## Related Rules

- Rule 5: Use PHP 8.1+ lazy objects for pure virtual proxies
- Rule 6: Custom proxy when combining virtual with protection/remote or requiring interface typing

---

## Related Skills

- Use PHP 8.1 Lazy Objects
- Implement Custom Proxy
- Combine Lazy Objects with Custom Proxy
