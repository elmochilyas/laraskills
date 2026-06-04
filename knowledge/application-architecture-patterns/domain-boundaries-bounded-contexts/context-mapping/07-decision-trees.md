# Decision Trees: Context Mapping

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Domain Boundaries and Bounded Contexts
- **Knowledge Unit:** Context mapping: relationships between contexts
- **Knowledge Unit ID:** DBC-02
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Open Host Service vs Shared Kernel vs Separate Ways | Architecture | Cross-context integration strategy |
| 2 | Anti-Corruption Layer vs Conformist | Architecture | Upstream-downstream integration |
| 3 | Customer-Supplier vs Partnership | Architecture | Coordinated team integration |

---

## Decision 1: Open Host Service vs Shared Kernel vs Separate Ways

### Context
Three relationship types define the default spectrum of cross-context integration: Open Host Service (published API with DTOs), Shared Kernel (shared code), and Separate Ways (no integration). Open Host Service is the default for stable upstream APIs. Shared Kernel should be minimal and reserved for foundational value objects. Separate Ways is the default when contexts have no integration need.

### Decision Tree

```
Does context A need data or behavior from context B?
├── NO → Separate Ways
│   Each context implements its own solution independently
│   No integration, no coupling, no coordination needed
└── YES → Integration needed
    Is the integration need satisfied by a published API/contract?
    ├── YES → Open Host Service (preferred default)
    │   Context B publishes a clear interface + DTO contract
    │   Context A consumes through the contract, not direct model access
    │   Pros: explicit contract, upstream can change internally
    │   Cons: translation overhead
    └── NO (need to share actual code, not just API)
        → Is the shared code used by 3+ contexts AND stable?
        ├── YES → Shared Kernel (minimal)
        │   Only stable value objects, foundation interfaces
        │   No business logic, no Eloquent models
        └── NO → Reconsider integration approach
            If only 2 contexts need it, consider duplicating
            If unstable, do not share — duplication is safer
```

### Rationale
Open Host Service is the default integration pattern because it provides explicit contracts with the least coupling. Contexts communicate through published interfaces and DTOs, not shared code. Shared Kernel should be the exception, not the default — every shared class is a coupling point. Separate Ways is perfectly valid when two contexts have no integration need; forcing integration creates unnecessary overhead.

### Recommended Default
Open Host Service for integration; Separate Ways for unrelated contexts; Shared Kernel only for proven multi-context stable code

### Risks
- Defaulting to Shared Kernel: hidden coupling between contexts
- Open Host Service without versioning: contract changes break downstream
- Separate Ways when integration is needed: duplicate business logic

### Related Rules
- Prefer Open Host Service for stable upstream APIs (DBC-02/05-rules.md)
- Avoid defaulting to Shared Kernel relationship (DBC-02/05-rules.md)
- Default to Separate Ways when contexts implement same concept differently (DBC-02/05-rules.md)

### Related Skills
- Map Context Relationships Between Bounded Contexts (DBC-02/06-skills.md)
- Design Shared Kernel (DBC-03/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)

---

## Decision 2: Anti-Corruption Layer vs Conformist

### Context
When a downstream context needs data from an upstream context with a different domain model, two integration strategies exist: Anti-Corruption Layer (translate upstream's model to your own) and Conformist (accept upstream's model as-is). ACL protects model integrity but costs more to build. Conformist is cheaper but forces your model to adopt upstream concepts.

### Decision Tree

```
Does the upstream's model significantly differ from yours?
├── YES → Use Anti-Corruption Layer
│   Create translation layer between upstream's model and your model
│   Your context's model stays pure — upstream's concepts stay in the ACL
│   Does the upstream model change frequently or have poor quality?
│   ├── YES → ACL is required — protects your context from upstream instability
│   └── NO → ACL still recommended if the models are semantically different
└── NO (upstream model is similar to yours)
    → Consider Conformist
    Is the upstream model stable and changes infrequently?
    ├── YES → Conformist is acceptable — translation cost outweighs coupling risk
    │   Just use upstream's DTOs or models directly
    └── NO → Use ACL anyway — upstream changes will corrupt your model
        Is the upstream a legacy system with poor design?
        ├── YES → Always use ACL — legacy corruption is the primary ACL use case
        └── NO → Reconsider — if both models are clean, maybe share a kernel
```

