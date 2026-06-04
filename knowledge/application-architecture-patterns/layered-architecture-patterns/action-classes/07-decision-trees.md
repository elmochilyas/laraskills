# Decision Trees: Action Classes

## Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-15-action-classes
**Generated:** 2026-06-04

---

## Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Action vs Service vs Use Case | Architectural | Design |
| 2 | Direct Route Binding vs Controller Delegation | Design | Implement |
| 3 | Action with DTO vs Action with Primitives | Design | Implement |
| 4 | Single Action vs Split Actions | Design | Design |
| 5 | Inline Closure vs Action Class | Design | Implement |

---

## Decision 1: Action vs Service vs Use Case

### Context
Which pattern to use for encapsulating business operations.

### Decision Tree
Does the operation orchestrate multiple domain objects or have 4+ dependencies?
- **YES** → Use Case
- **NO** → Continue

Does the operation group multiple related methods (CRUD for a single entity)?
- **YES** → Service
- **NO** → Continue

Is the operation a single isolated task with 1-3 dependencies?
- **YES** → Action
- **NO** → Continue

Is the operation a one-liner (single method call)?
- **YES** → Inline in controller or closure
- **NO** → Action

### Recommended Default
Start with an Action. Promote to Use Case when complexity grows.

### Risks
- Action for orchestration: insufficient structure for complex operations
- Use Case for simple tasks: architectural overhead without benefit
- Service for everything: violation of single responsibility

---

## Decision 2: Direct Route Binding vs Controller Delegation

### Context
How to connect the Action to HTTP.

### Decision Tree
Is the Action the only operation on this endpoint?
- **YES** → Direct route binding (`Route::post('/', MyAction::class)`)
- **NO** → Continue

Does the endpoint need middleware that applies to multiple Actions?
- **YES** → Controller delegation (shared middleware on controller)
- **NO** → Direct route binding

Does the Action need data that requires controller-level extraction?
- **YES** → Controller delegation
- **NO** → Direct route binding

### Recommended Default
Direct route binding. It eliminates the controller entirely.

### Risks
- Direct binding: no shared middleware control, no controller-level error handling
- Controller delegation: extra code, extra test surface

---

## Decision 3: Action with DTO vs Action with Primitives

### Context
Whether to accept a DTO or primitive parameters in `__invoke()`.

### Decision Tree
Does the Action accept 3+ parameters?
- **YES** → DTO
- **NO** → Continue

Are the parameters likely to change in the future?
- **YES** → DTO (signature change is a DTO field change, not method signature change)
- **NO** → Continue

Is the Action called from multiple places (controller, CLI, queue)?
- **YES** → DTO (consistent interface for all callers)
- **NO** → Primitives may suffice

Are the parameters logically grouped (address fields, payment details)?
- **YES** → DTO (logical grouping improves readability)
- **NO** → Primitives

### Recommended Default
Primitives for 1-2 stable parameters. DTO for 3+ parameters or when the parameter set may evolve.

### Risks
- Primitives for many parameters: fragile signatures, hard-to-read calls
- DTO for 1 parameter: unnecessary ceremony

---

## Decision 4: Single Action vs Split Actions

### Context
Whether to handle related operations in one Action or separate classes.

### Decision Tree
Do the operations share the same input data?
- **YES** → Continue
- **NO** → Split into separate Actions

Are the operations always called together?
- **YES** → Single Action may be appropriate (but reconsider design)
- **NO** → Split into separate Actions

Do the operations have different authorization requirements?
- **YES** → Split into separate Actions
- **NO** → Continue

Can you name the Action without using "and"?
- **YES** → Single Action
- **NO** → Split (ValidateAndApplyCoupon → ValidateCoupon + ApplyCoupon)

### Recommended Default
One Action per distinct operation. Avoid "and" in Action names.

### Risks
- Single Action with multiple operations: violates single responsibility
- Too many Actions: more files, but each is small and focused

---

## Decision 5: Inline Closure vs Action Class

### Context
Whether to implement the operation as an inline closure or an Action class.

### Decision Tree
Is the operation used in more than one route?
- **YES** → Action class (reusable)
- **NO** → Continue

Does the operation need dependency injection?
- **YES** → Action class (constructor injection)
- **NO** → Continue

Will you need to test this operation independently?
- **YES** → Action class (unit testable)
- **NO** → Continue

Is the operation more than 5 lines of logic?
- **YES** → Action class
- **NO** → Inline closure

### Recommended Default
Action class for any non-trivial operation. Inline closures only for trivial passthrough.

### Risks
- Closure for non-trivial logic: untestable, unreusable, undebuggable
- Action class for one-liner: ceremony without benefit
