# Decision Trees: Integrating Legacy Systems at Context Boundaries

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Domain Boundaries and Bounded Contexts
- **Knowledge Unit:** Integrating legacy systems at context boundaries
- **Knowledge Unit ID:** DBC-10
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Strangler Fig + ACL vs full rewrite | Architecture | Legacy migration strategy |
| 2 | Feature-flag routing vs manual cutover | Architecture | Migration increment granularity |
| 3 | Write-through vs shadow reads vs immediate cutover | Architecture | Migration verification method |

---

## Decision 1: Strangler Fig + ACL vs full rewrite

### Context
Full legacy rewrites have a notorious failure rate — the legacy system embodies years of bug fixes, edge case handling, and business rules that are rarely fully documented. Strangler Fig with ACL replaces functionality incrementally while protecting the new context from legacy model contamination. The decision is between incremental replacement (safe, slow) and full rewrite (risky, fast on paper).

### Decision Tree

```
Is the legacy system large (50+ features, 100+ tables, 3+ years of production)?
├── YES → Strangler Fig + ACL is the ONLY viable approach
│   A full rewrite of a large legacy system has a >50% failure rate
│   Incremental migration keeps the business running throughout
│   ACL protects the new context from legacy schema contamination
└── NO (small legacy system, <10 features, <5 tables)
    → Is the legacy system well-documented and understood?
    ├── YES → Full rewrite is possible
    │   Rewrite the entire system at once in the new context
    │   Risk: one-shot deployment, no rollback without full rebuild
    │   Better to still use Strangler Fig if the cost is manageable
    └── NO (undocumented, poorly understood)
        → Strangler Fig + ACL is safer
        You don't know what you don't know
        Incremental extraction discovers hidden complexity safely
```

### Rationale
Full rewrites fail because they underestimate the complexity embedded in legacy systems. The Strangler Fig pattern replaces functionality route by route, feature by feature, keeping the business running throughout. Paired with ACL, it prevents legacy schema and terminology from leaking into the new context. The cost is longer migration duration; the benefit is safe, verifiable, reversible progress.

### Recommended Default
Strangler Fig with ACL for any non-trivial legacy system; full rewrite only for small, well-understood systems

### Risks
- Full rewrite failure: rewrites fail >50% of the time for large systems
- Strangler Fig without ACL: new system inherits legacy model problems
- Migration without rollback: can't revert if something goes wrong

### Related Rules
- Always pair Strangler Fig with an Anti-Corruption Layer (DBC-10/05-rules.md)
- Never attempt a full legacy system rewrite (DBC-10/05-rules.md)
- Build the ACL in the new context's boundary (DBC-10/05-rules.md)

### Related Skills
- Integrate Legacy Systems at Context Boundaries (DBC-10/06-skills.md)
- Build Anti-Corruption Layer (DBC-04/06-skills.md)
- Split Monolithic Models Incrementally (DBC-08/06-skills.md)

---

## Decision 2: Feature-flag routing vs manual cutover

### Decision Tree

```
Can individual features be migrated independently?
├── YES → Use feature-flag based routing
│   Each feature or route has its own feature flag
│   New features route to new system, old stay on legacy
│   When a feature is verified, the flag is removed
│   Rollback: toggle the flag back to legacy
│   Requires: feature flag system (Laravel Pennant, custom)
│   Pros: per-feature migration, rollback per feature, safe
│   Cons: feature flag maintenance, dual code paths
└── NO (features are tightly coupled, can't migrate independently)
    → Manual cutover across the entire system
    Is there a way to decouple features first?
    ├── YES → Decouple then use feature flags
    │   Spend time decoupling before migration
    │   The decoupling work has value regardless of migration
    └── NO → High-risk cutover
        Migrate entire system at once
        Must have robust rollback plan (snapshot, database restore)
        Significantly higher risk than feature-flag approach
```

### Rationale
Feature-flag routing is the granularity that makes Strangler Fig work. Each flag controls one feature — when the flag is on, the feature runs on the new system. When off (or exception), it falls back to legacy. This enables per-feature migration, per-feature testing, and per-feature rollback. Manual cutover is an all-or-nothing bet: either everything works on the new system, or everything must roll back. The cost of feature flags is code complexity; the cost of manual cutover is deployment risk.

### Recommended Default
Feature-flag based routing for all Strangler Fig migrations; manual cutover only as last resort

### Risks
- Feature flag proliferation: hundreds of flags, complex cleanup process
- Manual cutover failure: entire system affected, rollback complexity
- Feature flags without cleanup: flags left in code after migration complete

### Related Rules
- Use feature-flag based routing for Strangler Fig migration (DBC-10/05-rules.md)
- Include compensating rollback logic (DBC-10/05-rules.md)
- Implement write-through and read-through during migration (DBC-10/05-rules.md)

### Related Skills
- Integrate Legacy Systems at Context Boundaries (DBC-10/06-skills.md)
- Use Bridge/Adapter Pattern (CPC-07/06-skills.md)
- Refactor and Remediate Architecture (AEG-09/06-skills.md)

---

## Decision 3: Write-through vs shadow reads vs immediate cutover

### Decision Tree

```
What level of verification is needed during the migration?
├── Maximum verification — write to both systems
│   → Write-through: writes go to both legacy and new system
│   Reads come from new system
│   Compare results to verify correctness without user impact
│   Pros: continuously verified, users always on new system
│   Cons: dual-write overhead, temporary complexity
│   Use when: data accuracy is critical (financial, compliance)
├── Moderate verification — read from both systems
│   → Shadow reads: reads go to both systems, compare results
│   Users see legacy data; new system runs in shadow
│   No write synchronization needed
│   Use when: reading is the primary concern, writes are simple
└── Minimal verification — just switch
    → Immediate cutover: turn off legacy, turn on new
    No parallel operation
    Use when: the new system is simple and independently verifiable
    Or: legacy system cannot be kept running alongside
```

### Rationale
Write-through provides the highest confidence during migration — every write operation goes to both systems, and reads come from the new system. Any difference between what the new system returns and expected behavior is caught immediately. Shadow reads are lighter but only verify read paths. Immediate cutover has no parallel verification and should be reserved for trivial migrations.

### Recommended Default
Write-through for critical data migrations; shadow reads for read-heavy migrations

### Risks
- No verification: bugs discovered by users in production
- Write-through complexity: dual-write code, conflict resolution
- Shadow reads only: write path bugs not detected until cutover

### Related Rules
- Implement write-through and read-through during migration (DBC-10/05-rules.md)
- Include compensating rollback logic (DBC-10/05-rules.md)
- Monitor the migration process (DBC-10/05-rules.md)

### Related Skills
- Integrate Legacy Systems at Context Boundaries (DBC-10/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)
- Implement Sagas for Multi-Context Transactions (DBC-11/06-skills.md)
