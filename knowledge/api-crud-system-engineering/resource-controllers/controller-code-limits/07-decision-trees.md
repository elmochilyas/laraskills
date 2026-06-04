# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Resource Controllers
**Knowledge Unit:** Controller Code Limits
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Limit Enforcement Strategy

---

## Decision Context

Choosing the appropriate code limit strategy (file length, method length, method count) for controllers based on team maturity and codebase age.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is this a new project or existing codebase with fat controllers?
├── New project → Set strict limits from day one
│   ├── Max 200 lines per file, 15 lines per method, 7 methods per controller
│   └── Enforce via PHPStan in CI
└── Existing codebase → Graduated enforcement
    ├── Phase 1: Measure and baseline current controller sizes
    ├── Phase 2: Set 300-line limit as warning (catch new bloat)
    ├── Phase 3: Tighten to 200-line limit after refactoring
    └── Phase 4: Add method-level limit (15 lines per method)

Which limits provide the most value?
├── File-level limit (200 lines) — prevents controller god classes
├── Method-level limit (15 lines) — prevents Swiss-army-knife methods
└── Method count limit (7 methods) — enforces resource controller contract

---

## Rationale

Controllers that grow beyond reasonable size become maintenance liabilities. Code limits impose a structural discipline that forces decomposition. Start generous and tighten over time.

---

## Recommended Default

**Default:** 200 lines per file, 15 lines per method, 7 methods per controller
**Reason:** Matches the resource controller pattern and forces decomposition at the right thresholds.

---

## Risks Of Wrong Choice

No limits allow controllers to grow into god classes over time. Too-strict limits without gradual rollout cause team pushback. File-level limit alone misses single 120-line methods.

---

## Related Rules

* Enforce Maximum Controller File Length
* Enforce Maximum Method Length
* Limit Public Methods Per Controller
* Count Logical Lines Excluding Comments

---

## Related Skills

* Enforce Maximum Method Lines and Cyclomatic Complexity in Controllers
