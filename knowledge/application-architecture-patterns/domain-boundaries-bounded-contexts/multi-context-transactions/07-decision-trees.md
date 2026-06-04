# Decision Trees: Multi-Context Transactions and Saga Patterns

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Domain Boundaries and Bounded Contexts
- **Knowledge Unit:** Multi-context transactions and saga patterns
- **Knowledge Unit ID:** DBC-11
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | ACID vs Saga vs distributed transaction | Architecture | Transaction strategy |
| 2 | Choreographed saga vs orchestrated saga | Architecture | Saga design |
| 3 | State-persisted saga vs in-memory saga | Architecture | Saga reliability |

---

## Decision 1: ACID vs Saga vs distributed transaction

### Context
Three options exist for transactional operations: ACID (standard database transaction within a single context), Saga (sequence of local transactions with compensation across contexts), and distributed transaction (XA/two-phase commit across databases). ACID is the default for single-context work. Sagas are the correct pattern for cross-context work. Distributed transactions should be avoided.

### Decision Tree

```
Does the operation span multiple bounded contexts?
├── NO → Use ACID transaction within the single context
│   `DB::transaction(function () { ... })`
│   Simple, correct, well-understood
│   No saga overhead needed
└── YES → Operation spans multiple contexts
    Can the operation be redesigned to fit within a single context?
    ├── YES → Redesign if possible — simpler and more reliable
    └── NO → Must use Saga pattern
        → Is a distributed transaction (XA/two-phase commit) being considered?
        ├── YES → Do NOT use distributed transaction
        │   Distributed transactions are fragile, slow, and complex
        │   They scale poorly and require all databases to support XA
        │   Use Saga instead
        └── NO → Saga is the correct approach
            Each step is a local ACID transaction
            Compensating transactions undo on failure
```

### Rationale
ACID transactions are simple and reliable within a single context. For cross-context operations, they require shared database access or distributed transaction coordinators. Distributed transactions (XA, two-phase commit) are notoriously fragile — they hold locks across resources, don't scale, and fail in unpredictable network partitions. Sagas provide eventual consistency without distributed locks, accepting temporary inconsistency in exchange for reliability and scalability.

### Recommended Default
ACID within a single context; Saga across contexts; never distributed transactions

### Risks
- ACID across contexts: shared database coupling, can't split later
- Distributed transaction: fragile, slow, doesn't scale
- Saga without compensation: inconsistent state on failure

### Related Rules
- Use ACID within a context, Sagas across contexts (DBC-11/05-rules.md)
- Always include compensating transactions for every saga step (DBC-11/05-rules.md)
- Do not use sagas for single-context operations (DBC-11/05-rules.md)

### Related Skills
- Implement Sagas for Multi-Context Transactions (DBC-11/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)
- Implement Domain Events (CPC-02/06-skills.md)

---

## Decision 2: Choreographed saga vs orchestrated saga

### Decision Tree

```
How complex is the cross-context workflow?
├── Simple linear flow with 2-3 steps, no branches
│   → Choreographed saga (events)
│   Each step publishes an event → next step triggered
│   Decentralized — no single point of control
│   Pros: simple, good for independent teams
│   Cons: hard to trace the full flow, no central error handling
│   `UserCreated` → `BillingCustomerCreated` → `WelcomeEmailSent`
├── Moderate complexity (4-6 steps, some conditional paths)
│   → Consider either — evaluate based on team preference
│   Can all error handling be local to each step?
│   ├── YES → Choreographed may be sufficient
│   └── NO → Orchestrated gives better error visibility
└── Complex workflow (branches, parallel steps, complex error handling)
    → Orchestrated saga (coordinator)
    Central saga manager controls the flow
    Explicit error handling, retry logic, timeout management
    Pros: full visibility, easier to reason about
    Cons: centralized coordinator is a single point of failure
    `SagaManager` → step1 → step2 → step3 → complete
    On failure: manager runs compensating transactions in reverse
```

### Rationale
Choreographed sagas are simpler but provide less visibility. Each step is self-contained and triggered by events — good for independent teams that don't need to know about each other's internals. Orchestrated sagas centralize the flow in a saga manager that tracks progress, handles failures, and runs compensating transactions. For complex workflows with branches, parallel steps, or multiple failure paths, orchestration provides the needed control and observability.

### Recommended Default
Choreographed for simple linear workflows; orchestrated for complex workflows with multiple failure paths

### Risks
- Choreographed for complex flow: hard to trace, debug, and recover
- Orchestrated for simple flow: over-engineering, single point of control
- No timeouts on saga steps: saga hangs indefinitely on unresponsive step

### Related Rules
- Use choreographed sagas for simple workflows (DBC-11/05-rules.md)
- Use orchestrated sagas for complex workflows (DBC-11/05-rules.md)
- Time-box saga steps with timeouts (DBC-11/05-rules.md)

### Related Skills
- Implement Sagas for Multi-Context Transactions (DBC-11/06-skills.md)
- Implement Domain Events (CPC-02/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)

---

## Decision 3: State-persisted saga vs in-memory saga

### Decision Tree

```
Can the saga lose its state and still be acceptable?
├── NO → State must be persisted
│   → Persist saga state in database
│   Store saga ID, type, status, current step, and payload
│   `saga_states` table enables recovery on crash
│   Is the saga orchestrated?
│   ├── YES → Persist state in saga manager
│   │   Manager restores from database on restart
│   │   Continues from last completed step
│   └── NO (choreographed)
│       → Persist individual event processing state
│       Each event handler tracks what events it has processed
│       Idempotency ensures safe retry
└── YES (acceptable to lose state)
    → In-memory saga (ephemeral)
    No persistence — state lives in process memory
    Saga is lost on crash or restart
    Use only for: non-critical operations where failure means manual retry
    Warning: most business operations should persist state
```

### Rationale
In-memory sagas are lost when the process crashes. For critical workflows (financial transactions, orders, user registration), losing saga state means the system doesn't know whether steps completed or need compensation. A persisted saga state in a `saga_states` table enables recovery — on restart, the saga manager finds incomplete sagas and resumes or compensates them. The overhead of persisting saga state is minimal (one row per saga), and the reliability benefit is enormous.

### Recommended Default
Persist saga state in database for all critical workflows

### Risks
- In-memory saga on crash: saga state lost, manual recovery needed
- Missing idempotency: duplicate compensation when saga restarts
- State table performance: becomes bottleneck for high-throughput sagas

### Related Rules
- Persist saga state for recovery from failures (DBC-11/05-rules.md)
- Design compensating transactions to be idempotent (DBC-11/05-rules.md)
- Use the Outbox pattern to guarantee event delivery (DBC-11/05-rules.md)

### Related Skills
- Implement Sagas for Multi-Context Transactions (DBC-11/06-skills.md)
- Manage Eventual Consistency (DBC-12/06-skills.md)
- Implement Outbox Pattern (CPC-10/06-skills.md)
