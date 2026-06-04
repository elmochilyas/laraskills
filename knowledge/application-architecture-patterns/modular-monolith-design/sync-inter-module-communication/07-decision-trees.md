# Decision Trees: Synchronous Inter-Module Communication via Contracts

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Inter-module synchronous communication via contracts
- **Knowledge Unit ID:** MMD-06
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Synchronous contracts vs async events for inter-module calls | Architecture | Communication design |
| 2 | DTOs vs Eloquent models in contract signatures | Architecture | Contract definition |
| 3 | Contract in providing vs consuming module | Architecture | Contract ownership |

---

## Decision 1: Synchronous contracts vs async events

### Context
When Module A needs data or action from Module B, choose synchronous contracts (interface + method call) for request-response scenarios, and async events for fire-and-forget notifications. Synchronous calls are microseconds; async via queues adds latency but decouples modules.

### Decision Tree

```
Does the calling module need a response before proceeding?
├── YES
│   Is the response needed for the client response (blocking)?
│   ├── YES → Synchronous contract (interface + method call)
│   └── NO → Could use async with eventual consistency
│       Can the operation tolerate eventual consistency?
│       ├── YES → Consider async event (decoupled, resilient)
│       └── NO → Synchronous contract required
└── NO (fire-and-forget notification only)
    → Async events (no response needed, full decoupling)
```

### Rationale
Synchronous contracts provide type-safe, immediate responses at microsecond latency. Use them when the caller cannot proceed without the response. Async events are better for notifications where eventual consistency is acceptable. Common mistake: using events when a response is needed (requiring polling or callbacks).

### Recommended Default
Synchronous contracts for request-response; async events for notifications

### Risks
- Sync for fire-and-forget: unnecessary coupling, blocks the caller
- Async for blocking operations: additional complexity (polling, callbacks, eventual consistency management)
- Wrong boundary detection: if modules need synchronous request-response too frequently, consider merging them

### Related Rules
- Use Contracts for Sync Communication (MMD-06/05-rules.md)
- Use DTOs in Contract Signatures (MMD-06/05-rules.md)
- Contracts in Providing Module (MMD-06/05-rules.md)
- Avoid Circular Contract Dependencies (MMD-06/05-rules.md)

### Related Skills
- Manage Synchronous Inter-Module Communication (MMD-06/06-skills.md)
- Manage Async Inter-Module Communication via Events (MMD-07/06-skills.md)

---

## Decision 2: DTOs vs Eloquent models in contract signatures

### Context
Contract methods must accept and return DTOs (plain PHP objects), never Eloquent models or domain entities. Eloquent models expose internal database schema and ORM decisions, coupling the consumer to the provider's implementation.

### Decision Tree

```
Does the contract method return or accept data from another module?
├── YES
│   Is the consumer expected to know the provider's database schema?
│   ├── YES (wrong) → Use DTOs — consumer must NOT know provider's schema
│   └── NO (correct)
│       Do you need serialization (JSON/array) support?
│       ├── YES → Readonly DTO with JsonSerializable
│       └── NO → Readonly DTO or plain PHP object
└── NO (within same module) → Eloquent models are fine internally
```

### Rationale
DTOs are the contract boundary's data representation. They are stable, serializable, and framework-agnostic. Eloquent models would expose column names, relationships, and ORM methods to the consumer — breaking module isolation. Use readonly classes for immutability.

### Recommended Default
Readonly DTOs in all contract method signatures

### Risks
- Eloquent in contracts: schema changes break consumers in same deployment
- Eloquent in contracts: lazy loading triggers N+1 queries in consumer context
- Too many DTOs: proliferation of thin classes — group related data into logical DTOs

### Related Rules
- Use DTOs in Contract Signatures (MMD-06/05-rules.md)
- Use Contracts for Sync Communication (MMD-06/05-rules.md)
- Bind Contracts in Service Provider (MMD-06/05-rules.md)

### Related Skills
- Manage Synchronous Inter-Module Communication (MMD-06/06-skills.md)
- Implement Data Transfer Objects (LAP-14/06-skills.md)

---

## Decision 3: Contract in providing vs consuming module

### Context
Contracts (interfaces) should be defined in the providing module's `Contracts/` directory — the provider owns the interface and controls its evolution. This is counterintuitive to developers who expect the consumer to define what it needs.

### Decision Tree

```
Does this module provide functionality that others consume?
├── YES
│   Can the provider define a stable interface for its capability?
│   ├── YES → Contract in providing module's Contracts/
│   └── NO → Provider's capability is not well-defined — refine boundaries first
└── NO (this module only consumes, never provides)
    → No contract needed in this module's Contracts/
    → Import contracts from providing modules
```

### Rationale
The providing module owns the interface because it controls the capability being offered. The provider is responsible for backward compatibility and knows best what it can guarantee. Consumer-defined contracts would require the provider to adapt to every consumer's interface — inversion of control.

### Recommended Default
Contract in providing module's Contracts/ directory

### Risks
- Contract in consumer: provider must adapt to consumer-defined interfaces
- No contract at all: direct implementation imports create tight coupling
- Circular contracts: Module A's contract depends on B's, which depends on A's — signals wrong boundaries

### Related Rules
- Contracts in Providing Module (MMD-06/05-rules.md)
- Use Contracts for Sync Communication (MMD-06/05-rules.md)
- Use DTOs in Contract Signatures (MMD-06/05-rules.md)
- Version Contracts for Breaking Changes (MMD-06/05-rules.md)

### Related Skills
- Manage Synchronous Inter-Module Communication (MMD-06/06-skills.md)
- Bind Interfaces to Implementations (LAP-09/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)
