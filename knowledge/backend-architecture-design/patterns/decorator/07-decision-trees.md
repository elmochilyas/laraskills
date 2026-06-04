# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Decorator pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Decorator vs inheritance
* Decision 2: Decorator middleware vs Laravel Pipeline
* Decision 3: Decorator ordering — ordering sensitivity and composition strategy

---

# Architecture-Level Decision Trees

---

## Decision: Decorator vs Inheritance

---

## Decision Context

Choose between the Decorator pattern (wrap behavior via composition) and class inheritance (extend behavior via subclassing) for adding responsibilities.

---

## Decision Criteria

* performance considerations: Decorator adds delegation overhead per layer; inheritance is direct method call
* architectural considerations: Decorator composes at runtime; inheritance is compile-time fixed
* security considerations: Decorator can intercept every call for security checks; inheritance inherits parent's security
* maintainability considerations: Decorator allows mix-and-match; inheritance requires class per combination

---

## Decision Tree

Do you need to combine behaviors at runtime (different combinations for different scenarios)?
↓
YES → Decorator (runtime composition — wrap instances with selected decorators)
    ↓
    Example: `new LoggingDecorator(new CachingDecorator(new Repository()))`
    VS inheritance: `LoggingCachingRepository` — one class per combination
    ↓
    Is the number of behavior combinations large (3+ behaviors × scenarios)?
    YES → Decorator (inheritance causes combinatorial explosion)
        ↓
        3 behaviors: Logging, Caching, Validation
        Inheritance: LoggingRepo, CachingRepo, ValidationRepo, LoggingCachingRepo, LoggingValidationRepo, CachingValidationRepo, LoggingCachingValidationRepo = 7 classes
        Decorator: 3 decorator classes + 1 core = 4 classes, any combination at runtime
        NO → Inheritance is simpler (≤3 fixed combinations)
    NO → Will new behaviors be added over time?
        YES → Decorator (add new decorator without modifying existing classes — OCP)
            ↓
            New decorator class, compose it into the chain where needed
            NO → Inheritance (behavior is stable, no new variants expected)
NO → Is the behavior independent of the core class's interface (cross-cutting)?
    YES → Decorator (middleware, logging, caching, rate limiting — all cross-cutting)
        ↓
        Cross-cutting concerns don't change the core behavior, they wrap it
        Example: `LoggingDecorator` logs before/after delegating — core unchanged
        NO → Is the behavior part of the core class's identity (is-a relationship)?
            YES → Inheritance (true specialization — subclass IS a type of parent)
                ↓
                Example: `AdminUser extends User` — AdminUser IS a User with additional behavior
                NO → Decorator (composition over inheritance for behavior extension)

---

## Rationale

Decorator is the default for adding cross-cutting behaviors (logging, caching, validation, rate limiting) because it supports runtime composition and prevents combinatorial class explosion. Inheritance remains valid for true specialization (is-a relationships) where the subclass represents a distinct type in the domain.

---

## Recommended Default

**Default:** Decorator for cross-cutting behavioral extensions (logging, caching, monitoring). Inheritance only for true type specialization (AdminUser extends User).
**Reason:** Decorator provides runtime flexibility and prevents class explosion. Inheritance creates compile-time coupling and rigid hierarchies.

---

## Risks Of Wrong Choice

Inheritance for cross-cutting: combinatorial class explosion, violates OCP (modifying hierarchy for new behavior). Decorator for type specialization: wrapping doesn't create an is-a relationship, type checking breaks. No pattern: behavior duplicated across classes, or scattered inline code.

---

## Related Rules

- Rule 1: Decorator for cross-cutting behavior (logging, caching); Inheritance for type specialization
- Rule 2: Use Laravel's `extend()` method for container-level decorator registration

---

## Related Skills

- Implement Decorator Pattern
- Use Container `extend()` for Decorators
- Recognize Cross-Cutting vs Type Specialization

---

## Decision: Decorator Middleware vs Laravel Pipeline

---

## Decision Context

Choose between class-based Decorators (each decorator wraps the next) and Laravel's Pipeline (ordered array of callable stages) for layered behavior.

---

## Decision Criteria

* performance considerations: Pipeline uses array iteration with closures; Decorator uses nested object calls — similar overhead
* architectural considerations: Pipeline is explicit about order; Decorator order depends on nesting
* security considerations: Pipeline can be reordered per route; Decorator order is fixed at container binding
* maintainability considerations: Pipeline composition is centralized; Decorator composition may be scattered across providers

---

## Decision Tree

Does the decorator composition vary by context (different order per route, per request type)?
↓
YES → Pipeline (centralized composition per context)
    ↓
    Example: `$pipeline->through([ThrottleRequests::class, Authenticate::class, LogRequests::class])`
    Order is explicit, visible, and varies per pipeline configuration
    ↓
    Does the same wrapped instance need to be passed as a dependency?
    YES → Decorator + Container `extend()` (the wrapped instance is the resolved dependency)
        ↓
        `$this->app->extend(Cache::class, fn($cache) => new LoggingCacheDecorator($cache))`
        Pipeline doesn't produce a wrapped dependency — it processes passables
        NO → Pipeline (cleaner for processing workflows — middleware, request pipelines)
    NO → Is every stage always executed (no conditional short-circuit)?
        YES → Pipeline (each stage calls `$next($passable)`)
            ↓
            Pipeline stages are functions/closures — lighter than full decorator classes
            NO → Is short-circuit behavior needed?
                YES → Pipeline (stage can return without calling `$next`)
                    ↓
                    Pipeline supports early return (like middleware aborting the request)
                    Decorator can also short-circuit but the pattern is less intuitive
                    NO → Either works; prefer Pipeline for central composition
