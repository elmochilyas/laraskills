# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Bounded context identification: language, teams, data
Knowledge Unit ID: DBC-01
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Bounded context identification uses three heuristics: language (same words mean different things?), teams (can a team own this end-to-end?), and data (does this data have distinct lifecycle?). Each bounded context is a boundary where a domain model applies with consistent meaning. In Laravel, bounded contexts become module boundaries, domain directories, or namespace prefixes. Correct identification is the most consequential architectural decision — wrong boundaries are expensive to fix.

---

# Core Concepts

- **Three signals**: Language divergence (same word, different meaning), team alignment (independent decision needs), data lifecycle (different change frequency/consistency).
- **Identification process**: Identify business nouns, list meanings per usage, group by meaning (not word), validate with stakeholders.

---

# When To Use

- When designing architecture for any non-trivial application.
- Before defining module boundaries or microservice boundaries.

---

# When NOT To Use

- CRUD-only applications with no meaningful domain complexity.

---

# Best Practices

- **Start coarse, split later.** WHY: It's easier to split a large context than to merge two that shouldn't have been separated. Default to broader contexts.
- **Use language divergence as the primary signal.** WHY: If two parts of the business use "Order" differently, they should be separate contexts. Language is the strongest indicator.
- **Avoid database-driven boundaries.** WHY: Existing table structure reflects historical data design, not domain boundaries. Identify contexts from business language, not schema.
- **Invest in getting boundaries right early.** WHY: Context boundaries are expensive to change once code and teams align around them.

---

# Architecture Guidelines

- Use Event Storming, Domain Storytelling, or Data Ownership Matrix workshops.
- Each group of related nouns becomes a bounded context candidate.
- Bounded contexts become module boundaries, domain directories, or namespace prefixes.
- Validate with business stakeholders: "Does 'Customer' mean the same thing here?"

---

# Performance Considerations

- No runtime cost. Design-time only (workshops, mapping, documentation).

---

# Security Considerations

- Context boundaries should align with data access boundaries for security.

---

# Common Mistakes

1. **Database-driven boundaries:** Using existing table structure to define contexts. Cause: technical bias. Consequence: boundaries don't align with business language. Better: identify from business conversations.

2. **Team-structure-only boundaries:** Defining contexts solely by team structure. Cause: organizational bias. Consequence: teams can share a context if domain is cohesive. Better: let domain drive boundaries.

3. **Too many contexts:** 20 contexts for a small application. Cause: over-splitting. Consequence: integration overhead dominates. Better: start coarse, split later.

---

# Anti-Patterns

- **Leaky context boundary**: Other contexts directly access models/tables owned by a different context.
- **Boundary erosion**: Changes naturally blur boundaries over time without enforcement.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-02 Boundary identification | DBC-02 Context mapping | DBC-08 Evolutionary boundaries |
| DDD fundamentals | DBC-03 Shared kernel | DBC-09 Team-to-context mapping |

---

# AI Agent Notes

- Default to coarse context boundaries.
- Use language divergence as primary identification signal.
- Context boundaries should align with module boundaries.

---

# Verification

- [ ] Context boundaries identified using language, teams, data signals
- [ ] Boundaries validated with business stakeholders
- [ ] Not driven by database structure
- [ ] Coarse boundaries (can split later if needed)
- [ ] Context map documents relationships
