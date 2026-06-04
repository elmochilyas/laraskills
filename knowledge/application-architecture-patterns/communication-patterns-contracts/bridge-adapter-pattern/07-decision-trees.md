# Decision Trees: Bridge/Adapter Pattern for Context Boundaries

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Communication Patterns and Contracts
- **Knowledge Unit:** Bridge/adapter pattern for context boundaries
- **Knowledge Unit ID:** CPC-07
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Bridge interface vs direct dependency | Architecture | Cross-context synchronous call design |
| 2 | Adapter in producer vs consumer context | Architecture | Adapter placement |
| 3 | Bridge in shared kernel vs inside a context | Architecture | Bridge interface location |

---

## Decision 1: Bridge interface vs direct dependency

### Context
When Context A needs to call Context B synchronously, the simplest approach is to import and instantiate Context B's class directly. The Bridge pattern inserts an interface between them. The overhead is minimal (one interface, one adapter class, one service provider binding) but the decoupling benefit is significant — the consumer never knows the producer's implementation details.

### Decision Tree

```
Does the consumer need to call another bounded context synchronously?
├── YES → Is this a single-context-internal call?
│   ├── YES → Direct instantiation is acceptable
│   │   Within a context, interfaces are for internal design
│   │   No need for a bridge across non-existent boundaries
│   └── NO → Use a bridge interface
│       Does the producer's interface already match the contract needed by the consumer?
│       ├── YES → No adapter needed (producer already implements the contract)
│       │   Just use the interface directly and bind in service provider
│       └── NO → Bridge + Adapter pair required
│           Consumer depends only on the bridge interface
│           Producer implements an adapter that converts its API to the bridge contract
│           Benefits: decoupled, testable, swappable
└── NO (same context or no sync call)
    → Bridge not needed
```

### Rationale
Every cross-context synchronous call needs a bridge. Direct dependency creates tight coupling — the consumer knows the producer's namespace, constructor arguments, and internal dependencies. A bridge interface breaks this: the consumer depends only on a contract. The producer can change its implementation (rename classes, change constructor, swap libraries) without the consumer knowing. The cost is negligible: one interface, one adapter, and one service provider binding.

### Recommended Default
Bridge interface for every cross-context synchronous call

### Risks
- No bridge: tight coupling, producer changes break consumers
- Bridge for internal calls: unnecessary abstraction, over-engineering
- Bridge without adapter: producer's interface doesn't match consumer expectations

### Related Rules
- Use a bridge interface for every cross-context synchronous call (CPC-07/05-rules.md)
- Place the adapter in the producer context (CPC-07/05-rules.md)
- Define the bridge in a shared kernel (CPC-07/05-rules.md)

### Related Skills
- Implement Bridge/Adapter Pattern at Context Boundaries (CPC-07/06-skills.md)
- Define Formalized Contracts (CPC-01/06-skills.md)
- Implement Circuit Breaker (CPC-06/06-skills.md)

---

## Decision 2: Adapter in producer vs consumer context

### Decision Tree

```
Who should implement the adapter that converts the producer's API to the bridge contract?
├── The producer context
│   → Adapter lives where the functionality is implemented
│   Producer knows its own API and can adapt it to the bridge contract
│   Consumer depends only on the bridge interface
│   Benefits: consumer knows nothing about producer's internals
│   Drawbacks: producer must maintain the adapter alongside its own code
├── The consumer context
│   → Risky — consumer now knows both bridge and producer's API
│   Consumer must import producer classes, know their constructor, etc.
│   Defeats the purpose of the bridge pattern
│   Only justified when: producer is a third-party library
│   (Third-party producer can't host the adapter, so consumer must)
└── A third location (shared kernel)
    → NOT recommended for the adapter itself
    Adapter contains implementation details and dependencies
    It belongs with the producer, not in the shared kernel
    (The bridge interface belongs in the shared kernel, not the adapter)
```

### Rationale
The adapter implements the bridge contract using the producer's API. The producer knows its own API best — it should convert its interface to the bridge contract. When the adapter lives in the consumer, the consumer must import and understand the producer's implementation, defeating the decoupling purpose. The only exception is when the producer is a third-party library that can't be modified — in that case, the consumer must host the adapter as an anti-corruption layer.

### Recommended Default
Adapter in the producer context

### Risks
- Adapter in consumer: consumer knows producer's internals, defeats decoupling
- Adapter in shared kernel: implementation details leak into shared space
- No adapter at all: direct coupling if producer doesn't match bridge contract

### Related Rules
- Place the adapter in the producer context (CPC-07/05-rules.md)
- Use a bridge interface for every cross-context synchronous call (CPC-07/05-rules.md)
- Use tiered adapters for different environments (CPC-07/05-rules.md)

### Related Skills
- Implement Bridge/Adapter Pattern at Context Boundaries (CPC-07/06-skills.md)
- Implement Anti-Corruption Layer (DBC-04/06-skills.md)
- Implement Facade Pattern for Third-Party (CPC-12/06-skills.md)

---

## Decision 3: Bridge in shared kernel vs inside a context

### Decision Tree

```
Where should the bridge interface definition live?
├── In a shared kernel (recommended)
│   Define the bridge interface in a directory accessible to both contexts
│   e.g., `src/Kernel/Contracts/Billing/PaymentProcessorInterface.php`
│   Both contexts depend on the shared kernel
│   Pros: no circular dependencies, clear contract ownership, single source of truth
│   Cons: shared kernel becomes a dependency for both contexts
├── Inside the consumer context (risky)
│   Consumer defines the interface it expects
│   Producer adapter must implement an interface defined in consumer's namespace
│   PROS:
│   └── Consumer controls the contract perfectly
│   CONS:
│   ├── Producer now depends on consumer's namespace (reverse dependency)
│   └── Circular dependency risk if consumer also calls producer
├── Inside the producer context (not recommended)
│   Producer defines the interface for consumers to use
│   PROS:
│   └── Producer controls the contract
│   CONS:
│   ├── Producer's interface may not match consumer's needs
│   └── Consumer depends on producer's namespace (coupling reappears)
└── NEVER define the bridge inside either context
    Shared kernel or a dedicated Contracts module is the only safe location
```

### Rationale
The bridge interface must live in a location that both contexts can depend on without creating circular dependencies. A shared kernel is the standard solution — both contexts depend on it, but it depends on nothing. Defining the bridge inside either context creates a dependency from the other context into that namespace, which either reverses the dependency direction (consumer defines it → producer depends on consumer) or re-introduces coupling (producer defines it → consumer depends on producer's namespace). The shared kernel is the only location that prevents this.

### Recommended Default
Bridge interface in a shared kernel / contracts directory

### Risks
- Bridge in consumer: producer depends on consumer's namespace
- Bridge in producer: consumer depends on producer's namespace
- No shared kernel: bridge location unclear, may drift into wrong context

### Related Rules
- Define the bridge in a shared kernel (CPC-07/05-rules.md)
- Use a bridge interface for every cross-context synchronous call (CPC-07/05-rules.md)
- Use tiered adapters for different environments (CPC-07/05-rules.md)

### Related Skills
- Implement Bridge/Adapter Pattern at Context Boundaries (CPC-07/06-skills.md)
- Structure Module Dependencies (MMD-04/06-skills.md)
- Enforce Dependency Direction (AEG-07/06-skills.md)
