# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Bounded context identification: language, teams, data
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Bounded context identification uses three heuristics: language (do the same words mean different things?), teams (can a team own this end-to-end?), and data (does this data have a distinct lifecycle?). Each bounded context is a boundary where a domain model applies with consistent meaning. In Laravel, bounded contexts become module boundaries, domain directories, or namespace prefixes. Correct identification is the most consequential architectural decision—wrong boundaries are expensive to fix.

---

# Core Concepts

**Three signals for bounded context:**
1. **Language divergence:** Same word, different meaning. "Customer" in Sales means "buyer"; in Support means "ticket creator"; in Shipping means "address recipient."
2. **Team alignment:** Different teams need to make independent decisions about the concept.
3. **Data lifecycle:** Different change frequency, different consistency requirements.

---

# Mental Models

**The "Same Word, Different Meaning" model:** If two parts of the business use "Order" differently, they should be separate contexts. In Sales, Order is a cart. In Fulfillment, Order is a shipment request. In Accounting, Order is a financial record.

**The "Team Boundary" model:** If two teams need to modify the same file set independently, those files belong to separate contexts.

**The "Different Change Rates" model:** If "Product" data (description, price) changes daily but "Product" inventory data changes every minute, they may need separate contexts despite sharing the same word.

---

# Internal Mechanics

**Identification process:**
1. Identify business nouns (User, Order, Product, Invoice, Payment)
2. For each noun, list all places it's used and what it means there
3. Group by meaning, not by word
4. Validate with business stakeholders: "Does 'Customer' mean the same thing here?"
5. Each group becomes a bounded context candidate

---

# Patterns

**Event storming:** Workshop technique where business events are mapped to identify context boundaries. Events that naturally group together belong to the same context.

**Domain storytelling:** Walk through business processes. Where responsibility hands off between people/teams/systems is a context boundary.

**Data ownership matrix:** Map each data entity to the team that is the authoritative source. Teams that own separate authoritative sources are separate contexts.

---

# Architectural Decisions

**Context boundaries should be stable:** Once identified, they're expensive to change. Invest in getting them right early.

**Start coarse, split later:** It's easier to split a large context than to merge two that shouldn't have been separated. Default to broader contexts.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clear domain ownership | Boundary identification takes effort | Wrong boundaries require painful restructuring |
| Team independence | Cross-context communication overhead | Every boundary crossing needs contract or event |
| Language clarity | Context mapping required | Must document relationships between contexts |

---

# Common Mistakes

**Database-driven boundaries:** Using existing table structure to define contexts. Tables reflect historical data design, not domain boundaries.

**Team-structure-only boundaries:** Defining contexts solely by team structure. Teams can share a context if the domain is cohesive.

**Too many contexts:** 20 contexts for a small application. Contexts should be coarse enough to provide value but not so fine-grained that integration overhead dominates.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-02 Boundary identification | DBC-02 Context mapping | DBC-08 Evolutionary boundaries |
| DDD fundamentals | DBC-03 Shared kernel | DBC-09 Team-to-context mapping |

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
