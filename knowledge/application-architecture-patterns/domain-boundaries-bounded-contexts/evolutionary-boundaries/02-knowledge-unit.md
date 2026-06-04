# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Evolutionary boundaries: splitting a monolithic model
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Evolutionary boundaries recognize that context boundaries emerge over time; they aren't perfectly identified upfront. Splitting a monolithic model into bounded contexts is a common but risky refactoring. The process follows: identify divergent concepts within the model (different meanings, different change rates, different teams), extract one concept at a time into a new context, introduce contracts for cross-context communication, and migrate consumers incrementally. The split should be guided by concrete pain—not theoretical purity.

---

# Core Concepts

**Signals that a model needs splitting:**
- The same class has 50+ methods serving different business needs
- Changes to one part of the model break unrelated features
- Different teams need to modify the same file for different reasons
- The model name has lost specific meaning ("Order" means too many things)

---

# Mental Models

**The "Strangler Fig" for models:** Don't rewrite the model. Incrementally extract responsibilities into new contexts. Old code stays until new code replaces it.

**The "Extract Class" at scale:** You'd extract a large PHP class into smaller ones. Evolutionary boundary splitting is the same operation at the architectural level.

---

# Internal Mechanics

**Splitting process:**
1. Identify divergent concepts within the monolithic model
2. Choose one concept to extract (the most independent one)
3. Create a new context/namespace for the extracted concept
4. Define the contract between old and new contexts
5. Move code incrementally (not all at once)
6. Redirect consumers to the new contract
7. Remove old code when all consumers are migrated

---

# Patterns

**Parallel implementation:** The new context is built alongside the old model. Both coexist. Consumers migrate one by one.

**Facade old model:** The old model becomes a facade that delegates to the new contexts. This enables gradual migration without breaking existing consumers.

**Repository separation:** Split a monolithic repository into context-specific repositories. Each repository only handles queries for its context.

---

# Architectural Decisions

**Split when:** Concrete pain exists: bugs from model confusion, team coordination overhead, or change conflict frequency.

**Don't split when:** The model is cohesive (all parts change together) and a single team owns it. Splitting would add complexity without benefit.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clearer domain boundaries | Migration takes months | Both old and new structures coexist |
| Team independence | Risk of splitting incorrectly | Wrong split is painful to undo |
| Independent evolution | Temporary duplication | Old model and new context overlap during migration |

---

# Common Mistakes

**Big-bang split:** Trying to split the model in one effort. The application breaks for weeks. Always split incrementally.

**Perfect split on first attempt:** Expecting to get boundaries exactly right. Boundaries are hypotheses; they may need adjustment.

**Splitting without concrete pain:** Splitting a working model because "it's the right thing to do." The cost may not be justified.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| DBC-01 Context identification | DBC-09 Team-to-context mapping | LAP-12 Incremental migration |
| DBC-05 Model ownership | MMD-11 Module extraction | AEG-09 Refactoring remediation |

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
