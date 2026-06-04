# Decision Trees: Shared Kernel Design

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Domain Boundaries and Bounded Contexts
- **Knowledge Unit:** Shared kernel design: minimal shared code
- **Knowledge Unit ID:** DBC-03
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Duplicate vs extract to shared kernel | Architecture | Cross-context code sharing |
| 2 | Value object vs business logic placement | Architecture | Shared kernel contents |
| 3 | Interface contract vs shared implementation | Architecture | Shared kernel abstraction |

---

## Decision 1: Duplicate vs extract to shared kernel

### Context
The default decision for cross-context code should be duplication. Every item in the shared kernel is a coupling point that all contexts depend on. Premature extraction creates wrong abstractions. The "rule of three" applies: extract to shared only when the third context independently needs the same concept.

### Decision Tree

```
How many contexts independently need the same concept?
├── 1-2 contexts → Duplicate
│   Two contexts having the same Email value object is acceptable
│   Premature extraction creates coupling without proven reuse
│   If they diverge later, each context's version can evolve independently
├── 3+ contexts → Consider shared kernel
│   Is the concept stable (unlikely to change differently per context)?
│   ├── YES → Extract to shared kernel
│   │   Immutable value objects and foundation interfaces are safe to share
│   └── NO (the concept may evolve differently per context)
│       → Duplicate anyway — shared would prevent per-context evolution
│       Document why duplication is intentional
└── Unknown (new concept, no existing usage)
    → Do not extract — wait for proven need
    Speculative extraction creates wrong abstractions
```

### Rationale
The "rule of three" prevents premature extraction. Two contexts duplicating the same Email class is fine — they can diverge independently. When the third context independently needs it, extraction is justified. The cost of duplication is code repetition; the cost of wrong sharing is coupling that prevents independent evolution. The former is cheaper to fix (extract later) than the latter (unshare later).

### Recommended Default
Duplicate for 1-2 contexts; extract to shared only when the third context proves need

### Risks
- Premature extraction: wrong abstraction, unnecessary coupling, hard to unshare
- Never extracting: 20 identical copies of same value object across contexts
- Extracting too late: three teams independently created the same class — merge effort

### Related Rules
- Extract to shared kernel only when a third context needs it (DBC-03/05-rules.md)
- Keep the shared kernel small (DBC-03/05-rules.md)
- Never place business logic in the shared kernel (DBC-03/05-rules.md)

### Related Skills
- Design Minimal Shared Kernel for Cross-Context Code (DBC-03/06-skills.md)
- Identify Bounded Contexts (DBC-01/06-skills.md)
- Design Modular Monolith Shared Kernel (MMD-08/06-skills.md)

---

## Decision 2: Value object vs business logic placement

### Context
The shared kernel tempts developers to place business logic there for reusability. This is the most common mistake. Business logic evolves differently per context over time. Value objects (Money, Email, Address) are safe to share because they are immutable and stable. Business logic (discount calculation, validation rules) must stay in individual contexts.

### Decision Tree

```
Is the candidate for sharing a value object or business logic?
├── Value object (Money, Email, Currency, Address)
│   → Safe to share in shared kernel
│   Immutable, no behavior beyond self-validation
│   Low risk of divergence — Email is Email everywhere
│   Are the validation rules truly universal?
│   ├── YES → Value object belongs in shared kernel
│   └── NO (validation differs per context — e.g., different email formats)
│       → Each context creates its own version
└── Business logic (discount rules, eligibility checks, pricing)
    → Must NOT go in shared kernel
    Business rules evolve differently per context over time
    A discount in Billing is different from a discount in Shipping
    Do all contexts genuinely need the exact same logic forever?
    ├── YES (proven, not speculative) → Consider but document carefully
    │   Example: tax calculation mandated by law with immutable formula
    └── NO → Duplicate per context — they will diverge
```

### Rationale
Business logic belongs in individual contexts because it evolves per business need. A discount calculator shared across Billing and Shipping prevents the Shipping team from changing their discount algorithm without affecting Billing. Value objects are safe because they represent universal concepts with stable invariants. When in doubt, put it in the context — it's easier to extract to shared kernel later than to remove from shared kernel.

### Recommended Default
Value objects in shared kernel; business logic in individual contexts

### Risks
- Business logic in shared kernel: prevents per-context evolution
- Eloquent models in shared kernel: schema coupling across all contexts
- Value objects in shared kernel with wrong validation: changing validation affects all contexts

### Related Rules
- Never place business logic in the shared kernel (DBC-03/05-rules.md)
- Never place Eloquent models in the shared kernel (DBC-03/05-rules.md)
- Only share value objects and foundation interfaces (DBC-03/05-rules.md)

### Related Skills
- Design Minimal Shared Kernel for Cross-Context Code (DBC-03/06-skills.md)
- Design Value Objects (LAP-07/06-skills.md)
- Design Domain Services (LAP-09/06-skills.md)

---

## Decision 3: Interface contract vs shared implementation

### Decision Tree

```
Does the shared concept define behavior that needs different implementations?
├── YES → Share interface only, not implementation
│   Shared kernel defines the interface/contract
│   Each context provides its own implementation
│   Example: EventBus interface in shared, RedisEventBus in Identity context
│   Does the interface need versioning?
│   ├── YES → Version the interface explicitly
│   │   EventBusV1, EventBusV2 — makes contract changes explicit
│   └── NO → Simple interface is fine, keep it stable
└── NO (the concept has exactly one correct implementation)
    → Can share implementation, but is it truly universal?
    Is the implementation stable and unlikely to change?
    ├── YES → Shared implementation is acceptable
    │   Example: immutable value object `Email`
    └── NO → Share interface anyway — the implementation may vary later
```

### Rationale
Sharing interfaces over implementations is the safer default. An interface in the shared kernel defines a contract without locking all contexts into the same implementation. Each context can implement it differently based on its needs. When the implementation is truly universal and stable (like `Email` value object), sharing the implementation is fine. But for anything with behavior, prefer interface-only sharing.

### Recommended Default
Share interfaces/contracts in shared kernel; implementations in individual contexts

### Risks
- Shared implementation: all contexts locked to same implementation, hard to change
- Interface without versioning: changing the interface breaks all contexts at once
- No shared interface: each context defines its own incompatible version of the same concept

### Related Rules
- Prefer stable interfaces over shared implementations (DBC-03/05-rules.md)
- Version shared kernel contracts explicitly (DBC-03/05-rules.md)
- Do not mutate shared kernel state (DBC-03/05-rules.md)

### Related Skills
- Design Minimal Shared Kernel for Cross-Context Code (DBC-03/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)
- Design Modular Monolith Shared Kernel (MMD-08/06-skills.md)
