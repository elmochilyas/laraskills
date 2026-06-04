# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Octane compatibility considerations for layered architecture
**Generated:** 2026-06-03

---

# Decision Inventory

* Transient binding vs singleton binding for services under Octane
* Constructor injection vs method parameter injection for request context
* Stateless action classes vs stateful service classes for Octane safety

---

# Architecture-Level Decision Trees

---

## Transient Binding vs Singleton Binding for Services Under Octane

---

## Decision Context

Under Octane, services persist across requests. Singleton services with mutable state cause cross-request contamination. Transient services create fresh instances per request but increase garbage collection pressure.

---

## Decision Criteria

* performance considerations — transient creates more objects (GC pressure); singleton is more memory-efficient
* architectural considerations — transient is safe by default; singleton requires state audit
* security considerations — stateful singletons leak user data across requests
* maintainability considerations — transient is simpler to reason about; singleton requires careful auditing

---

## Decision Tree

Service binding under Octane?
↓
Does the service have mutable state (properties that change after construction)?
YES → Bind as transient — safe but creates more objects per request
NO → Is the service provably stateless (no mutable properties, no static state)?
    YES → Bind as singleton — memory-efficient and safe
    NO → Bind as transient — audit for mutability first

---

## Rationale

Under Octane, the safe default is transient binding. Singleton binding is an optimization for provably stateless services. The performance gain from singleton is typically negligible compared to the risk of cross-request contamination.

---

## Recommended Default

**Default:** Bind all services as transient under Octane
**Reason:** Transient is safe regardless of service implementation. Singleton binding saves memory but risks cross-request contamination if the service has mutable state. Profile before optimizing — the performance difference is usually negligible.

---

## Risks Of Wrong Choice

Singleton with mutable state leaks user data across requests — request A's user appears in request B's response. Transient for everything creates more GC pressure but is always safe.

---

## Related Rules

- Rule: Bind Services as Transient by Default Under Octane (LAP-15/05-rules.md)
- Rule: Never Store Request Context on Service Instances (LAP-15/05-rules.md)

---

## Related Skills

- Apply Octane Compatibility for Layered Architecture (LAP-15/06-skills.md)
- Design Stateless Service Classes (SLP-19/06-skills.md)

---

## Constructor Injection vs Method Parameter Injection for Request Context

---

## Decision Context

Request context (user, tenant, locale) can be injected in the constructor (captured at service creation) or passed as method parameters (fresh per call). Under Octane, constructor injection captures context only once per worker, not per request.

---

## Decision Criteria

* performance considerations — no significant performance difference
* architectural considerations — method parameters provide fresh context each call; constructor captures once
* security considerations — constructor-injected user context leaks across requests under Octane
* maintainability considerations — method parameters are explicit; constructor injection is convenient

---

## Decision Tree

Request context injection approach?
↓
Is the context request-scoped (user, tenant, locale)?
YES → Pass as method parameter — fresh per request
NO → Is the context application-scoped (config, database connection)?
    YES → Constructor injection is safe — doesn't change per request
    NO → Method parameter injection — safe default

---

## Rationale

Request-scoped context (authenticated user, current tenant, locale) must be passed as method parameters, not injected in the constructor. Under Octane, constructor injection captures context at worker boot, not per request. Method parameters ensure fresh context for every call.

---

## Recommended Default

**Default:** Pass request-scoped context as method parameters
**Reason:** Constructor-injected request context is captured once per worker under Octane, causing cross-request contamination. Method parameters ensure fresh context per call and make dependencies explicit.

---

## Risks Of Wrong Choice

Constructor-injected user context under Octane causes user A's data to appear in user B's responses — intermittent, hard-to-debug production bugs.

---

## Related Rules

- Rule: Never Store Request Context on Service Instances (LAP-15/05-rules.md)
- Rule: Use the Context Object Pattern (LAP-15/05-rules.md)

---

## Related Skills

- Apply Octane Compatibility for Layered Architecture (LAP-15/06-skills.md)
- Design Stateless Service Classes (SLP-19/06-skills.md)

---

## Stateless Action Classes vs Stateful Service Classes for Octane Safety

---

## Decision Context

Action classes (single-purpose, all input via `execute()` parameters) are naturally stateless and Octane-safe. Service classes with multiple methods may accumulate state across method calls.

---

## Decision Criteria

* performance considerations — no significant difference
* architectural considerations — actions are naturally stateless; services require auditing
* security considerations — stateful services under Octane leak data
* maintainability considerations — actions are simpler to reason about; services can hide stateful patterns

---

## Decision Tree

Class design for Octane?
↓
Does the class have state that changes between method calls?
YES → Refactor to stateless — pass all input as parameters
NO → Does the class receive all input via method parameters?
    YES → Octane-safe — stateless by design
    NO → Does the class inject request-scoped context in constructor?
        YES → Refactor to method parameters — constructor capture is unsafe
        NO → Octane-safe — no mutable state after construction

---

## Rationale

Action classes are inherently Octane-safe — they receive all input via `execute()` parameters and have no mutable state. Service classes with multiple methods may have state set in one method and used in another, which breaks under Octane's shared-worker model.

---

## Recommended Default

**Default:** Prefer action classes (stateless by design) for Octane applications
**Reason:** Action classes naturally receive all input via `execute()` parameters and have no mutable state. They are inherently Octane-safe without auditing. Service classes require careful state audit.

---

## Risks Of Wrong Choice

Stateful services under Octane cause intermittent, hard-to-reproduce bugs. Stateless-only design may create file proliferation where a single service class would suffice.

---

## Related Rules

- Rule: Prefer Action Classes for Octane-Safe Operations (LAP-15/05-rules.md)
- Rule: Audit All Services for Mutable Properties Before Octane Migration (LAP-15/05-rules.md)

---

## Related Skills

- Apply Octane Compatibility for Layered Architecture (LAP-15/06-skills.md)
- Create Action Classes for Business Operations (SLP-02/06-skills.md)
