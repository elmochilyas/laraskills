# Decision Trees — Thin Controller Principle

## Tree 1: Logic Extraction Decision

**Decision Context**: Determining whether a piece of logic in a controller should be extracted to an action, service, or FormRequest.

**Decision Criteria**:
- Concern type (HTTP, business logic, validation)
- Reuse potential
- Testability requirements

**Decision Tree**:
```
Is the logic related to input validation or request parsing?
├── YES → Extract to FormRequest — validation is a distinct concern from controller delegation
└── NO → Is the logic a business rule or decision (conditions, calculations, data transformations)?
    ├── YES → Extract to action or service — business logic belongs outside HTTP layer
    └── NO → Is the logic related to response formatting?
        ├── YES → Extract to API Resource or response factory — formatting belongs in dedicated classes
        └── NO → Is the logic pure coordination (call action → return response)?
            ├── YES → Keep in controller — that's exactly what controllers should do
            └── NO → Extract to the most appropriate layer by elimination
```

**Rationale**: Controllers should only coordinate: parse request → delegate → respond. Everything else belongs in a lower layer.

**Recommended Default**: Controller method body should be 3-5 lines: FormRequest → DTO → action/service → response.

**Risks**: Extracting every condition creates unnecessary class count. Keeping business logic in controllers creates untestable, unreusable code.

---

## Tree 2: Code Review Violation Decision

**Decision Context**: Determining whether a controller violates the thin controller principle during code review.

**Decision Criteria**:
- Controller method line count
- Presence of Eloquent queries, business conditionals, event/queue dispatching
- HTTP vs business concern boundary

**Decision Tree**:
```
Does the controller method exceed 10 lines of executable code (excluding imports, boilerplate)?
├── YES → Violation — extract logic to action, service, or FormRequest
└── NO → Does the controller contain any of the following?
    • Eloquent queries (User::find, User::where, DB::table)
    • Business conditionals (if ($user->isAdmin()))
    • Event dispatching (event(), Event::dispatch)
    • Queue dispatching (Job::dispatch)
    • Mailing (Mail::to)
├── YES → Any of the above = violation — extract to action/service
└── NO → Does the controller return an Eloquent model directly?
    ├── YES → Violation — use API Resource or DTO for response
    └── NO → No violation — controller follows thin controller principle
```

**Rationale**: The checklist is clear: no Eloquent queries, no business logic, no dispatching, no direct model returns. Any violation requires extraction.

**Recommended Default**: Reject controllers with any business logic, Eloquent queries, or dispatching during code review.

**Risks**: Accepting "just this once" violations normalizes fat controllers. Over-strict enforcement on tiny prototypes may slow initial development.
