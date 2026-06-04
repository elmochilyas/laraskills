# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Team-to-context mapping: Conway's Law in practice
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Conway's Law states: "Organizations design systems that mirror their communication structure." In practice, this means each team should own one or more bounded contexts, and each bounded context should be owned by exactly one team. Misaligned ownership—where a bounded context is shared by multiple teams, or a team owns unrelated contexts—causes coordination overhead, conflicting priorities, and architectural degradation.

---

# Core Concepts

**Team owns context:** The team has authority over the context's model, implementation, and schema. They can make changes without coordinating with other teams (subject to contract stability).

**Context owned by one team:** No context is shared between teams. If multiple teams need to modify a context, the context should be split.

**Context boundaries match team boundaries:** The number of contexts roughly equals the number of teams. Fewer contexts than teams means some teams don't have clear ownership.

---

# Mental Models

**The "Reverse Conway" model:** To achieve a desired architecture, restructure the team first. If you want two microservices, create two teams. The architecture will follow.

**The "Team as Context Guardian" model:** The team is responsible for protecting the context's model integrity. They decide what goes in, what stays out, and what the contracts look like.

---

# Internal Mechanics

**Team-to-context mapping document:**
```
| Team | Owns Context(s) | Consumes From |
|---|---|---|
| Platform | Identity, Shared | - |
| Billing | Billing | Identity |
| Catalog | Catalog, Inventory | Identity |
```

---

# Patterns

**Two-pizza team per context:** Each context is owned by a team small enough to be fed with two pizzas (5-8 people). Larger teams should own multiple contexts, not one large context.

**Context ownership in CODEOWNERS:** GitHub's CODEOWNERS file enforces team ownership at the code level:
```
/app/Domains/Billing/ @team-billing
/app/Domains/Catalog/ @team-catalog
```

**Cross-team contract review:** Changes to a context's contracts (interfaces, events) require review by consuming teams.

---

# Architectural Decisions

**Align teams to contexts when:** Team size is >5 engineers, there are multiple distinct business domains, and independent team ownership is valued.

**Merge context ownership when:** A team is too small for its context (1-2 developers), or the context is so stable that active ownership isn't needed.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clear ownership, fast decisions | Context fragmentation if team per sub-domain | Too many small contexts |
| Team autonomy | Cross-team dependency management | Teams waiting for contract changes |
| Accountability | Team knowledge silos | One team knows the billing domain deeply |

---

# Common Mistakes

**Misaligned team/context boundaries:** Two teams modifying the same context. Every change requires cross-team coordination.

**Context without an owner:** A context that was created but no team owns it. It becomes a neglected code area.

**Team owns too many contexts:** A small team owning 5+ contexts. They can't maintain them all. Contexts degrade.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-01 Context identification | COS-10 Team-scale strategies | MMD-17 Modular vs microservices |
| Conway's Law | DBC-08 Evolutionary boundaries | AEG-04 Code review checklists |

---

## Performance Considerations

Identifying bounded context boundaries adds negligible performance overhead at runtime. The cost is at design time: event storming sessions, context mapping workshops, and documentation. Once boundaries are identified, the performance characteristics depend on the communication pattern between contexts. Synchronous calls between contexts add network latency if services are separated. In a modular monolith, context boundaries add no runtime cost.

---

## Production Considerations

Bounded contexts must be enforced in production through CI checks (architecture tests, import rules). Without enforcement, boundaries degrade: cross-context direct model access creeps in, shared database tables emerge, and the bounded context becomes a folder boundary in name only. Production monitoring should track cross-context call volume and latency (if using service-level boundaries). Team ownership should align with context boundaries in production incident response.

---

## Failure Modes

**Leaky context boundary:** Other contexts directly access Eloquent models or database tables owned by a different context. The boundary exists in folder structure but not in runtime enforcement.

**Wrong boundary identification:** Splitting a domain where the concepts are tightly coupled causes transaction and consistency problems. The overhead of coordinating across the boundary exceeds the benefit of separation.

**Boundary erosion over time:** As the codebase evolves, changes naturally blur context boundaries. Regular architecture reviews and automated enforcement are required to maintain integrity.

---

## Ecosystem Usage

Event Storming (Alberto Brandolini) is the most popular technique for bounded context identification. The Context Mapper DSL provides tooling for context mapping. In the Laravel ecosystem, nwidart/laravel-modules and domain-based directory organization are the primary implementation approaches. Eric Evans Domain-Driven Design (2003) remains the definitive reference. Vaughn Vernons Implementing Domain-Driven Design provides practical implementation guidance.

---

## Research Notes

Research in 2025-2026 shows continued adoption of strategic DDD patterns in Laravel. The community consensus favors starting with coarse context boundaries and splitting later over premature fine-grained separation. The bounded context heuristic (language divergence, team alignment, data lifecycle) remains the standard identification approach. Anti-Corruption Layers are increasingly recognized as essential for legacy Laravel application integration.
