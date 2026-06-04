# Decision Trees: Action Classes

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Action classes: single-operation-per-class pattern
- **Knowledge Unit ID:** SLP-02
- **Difficulty Level:** Foundation

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Action class vs service class for an operation | Architecture | Class creation |
| 2 | Actions as leaf nodes vs action-to-action calls | Architecture | Method design |
| 3 | Stateless action vs stateful action | Reliability | Class design |

---

## Decision 1: Action class vs service class for an operation

### Context
Actions encapsulate one operation per class (RegisterUserAction, ProcessPaymentAction). Services group related operations per entity (UserService). Use actions when operations are distinct enough to warrant individual classes, preventing the god service class problem. Use services when operations share significant internal logic or state.

### Decision Tree

```
Is this operation a leaf-node business operation (no sub-operations)?
├── YES
│   Is the operation complex enough to warrant its own class?
│   ├── YES (involves multiple models, events, or coordination) → Action class
│   └── NO (simple model call like User::create) → Keep inline or in service
└── NO (operation has sub-operations that could be separate actions)
    → Service class orchestrating multiple actions
    Could the service be replaced by a single action?
    ├── YES → Single action is sufficient — don't create unnecessary service
    └── NO → Service as orchestrator is correct pattern
```

### Rationale
Actions prevent god service classes by forcing each operation into its own class. The cost is more files; the benefit is independent testability, injectability, and composability. The deciding factor is whether the operation is a leaf node in the call graph. If it calls sub-operations, it should be a service; if it's a terminal operation, it should be an action.

### Recommended Default
Action for complex leaf-node operations; service for orchestrating multiple actions

### Risks
- Too many actions: class explosion without organization — use domain subdirectories
- Anemic action: wraps single model method without adding value
- Action instead of service: hidden orchestration, action calling actions

### Related Rules
- One Public Method Per Action (SLP-02/05-rules.md)
- Actions Must Not Call Other Actions (SLP-02/05-rules.md)
- Actions Must Be Stateless (SLP-02/05-rules.md)
- Group Actions By Domain (SLP-02/05-rules.md)

### Related Skills
- Design Single-Operation Action Classes (SLP-02/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Build Service-Action-Repository Pyramid (SLP-04/06-skills.md)

---

## Decision 2: Actions as leaf nodes vs action-to-action calls

### Context
Actions are leaf nodes in the call graph — they must not call other actions. Composition of multiple actions happens at the service layer. Action-to-action calls create opaque call graphs, couple operations, and bypass the service orchestration layer.

### Decision Tree

```
Does this action need to call another action to complete its operation?
├── YES
│   → REFACTOR: Move composition to a service
│   Create a service that orchestrates the two actions
│   Is there already a service that orchestrates this workflow?
│   ├── YES → Move the action call to that service
│   └── NO → Create a service for workflow orchestration
└── NO → Action is a proper leaf node — keep as is
```

### Rationale
The action-service hierarchy is fundamental: services orchestrate, actions execute. Action-to-action calls bypass services, making the call graph harder to trace and test. A service calling Action A then Action B is visible in the service's code. Action A calling Action B hides the call inside Action A.

### Recommended Default
Actions are leaf nodes — never call other actions

### Risks
- Action-to-action calls: opaque call graphs, hard to trace
- Action-to-action calls: coupled operations that can't be tested independently
- No service layer: all orchestration hidden inside actions

### Related Rules
- Actions Must Not Call Other Actions (SLP-02/05-rules.md)
- One Public Method Per Action (SLP-02/05-rules.md)
- Avoid Giant Action Classes (SLP-02/05-rules.md)

### Related Skills
- Design Single-Operation Action Classes (SLP-02/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)

---

## Decision 3: Stateless action vs stateful action

### Context
Actions must be stateless — no mutable properties set between construction and execution. All data must be passed as parameters to `execute()`. Under Octane, stateful actions cause cross-request contamination because singleton instances persist across requests.

### Decision Tree

```
Does the action set any mutable properties between construction and execute()?
├── YES
│   → REFACTOR: Move properties to execute() parameters
│   Is the action running under Octane?
│   ├── YES (or unsure) → CRITICAL: State leaks between requests immediately
│   └── NO → Still refactor — stateful actions are fragile regardless
└── NO (all data passed to execute())
    → Stateless — Octane-safe and correct design
```

### Rationale
Actions are registered as singletons in the container by default. Any mutable property set on the instance persists for the lifetime of the worker process. Under Octane, this means request A sets `$this->userId = 1`, and request B reads `$this->userId = 1` — a cross-request data leak. Stateless actions are the only safe pattern.

### Recommended Default
Actions are stateless — all data passed to execute() parameters

### Risks
- Stateful under Octane: cross-request data leaks, hard to diagnose
- Stateful not under Octane: breaks silently if deployment switches to Octane
- Mutable properties on singleton: persists across all calls within same process

### Related Rules
- Actions Must Be Stateless (SLP-02/05-rules.md)
- One Public Method Per Action (SLP-02/05-rules.md)
- Limit Constructor Dependencies (SLP-02/05-rules.md)

### Related Skills
- Design Single-Operation Action Classes (SLP-02/06-skills.md)
- Handle Octane Service State (SLP-19/06-skills.md)
