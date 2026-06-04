# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** ABAC (Attribute-Based Access Control)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | RBAC vs ABAC Authorization Model | Choosing primary authorization approach | architectural, maintainability, security |
| 2 | Internal vs External PDP | Policy decision point implementation | maintainability, performance, security |

---

# Architecture-Level Decision Trees

---

## RBAC vs ABAC Authorization Model

---

## Decision Context

Choosing between Role-Based Access Control (database roles/permissions) and Attribute-Based Access Control (attribute evaluation policies) as the primary authorization model.

---

## Decision Criteria

* architectural
* maintainability
* security

---

## Decision Tree

Can authorization be expressed as "user has role X which grants permission Y"?
↓
YES → RBAC (simpler, well-understood, covers ~80% of use cases)
NO → Does authorization depend on attributes like department, time, location, resource classification?
    YES → ABAC (attribute evaluation needed)
    NO → Can authorization be expressed as simple boolean checks?
        YES → Gates/Policies (simpler than both RBAC and ABAC)
        NO → ABAC (complex multi-dimensional rules)

Are there compliance requirements for attribute-based controls?
↓
YES → ABAC (role-based alone may not satisfy compliance)
NO → RBAC (start here, add ABAC only for edge cases)

Is the authorization team experienced with ABAC policy engines?
↓
YES → ABAC viable as primary model
NO → RBAC first, ABAC only where forced

---

## Rationale

RBAC is simpler, has better tooling (Spatie), and covers most use cases. ABAC is more flexible but introduces policy engine complexity. The recommended approach is RBAC-first with ABAC layered on for edge cases. Pure ABAC from day one is rarely justified — most applications have simple role-based requirements for the majority of their authorization.

---

## Recommended Default

**Default:** RBAC (Spatie laravel-permission) as primary authorization; add ABAC Policy logic for attribute-based edge cases
**Reason:** RBAC handles 80%+ of authorization requirements with well-understood tooling. ABAC layers on top for complex attribute evaluations. This hybrid approach provides flexibility without premature complexity.

---

## Risks Of Wrong Choice

- Pure ABAC: over-engineered for simple role checks, slower development, harder debugging
- RBAC for attribute-based rules: forced into role explosion (creating roles for every attribute combination)
- Neither: no structured authorization, ad-hoc checks throughout codebase
- ABAC without fail-closed: policy engine errors default to allow

---

## Related Rules

- Start With RBAC, Add ABAC Only Where Needed (05-rules.md)
- Resolve Attributes Server-Side, Never Trust Client-Provided Values (05-rules.md)
- Default Deny When No ABAC Policy Matches (05-rules.md)
- Cache PDP Decisions With Appropriate TTL (05-rules.md)

---

## Related Skills

- Implement Attribute-Based Access Control (ABAC) for Fine-Grained Authorization (06-skills.md)
- Design Role-Based Access Control (06-skills.md)

---

## Internal vs External PDP

---

## Decision Context

Whether to implement the Policy Decision Point (PDP) in application code (internal) or use an external service (Permit.io, OPA).

---

## Decision Criteria

* maintainability
* performance
* security

---

## Decision Tree

How many ABAC policies will be evaluated?
↓
<10 simple rules → Internal PDP (Policy methods with attribute checks)
10-50 → External PDP (OPA, Permit.io — dedicated policy engine)
50+ → External PDP with caching (policy complexity demands dedicated engine)

Is low latency critical for authorization?
↓
YES → Internal PDP (no network call, 1-5ms)
NO → External PDP acceptable (10-100ms network round trip)

Does the team include authorization specialists?
↓
YES → External PDP (dedicated policy language, version control, testing)
NO → Internal PDP (simpler, uses existing PHP skills)

Are policies managed by a separate team (security/compliance)?
↓
YES → External PDP (policies managed in external UI, not code)
NO → Internal PDP (policies in PHP code, managed by dev team)

Do you need policy versioning, dry-run, and audit?
↓
YES → External PDP (built-in policy lifecycle management)
NO → Internal PDP (version control via git)

---

## Rationale

Internal PDP is simpler for small numbers of attribute-based rules evaluated in Policy methods. External PDP (OPA, Permit.io) provides dedicated policy engines with versioning, testing, and non-blocking dry-run evaluation. External PDPs add latency and a network dependency. Internal PDP is appropriate for simple attribute checks; external PDP for complex policy requirements.

---

## Recommended Default

**Default:** Internal PDP (Policy methods with attribute checks) for <10 rules; external PDP (Permit.io/OPA) for complex policy needs
**Reason:** Internal PDP avoids network latency and external dependencies for simple attribute checks. External PDP provides proper policy lifecycle management when complexity grows beyond what Policy methods can maintain.

---

## Risks Of Wrong Choice

- Internal PDP for complex policies: Policy methods become unmanageable, hard to audit, hard to test
- External PDP for simple checks: unnecessary latency, cost, dependency for simple attribute evaluations
- External PDP without fail-closed fallback: PDP outage causes authorization to allow all requests
- No PDP caching: external PDP called on every request, unnecessary latency

---

## Related Rules

- Cache PDP Decisions With Appropriate TTL (05-rules.md)
- Default Deny When No ABAC Policy Matches (05-rules.md)
- Resolve Attributes Server-Side, Never Trust Client-Provided Values (05-rules.md)

---

## Related Skills

- Implement Attribute-Based Access Control (ABAC) for Fine-Grained Authorization (06-skills.md)