### Rationale
ACL is the safe default when models differ. The translation cost is upfront, but it protects your context's model integrity indefinitely. Conformist should only be used when the upstream model is stable and closely matches your domain language. Legacy systems always need ACL — they carry historical design decisions that shouldn't leak into your model. The cost of ACL is upfront; the cost of Conformist is ongoing model corruption.

### Recommended Default
Anti-Corruption Layer for divergent models; Conformist only when upstream is stable and closely aligned

### Risks
- No translation layer: direct model access creates tight coupling
- Conformist with divergent models: your model adopts foreign semantics
- ACL without maintaining: translation layer becomes outdated, upstream changes leak through

### Related Rules
- Use Anti-Corruption Layer for integrating with divergent models (DBC-02/05-rules.md)
- Prefer Open Host Service for stable upstream APIs (DBC-02/05-rules.md)
- Document all cross-context relationships in a context map (DBC-02/05-rules.md)

### Related Skills
- Map Context Relationships Between Bounded Contexts (DBC-02/06-skills.md)
- Design Anti-Corruption Layer (DBC-04/06-skills.md)
- Integrate Legacy Systems (DBC-10/06-skills.md)

---

## Decision 3: Customer-Supplier vs Partnership

### Context
When two contexts need coordinated changes, two relationship types apply: Customer-Supplier (upstream provides data, downstream consumes, upstream accommodates downstream needs) and Partnership (teams coordinate changes, interdependent evolution). Customer-Supplier is the default for data flow relationships. Partnership is reserved for genuinely co-evolving contexts.

### Decision Tree

```
Is there a clear data flow direction (one context produces, another consumes)?
├── YES → Customer-Supplier
│   Upstream supplies data/functionality, downstream consumes
│   Upstream must accommodate downstream's needs
│   Document explicit agreement: what fields are provided, what are not
│   Does downstream need to influence upstream's roadmap?
│   ├── YES → Customer-Supplier with explicit SLA agreement
│   │   Upstream commits to providing specific data by specific dates
│   └── NO → Open Host Service (if multiple consumers) or simple Customer-Supplier
└── NO (bidirectional, interdependent changes)
    → Partnership
    Is the coordination sustainable for the team?
    ├── YES → Partnership with regular sync meetings
    │   Both teams must coordinate on every significant change
    └── NO → Partnership is too expensive — reconsider context boundaries
        Are these actually separate contexts?
        ├── YES → If boundaries are right, Partnership should be rare
        └── NO → May be the same context — consider merging
```

### Rationale
Customer-Supplier is the most common cross-context relationship: one context produces data that another consumes. The upstream has an obligation to downstream consumers. Partnership is expensive — it requires continuous coordination, shared planning, and synchronized deployments. Reserve Partnership for genuinely co-evolving contexts. If two contexts require Partnership and the coordination is unsustainable, the contexts may actually be one.

### Recommended Default
Customer-Supplier for data flow relationships; Partnership only for genuinely co-evolving contexts

### Risks
- Partnership without coordination: teams diverge, integration breaks
- Customer-Supplier without SLA: upstream changes break downstream without warning
- Partnership for unrelated contexts: artificial coordination overhead

### Related Rules
- Use Customer-Supplier when upstream must accommodate downstream (DBC-02/05-rules.md)
- Use Anti-Corruption Layer for integrating with divergent models (DBC-02/05-rules.md)
- Document all cross-context relationships in a context map (DBC-02/05-rules.md)

### Related Skills
- Map Context Relationships Between Bounded Contexts (DBC-02/06-skills.md)
- Design Anti-Corruption Layer (DBC-04/06-skills.md)
- Integrate Legacy Systems (DBC-10/06-skills.md)
