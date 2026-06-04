# Decision Trees: Conditional Attributes

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Serialization |
| Knowledge Unit | Conditional Attributes |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Conditional method selection (whenLoaded vs whenCounted vs when) | Primary |
| 2 | Conditional attribute performance | Architecture |
| 3 | Nested conditional complexity | Architecture |

---

## Decision 1: Conditional Method Selection

### Context
API Resources provide five conditional methods: `whenLoaded()`, `whenCounted()`, `whenAggregated()`, `whenNotNull()`, and generic `when()`. Each targets a specific condition type. Using the wrong method produces silent omissions or N+1.

### Criteria
- Is the field a relationship that should only appear when loaded?
- Is the field a count/aggregate from `withCount()`/`withAggregate()`?
- Is the field a nullable attribute that may be null?
- Is the condition based on business logic (role, state)?

### Decision Tree
```
What type of field is being conditionally included?
├── Relationship (eager-loaded via with())
│   └── Use whenLoaded('relation')
│       └── Is the relation eager-loaded at the query site?
│           ├── YES → Safe; silent omission if not loaded
│           └── NO → Add with() to query or field silently disappears
├── Aggregate (count, sum, avg via withCount/withAggregate)
│   └── Use whenCounted() or whenAggregated()
├── Nullable attribute
│   └── Use whenNotNull($this->field)
└── Business logic condition
    └── Use generic when(condition, value)
        └── Pass closure for $value if expensive computation
```

### Rationale
`whenLoaded()` is specifically for relationships — it checks `relationLoaded()` which is O(1) and prevents N+1. `whenCounted()` checks `relationLoaded()` for the count attribute. `whenNotNull()` is explicit about nullable fields. Using generic `when()` for these specific cases adds unnecessary ambiguity.

### Recommended Default
Use the most specific conditional method available. `whenLoaded()` for relationships. `whenCounted()` for counts. `whenNotNull()` for nullable fields. Reserve generic `when()` for business logic conditions.

### Risks
- Relationship field without `whenLoaded()`: N+1 if relation not loaded
- `whenLoaded()` without `with()`: field silently absent, no error
- `whenCounted()` used without `withCount()`: field silently absent
- Generic `when()` for nullable field: treats `0`, `''`, `false` as absent

### Related Rules/Skills
- whenLoaded for Relationships (05-rules.md)
- whenCounted for Aggregates (05-rules.md)
- whenNotNull for Nullable Fields (05-rules.md)

---

## Decision 2: Conditional Attribute Performance

### Context
Each conditional method creates a wrapper object. Closures passed as values are evaluated lazily. For resources with many conditionals, the allocation and lazy evaluation pattern matters.

### Criteria
- How many conditional fields does the resource have?
- Are the values expensive to compute?
- Are closures used for lazy evaluation?
- Is the resource serialized in listing endpoints (many instances)?

### Decision Tree
```
Are any conditional values expensive to compute (> 1ms)?
├── YES
│   └── Pass a closure: when($condition, fn() => expensive())
│       └── Is the resource in a listing endpoint?
│           ├── YES → Evaluate if the condition is usually false
│           └── NO → Closure is sufficient
└── NO (simple values or cheap computation)
    └── Pass value directly (no closure needed)
```

### Rationale
Closures passed as `$value` to `when()` are only invoked when the condition is true. For expensive computations that are rarely included, this saves the cost on most requests. For simple values, closures add unnecessary overhead. The tradeoff is closure allocation vs computation.

### Recommended Default
Pass closures for expensive values that are rarely included. Pass values directly for cheap or always-included fields. For listing endpoints with many resources, minimize closure count.

### Risks
- Non-closure expensive value evaluated before `when()` call: always computed regardless of condition
- Too many closures on listing resource: allocation overhead = N × closures per resource
- Closure capturing large variables: memory retained until closure resolved
- Inline expression instead of closure: expression evaluated even when condition is false

### Related Rules/Skills
- Closure for Expensive Values (05-rules.md)
- Inline for Cheap Values (05-rules.md)
- Resource Listing Performance (05-rules.md)

---

## Decision 3: Nested Conditional Complexity

### Context
Deeply nested `when()` chains make `toArray()` unreadable. Complex conditional logic should be extracted to maintain readability and testability.

### Criteria
- Are conditional fields nested inside other conditionals?
- Does the conditional logic span more than 5 lines?
- Is the same conditional pattern repeated across resources?
- Could the logic be extracted to a private method?

### Decision Tree
```
Is the toArray() method longer than 30 lines?
├── YES
│   └── Extract logical groups to private methods
│       └── Are conditionals nested > 2 levels deep?
│           ├── YES → Extract to named private method
│           └── NO → Group extraction sufficient
└── NO
    └── Is any single conditional block > 5 lines?
        ├── YES → Extract that block to a private method
        └── NO → Inline conditional is fine
```

### Rationale
`toArray()` returns a single array — long methods with nested logic are hard to read and test. Private methods on the resource class (`private function adminFields(): array`, `private function relationshipFields(): array`) keep `toArray()` readable while isolating conditional logic.

### Recommended Default
Keep `toArray()` under 30 lines. Extract conditional groups to private methods. Test private methods' output for both true and false conditions.

### Risks
- Unreadable `toArray()`: bugs hidden in nested conditionals
- No tests for conditional branches: silent omission on edge cases
- Copy-pasted conditional patterns across resources: inconsistent behavior
- Extracting too aggressively: method explosion for simple conditionals

### Related Rules/Skills
- toArray() Readability (05-rules.md)
- Private Method Extraction (05-rules.md)
- Conditional Branch Testing (05-rules.md)
