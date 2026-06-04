# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Evolutionary boundaries: splitting a monolithic model
Knowledge Unit ID: DBC-08
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Evolutionary boundaries recognizes that context boundaries emerge over time; they aren't perfectly identified upfront. Splitting a monolithic model into bounded contexts is common but risky. Process: identify divergent concepts within the model (different meanings, change rates, teams), extract one concept at a time, introduce contracts, migrate consumers incrementally. The split should be guided by concrete pain — not theoretical purity.

---

# Core Concepts

- **Signals for splitting**: Same class has 50+ methods serving different needs. Changes to one part break unrelated features. Different teams modifying same file. Model name lost specific meaning.
- **Process**: Identify divergent concepts → extract one concept → create new context → define contract → move code incrementally → redirect consumers → remove old code.

---

# When To Use

- Concrete pain exists: bugs from model confusion, team coordination overhead, change conflict frequency.

---

# When NOT To Use

- Model is cohesive (all parts change together) and single team owns it.
- Splitting would add complexity without benefit.

---

# Best Practices

- **Split incrementally, not via big bang.** WHY: Trying to split the model in one effort breaks the application for weeks. Always extract one concept at a time. Old code stays until new code replaces it.
- **Use parallel implementation.** WHY: The new context is built alongside the old model. Both coexist. Consumers migrate one by one. No downtime.
- **Split based on concrete pain, not theoretical purity.** WHY: Splitting a working model because "it's the right thing to do" may not justify the cost. Wait for measurable pain.
- **Treat boundaries as hypotheses.** WHY: First attempts at boundaries may be wrong. Expect to adjust.

---

# Architecture Guidelines

- Strangler Fig pattern for models: incrementally extract responsibilities.
- The old model becomes a facade delegating to new contexts during migration.
- Split a monolithic repository into context-specific repositories.
- Don't rewrite — extract incrementally.

---

# Performance Considerations

- No runtime cost during normal operation. During split, old and new structures coexist.

---

# Security Considerations

- Security boundaries should be re-evaluated when splitting contexts.

---

# Common Mistakes

1. **Big-bang split:** Trying to split in one effort. Cause: enthusiasm. Consequence: application broken for weeks. Better: incremental extraction.

2. **Perfect split on first attempt:** Expecting exact boundaries. Cause: perfectionism. Consequence: reluctant to adjust. Better: boundaries are hypotheses, adjust as needed.

3. **Splitting without concrete pain:** Splitting because "it's right." Cause: theoretical purity. Consequence: cost not justified. Better: wait for measurable pain.

---

# Anti-Patterns

- **Analysis paralysis**: Spending months designing the perfect split instead of extracting incrementally.
- **Split and abandon**: New context created but old code never removed.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-01 Context identification | DBC-09 Team-to-context mapping | LAP-12 Incremental migration |
| DBC-05 Model ownership | MMD-11 Module extraction | AEG-09 Refactoring remediation |

---

# AI Agent Notes

- Default to incremental extraction, not big-bang splits.
- Keep old model as facade during migration.
- Extract the most independent concept first.

---

# Verification

- [ ] Split is incremental, not big-bang
- [ ] Split guided by concrete pain (not theory)
- [ ] Old and new coexist during migration
- [ ] Consumers migrated one by one
- [ ] Old code removed after full migration
