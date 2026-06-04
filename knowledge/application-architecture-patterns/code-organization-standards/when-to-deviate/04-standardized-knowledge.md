# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: When to deviate from defaults: decision criteria
Knowledge Unit ID: COS-09
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

The decision to deviate from Laravel's default structure is one of the most consequential in a project's lifecycle. Community consensus: start with defaults, deviate only when measurable pain emerges. The threshold is not team size or feature count — it's concrete, recurring friction that defaults cannot address. This KU provides the decision framework for evaluating whether deviation is justified.

---

# Core Concepts

- **Two cost categories**: Setup cost (restructuring, PSR-4 config, tooling) and ongoing cost (training, framework mismatch, package compatibility, code review overhead).
- **Pain-First Model**: Don't deviate until you can name specific friction. "Hard to find code" is not specific. "15 minutes tracing 6 files to understand checkout" is specific.
- **Six-Month Rule**: For new projects, wait six months before deviating. Domain boundaries reveal themselves organically.
- **One Level at a Time**: Deviations should be incremental — hybrid before full domain, subdirectories before modules.

---

# When To Use

- Specific, recurring friction is identified and measurable
- The friction causes measurable productivity loss
- The deviation directly addresses the friction
- Team agrees on the deviation and its costs
- Deviation can be enforced (automated or via code review)

---

# When NOT To Use

- Application is primarily CRUD with simple business rules
- Team is 1-5 developers
- Project expected to live <3 years
- No clear domain boundaries exist
- Can't articulate a specific problem with defaults
- Deviating because "that's what real projects do"

---

# Best Practices

- **Document deviation decisions in an ADR.** WHY: Prevents the next developer from reverting or repeating analysis. Include the problem, alternatives, and expected benefits.
- **Introduce deviations incrementally.** WHY: One-level-at-a-time prevents half-migration — the worst outcome where neither structure is consistently applied.
- **Ensure deviations are enforceable.** WHY: A new directory structure without enforcement degrades within months as files scatter across old and new structures.
- **Evaluate against five questions:** (1) What friction exists? (2) Does the deviation address it? (3) Does benefit exceed cost? (4) Is there a less invasive option? (5) Can it be incremental?

---

# Architecture Guidelines

Justified deviations:
- `app/Services/` when controllers exceed 200 lines
- Domain subdirectories when Models directory has 30+ files
- Full domain structure when clear bounded contexts exist
- Module structure when extraction to microservices is anticipated

Unjustified deviations:
- Repository pattern for all models with no multi-source data
- Clean Architecture from day one for CRUD apps
- Interface-per-service with no second implementation planned

---

# Performance Considerations

- Most deviations don't affect runtime performance.
- Per-domain service providers increase boot time — monitor with 10+ providers.
- Config and route caching mitigates boot-time costs.

---

# Security Considerations

- No direct security impact. However, custom structures can hide security-sensitive code if not well-documented.

---

# Common Mistakes

1. **Pre-emptive architecture:** Building Clean Architecture for a project that doesn't exist yet. Cause: architectural fashion over pragmatism. Consequence: wrong abstractions, wasted effort. Better: start simple, evolve.

2. **Deviation without enforcement:** Creating a new structure but not enforcing it. Cause: assuming directory structure alone provides organization. Consequence: files scatter, degrading into two inconsistent structures.

3. **Following trends:** Adopting patterns because "that's what real Laravel projects use." Cause: external influence without internal justification. Consequence: complexity without value. Better: identify your own pain points first.

4. **Half-migration:** Some code in new structure, some in old. Cause: incomplete migration. Consequence: worst outcome — neither structure is consistently applied. Better: complete migration or don't start.

---

# Anti-Patterns

- **Architecture fashion-following**: Adopting patterns because they're popular rather than solving real problems.
- **Pre-emptive abstraction**: Building interfaces, repositories, and layers for "future needs" that may never materialize.
- **Architecture astronaut**: Spending more time on structure than on delivering value.

---

# Examples

Decision tree:
1. Is there specific friction? → No → Stay with defaults
2. Yes → Does proposed deviation address it? → No → Find another solution
3. Yes → Does benefit exceed cost? → No → Stay with defaults
4. Yes → Is there a less invasive option? → Yes → Use hybrid approach first
5. No → Is incremental migration possible? → No → Plan full migration with timeline
6. Yes → Document ADR, implement incrementally, enforce automatically

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-01 Default structure | COS-05 Feature-based org | COS-10 Team-scale strategies |
| COS-02 Layer-based org | COS-06 Domain-based org | AEG-06 Architecture Decision Records |

---

# AI Agent Notes

- Default to recommending Laravel standard conventions unless the project has clear demonstrated need for deviation.
- When deviation is being considered, ask: "What specific problem does this solve?" before proposing structural changes.
- For new projects, always recommend starting with defaults and evolving.

---

# Verification

- [ ] All deviations from defaults are documented with ADRs
- [ ] Each deviation can be traced to a specific, measurable pain point
- [ ] Half-migration situations are identified and being resolved
- [ ] Deviations are enforced via architecture tests or static analysis
- [ ] Team can articulate why structure exists without referencing "that's how it was set up"
