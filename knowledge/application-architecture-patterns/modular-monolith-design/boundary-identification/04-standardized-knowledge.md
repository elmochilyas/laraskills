# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module boundary identification: bounded context heuristics
Knowledge Unit ID: MMD-02
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Module boundaries are determined by business domain boundaries, not technical convenience. The primary heuristic: do the same words (User, Order, Account) mean different things in different contexts? Other heuristics include team ownership, data lifecycle, change frequency, and business capability distinctness.

---

# Core Concepts

- **Language divergence**: Same word means different things in different contexts — clear boundary signal.
- **Data lifecycle**: Different change patterns indicate separate modules.
- **Team alignment**: Can one team own this end-to-end?
- **Change frequency**: Concepts changing for different reasons should be separate.
- **Business capability**: Does this represent a distinct business capability?

---

# When To Use

- Designing a new modular monolith from scratch
- Refactoring an existing monolith into modules
- Evaluating whether current module boundaries are correct

---

# When NOT To Use

- Single-domain application where all concepts are tightly coupled
- Prototype where module boundaries are not yet discoverable

---

# Best Practices

- **Use language divergence as the primary signal.** WHY: If "Customer" means different things in different contexts, that's the clearest indicator of a boundary. Validate with domain experts.
- **Start broad, split later.** WHY: Module boundaries are easier to split than merge. Begin with broader boundaries and split as divergence emerges.
- **Use event storming workshops** to discover bounded contexts. WHY: Domain experts and developers mapping business events together reveals natural boundaries.
- **Document boundary rationale in ADRs.** WHY: Include context name, owned concepts, exposed interfaces, and dependencies. Prevents future confusion about why boundaries exist.

---

# Architecture Guidelines

- Module boundary is right when: a team owns it independently, concept has clear definition within the boundary, changes rarely require cross-boundary coordination.
- Module boundary is wrong when: every change touches multiple modules, or same concept has fragmented logic across modules.
- Avoid technical boundaries (API Module, Admin Module) — use business domain boundaries (Billing Module, Catalog Module).
- Avoid database-driven boundaries — tables reflect historical design, not necessarily business domains.

---

# Performance Considerations

- More modules = more inter-module communication overhead.
- Very fine-grained modules (10+ for one database) create cross-module query overhead.

---

# Security Considerations

- Module boundaries do not provide security isolation — authentication still applies globally.

---

# Common Mistakes

1. **Technical boundaries, not business boundaries:** Creating modules by technical layer instead of business domain. Cause: developer-centric thinking. Consequence: modules don't align with business needs. Better: identify business domains first.

2. **Database-driven boundaries:** Using existing tables as module boundaries. Cause: convenience. Consequence: tables reflect historical design, not business domains. Better: re-evaluate boundaries from business perspective.

3. **Too fine-grained from start:** Creating 15 modules for 3-developer team. Cause: over-engineering. Consequence: overhead consumes development capacity. Better: start with 3-5 modules, split as needed.

---

# Anti-Patterns

- **Wrong boundary discovered too late**: Two "modules" should share a model — merging is expensive.
- **Context conflation**: Billing and Subscriptions treated as one module due to shared tables — separation requires data migration.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-01 Module vs microservice | DBC-01 Bounded context ID | DBC-02 Context mapping |
| DDD basics | MMD-03 Module internal structure | DBC-08 Evolutionary boundaries |

---

# AI Agent Notes

- When generating module structures, use business domain names not technical layer names.
- If uncertain about boundaries, suggest broader rather than narrower modules.
- Use language divergence as the primary signal for suggesting splits.

---

# Verification

- [ ] Module boundaries are based on business domains, not technical layers
- [ ] Boundary rationale is documented in ADRs
- [ ] Language divergence between modules is documented
- [ ] Module count is appropriate for team size (3-8 for most teams)
- [ ] Start broad, split later principle is followed
