# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Internal Developer Platforms
**Knowledge Unit:** Forge-Based Internal Platform Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Should we build a Forge-based self-service platform? | Scale, infra type, team size | Yes — for 10-50 dev teams with VPS |
| 2 | Recipe management: UI vs version-controlled? | Audit needs, deployment frequency | Version-controlled with CI |
| 3 | Provisioning flow: sync vs async? | Latency tolerance, user experience | Async with progress polling |
| 4 | Abstraction layer: thin wrap vs comprehensive? | Vendor lock-in risk, multi-backend plans | Thin wrap for Laravel-only |

---

# Architecture-Level Decision Trees

---

## Decision 1: Should We Build a Forge-Based Self-Service Platform?

---

## Decision Context

Laravel Forge is the de facto provisioning backend for Laravel IDPs. Wrapping its API in a self-service layer enables automated server creation, site deployment, and environment management. The decision depends on team size, infrastructure type, and existing Forge usage.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the organization use VPS-based infrastructure (DigitalOcean, Linode, AWS EC2)?
↓
NO → Use platform-specific tools (K8s, serverless) — Forge not applicable
YES → ↓
How many servers are managed?
↓
< 10 → Forge web UI is sufficient; no API abstraction needed
10+ → ↓
How many Laravel applications?
↓
< 3 → Forge UI + manual scripts may suffice
3+ → ↓
Team size?
↓
< 10 → Forge UI is sufficient
10-50 → ↓
**Build Forge-based self-service platform** with API abstraction layer

---

## Rationale

Forge API abstraction becomes valuable when server count and team size reach the point where manual UI management creates bottlenecks. Below these thresholds, the Forge web UI provides adequate management capabilities. The 10-50 developer range represents the sweet spot where automation ROI justifies platform investment.

---

## Recommended Default

**Default:** Use Forge web UI for < 10 servers; build platform for 10+
**Reason:** API abstraction introduces maintenance overhead that only pays back at scale

---

## Risks Of Wrong Choice

- **Platform too early (< 10 servers):** Maintenance overhead exceeds value; platform becomes abandoned
- **No platform at scale (20+ servers):** Server management becomes bottleneck; errors from manual operations

---

## Related Rules

- FORGE-RULE-020: Use Forge-based platform for 10-50 dev teams with multiple Laravel apps on VPS
- FORGE-RULE-021: Do NOT use Forge for Kubernetes or serverless infrastructure
- FORGE-RULE-022: < 10 servers → Forge UI is sufficient

---

## Related Skills

- Build a Forge-Based Self-Service Provisioning Platform
- Manage Forge Recipe Lifecycle and Testing

---

## Decision 2: Recipe Management — UI vs Version-Controlled?

---

## Decision Context

Forge recipes (server provisioning bash scripts) can be managed through the Forge web UI or stored in a version-controlled repository with CI testing. The choice affects auditability, repeatability, and change management.

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

Are compliance or audit requirements present (SOC2, PCI, HIPAA)?
↓
YES → **Version-controlled with CI** — mandatory audit trail
NO → ↓
How often do recipes change?
↓
Rarely (quarterly or less) → Forge UI may be acceptable
Frequently → ↓
Is there a team of 2+ engineers managing infrastructure?
↓
NO → Forge UI for simplicity; document changes manually
YES → **Version-controlled with CI testing**

---

## Rationale

Version control provides history, rollback, peer review, and CI validation. Forge UI management is acceptable for small teams where recipes are simple and rarely change. The compliance requirement makes version control non-negotiable in regulated environments.

---

## Recommended Default

**Default:** Version-controlled recipes with CI testing
**Reason:** Recipes are infrastructure code; they deserve the same rigor as application code

---

## Risks Of Wrong Choice

- **UI-only at scale:** Lost audit trail, no rollback capability, untested changes break production servers
- **Version control overhead for simple setups:** Unnecessary process burden on small team

---

## Related Rules

- FORGE-RULE-002: Version-control recipes
- FORGE-RULE-009: Test recipes before production

---

## Related Skills

- Manage Forge Recipe Lifecycle and Testing
- Build a Forge-Based Self-Service Provisioning Platform

---

## Decision 3: Provisioning Flow — Sync vs Async?

---

## Decision Context

Forge API operations (server creation, site setup) take 1-30 seconds for simple operations and 5-15 minutes for full server provisioning. The provisioning flow design must choose between synchronous (blocking) and asynchronous (trigger-and-poll) approaches.

---

## Decision Criteria

* performance

---

## Decision Tree

Is the operation duration under 5 seconds?
↓
YES → **Synchronous** — block and return result
NO → ↓
Does the user need the result immediately to proceed?
↓
NO → **Asynchronous** with progress polling and notification
YES → ↓
Can the operation be pre-warmed (server pool)?
↓
YES → Pre-warm servers; make operation sync by serving from pool
NO → **Asynchronous** with progress indicator; do NOT block the UI

---

## Rationale

Blocking the UI for operations longer than a few seconds creates poor user experience and risks timeouts. Asynchronous flows with progress polling (via WebSocket or polling endpoint) keep developers informed without blocking. Pre-warming converts long operations into near-instant assignments.

---

## Recommended Default

**Default:** Asynchronous with progress polling
**Reason:** Most Forge operations (server creation, recipe installation) exceed tolerable wait times; async provides better UX

---

## Risks Of Wrong Choice

- **Synchronous for long operations (5+ min):** Browser timeouts, frustrated users, platform perceived as broken
- **Async for quick operations (< 2s):** Unnecessary complexity; polling overhead for simple operations

---

## Related Rules

- FORGE-RULE-016: Server provisioning: 5-15 minutes
- FORGE-RULE-017: API operations: 1-30 seconds
- FORGE-RULE-011: Pre-warm server pools

---

## Related Skills

- Build a Forge-Based Self-Service Provisioning Platform
- Implement Self-Service Environment Provisioning for Laravel

---

## Decision 4: Abstraction Layer — Thin Wrap vs Comprehensive?

---

## Decision Context

When wrapping Forge API calls, the abstraction layer can be a thin pass-through (direct 1:1 mapping to Forge API endpoints) or a comprehensive interface (abstracting provisioning, compute, and secrets separately).

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Will the platform ever use a non-Forge provisioning backend (Ploi, RunCloud, custom)?
↓
NO (Laravel-only, VPS-only) → **Thin wrap** — direct Forge API mapping
YES → ↓
How many provisioning backends are planned?
↓
2 → **Thin interface** — `ProvisioningProvider` interface with `ForgeAdapter`
3+ → **Comprehensive abstraction** — separate interfaces for provisioning, compute, secrets

---

## Rationale

A thin wrap minimizes maintenance and is appropriate when the organization is committed to Forge. A comprehensive interface adds overhead but prevents vendor lock-in. Most Laravel teams are Forge-only and benefit from simplicity. The interface pattern pays back when migrating between backends.

---

## Recommended Default

**Default:** Thin wrap (`ProvisioningProvider` interface with `ForgeAdapter`)
**Reason:** Most Laravel teams are Forge-only; comprehensive abstraction is premature optimization

---

## Risks Of Wrong Choice

- **Comprehensive abstraction for Forge-only:** Unnecessary complexity, slower development, harder to maintain
- **No abstraction at all:** Direct Forge API calls throughout codebase; migrating to new backend requires rewrites everywhere

---

## Related Rules

- FORGE-RULE-003: Abstraction layer
- IDP-RULE-029: Avoid Vendor Lock-In

---

## Related Skills

- Build a Forge-Based Self-Service Provisioning Platform
- Architect IDP Patterns for Laravel Teams

