# Metadata

Domain: Application Architecture Patterns
Subdomain: Domain Boundaries and Bounded Contexts
Knowledge Unit: Team-to-context mapping: Conway's Law in practice
Knowledge Unit ID: DBC-09
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Conway's Law: "Organizations design systems that mirror their communication structure." In practice, each team should own one or more bounded contexts, and each bounded context should be owned by exactly one team. Misaligned ownership — shared context or team owning unrelated contexts — causes coordination overhead, conflicting priorities, and architectural degradation.

---

# Core Concepts

- **Team owns context**: Authority over model, implementation, schema. Changes without cross-team coordination (subject to contract stability).
- **Context owned by one team**: No context shared between teams. If multiple teams need to modify a context, split it.
- **Reverse Conway**: To achieve a desired architecture, restructure the team first.

---

# When To Use

- Team size >5 engineers, multiple distinct business domains, independent team ownership valued.

---

# When NOT To Use

- Team too small (1-2 devs) — merge context ownership.
- Context is stable — active ownership not needed.

---

# Best Practices

- **Each bounded context has exactly one owning team.** WHY: Shared contexts require cross-team coordination for every change. Split contexts to match team boundaries.
- **Use CODEOWNERS to enforce context ownership.** WHY: GitHub's CODEOWNERS file enforces team ownership at the code level. PRs touching a context require that team's approval.
- **Require cross-team contract review.** WHY: Changes to a context's contracts (interfaces, events) require review by consuming teams. Protects consumers from breaking changes.
- **One team should not own more than 2-3 contexts.** WHY: A small team owning 5+ contexts can't maintain them all. Contexts degrade.

---

# Architecture Guidelines

- Number of contexts roughly equals number of teams.
- Fewer contexts than teams means some teams lack clear ownership.
- Team-to-context mapping documented in a matrix: Team → Owned Contexts → Consumed Contexts.
- Two-pizza team (5-8 people) per context as guideline.

---

# Performance Considerations

- No runtime cost. Organizational alignment affects development speed, not runtime performance.

---

# Security Considerations

- Team ownership provides accountability for data access and security decisions within the context.

---

# Common Mistakes

1. **Misaligned team/context boundaries:** Two teams modifying the same context. Cause: no Conway's Law awareness. Consequence: every change needs cross-team coordination. Better: split the context.

2. **Context without an owner:** Created but no team owns it. Cause: abandoned. Consequence: neglected code area. Better: assign ownership.

3. **Team owns too many contexts:** Small team owning 5+ contexts. Cause: context proliferation. Consequence: can't maintain all. Better: merge or reassign.

---

# Anti-Patterns

- **Context shared across teams**: Multiple teams responsible for one context. Coordination overhead dominates.
- **Orphaned context**: No team owns it — nobody is accountable.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| DBC-01 Context identification | COS-10 Team-scale strategies | MMD-17 Modular vs microservices |
| Conway's Law | DBC-08 Evolutionary boundaries | AEG-04 Code review checklists |

---

# AI Agent Notes

- Map teams to contexts in project documentation.
- Use CODEOWNERS to enforce ownership.
- Default to one team per context.

---

# Verification

- [ ] Each context has exactly one owning team
- [ ] No context is shared across teams
- [ ] No context is orphaned (no owner)
- [ ] No team owns more than 3 contexts
- [ ] Team-to-context mapping is documented
