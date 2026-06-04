# Decision Trees: Formalized Contracts Between Contexts

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Communication Patterns and Contracts
- **Knowledge Unit:** Formalized contracts between contexts
- **Knowledge Unit ID:** CPC-01
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Contract vs no contract | Architecture | Cross-context communication design |
| 2 | DTO vs Eloquent model in contract | Architecture | Contract data shape |
| 3 | Versioned contract vs unversioned contract | Architecture | Contract evolution |

---

## Decision 1: Contract vs no contract

### Context
Every communicating pair of bounded contexts needs a formal contract. Without one, changes in the producing context silently break consumers. A contract defines the data shapes (DTOs) and allowed operations (interface). Within a single context, formal contracts are unnecessary — interfaces are internal and can change freely.

### Decision Tree

```
Does the communication cross a bounded context boundary?
├── YES → Do the contexts communicate synchronously (request-response)?
│   ├── YES → Formal contract REQUIRED
│   │   Interface + readonly DTOs define the boundary
│   │   Producer implements, consumer depends on interface
│   │   Contract lives in shared location accessible to both
│   └── NO (asynchronous, one-way)
│       → Integration event is the contract
│       Event class with self-contained payload serves as contract
│       Still version events on breaking changes
└── NO (communication within the same context)
    → No formal cross-context contract needed
    Internal interfaces can change freely
    No versioning, no shared contract location
```

### Rationale
Formal contracts are the mechanism that enables independent evolution of contexts. When Context A exposes an interface + DTO contract, Context B depends on that contract — not on Context A's implementation. Context A can refactor internally as long as contract behavior is preserved. Without this contract, any change in Context A risks breaking Context B. Within a context, this decoupling isn't needed — all code can change together.

### Recommended Default
Formal contracts for all cross-context synchronous communication; integration events for async

### Risks
- No contract: changes in one context silently break another
- Contract mirrors implementation: leaks internal decisions into the contract
- Contract not shared: producer and consumer have different copies that drift apart

### Related Rules
- Define contracts at every context boundary (CPC-01/05-rules.md)
- Use DTOs instead of Eloquent models in contracts (CPC-01/05-rules.md)
- Contract-test both producer and consumer (CPC-01/05-rules.md)

### Related Skills
- Define Formalized Contracts Between Bounded Contexts (CPC-01/06-skills.md)
- Map Context Relationships (DBC-02/06-skills.md)
- Design Interface Contracts (SLP-13/06-skills.md)

---

## Decision 2: DTO vs Eloquent model in contract

### Decision Tree

```
What data type crosses the context boundary?
├── Eloquent model (Model instance, Builder, Collection)
│   → THIS IS WRONG — always use DTOs
│   Eloquent models expose the producer's internal persistence layer
│   Schema changes in producer cascade to consumers
│   Replace with readonly DTO containing only needed fields
│   `readonly class OrderData { public string $id; public string $status; }`
├── Value object (Money, Email, custom VO)
│   → Acceptable if shared kernel provides it
│   Value objects are self-contained and immutable
│   But prefer DTO wrapping for cross-context boundaries
└── DTO (readonly class with public properties)
    → Correct — use readonly DTOs for all cross-context communication
    Is the DTO minimal (only fields the consumer needs)?
    ├── YES → Good — keep it lean
    └── NO → Trim fields — every field is a dependency
```

### Rationale
Eloquent models represent the producer's internal persistence schema. Passing them across context boundaries couples consumers to that schema — renaming a database column in the producer breaks all consumers. DTOs are independent of the persistence layer. They contain only the fields the consumer actually needs. `readonly` DTOs prevent consumers from modifying data, which would create hidden coupling.

### Recommended Default
Always use readonly DTOs for cross-context contracts; never pass Eloquent models

### Risks
- Eloquent model in contract: schema coupling, consumer depends on DB structure
- DTO with too many fields: contract pollution, consumers depending on unnecessary data
- Mutable DTO: consumer modifies DTO, creating hidden side effects

### Related Rules
- Use DTOs instead of Eloquent models in contracts (CPC-01/05-rules.md)
- Keep DTOs immutable (CPC-01/05-rules.md)
- Keep contracts lean (CPC-01/05-rules.md)

### Related Skills
- Define Formalized Contracts Between Bounded Contexts (CPC-01/06-skills.md)
- Implement Data Transfer Objects (SLP-05/06-skills.md)
- Design Anti-Corruption Layer (DBC-04/06-skills.md)

---

## Decision 3: Versioned contract vs unversioned contract

### Decision Tree

```
Is the contract likely to change over time?
├── YES → Use versioned contracts
│   Apply semantic versioning:
│   Major = breaking change (remove field, change type, add required field)
│   Minor = additive (add optional field, add method)
│   Patch = bug fix (fix documentation, fix validation)
│   Do multiple versions need to coexist?
│   ├── YES → Maintain both V1 and V2 interfaces
│   │   Producer implements both. V2 consumers use new interface.
│   │   V1 consumers continue working until they migrate.
│   └── NO → Version by source control and release notes
│       Notify consumers before releasing breaking changes
└── NO (contract is stable and unlikely to change)
    → Unversioned contract may be acceptable
    Still document the contract explicitly
    Add version field once the first breaking change is needed
    Is there a timeline for expected changes?
    ├── YES → Better to version from the start
    │   Adding versioning later is harder than starting with it
    └── NO → Unversioned is acceptable for now
```

### Rationale
Unversioned contracts break consumers on every change. Versioned contracts allow multiple versions to coexist — V1 consumers continue working while V2 adopters migrate at their own pace. Semantic versioning makes the impact of changes explicit: consumers know that upgrading a major version requires code changes; minor/patch versions are safe. Start versioning from day one — adding versioning later is harder than starting with it.

### Recommended Default
Version all cross-context contracts with semantic versioning from the start

### Risks
- Unversioned contract: any change can break consumers
- Major version without coexistence: force-migrating all consumers at once
- Version fatigue: too many versions to maintain simultaneously

### Related Rules
- Version contracts on breaking changes (CPC-01/05-rules.md)
- Use semantic versioning for contracts (CPC-01/05-rules.md)
- Place contracts in a shared location (CPC-01/05-rules.md)

### Related Skills
- Define Formalized Contracts Between Bounded Contexts (CPC-01/06-skills.md)
- Map Context Relationships (DBC-02/06-skills.md)
- Implement Open Host Service (DBC-02/06-skills.md)
