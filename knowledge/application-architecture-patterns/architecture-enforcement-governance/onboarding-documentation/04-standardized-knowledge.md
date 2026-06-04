# Metadata

Domain: Application Architecture Patterns
Subdomain: Architecture Enforcement and Governance
Knowledge Unit: Onboarding documentation for architecture
Knowledge Unit ID: AEG-10
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Onboarding documentation for architecture is a structured introduction to the codebase's architectural decisions and conventions. It is the first document new developers read. It covers: bounded contexts map, dependency direction, contract system, common patterns, and reference material. The onboarding doc accelerates a new developer's ability to contribute without introducing architectural violations.

---

# Core Concepts

- **Architecture onboarding doc:** A concise document (5-10 pages) that gives a new developer the mental model of the system. It covers what exists, why it exists, and how to work within it.
- **Bounded context map:** A visual or textual diagram showing each context, its responsibilities, and its allowed dependencies. The most critical artifact for onboarding.
- **Pattern reference:** An annotated list of the most common patterns in the codebase (service, action, event, command) with a link to an example implementation.

---

# When To Use

- Onboarding new developers to the codebase.
- Documenting the architecture for team-wide reference.

---

# When NOT To Use

- Replacing detailed reference documentation (the onboarding doc is a guided tour, not a reference manual).

---

# Best Practices

- **Keep the onboarding doc living.** WHY: Updated when new contexts are added or conventions change. An outdated onboarding doc is worse than none — it teaches incorrect patterns.
- **Keep it small (5-10 pages).** WHY: If longer, split into reference docs and keep the onboarding doc as a guided tour. A new developer should be able to read it in one sitting.
- **Use example-first documentation.** WHY: Each pattern is demonstrated with before/after examples. Developers learn patterns by seeing real code transformations. Abstract descriptions are less effective.
- **Provide an onboarding checklist.** WHY: A step-by-step checklist the new developer follows. Each step maps to a document to read or a task to perform. Checklist prevents missing critical information.
- **Gate by architecture tests.** WHY: The onboarding process ends when the developer can make a change that passes architecture tests without violating rules. This confirms readiness.

---

# Architecture Guidelines

- Onboarding doc: 5-10 pages, in the repository.
- Contains: bounded context map, dependency direction, contract system, common patterns.
- Example-first documentation for each pattern.
- Onboarding checklist with step-by-step instructions.
- Gated by passing architecture tests.
- Updated when architecture changes.
- Link to ADRs, convention doc, and architecture tests.

---

# Performance Considerations

- Documentation only. No performance impact.

---

# Security Considerations

- Onboarding doc should cover security patterns and where security checks are enforced.

---

# Common Mistakes

1. **No onboarding doc:** New developers learn by asking questions. Cause: not creating one. Consequence: senior developers become bottlenecks; knowledge is uneven. Better: have an onboarding doc in the repo.

2. **Outdated onboarding doc:** The doc describes the old architecture. Cause: not updating when architecture changes. Consequence: new developers learn incorrect patterns and must relearn. Better: keep the doc living.

3. **Onboarding doc as fire hose:** All information dumped at once. Cause: trying to be comprehensive. Consequence: the developer is overwhelmed. Better: structure as progressive learning, not a reference manual.

---

# Anti-Patterns

- **Sink-or-swim onboarding**: No documentation. New developers figure it out alone.
- **Outdated onboarding**: The doc describes a different architecture. Teaches the wrong patterns.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| AEG-06 ADRs | AEG-07 Team convention docs | COS-09 Developer experience |
| AEG-01 Architecture testing | AEG-04 Code review guardrails | DBC-01 Bounded context basics |

---

# AI Agent Notes

- Maintain a 5-10 page onboarding doc in the repository.
- Include bounded context map, dependency direction, and pattern reference.
- Use example-first documentation.
- Gate onboarding completion on passing architecture tests.

---

# Verification

- [ ] Onboarding doc exists in the repository
- [ ] Doc includes bounded context map
- [ ] Doc includes dependency direction rules
- [ ] Doc includes pattern reference with examples
- [ ] Doc is 5-10 pages (guided tour, not reference manual)
- [ ] Doc is updated when architecture changes
- [ ] Onboarding process is gated by passing architecture tests
