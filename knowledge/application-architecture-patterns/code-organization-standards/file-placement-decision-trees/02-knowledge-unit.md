# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: File placement decision trees and team conventions
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

File placement decision trees codify the rules for where new code belongs. They eliminate the most common source of architectural inconsistency: developer uncertainty about where to put a new file. A well-designed decision tree covers the three axes of file placement: domain (which business area), role (which architectural layer), and naming (what to call it). Teams that document and enforce placement rules maintain consistent architecture year after year; teams that don't see progressive structural degradation.

---

# Core Concepts

Every new file prompts three placement questions:
1. **Which domain?** (Billing, Catalog, Identity, Auth, Shared)
2. **Which layer/role?** (Controller, Service, Action, Model, Event, Job, DTO, Request, Resource)
3. **What name?** (What operation does it perform? What entity does it relate to?)

Without explicit rules, developers default to:
- The closest directory that "looks right"
- What they did last time
- What a tutorial did
- "I'll move it later" (never happens)

---

# Mental Models

**The "Branching Logic" model:** File placement is a series of yes/no decisions: "Is this for an existing domain? Yes → Which domain? Billing → Is it a business operation? Yes → Action class → What verb? Create → `CreateInvoice`."

**The "Template-Based" model:** Once the decision path is known, file creation follows a template. `php artisan make:action Billing/CreateInvoice` would be the ideal developer experience.

**The "Convention Over Configuration" model:** The rules should be simple enough that most files follow them automatically. If the decision tree has more than 5 branches, the conventions are too complex.

---

# Internal Mechanics

Decision trees are implemented as:
1. **Documented rules:** CONTRIBUTING.md or ADVENT.md with flowcharts or decision tables.
2. **Artisan generators:** Custom `make:` commands that enforce placement rules.
3. **Code review checklist items:** "Verify file is in the correct domain directory."
4. **Static analysis rules:** PHPStan/Pest rules that flag misplaced files (see AEG-01, AEG-03).

---

# Patterns

**The Three-Question Rule:** For any new file, the developer must answer:
1. What business concept does this serve?
2. What does this code do (orchestrate, execute, store, transform)?
3. Where have we put similar files before?

**Primary axis determines directory structure:** Does your team organize by domain or by layer? The answer determines whether the first subdirectory is the domain name or the technical layer.

**The "90% Rule":** 90% of files should follow the standard decision tree. The remaining 10% (edge cases, cross-cutting concerns, infrastructure) need explicit discussion.

---

# Architectural Decisions

**Decision tree for a hybrid domain-layer structure:**
```
New file needed
├── Cross-cutting concern? → app/Http/, app/Providers/, config/
│   ├── Middleware → app/Http/Middleware/
│   ├── Form Request → app/Http/Requests/
│   ├── Service Provider → app/Providers/
│   └── Configuration → config/
├── Specific business domain?
│   ├── Which domain?
│   │   ├── Billing → app/Domains/Billing/
│   │   ├── Catalog → app/Domains/Catalog/
│   │   └── Identity → app/Domains/Identity/
│   ├── What layer?
│   │   ├── Controller → Http/Controllers/
│   │   ├── Service → Services/
│   │   ├── Action → Actions/
│   │   ├── Model → Models/
│   │   ├── Event → Events/
│   │   ├── Job → Jobs/
│   │   └── DTO → Data/
│   └── What name?
│       ├── Operation (verb+noun) → CreateInvoice
│       └── Entity reference → InvoiceController
└── Unsure? → Discuss with team (do not guess)
```

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Consistent file placement across team | Decision tree creation and maintenance | Must be documented and reviewed |
| New developers learn structure quickly | Rigid rules don't cover all cases | Edge cases require judgment calls |
| Code review can verify placement | Over-reliance on rules reduces critical thinking | Developers may stop thinking about architecture |
| Automated enforcement possible | Changes to structure require tree updates | Updating domain structure updates the decision tree |

---

# Performance Considerations

No performance impact from decision trees themselves. However, the chosen directory structure (deep nesting, many domains) affects CD/CI pipeline performance for file-watching operations.

---

# Production Considerations

Place the decision tree in a visible location: CONTRIBUTING.md, project README, or a dedicated `ARCHITECTURE.md`. Include examples for common file types.

Review the decision tree quarterly. As the application evolves, new patterns emerge that may not fit the existing tree.

---

# Common Mistakes

**Overly complex decision trees:** A decision tree with 20+ branches is not useful. If placement requires a flowchart, simplify the directory structure instead.

**No fallback rule:** The decision tree must include "What if I still don't know?" — the answer should be "ask in the team channel" or "put it in a `_pending/` directory for review."

**Perfect decision tree at project start:** Building the decision tree before the application exists is premature. Let the first 3-6 months of code reveal the natural patterns, then codify them.

---

# Failure Modes

**Decision tree ignored:** If the tree exists but team members don't follow it, either the tree is wrong (doesn't match reality) or enforcement is missing.

**Decision tree outdated:** A tree that wasn't updated when the directory structure changed becomes misleading. Developers follow stale rules.

---

# Ecosystem Usage

Tighten's team conventions include explicit file placement guidelines. Spatie's open source repositories follow consistent patterns documented in CONTRIBUTING. The `laravel-ddd-toolkit` package generates files following a predefined decision tree. Modulate's scaffolding enforces placement conventions.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-04 Namespace conventions | COS-08 Naming conventions | AEG-07 Team convention documentation |
| COS-09 When to deviate | COS-05 Feature-based org | AEG-04 Code review checklists |

---

## Research Notes

Research into Laravel code organization patterns in 2025-2026 reveals a strong community consensus around action classes and domain-based organization. Stu Mason's 2026 analysis documents how Laravel 12's streamlined bootstrap/app.php centralizes middleware, exception handling, and routing configuration. Jeffrey Davidson's "How I Structure Every Laravel Project" advocates for thin controllers, single-purpose Action classes, and DTOs for type safety. The community overwhelmingly recommends starting with the default structure and evolving toward feature or domain organization only when measurable pain emerges. The 
widart/laravel-modules package and spatie/laravel-query-builder represent the most popular third-party extensions to the default structure.
