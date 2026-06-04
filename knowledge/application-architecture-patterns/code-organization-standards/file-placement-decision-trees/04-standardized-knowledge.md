# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: File placement decision trees and team conventions
Knowledge Unit ID: COS-12
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

File placement decision trees codify the rules for where new code belongs. They eliminate the most common source of architectural inconsistency: developer uncertainty about where to put a new file. A well-designed tree covers three axes: domain (which business area), role (which architectural layer), and naming (what to call it). Teams that document and enforce placement rules maintain consistent architecture; teams that don't see progressive structural degradation.

---

# Core Concepts

Every new file prompts three placement questions:
1. **Which domain?** (Billing, Catalog, Identity, Auth, Shared)
2. **Which layer/role?** (Controller, Service, Action, Model, Event, Job, DTO, Request, Resource)
3. **What name?** (What operation? What entity?)

Without explicit rules, developers default to closest-looking directory, last time's location, tutorial patterns, or "I'll move it later" (never happens).

---

# When To Use

- Teams of 5+ engineers working on the same codebase
- Any project with custom directory structure beyond defaults
- Onboarding new developers to understand code organization
- After 3-6 months of code exists to reveal natural patterns

---

# When NOT To Use

- Prototypes or throwaway projects
- Single-developer projects
- Before the project has existed long enough to reveal patterns
- When the directory structure is so simple that placement is obvious

---

# Best Practices

- **Use the Three-Question Rule** for every new file. WHY: Domain, role, and name are the three axes that determine placement. Answering them prevents guessing.
- **Keep decision trees under 5 branches.** WHY: A tree with 20+ branches is not useful — if placement requires a flowchart, simplify the structure instead.
- **Include a fallback rule.** WHY: The tree must answer "What if I still don't know?" — answer should be "ask in team channel" or "use `_pending/` directory." Without fallback, developers guess.
- **Let patterns emerge before codifying.** WHY: Building the decision tree before the application exists is premature. Let 3-6 months of code reveal natural patterns.
- **Review the tree quarterly.** WHY: As the application evolves, new patterns emerge that may not fit the existing tree. Outdated trees become misleading.
- **Implement enforcement via code review and static analysis.** WHY: Documented rules alone are insufficient — automated checks catch violations.

---

# Architecture Guidelines

- The primary axis (domain vs. layer) determines whether the first subdirectory is domain name or technical layer.
- Decision trees are implemented as documented rules, custom Artisan generators, code review checklists, and static analysis rules.
- 90% of files should follow the standard tree; 10% (edge cases) need explicit discussion.
- Place the decision tree in a visible location: CONTRIBUTING.md, ARCHITECTURE.md, or README.

---

# Performance Considerations

- No performance impact from decision trees themselves.
- Chosen directory structure (deep nesting, many domains) affects CI pipeline performance for file-watching operations.

---

# Security Considerations

- File placement decisions should not affect security boundaries — security is applied via middleware, policies, and authentication, not directory structure.

---

# Common Mistakes

1. **Overly complex decision trees:** A tree with 20+ branches. Cause: trying to cover every edge case. Consequence: nobody uses it. Better: simplify the directory structure instead.

2. **No fallback rule:** Developer can't find their case in the tree. Cause: tree incomplete. Consequence: developer guesses. Better: always include "ask the team" as the terminal branch.

3. **Perfect tree at project start:** Building the tree before code exists. Cause: over-planning. Consequence: tree doesn't match reality. Better: let patterns emerge first.

4. **Tree not updated:** Tree exists but doesn't reflect current structure. Cause: no maintenance cycle. Consequence: misleading — worse than no tree. Better: quarterly review.

---

# Anti-Patterns

- **Orphaned decision tree**: Tree exists but nobody follows it — either wrong or enforcement is missing.
- **Flowchart-as-documentation**: A complex flowchart that's harder to follow than just guessing placement.

---

# Examples

Hybrid domain-layer decision tree:
```
New file needed
├── Cross-cutting concern?
│   ├── Middleware → app/Http/Middleware/
│   ├── Form Request → app/Http/Requests/
│   ├── Service Provider → app/Providers/
│   └── Configuration → config/
├── Specific business domain?
│   ├── Billing → app/Domains/Billing/
│   │   ├── Controller → Http/Controllers/
│   │   ├── Service → Services/
│   │   ├── Action → Actions/
│   │   ├── Model → Models/
│   │   └── Event → Events/
│   ├── Catalog → app/Domains/Catalog/
│   └── Identity → app/Domains/Identity/
└── Unsure? → Discuss with team
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-04 Namespace conventions | COS-08 Naming conventions | AEG-07 Team convention documentation |
| COS-09 When to deviate | COS-05 Feature-based org | AEG-04 Code review checklists |

---

# AI Agent Notes

- When generating new files, first determine the project's organizational axis (domain or layer).
- Follow the project's existing placement patterns — look at similar existing files.
- If unsure where to place generated code, ask the user rather than guessing.

---

# Verification

- [ ] File placement decision tree is documented and accessible
- [ ] Tree covers domain, role, and naming questions
- [ ] Fallback rule exists for uncertain cases
- [ ] Tree is reviewed quarterly for accuracy
- [ ] Code review checklist includes placement verification
- [ ] 90%+ of new files follow the standard tree without discussion
