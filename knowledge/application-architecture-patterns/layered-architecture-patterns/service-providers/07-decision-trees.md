# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Service Providers for Interface Binding
**Generated:** 2026-06-04

---

# Decision Inventory

* Explicit binding vs auto-discovery for interface resolution
* Singleton vs transient (bind) for service registration
* Dedicated InfrastructureServiceProvider vs AppServiceProvider
* Contextual binding vs separate interfaces per consumer

---

# Architecture-Level Decision Trees

---

## Explicit Binding vs Auto-Discovery

---

## Decision Context

Laravel can auto-resolve many classes without explicit bindings. Explicit bindings provide control and auditability but require maintenance. The choice affects boilerplate and confidence in resolution correctness.

---

## Decision Criteria

* performance considerations — no practical difference
* architectural considerations — explicit bindings document the dependency graph
* security considerations — no impact
* maintainability considerations — explicit bindings are more work; auto-discovery is simpler

---

## Decision Tree

Does the interface have exactly one implementation with no special configuration?
↓
YES → Is the project using strict Port-Adapter with audit requirements?
    YES → Explicit binding — document the resolution chain
    NO → Auto-discovery — Laravel resolves Interface → Implementation by convention
NO → Interface has multiple implementations or needs configuration?
    YES → Explicit binding — required for multiple or conditional implementations
    NO → Auto-discovery is sufficient

---

## Rationale

Auto-discovery reduces boilerplate but hides the dependency graph. Explicit bindings document every resolution and make missing bindings obvious. For most interfaces with one implementation, auto-discovery is sufficient.

---

## Recommended Default

**Default:** Auto-discovery for simple, single-implementation interfaces; explicit binding for complex or conditional resolution.
**Reason:** Balance between boilerplate and clarity. Explicit bind for the interesting cases; let convention handle the rest.

---

## Risks Of Wrong Choice

Explicit all: boilerplate-heavy, harder to maintain. Auto-discovery all: resolution failures are discovered at runtime.

---

## Related Rules

- Rule: Dedicated InfrastructureServiceProvider (LAP-09/05-rules.md)
- Rule: Automatic Binding for Common Patterns (LAP-09/05-rules.md)

---

## Related Skills

- Bind Interfaces to Implementations in Service Providers (LAP-09/06-skills.md)

---

## Singleton vs Transient (bind) for Service Registration

---

## Decision Context

Services can be registered as singletons (one instance for the entire application lifecycle) or transient (new instance per resolution). The choice affects memory usage, state safety, and testability.

---

## Decision Criteria

* performance considerations — singletons reduce allocation and improve throughput
* architectural considerations — singletons require stateless services
* security considerations — no difference
* maintainability considerations — singletons are more efficient; transients are safer

---

## Decision Tree

Is the service stateless (no mutable properties, no per-request state)?
↓
YES → Singleton
    One instance, reused across all requests
    No mutable state risk
NO → Does the service hold per-request state (DB connection, request context)?
    YES → Transient (bind)
        New instance per resolution
        No risk of cross-request state leakage
    NO → Default to singleton for efficiency

---

## Rationale

Singletons are more efficient: one object, no repeated construction. They are safe for any service that has no mutable state. Only services with per-request state need transient registration.

---

## Recommended Default

**Default:** Singleton for stateless services, bind for stateful services.
**Reason:** Most infrastructure services (repositories, gateways) are stateless and should be singletons.

---

## Risks Of Wrong Choice

Singleton for stateful services: cross-request state leakage, race conditions. Transient for stateless services: unnecessary object allocation overhead.

---

## Related Rules

- Rule: Bind in register(), Not boot() (LAP-09/05-rules.md)

---

## Related Skills

- Bind Interfaces to Implementations in Service Providers (LAP-09/06-skills.md)

---

## Dedicated InfrastructureServiceProvider vs AppServiceProvider

---

## Decision Context

All bindings can be placed in Laravel's default `AppServiceProvider`, or extracted to a dedicated `InfrastructureServiceProvider`. The choice affects organization and separation of concerns.

---

## Decision Criteria

* performance considerations — no difference
* architectural considerations — separate providers respect layer boundaries
* security considerations — no impact
* maintainability considerations — separate providers are easier to navigate

---

## Decision Tree

Does the project have 10+ interface-to-implementation bindings?
↓
YES → Dedicated InfrastructureServiceProvider
    Keeps bindings organized and auditable
NO → Is the project using Clean/Hexagonal Architecture?
    YES → Dedicated InfrastructureServiceProvider
        Respects architectural separation
    NO → AppServiceProvider is sufficient for small projects

---

## Rationale

A dedicated provider communicates intent: "this provider handles infrastructure binding." It also keeps AppServiceProvider from becoming a dumping ground for unrelated registrations.

---

## Recommended Default

**Default:** Dedicated InfrastructureServiceProvider for any project with layered architecture.
**Reason:** Clear separation of concerns; easier to audit; respects architectural boundaries.

---

## Risks Of Wrong Choice

No dedicated provider: AppServiceProvider becomes a god provider. Dedicated provider for 2 bindings: unnecessary file.

---

## Related Rules

- Rule: Dedicated InfrastructureServiceProvider (LAP-09/05-rules.md)

---

## Related Skills

- Bind Interfaces to Implementations in Service Providers (LAP-09/06-skills.md)
