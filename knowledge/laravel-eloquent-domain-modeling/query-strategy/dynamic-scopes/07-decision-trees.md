# Decision Trees: Dynamic Scopes

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Query Strategy |
| Knowledge Unit | Dynamic Scopes |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Dynamic dispatch vs explicit scopes | Primary |
| 2 | Whitelist security for user input | Architecture |
| 3 | Parameterized scope complexity | Architecture |

---

## Decision 1: Dynamic Dispatch vs Explicit Scopes

### Context
Dynamic scopes resolve at runtime based on data (request parameters, user roles). Explicit scopes are chained at development time. Dynamic dispatch adds flexibility but reduces static analysis and IDE support.

### Criteria
- Are the scopes determined by runtime data (request params, user input)?
- Is the scope set fixed and small (< 10)?
- Is the code infrastructure/generic or business logic?
- Is static analysis important for this code path?

### Decision Tree
```
Are the scopes determined by runtime data?
├── YES
│   └── Is the set of possible scopes known and bounded?
│       ├── YES → Use dynamic dispatch with whitelist
│       │   └── Is the pattern generic (applies to multiple models)?
│       │       ├── YES → Build a generic filter system
│       │       └── NO → Use when() with specific conditions
│       └── NO (open-ended, unknown scope names) → Do NOT use dynamic dispatch
└── NO (scopes are known at development time)
    └── Use explicit scope chaining (clearer, IDE-supported)
```

### Rationale
Dynamic dispatch is for generic infrastructure — filter systems that apply scopes from request parameters, role-based query adapters, or feature-flag-aware building. Business logic should use explicit chaining for clarity and static analysis. Dynamic dispatch from user input without a whitelist is a security vulnerability.

### Recommended Default
Explicit scope chaining for business logic. Dynamic dispatch with whitelist for generic filter infrastructure. Never use dynamic dispatch without a whitelist.

### Risks
- Unvalidated dynamic dispatch: user input calls arbitrary methods
- Dynamic dispatch for business logic: loses static analysis and IDE navigation
- Scope name collisions: dynamic scope name matches a core builder method
- Performance from many `method_exists()` calls in loops

### Related Rules/Skills
- Whitelist Dynamic Scope Names (05-rules.md)
- Explicit Chaining for Business Logic (05-rules.md)
- Scope Registry Pattern (05-rules.md)

---

## Decision 2: Whitelist Security for User Input

### Context
Using user input directly as scope method names allows arbitrary method calls on the builder. A whitelist restricts which scopes can be applied dynamically.

### Criteria
- Is the scope name derived from user input (request parameter, URL)?
- Is there a mapping from parameter names to scope methods?
- Are unknown scope names rejected gracefully?
- Is the whitelist documented and maintained?

### Decision Tree
```
Is the scope name derived from user input?
├── YES
│   └── Is there a whitelist mapping parameter to scope method?
│       ├── YES
│       │   └── Is the whitelist restrictive (only intended scopes)?
│       │       ├── YES → Safe to proceed
│       │       └── NO → Narrow the whitelist to minimum necessary
│       └── NO → MUST add a whitelist before deploying
└── NO (scope name from application code)
    └── No whitelist needed (already controlled)
```

### Rationale
Calling `User::{$userInput}()` without validation allows calling ANY public method on the Builder or Model class, including potentially dangerous ones. A whitelist limits the attack surface to explicitly allowed scope names. The whitelist also serves as documentation of available dynamic scopes.

### Recommended Default
Always maintain a `$filterable` whitelist array on the model for dynamic scope dispatch. Reject unknown scope names with a clear error.

### Risks
- Method injection: user passes `delete()` or `forceDelete()` as scope name
- Reflection bypass: user accesses internal builder methods
- Whitelist too broad: including scopes that should not be user-controllable
- Missing validation on scope parameters: user passes malicious values to whitelisted scopes

### Related Rules/Skills
- Whitelist Dynamic Scope Names (05-rules.md)
- User Input Validation (05-rules.md)
- Audit Logging for Dynamic Scopes (05-rules.md)

---

## Decision 3: Parameterized Scope Complexity

### Context
Parameterized scopes accept runtime arguments. Too many parameters make scopes hard to use and test. The threshold determines when to extract to a query object.

### Criteria
- How many parameters does the scope accept?
- Are the parameters optional with sensible defaults?
- Does the scope combine multiple concerns?
- Is the scope tested with various parameter combinations?

### Decision Tree
```
How many parameters does the scope accept?
├── 0-1 → Simple parameterized scope (fine)
├── 2-3 → Acceptable
│   └── Are all parameters related to the same concern?
│       ├── YES → Single scope is fine
│       └── NO → Split into separate scopes
└── 4+ → Extract to query object
    └── Can parameters be grouped into a value object?
        ├── YES → Create filter DTO + query object
        └── NO → Query object with explicit methods
```

### Rationale
A scope with 5+ parameters is a code smell — it's doing too much or handling too many variations. Each parameter adds test cases (valid, invalid, null, default) exponentially. Query objects handle complex filtering with explicit, testable methods for each combination.

### Recommended Default
Keep parameters to 0-3 per scope. Extract to query objects for 4+ parameters. Use filter DTOs for grouping related parameters.

### Risks
- Too many parameters: untested combinations, unexpected behavior
- All-optional parameters: scope behavior varies widely based on which params are provided
- Parameters from user input without validation: injection or unexpected query behavior
- Boolean flags as parameters: indicates the scope should be split

### Related Rules/Skills
- Parameter Limits (05-rules.md)
- Query Object Extraction (05-rules.md)
- Filter DTO Pattern (05-rules.md)
