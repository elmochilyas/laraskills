# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Code Organization Standards
**Knowledge Unit:** Team-scale organizational strategies (10+ engineers)
**Generated:** 2026-06-03

---

# Decision Inventory

* Per-team namespace roots vs shared App\ namespace
* Module-per-team vs domain-per-team organization
* Contract-based cross-team communication vs shared models

---

# Architecture-Level Decision Trees

---

## Per-Team Namespace Roots vs Shared App\ Namespace

---

## Decision Context

At 10+ engineers across multiple teams, the shared `App\` namespace becomes a bottleneck — merge conflicts, unclear ownership, and naming collisions. Per-team namespace roots provide clear ownership but require PSR-4 restructuring.

---

## Decision Criteria

* performance considerations — multiple PSR-4 roots add no runtime cost with optimized class maps
* architectural considerations — per-team roots enable clear ownership and reduce merge conflicts
* security considerations — namespace isolation is organizational, not security
* maintainability considerations — per-team roots require documentation and developer training

---

## Decision Tree

Namespace strategy at team scale?
↓
Are 2+ teams sharing the App\ namespace?
YES → Merge conflicts exceed 5/month in shared directories?
    YES → Implement per-team namespace roots with separate PSR-4 mappings
    NO → Are teams requesting file ownership clarity?
        YES → Implement per-team namespace roots
        NO → Monitor — add per-team roots when pain emerges
NO → Single team at scale — domain organization suffices

---

## Rationale

A shared `App\` namespace at 10+ engineers creates daily merge conflicts, unclear file ownership, and naming collisions. Per-team namespace roots make ownership explicit, allow independent file creation, and eliminate cross-team file conflicts.

---

## Recommended Default

**Default:** Implement per-team namespace roots at 10+ engineers across 2+ teams
**Reason:** The shared `App\` namespace becomes a coordination bottleneck. Per-team roots eliminate merge conflicts and clarify ownership. The PSR-4 configuration cost is outweighed by reduced coordination overhead.

---

## Risks Of Wrong Choice

Keeping shared `App\` at scale causes merge conflict chaos and unclear ownership. Implementing per-team roots too early (under 10 engineers) adds unnecessary configuration complexity.

---

## Related Rules

- R01: Give Each Team Its Own Namespace Root with Separate PSR-4 Mapping (COS-10/05-rules.md)
- R02: Ensure No Two Teams Ever Modify the Same File for Different Reasons (COS-10/05-rules.md)

---

## Related Skills

- Scale Code Organization for Multi-Team (10+ Engineers) (COS-10/06-skills.md)
- Configure PSR-4 Autoloading for Custom Directories (COS-03/06-skills.md)

---

## Module-Per-Team vs Domain-Per-Team Organization

---

## Decision Context

At scale, teams can own modules (fully isolated vertical slices with contracts) or domains (business concepts with shared infrastructure). The choice affects independence, contract overhead, and shared resource coordination.

---

## Decision Criteria

* performance considerations — module isolation adds boot overhead; domain sharing is lighter
* architectural considerations — modules provide full isolation; domains share infrastructure
* security considerations — module isolation provides stronger boundaries
* maintainability considerations — modules require more contract overhead; domains require more coordination

---

## Decision Tree

Team ownership structure?
↓
Do teams need independent release cadences?
YES → Module-per-team with explicit contracts and CI isolation
NO → Do teams have clear domain boundaries with minimal overlap?
    YES → Domain-per-team — lighter than modules, sufficient for most
    NO → Are teams cross-functional (each team touches multiple domains)?
        YES → Domain-per-team with shared ownership — strict change management
        NO → Module-per-team — formal contracts prevent coupling

---

## Rationale

Module-per-team provides full isolation with contract overhead. Domain-per-team is lighter but requires more coordination. The choice depends on whether teams need independent deployment and whether domain boundaries align with team structure.

---

## Recommended Default

**Default:** Domain-per-team for 10-20 engineers; module-per-team for 20+ or independent deployment needs
**Reason:** Domain-per-team provides sufficient isolation with less overhead for smaller organizations. Module-per-team becomes necessary as teams grow and require independent release cadences.

---

## Risks Of Wrong Choice

Module-per-team too early adds contract overhead without proportional benefit. Domain-per-team at very large scale causes coordination bottlenecks from shared infrastructure.

---

## Related Rules

- R03: Use Per-Domain Service Providers for Independent Registration (COS-10/05-rules.md)
- R04: Use API-First Internal Communication with Versioned Contracts (COS-10/05-rules.md)

---

## Related Skills

- Scale Code Organization for Multi-Team (10+ Engineers) (COS-10/06-skills.md)
- Map Team Structure to Bounded Contexts (DBC-09/06-skills.md)

---

## Contract-Based Cross-Team Communication vs Shared Models

---

## Decision Context

Teams can communicate through shared models (both access the same database tables) or through contracts (service interfaces, events). The choice determines coupling between teams.

---

## Decision Criteria

* performance considerations — shared models are faster (direct queries); contracts add latency (API calls)
* architectural considerations — contracts decouple teams; shared models create coupling
* security considerations — contracts can enforce data access boundaries; shared models expose data
* maintainability considerations — contracts require maintenance; shared models require coordination

---

## Decision Tree

Cross-team data access pattern?
↓
Do both teams need read access to the same data?
YES → Use service contract — one team exposes a query interface
NO → Does Team A need to notify Team B of an event?
    YES → Use domain event — fire-and-forget
    NO → Do both teams need write access to the same tables?
        YES → Reconsider domain boundaries — ownership is ambiguous
        NO → Use contract — prevents direct coupling

---

## Rationale

Shared models create a single coupling point — schema changes affect all dependent teams. Contracts provide an abstraction layer that insulates teams from internal implementation changes. Events decouple teams further by removing the need for synchronous responses.

---

## Recommended Default

**Default:** Use versioned service contracts for synchronous communication; use events for fire-and-forget
**Reason:** Contracts and events prevent direct coupling between teams. Schema changes behind a contract don't break consumers. Events enable async processing and fault tolerance.

---

## Risks Of Wrong Choice

Shared models at team scale create schema coupling — any table change requires coordinated releases across all teams. Contract overhead without clear benefit adds unnecessary complexity.

---

## Related Rules

- R04: Use API-First Internal Communication with Versioned Contracts (COS-10/05-rules.md)
- R06: Track Merge Conflict Budget — Investigate at 5+ Conflicts/Month (COS-10/05-rules.md)

---

## Related Skills

- Scale Code Organization for Multi-Team (10+ Engineers) (COS-10/06-skills.md)
- Handle Cross-Domain Query Patterns (DBC-07/06-skills.md)
