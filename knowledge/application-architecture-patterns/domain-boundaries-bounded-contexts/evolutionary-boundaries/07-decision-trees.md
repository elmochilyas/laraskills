# Decision Trees: Evolutionary Boundaries

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Domain Boundaries and Bounded Contexts
- **Knowledge Unit:** Evolutionary boundaries: splitting a monolithic model
- **Knowledge Unit ID:** DBC-08
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Split vs keep together | Architecture | Model evaluation |
| 2 | Incremental extraction vs big-bang split | Architecture | Migration strategy |
| 3 | Parallel coexistence vs cutover migration | Architecture | Deployment approach |

---

## Decision 1: Split vs keep together

### Context
The most important decision is whether to split at all. Splitting has real costs: new contracts, migration effort, testing, and ongoing integration overhead. It should be driven by concrete pain — frequent bugs, team coordination overhead, conflicting change requests — not by theoretical architectural purity. A cohesive model owned by a single team should not be split.

### Decision Tree

```
Is there measurable pain in the current model?
├── YES — concrete pain exists
│   What type of pain?
│   ├── Frequent bugs from model confusion (same entity means different things)
│   │   → Strong signal for split — language divergence is primary indicator
│   ├── Team coordination overhead (two teams modifying same files)
│   │   → Strong signal for split — Conway's Law in action
│   ├── Conflicting change requests (one change breaks another)
│   │   → Moderate signal — investigate if areas can be separated
│   └── Model has 50+ methods serving different concerns
│       → Moderate signal — consider if responsibilities are truly distinct
└── NO — no measurable pain
    → Do NOT split
    Is the model cohesive (all parts change together)?
    ├── YES → Definitely don't split — no benefit to justify cost
    └── NO (model has distinct concerns but no pain yet)
        → Monitor but don't act — wait for concrete pain to emerge
        Premature splitting creates overhead without benefit
```

### Rationale
Splitting a monolithic model is a significant investment. The decision must be driven by measurable pain, not aesthetic preference. A model that changes together and is owned by one team is fine as-is. Splitting prematurely creates all the costs of distributed systems (contracts, integration, coordination) without the benefits. Wait until the concrete pain (bugs, coordination overhead, conflicting changes) exceeds the cost of the split.

### Recommended Default
Keep together unless concrete pain is measurable and significant

### Risks
- Splitting without pain: cost not justified, integration overhead without benefit
- Not splitting with pain: productivity degrades, bugs increase, team frustration grows
- Splitting for wrong reasons: "it's the right architecture" rather than solving actual pain

### Related Rules
- Split based on concrete pain, not theoretical purity (DBC-08/05-rules.md)
- Treat context boundaries as hypotheses (DBC-08/05-rules.md)
- Split incrementally, never via big-bang rewrite (DBC-08/05-rules.md)

### Related Skills
- Split a Monolithic Model into Bounded Contexts Incrementally (DBC-08/06-skills.md)
- Identify Bounded Contexts (DBC-01/06-skills.md)
- Extract Modules Incrementally (MMD-11/06-skills.md)

---

## Decision 2: Incremental extraction vs big-bang split

### Decision Tree

```
How many concepts are being extracted?
├── 1 concept → Incremental by default — straightforward extraction
│   Extract the concept, create its context, migrate consumers one by one
├── 2-5 concepts → Incremental extraction (one at a time, sequentially)
│   Extract the most independent concept first
│   Benefits: early success builds confidence, each extraction independently verifiable
│   Risk: big-bang thinking — trying to do all at once
└── 6+ concepts → Definitely incremental (never big-bang)
    → Is the team planning a big-bang rewrite?
    ├── YES → This will break the application for weeks
    │   Split the plan: extract one concept per 1-2 week cycle
    │   Old model stays as facade until all consumers migrate
    └── NO → Continue incremental approach
```

### Rationale
Big-bang splits are the most common reason extraction efforts fail. A single branch that attempts to split the entire model into 8 contexts breaks the application for weeks or months, has massive merge conflicts, and creates enormous risk. Incremental extraction — one concept at a time, each independently deployable — keeps the application running, provides early wins, and is reversible if something goes wrong. The "big-bang" approach should never be used.

### Recommended Default
Always incremental extraction, one concept at a time; never big-bang

### Risks
- Big-bang split: application broken for weeks, massive merge conflict risk
- Incremental too slow: extraction drags across months — but still better than broken
- Wrong extraction order: extracting dependent concept before independent one

### Related Rules
- Split incrementally, never via big-bang rewrite (DBC-08/05-rules.md)
- Extract the most independent concept first (DBC-08/05-rules.md)
- Use Strangler Fig pattern for model extraction (DBC-08/05-rules.md)

### Related Skills
- Split a Monolithic Model into Bounded Contexts Incrementally (DBC-08/06-skills.md)
- Refactor and Remediate Architecture (AEG-09/06-skills.md)
- Extract Modules Incrementally (MMD-11/06-skills.md)

---

## Decision 3: Parallel coexistence vs cutover migration

### Decision Tree

```
Can consumers migrate one by one over time?
├── YES → Use parallel coexistence
│   Build new context alongside old model
│   Old model becomes a facade delegating to new context
│   Consumers migrate one by one (Strangler Fig pattern)
│   No downtime — if new context has a bug, fall back to old path
│   Is the old model large with many consumers?
│   ├── YES → Parallel coexistence is the ONLY safe approach
│   └── NO (small model, few consumers, 1-2 day migration)
│       → Parallel coexistence is still recommended
└── NO (must switch all consumers at once)
    → Cutover migration (high risk)
    Is this a small model with zero active consumers?
    ├── YES → Cutover is acceptable
    │   New context replaces old model atomically
    └── NO → Parallel coexistence is REQUIRED
        If you can't migrate consumers one by one, refactor the entry points
        The cutover approach has no rollback path
```

### Rationale
Parallel coexistence (old and new both running) is the default because it provides zero-downtime migration with rollback capability. The old model becomes a facade that delegates to the new context. Each consumer is migrated independently, tested, and verified. If something goes wrong, the consumer can flip back to the old path. Cutover migration should only be used for trivial models with zero active consumers.

### Recommended Default
Parallel coexistence with old model as facade; cutover only for trivially small migrations

### Risks
- Cutover without rollback: new context bug means rebuild old code from version control
- Parallel not maintained: old model facade falls out of sync with new context
- Dual-write complexity: keeping both paths in sync during migration

### Related Rules
- Use parallel implementation during migration (DBC-08/05-rules.md)
- Keep the old model as a facade during migration (DBC-08/05-rules.md)
- Remove old code after all consumers are fully migrated (DBC-08/05-rules.md)

### Related Skills
- Split a Monolithic Model into Bounded Contexts Incrementally (DBC-08/06-skills.md)
- Integrate Legacy Systems (DBC-10/06-skills.md)
- Refactor and Remediate Architecture (AEG-09/06-skills.md)
