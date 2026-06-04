# Decision Trees: Module Extraction Path

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Module extraction path: from module to independent service
- **Knowledge Unit ID:** MMD-11
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Extract module vs keep in monolith | Architecture | Extraction trigger |
| 2 | Code-first vs database-first extraction order | Migration | Extraction planning |
| 3 | Strangler Fig gradual cutover vs big bang | Migration | Cutover approach |

---

## Decision 1: Extract module vs keep in monolith

### Context
Module extraction is a cost — it doubles CI, deployment, monitoring, and adds network latency. Only extract when specific measurable triggers are met: resource divergence, team independence needs, or technology stack divergence. The modular monolith is a valid end-state, not a temporary state.

### Decision Tree

```
Does the module have measurable resource divergence (CPU, memory, scaling)?
├── YES → Consider extraction
│   Are the module's contracts stable (no changes in 4+ weeks)?
│   ├── YES → Proceed with extraction planning
│   └── NO → Harden and freeze contracts first — extraction now will be costly
└── NO
    Does the module's team need independent deployment?
    ├── YES → Consider extraction for organizational reasons
    └── NO
        Is there a technology divergence need?
        ├── YES → Consider extraction (different database, runtime, etc.)
        └── NO → Keep in monolith — extraction provides no benefit
```

### Rationale
The decision to extract must be driven by measurable constraints, not architectural fashion. Resource divergence is the most common valid trigger — if Billing uses 70% of DB CPU, extracting it protects the rest of the monolith. Team independence is a valid organizational trigger. Without at least one valid trigger, extraction adds cost without benefit.

### Recommended Default
Keep in monolith — extract only when specific triggers are met

### Risks
- Extracting without triggers: operational cost increases, no benefit
- Extracting with unstable contracts: every change must be made in both monolith and new service
- Extracting too late: module was never truly isolated (shared database, shared models)

### Related Rules
- Extract Only When Triggers Met (MMD-11/05-rules.md)
- Harden Contracts Before Extraction (MMD-11/05-rules.md)
- Strangler Fig Extraction (MMD-11/05-rules.md)
- Never Share Database After Extraction (MMD-11/05-rules.md)

### Related Skills
- Extract a Module to an Independent Microservice (MMD-11/06-skills.md)
- Decide Modular Monolith vs Microservices (MMD-01/06-skills.md)

---

## Decision 2: Code-first vs database-first extraction order

### Context
When extracting a module, two approaches: database-first (separate the database while code is still in the monolith, then extract code) or code-first (extract code first, separate database later). Database-first is safer because the database split is the hardest, highest-risk step — doing it while still in the monolith provides easy rollback.

### Decision Tree

```
Does the module share a database with other modules?
├── YES
│   Can you separate the database while code is still in the monolith?
│   ├── YES → Database-first extraction (safer, easier rollback)
│   │   1. Move tables to own database connection
│   │   2. Verify everything still works in monolith
│   │   3. Extract code to new service
│   │   4. Cut over
│   └── NO → Must decouple schema before extraction can begin
└── NO (already has own database)
    → Code-first extraction (simpler — no database coupling)
```

### Rationale
Database separation is the hardest part of extraction. If it fails, having the code still in the monolith means rollback is instant (just reconnect to the shared database). Database-first extraction enables this safety net. Code-first only applies when the module already owns its database schema.

### Recommended Default
Database-first extraction for modules sharing a database

### Risks
- Database-first without connection separation: module still queries shared DB from new service
- Code-first with shared DB: new service queries monolith database — distributed monolith
- Neither works: module schema is so entangled that extraction requires full rewrite

### Related Rules
- Extract Database First (MMD-11/05-rules.md)
- Never Share Database After Extraction (MMD-11/05-rules.md)
- Harden Contracts Before Extraction (MMD-11/05-rules.md)

### Related Skills
- Extract a Module to an Independent Microservice (MMD-11/06-skills.md)
- Handle Cross-Module Data Access (MMD-10/06-skills.md)
- Own Database Schema Per Module (MMD-13/06-skills.md)

---

## Decision 3: Strangler Fig gradual cutover vs big bang

### Context
Extracting a module should follow the Strangler Fig pattern: gradually redirect routes and consumers from the monolith module to the new service, one route at a time. Big-bang extraction (cutting over all traffic at once) is high-risk — if the new service has issues, everything breaks simultaneously with no rollback path.

### Decision Tree

```
Can you redirect traffic per-route (not all-or-nothing)?
├── YES
│   Is there a feature flag system in place?
│   ├── YES → Strangler Fig extraction — ideal
│   │   1. Start with 10% of traffic to new service
│   │   2. Verify correctness (parallel run comparison)
│   │   3. Gradually increase to 100%
│   │   4. Remove monolith module code
│   └── NO → Implement feature flags first, then Strangler Fig extraction
└── NO (monolith module code is tightly integrated with request handling)
    → Must refactor for Strangler Fig compatibility before extraction
    Big-bang extraction is only acceptable for:
    - Greenfield modules with no existing consumers
    - With comprehensive parallel run verification first
```

### Rationale
Big-bang extraction is gambling — one deployment determines success or failure. Strangler Fig enables incremental verification: 10% of traffic reveals issues affecting only 10% of users. Feature flags provide instant rollback: if the new service has problems, the flag is turned off.

### Recommended Default
Strangler Fig pattern with feature-flagged gradual cutover

### Risks
- Big bang: deployment failure affects all users simultaneously
- Big bang: no rollback path short of redeploying the monolith
- No parallel run: cutover reveals data discrepancies between monolith and new service
- No feature flag: rollback requires infrastructure changes, not just config toggle

### Related Rules
- Strangler Fig Extraction (MMD-11/05-rules.md)
- Feature-Flag Cutover (MMD-11/05-rules.md)
- Parallel Run Verification (MMD-11/05-rules.md)
- Harden Contracts Before Extraction (MMD-11/05-rules.md)

### Related Skills
- Extract a Module to an Independent Microservice (MMD-11/06-skills.md)
- Apply Strangler Fig Pattern (DBC-10/06-skills.md)
- Decide Modular Monolith vs Microservices (MMD-01/06-skills.md)
