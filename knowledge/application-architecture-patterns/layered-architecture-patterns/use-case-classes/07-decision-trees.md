# Decision Trees: Use Case Classes

## Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-11-use-case-classes
**Generated:** 2026-06-04

---

## Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Use Case vs Action vs Service | Architectural | Design |
| 2 | \_\_invoke vs execute vs handle | Design | Implement |
| 3 | DTO per Use Case vs Shared DTOs | Design | Design |
| 4 | Transaction Scope in Use Case | Design | Implement |
| 5 | Single Use Case vs Multiple for Related Operations | Architectural | Design |

---

## Decision 1: Use Case vs Action vs Service

### Context
Three patterns for encapsulating business operations. Each has different characteristics.

### Decision Tree
Does the operation orchestrate multiple domain objects or steps?
- **YES** → Use Case
- **NO** → Continue

Does the operation take 1-3 dependencies and perform a single, isolated task?
- **YES** → Action class (LAP-15)
- **NO** → Continue

Does the operation group multiple related methods (CRUD on a single entity)?
- **YES** → Service class (SLP-01)
- **NO** → Use Case

### Recommended Default
Start with a Use Case. If it becomes a single method call with few dependencies, collapse to an Action.

### Risks
- Using Actions for orchestration: insufficient structure for complex operations
- Using Services for single operations: violates single responsibility
- Using Use Cases for CRUD: over-engineering

---

## Decision 2: __invoke vs execute vs handle

### Context
Three naming conventions for the single public method.

### Decision Tree
Does the project already use a convention?
- **YES** → Follow existing convention
- **NO** → Continue

Is the Use Case routed directly (Route::post('/', MyUseCase::class))?
- **YES** → Use `__invoke`
- **NO** → Continue

Does the team prefer explicit, self-documenting method names?
- **YES** → Use `execute`
- **NO** → Use `handle`

### Recommended Default
`__invoke` for route-backed Use Cases. `execute` for clarity when the Use Case is called programmatically.

### Risks
- Mixing conventions in the same project creates confusion
- `__invoke` makes stack traces slightly less readable (shows `__invoke` instead of meaningful name)

---

## Decision 3: DTO per Use Case vs Shared DTOs

### Context
Whether to create a dedicated DTO for each Use Case or share DTOs across related operations.

### Decision Tree
Do the Use Cases operate on the same entity with overlapping data?
- **YES** → Continue
- **NO** → DTO per Use Case

Are the input fields for Create and Update >80% the same?
- **YES** → Shared DTO with optional fields or separate but inheriting DTOs
- **NO** → DTO per Use Case

Do the Use Cases have different authorization requirements?
- **YES** → DTO per Use Case (authorization varies per operation)
- **NO** → Shared DTO acceptable

### Recommended Default
DTO per Use Case for loose coupling. Shared DTOs only for closely related CRUD operations.

### Risks
- Shared DTOs: changes for one Use Case affect another — coupling
- DTO per Use Case: more classes to maintain — but each is simple and focused

---

## Decision 4: Transaction Scope in Use Case

### Context
Where to draw the transaction boundary within a Use Case.

### Decision Tree
Does the operation involve multiple writes that must be atomic?
- **YES** → Wrap entire orchestration in a transaction
- **NO** → Continue

Does the operation include slow external API calls?
- **YES** → Split: validate/local writes first in transaction, external calls after commit
- **NO** → Continue

Does the operation dispatch queue jobs that read the written data?
- **YES** → Use `afterCommit` on dispatches inside the transaction
- **NO** → Standard transaction pattern

### Recommended Default
Narrow transaction scope — commit as early as possible to release locks.

### Risks
- Transaction too broad: holds database locks for entire operation, including slow API calls
- Transaction too narrow: partial writes if an orchestrator step fails after the transaction
- Missing transaction: inconsistent state if one write succeeds and another fails

---

## Decision 5: Single Use Case vs Multiple for Related Operations

### Context
Whether to model related business operations (Create + Cancel + Refund for Orders) as one class or separate classes.

### Decision Tree
Do the operations share >50% of orchestration steps?
- **YES** → Consider extracting shared orchestration to a Service, keep Use Cases separate
- **NO** → Separate Use Cases

Do the operations require different dependencies?
- **YES** → Separate Use Cases (different constructor signatures)
- **NO** → Continue

Are the operations likely to change independently?
- **YES** → Separate Use Cases
- **NO** → Single Use Case with multiple methods (technically a Service)

### Recommended Default
Separate classes per business operation — `CreateOrder`, `CancelOrder`, `RefundOrder`. Extract shared logic to a private method or a supporting Service.

### Risks
- Single class with many methods: violates single responsibility, grows unbounded
- Too many classes: more files to navigate, but each is small and focused
