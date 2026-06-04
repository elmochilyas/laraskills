# Decision Trees: Avoiding Anemic Domain Model

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Avoiding anemic domain model in service-layer architectures
- **Knowledge Unit ID:** SLP-18
- **Difficulty Level:** Expert

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Model method vs service method | Architecture | Feature implementation |
| 2 | Thin service vs fat service | Architecture | Service design |
| 3 | Mass assignment via fillable vs guarded / named constructors | Architecture | Model construction |

---

## Decision 1: Model method vs service method

### Context
When implementing a new feature, the first instinct is often to put logic in a service method. This creates anemic models — property bags with no behavior, where all business rules live in services. The decision point: does the behavior operate on model state? If yes, it belongs on the model. Service methods should orchestrate, not enforce.

### Decision Tree

```
Does the behavior operate on a single model's state (checking/updating its properties)?
├── YES → Put the method on the model
│   `Order::cancel()` checks status, updates properties, saves
│   Service calls `$order->cancel()`
│   Does the behavior span multiple models?
│   ├── YES → Consider domain service (extract when logic involves multiple aggregates)
│   └── NO → Model method is correct — keep it there
└── NO (behavior doesn't operate on model state — orchestration, workflow)
    → Put the method in a service
    Service decides the sequence of operations
    Service calls model methods for state changes
    Does the service method contain if-statements checking model state?
    ├── YES → Refactor — move those checks to the model as guard methods
    └── NO → Service orchestration is correct
```

### Rationale
Anemic models are the result of habitually putting behavior in services. The rule is: if the behavior checks or changes model state, it belongs on the model. `$order->cancel()` is a model method because it checks `$order->status` and sets `$order->cancelled_at`. The service calls `cancel()` and then dispatches events — that's orchestration. Models should protect their own invariants and throw on invalid transitions.

### Recommended Default
Add behavior to model first; extract to domain service only when behavior spans multiple models

### Risks
- All logic in service: models become property bags, business rules scattered
- Duplicate enforcement: model has `activate()` but service still checks `canBeActivated()`
- Bypassing model methods: service sets `$model->status` directly instead of calling `$model->activate()`

### Related Rules
- Add Behavior To Models First (SLP-18/05-rules.md)
- Models Must Protect Their Own Invariants (SLP-18/05-rules.md)
- Service Calls Model Methods, Not Set Attributes Directly (SLP-18/05-rules.md)

### Related Skills
- Avoid Anemic Domain Model in Service-Layer Architectures (SLP-18/06-skills.md)
- Implement Domain Entities (LAP-10/06-skills.md)
- Design Domain Services (LAP-09/06-skills.md)

---

## Decision 2: Thin service vs fat service

### Context
A service method with 30+ lines of if-statements checking model state is a smell. The service should orchestrate (call model methods, dispatch events, log) while the model enforces. Thin service methods indicate a healthy domain model. The threshold: if a service method contains more logic than orchestration, it's too fat.

### Decision Tree

```
Does the service method contain more business logic than orchestration calls?
├── YES → Service is too fat — models are likely anemic
│   Identify if-statements checking model state
│   ├── YES → Move each state check into a model method
│   │   `if ($order->status !== 'pending')` → `$order->cancel()` throws
│   └── NO (service contains complex computation, not state checks)
│       → Consider value object or service class for that logic
├── PARTIALLY — service has both orchestration and some business logic
│   → Extract business logic into model methods incrementally
│   Start with the most duplicated check — move to model
└── NO (service calls model methods, dispatches events, returns result)
    → Service is thin — correct health
    Does the service have a clear single responsibility?
    ├── YES → Good — keep it focused
    └── NO → Refactor into smaller services/actions
```

### Rationale
A service method's health correlates with line count and the ratio of business logic to orchestration. A healthy service method: `$order->cancel(); $this->events->dispatch(new OrderCancelled($order)); $this->logger->info(...)`. An unhealthy service method: 10 lines of if-statements checking order status, 5 lines of attribute updates, 2 lines of orchestration. The business logic in the if-statements belongs on the model.

### Recommended Default
Service methods that call model methods and dispatch events; model methods that enforce invariants

### Risks
- Fat service with anemic model: logic unreusable across services, hard to test
- Inconsistent thinness: some services thin, others fat — team convention needed
- Model over-bloating: too many responsibilities on one model — split by aggregate

### Related Rules
- Keep Service Methods Thin (SLP-18/05-rules.md)
- Add Behavior To Models First (SLP-18/05-rules.md)
- Avoid Logic Duplication Between Model And Service (SLP-18/05-rules.md)

### Related Skills
- Avoid Anemic Domain Model in Service-Layer Architectures (SLP-18/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)

---

## Decision 3: Mass assignment via fillable vs guarded / named constructors

### Context
Rich domain models that protect invariants are undermined by mass assignment. `Model::create($request->all())` or `$model->fill($data)` can set `is_admin`, bypass `activate()`, or skip validation — all without the model's consent. The decision is whether to allow mass assignment (fillable) or lock it down (guarded) and use named constructors or explicit methods.

### Decision Tree

```
Does the model have business invariants that must be enforced?
├── YES → Disable mass assignment or lock it down
│   Does the model need to be created with valid initial state?
│   ├── YES → Use named constructor (static factory method)
│   │   `User::register(string $name, Email $email): self`
│   │   Named constructor enforces invariants at creation time
│   └── NO → Use `$guarded = ['*']` and explicit method calls
│       `$user = new User(); $user->fillBasicInfo($data);`
└── NO (pure CRUD model with no business rules)
    → `$fillable` is acceptable
    Simple admin panels, data-entry apps, prototypes
    Is there any sensitive attribute (is_admin, role)?
    ├── YES → Still guard those even in CRUD models
    │   `$fillable = ['name', 'email'];` — exclude `is_admin`
    └── NO → Full fillable is fine for pure CRUD
```

### Rationale
Mass assignment is convenient but dangerous for rich domain models. A model with `$fillable = ['status']` can have `$order->update(['status' => 'active'])` bypass the `activate()` method that checks if the order can be activated. Named constructors (`User::register()`) and explicit methods (`$order->cancel()`) make state transitions explicit and enforceable. Guarded models with `$guarded = ['*']` force developers through behavior methods.

### Recommended Default
`$guarded = ['*']` for rich domain models; named constructors for complex creation

### Risks
- `$fillable` with all attributes: mass assignment bypasses all model invariants
- No `$guarded` for sensitive attributes: `is_admin` set via mass assignment
- Overly restrictive: `$guarded = ['*']` without named constructors makes simple CRUD painful

### Related Rules
- Eliminate $fillable With All Attributes (SLP-18/05-rules.md)
- Service Calls Model Methods, Not Set Attributes Directly (SLP-18/05-rules.md)
- Models Must Protect Their Own Invariants (SLP-18/05-rules.md)

### Related Skills
- Avoid Anemic Domain Model in Service-Layer Architectures (SLP-18/06-skills.md)
- Implement Domain Entities (LAP-10/06-skills.md)
- Design Value Objects (LAP-07/06-skills.md)
