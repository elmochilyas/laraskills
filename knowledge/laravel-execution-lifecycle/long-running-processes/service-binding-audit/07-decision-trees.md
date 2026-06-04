# Decision Trees: Service Binding Audit

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Knowledge Unit:** Service Binding Audit
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Decision Inventory

| Decision ID | Title | Category | Complexity | Frequency |
|---|---|---|---|---|
| DT-SA-01 | Binding Audit Priority and Scoping | Architecture | Medium | Per pre-Octane deployment |
| DT-SA-02 | Transitive Dependency Contamination | Architecture | High | Per binding classification |
| DT-SA-03 | CI Governance for New Bindings | Maintainability | Medium | Per CI setup |

---

## DT-SA-01: Binding Audit Priority and Scoping

### Decision Context
- **When to decide:** Starting a binding audit for Octane readiness
- **Stakeholders:** Backend Developers
- **Trigger:** Pre-Octane deployment or quarterly re-audit
- **Constraint:** Full audit is time-consuming; must prioritize high-risk bindings

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Binding type | High | singleton/scoped vs transient — only shared bindings matter |
| State sensitivity | High | Auth, tenant, session = highest risk |
| Dependency depth | Medium | Deeper dependency graphs need more tracing |

### Decision Tree

```
What type of binding is being audited?
├── bind() or bindIf() (transient, non-shared)
│   └── SAFE by construction — new instance per resolve
│       └── Skip audit — no risk of cross-request state leaks
│
├── singleton() or shared: true
│   ├── Does it store mutable per-request data?
│   │   ├── Yes — UNSAFE — must fix (convert to scoped or stateless redesign)
│   │   │   └── Priority: HIGH (data leak risk)
│   │   │       ├── CRITICAL: Auth guards, session, tenant resolver
│   │   │       ├── HIGH: Payment services, config mutators
│   │   │       └── MEDIUM: Caching layers, accumulators
│   │   │
│   │   └── No — check dependency graph
│   │       └── Dependencies safe? → SAFE singleton
│   │           └── Priority: LOW (no action needed)
│   │
│   └── (only shared bindings require audit)
│
├── scoped()
│   └── REVIEW — verify lifecycle activates correctly
│       └── Check: Is provider implementing OctaneSandbox?
│           ├── Yes → likely correct
│           └── No → may need OctaneSandbox implementation
│
└── instance() or singleton(..., fn) with closure
    └── UNSAFE by default — inspect closure for state mutations
```

### Rationale
Only shared bindings (`singleton()`, `scoped()`, `instance()`) require audit — transient bindings produce new instances per resolve and are inherently safe. Among shared bindings, prioritize by data sensitivity: auth and tenant bindings pose the highest risk of data leakage.

### Default Path
Generate automated binding inventory. Classify each shared binding. Prioritize by risk (CRITICAL > HIGH > MEDIUM > LOW). Fix CRITICAL bindings first regardless of difficulty.

### Risks
- Missing vendor package bindings — audit only application code while package singletons leak
- Assuming safe based on direct state only — missing transitive contamination through dependencies
- Over-classifying: marking safe stateless singletons as unsafe — unnecessary remediation work

### Related Rules/Skills
- Generate an automated binding inventory before every audit
- Classify bindings into three risk categories
- Skill: Generate Service Binding Inventory and Risk Matrix

---

## DT-SA-02: Transitive Dependency Contamination

### Decision Context
- **When to decide:** When classifying a singleton as safe
- **Stakeholders:** Backend Developers
- **Trigger:** Evaluating a singleton with no direct mutable state
- **Constraint:** A safe singleton depending on unsafe singleton is itself unsafe

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| Dependency graph depth | High | Trace 2+ levels for full safety picture |
| Dependency state mutability | High | Does any dependency hold per-request state? |
| Resolution time | Medium | Lazy vs eager resolution affects contamination exposure |

### Decision Tree

```
Does the singleton have constructor dependencies that are also shared bindings?
├── No — no dependencies or only transient/bind dependencies
│   └── Direct safe classification stands
│       └── Mark as SAFE SINGLETON
│
├── Yes — depends on other shared bindings
│   └── Trace dependency graph:
│       ├── For each dependency, check classification:
│       │   ├── All dependencies are SAFE → this binding is SAFE
│       │   └── Any dependency is UNSAFE → this binding is transitively UNSAFE
│       │
│       └── Example:
│           ├── PaymentGateway (singleton) — looks safe
│           ├── └─ depends on AuthManager (singleton) — UNSAFE
│           └── PaymentGateway is transitively UNSAFE
│
└── (trace all shared dependencies recursively to 2+ levels)
```

### Rationale
Transitive contamination is the most common audit miss. A singleton that appears safe (no direct mutable state) may depend on another singleton that stores per-request data. When resolved, the safe singleton receives a reference to the unsafe dependency's instance — inheriting the leak.

### Default Path
Trace the constructor dependency graph of every shared binding to 2+ levels. Mark any binding transitively contaminated as UNSAFE.

### Risks
- Only auditing direct bindings — transitive leaks are the most common miss
- Dependency graph changes when a dependency's classification changes — re-audit needed
- Lazy resolution may mask transitive contamination — the dependency may not be resolved in the audit test

### Related Rules/Skills
- Trace the full dependency graph, not just direct bindings
- Skill: Generate Service Binding Inventory and Risk Matrix

---

## DT-SA-03: CI Governance for New Bindings

### Decision Context
- **When to decide:** When setting up CI pipeline for Octane applications
- **Stakeholders:** DevOps, Backend Developers
- **Trigger:** Initial audit completion — preventing regression
- **Constraint:** Without CI enforcement, new unsafe bindings creep in within weeks

### Criteria
| Criterion | Weight | Description |
|---|---|---|
| PR diff scanning | High | Detect new singleton() registrations automatically |
| Enforcement level | Medium | Block vs flag vs require classification |
| False positive handling | Medium | Legitimate stateless singletons must be allowed |

### Decision Tree

```
What level of CI enforcement is appropriate?
├── Full enforcement — block new singletons without review
│   ├── Scan PR diffs for new singleton()/instance()/shared:true
│   ├── Block merge until binding has human-reviewed classification comment
│   └── Allows legitimate singletons but requires explicit justification
│       └── Best for: teams actively migrating to Octane
│
├── Moderate enforcement — flag for review
│   ├── Scan PR diffs for new singleton() registrations
│   ├── Add comment on PR requiring binding classification
│   ├── Does not block merge, but creates review obligation
│   └── Best for: established Octane apps with mature team
│
└── Minimal — documentation only
    └── Log new singleton registrations to audit log
        └── Periodic manual review (quarterly)
            └── Best for: low-risk apps with infrequent changes

Regardless of level:
├── Maintain baseline binding inventory
├── Run delta audit: compare current inventory to baseline
└── Alert on any new singleton that was not present in baseline
```

### Rationale
Without CI enforcement, new `singleton()` registrations (from both application and package updates) introduce unsafe bindings that go unnoticed until they cause production issues. CI governance scales the initial audit investment across the project lifetime.

### Default Path
Scan PR diffs for new `singleton()` calls. Flag for human review with required classification comment.

### Risks
- Blocking all singletons may be too restrictive — legitimate stateless singletons must be allowed with justification
- CI scanning may miss indirect singleton registration (e.g., via `extend()` or `afterResolving()`)
- Package updates introduce new singletons outside PR diff scanning scope — need dependency change monitoring

### Related Rules/Skills
- Add CI lint rules for new singleton registrations
- Re-audit after every major package update or quarterly
- Skill: Generate Service Binding Inventory and Risk Matrix