NO → Is the composition stable (same decorators always applied together)?
    YES → Either approach works; Decorator `extend()` is simpler
        ↓
        Container `extend()` in service provider — decorator applied to all resolutions
        Example: `$this->app->extend(Repository::class, fn($repo) => new CachingRepoDecorator($repo))`
        NO → Pipeline (flexible composition per use case)

---

## Rationale

Laravel Pipeline is the recommended approach for ordered processing stages (middleware, request validation pipelines). Decorator with Container `extend()` is better when the wrapped result is used as a dependency throughout the application. The distinction: Pipeline processes a passable through stages; Decorator wraps an object to add behavior when it's used.

---

## Recommended Default

**Default:** Laravel Pipeline for processing workflows (passable through stages). Container `extend()` with Decorator classes for transparent dependency wrapping.
**Reason:** Pipeline is explicit, centralized, and flexible. Decorator `extend()` is cleaner for dependency substitution.

---

## Risks Of Wrong Choice

Pipeline for dependency wrapping: pipeline produces a result, not a wrapped dependency. Decorator for varied composition: must manually compose decorators per context or use container tagging. No composition strategy: behaviors mixed into core class, SRP violation.

---

## Related Rules

- Rule 3: Use Pipeline for ordered processing workflows (middleware-style)
- Rule 4: Use Decorator + `extend()` for transparent dependency wrapping

---

## Related Skills

- Implement Decorator with Container `extend()`
- Use Laravel Pipeline
- Choose Between Pipeline and Decorator

---

## Decision: Decorator Ordering — Ordering Sensitivity and Composition Strategy

---

## Decision Context

Choose the order of decorators in a stack and how to manage ordering sensitivity (which decorators wrap which).

---

## Decision Criteria

* performance considerations: outer decorators run first (before inner); expensive checks should be outermost for early exit
* architectural considerations: ordering determines behavior — logging wraps caching vs caching wraps logging
* security considerations: security decorators must be outermost (first to validate, last to release)
* maintainability considerations: ordering must be documented and enforced — implicit orders are fragile

---

## Decision Tree

Does the decorator stack have cross-cutting ordering rules (security must be outermost)?
↓
YES → Establish explicit ordering convention and enforce it
    ↓
    Standard order (outside → inside):
    1. Security/Auth decorators (validate access first)
    2. Rate limiting decorators (throttle before processing)
    3. Logging decorators (log entry/exit around core behavior)
    4. Monitoring/Metrics decorators (measure timing)
    5. Caching decorators (check cache before delegate, cache after)
    6. Core implementation
    ↓
    Is the ordering enforced by code (not convention)?
    YES → Use a Builder or Factory that composes decorators in the correct order
        ↓
        `class DecoratedServiceFactory { public function create(): ServiceInterface { $inner = new CoreService(); $inner = new CachingDecorator($inner); $inner = new LoggingDecorator($inner); $inner = new RateLimitingDecorator($inner); return $inner; } }`
        NO → Document ordering in ADR and code reviews
    NO → Does decorator A depend on decorator B's behavior (order coupling)?
        YES → Document the coupling explicitly — test the order (integration test)
            ↓
            Example: LoggingDecorator should wrap CachingDecorator to see cache hit/miss
            If order is reversed, logs won't show cache behavior
            ↓
            Test: `$stack = new LoggingDecorator(new CachingDecorator($core));`
            Assert: logs show whether result was cached or computed
            NO → Either order works (additive, non-interfering decorators)
NO → Does wrapping order affect correctness (not just performance)?
    YES → Enforce correct order — consider merging decorators if they're tightly coupled
        ↓
        If two decorators must be in a specific relative order, they're coupled
        Consider merging into one decorator if they logically belong together
        NO → Any order works for correctness — order for performance (outermost = first executed)

---

## Rationale

Decorator ordering is critical: security must be outermost, caching should be innermost. Establish a convention and enforce it with integration tests. When decorators are strongly order-coupled, consider if they should be merged. The standard order (outside → inside): Security → Rate Limit → Logging → Monitoring → Caching → Core.

---

## Recommended Default

**Default:** Security → Rate Limit → Logging → Monitoring → Caching → Core (outside to inside). Use a Factory or Builder to enforce this order in code.
**Reason:** This ordering ensures security checks happen first, logging captures all behavior, and caching wraps the core for maximum cache effectiveness.

---

## Risks Of Wrong Choice

Security decorator inside others: auth check after logging, sensitive data leaked in logs. Caching outside logging: logs don't show cache effectiveness, debugging is harder. No order enforcement: developers add decorators in wrong order, subtle behavioral bugs. Reversed order: different semantics than expected, unreliable system.

---

## Related Rules

- Rule 5: Security decorators must be outermost; caching decorators innermost
- Rule 6: Test decorator ordering with integration tests (not just unit tests)

---

## Related Skills

- Compose Decorator Stack
- Enforce Decorator Order
- Test Decorator Stack
