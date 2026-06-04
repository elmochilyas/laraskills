# CastsAttributes Interface — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | CastsAttributes Interface |
| Focus | Anti-patterns in implementing the foundational custom cast interface |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Null Auto-Coercion Without Explicit Handling | Reliability | Critical |
| 2 | Incorrect Return Value from set | Reliability | High |
| 3 | I/O Operations Inside Cast Methods | Performance | Critical |
| 4 | Business Logic Through the Model Instance | Design | High |
| 5 | Unimplemented get or set on Bidirectional Cast | Framework Usage | High |
| 6 | Custom Cast When Built-in Converts Correctly | Design | Medium |

## Repository-Wide Cross-Cutting Patterns

- Custom cast classes are a common source of hidden performance problems because `get()` and `set()` execute synchronously on every attribute access
- The bidirectional contract (`get`/`set`) is frequently misunderstood — developers often implement only `get` and leave `set` broken
- Null handling is the most commonly missed edge case in custom casts, causing sporadic production errors that are difficult to reproduce

---

## 1. Null Auto-Coercion Without Explicit Handling

### Category
Reliability

### Description
A custom cast that assumes the database value is always present and fails or auto-coerces when `null` is passed to `get()` or `set()`. This causes runtime errors or silent data transformation of null to meaningless defaults when nullable columns are introduced.

### Why It Happens
Developers test with non-null values and don't consider the null case. The column may start as `NOT NULL` and become nullable later through schema changes. The `get()` method receives `null` directly from the database without warning.

### Warning Signs
- `get()` accesses `$value` without checking for null (e.g., `$value / 100`, `explode()`, `json_decode()`)
- `set()` calls methods on `$value` without null check (e.g., `$value->toCents()`)
- Cast class return type does not include `?` nullable indicator
- No test coverage for null input values

### Why Harmful
- Production crashes when a column value is null — the cast throws a type error
- If null is auto-coerced (e.g., `$value ?? 0`), the domain loses the distinction between "zero" and "not set"
- Schema changes that introduce nullable columns break existing casts silently
- Debugging is difficult because the error manifests when reading or writing the attribute, not when the schema changes

### Consequences
- Runtime type errors ("Call to a member function on null") in production
- Silent data corruption: null stored as 0, empty string, or other meaningless default
- Schema migrations that add nullable columns break existing code unexpectedly
- Loss of null semantics in the domain layer

### Preferred Alternative
```php
public function get(Model $model, string $key, mixed $value, array $attributes): ?Money
{
    return $value === null ? null : new Money($value / 100);
}

public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    if ($value === null) {
        return [$key => null];
    }
    return [$key => $value->toCents()];
}
```

### Refactoring Strategy
1. Identify all custom casts that don't check for null in `get()` or `set()`
2. Add explicit null checks at the top of both methods
3. Update return types to include `?` nullable indicator
4. Add test cases with null input values

### Detection Checklist
- [ ] Search for `function get(.*)` in cast classes — count those without `$value === null` checks
- [ ] Check return types — do they include `?` for nullable?
- [ ] Search for `function set(.*)` — count those without `$value === null` checks
- [ ] Review test suites for null input test cases

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Handle Null Explicitly in get and set |
| Skill | `06-skills.md` — Step 4: Handle null explicitly |
| Decision Tree | `07-decision-trees.md` — Decision 3: Null Passthrough vs Auto-Coercion |

---

## 2. Incorrect Return Value from set

### Category
Reliability

### Description
The `set()` method returns a non-array value, an array with a hardcoded key instead of the provided `$key`, or a malformed structure. This violates the `CastsAttributes` contract and causes incorrect attribute assignment during save operations.

### Why It Happens
Developers don't read the interface contract carefully. The `set()` method looks like it should return the transformed value, but the framework expects a key-value array. Returning the scalar value directly is a common mistake.

### Warning Signs
- `set()` returns a scalar (string, int, object) instead of `[$key => value]`
- `set()` returns `['hardcoded_key' => $value]` instead of `[$key => $value]`
- Model saves silently fail to persist the attribute value
- Unit tests mock `set()` but don't assert the return structure
- Debugging shows the attribute value unchanged after `save()`

### Why Harmful
- The attribute is not saved to the database — or worse, saved under the wrong column
- Silent failure: Laravel uses the returned array to set attributes on the model. If the key is wrong, the wrong column gets the value
- Debugging is confusing — the model shows the transformed value in memory, but the database has the wrong or unchanged value
- Multi-attribute casts that modify sibling columns must include all modified keys; missing one causes partial updates

### Consequences
- Data loss: attribute values not persisted to the database
- Data corruption: values written to the wrong columns
- Intermittent bugs where saves appear to succeed but actually don't update the cast attribute
- Wasted debugging time tracing why attribute values don't persist

### Preferred Alternative
```php
public function set(Model $model, string $key, mixed $value, array $attributes): array
{
    if ($value === null) {
        return [$key => null];
    }
    return [$key => $value * 100]; // Uses $key, returns key-value pair
}
```

### Refactoring Strategy
1. Identify cast classes with incorrect `set()` return values
2. Ensure `set()` always returns `[$key => $value]` for single-attribute casts
3. For multi-attribute casts, ensure the array includes all modified keys
4. Add tests that assert `set()` return value structure

### Detection Checklist
- [ ] Search for `function set(.*): array` — check return statements
- [ ] Search for hardcoded attribute keys in `set()` return values
- [ ] Verify `set()` returns an array (not a scalar)
- [ ] Test: save a model with a new cast value and verify the database column is updated

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Return Full Key-Value Array From set |
| Skill | `06-skills.md` — Step 3: Implement set() contract |
| Knowledge | `04-standardized-knowledge.md` — set returns array of key-value pairs |

---

## 3. I/O Operations Inside Cast Methods

### Category
Performance

### Description
Performing database queries, HTTP requests, filesystem reads, or any I/O inside `get()` or `set()` methods. These methods execute synchronously on every attribute access, making I/O latency proportional to attribute reads rather than intentional operations.

### Why It Happens
Developers treat the cast class as a convenient place to resolve related data. The model instance is available, so lazy-loading a relationship or looking up a configuration value seems natural inside the cast.

### Warning Signs
- `$model->relation` (lazy relationship load) inside `get()` or `set()`
- `$model->relation()->count()`, `$model->relation()->where()` queries
- `Http::get()`, `Storage::get()`, `Cache::get()` calls inside cast methods
- Debug toolbar showing queries originating from cast methods
- Slow attribute reads that are traced to hidden database calls

### Why Harmful
- Every attribute read triggers I/O: `$model->casted_attr` in Blade, serialization, or debugging all execute the query
- N+1 query problem within a single attribute read: reading 100 models with a cast that does a query generates 100 extra queries
- I/O latency blocks the request thread for every attribute access
- Hidden performance costs: the cast looks simple but has hidden I/O that only appears in profiling

### Consequences
- Severe N+1 query patterns from attribute access
- Request latency spikes proportional to model attribute reads
- Database connection exhaustion from hidden queries
- Profile noise: queries attributed to attribute access rather than intentional data loading

### Preferred Alternative
```php
// Keep cast methods fast — no I/O
public function get(Model $model, string $key, mixed $value, array $attributes): Role
{
    return new Role($value);
}
```

### Refactoring Strategy
1. Identify I/O operations inside cast `get()` and `set()` methods
2. If the I/O resolves data that should be eager-loaded, move loading to the query layer or controller
3. If the I/O computes a derived value, move to an accessor or service
4. If the I/O is a cached lookup, ensure the cache is in-memory and pre-warmed
5. Never perform DB queries or HTTP calls inside casts

### Detection Checklist
- [ ] Search for `->` calls on `$model` inside cast methods (relationship access)
- [ ] Search for `DB::`, `Http::`, `Storage::`, `Cache::` inside cast files
- [ ] Check debug toolbar for query sources from cast classes
- [ ] Profile attribute read latency with and without the cast

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep Cast Methods Fast — No DB Queries or External Calls |
| Skill | `06-skills.md` — Step 7: Keep cast methods fast |
| Knowledge | `04-standardized-knowledge.md` — Performance considerations |

---

## 4. Business Logic Through the Model Instance

### Category
Design

### Description
Using the `$model` parameter in `get()` or `set()` to call business methods, orchestrate domain logic, or invoke model relationships beyond simple sibling attribute access. The cast becomes coupled to the model's internal API rather than transforming data.

### Why It Happens
The model instance is readily available in `get()` and `set()`, making it tempting to use for convenience. Casts that need sibling values from the model can easily escalate into calling model methods for business logic.

### Warning Signs
- `$model->someBusinessMethod()`, `$model->applyDiscount()` inside `get()` or `set()`
- Cast that calls `$model->save()`, `$model->dispatch()`, or other state-changing methods
- Cast that references model-specific logic that would break if reused on a different model
- Unit tests for the cast that require bootstrapping a full model instance

### Why Harmful
- Couples the cast to specific model methods, preventing reuse across models
- Violates Single Responsibility Principle: the cast now does data transformation and business orchestration
- Unit testing requires bootstrapping model instances with the specific methods called
- Business logic runs on every attribute access, even when only serializing or reading
- Fragile: changing a model method breaks the cast silently

### Consequences
- Casts that are model-specific and cannot be reused
- Business logic executed implicitly during serialization, Blade rendering, and API responses
- Slow unit tests that require model bootstrapping
- Brittle code where model refactoring breaks cast behavior
- Business rules scattered across cast classes instead of centralized in domain methods

### Preferred Alternative
```php
// Use model for attribute access only, not business logic
public function get(Model $model, string $key, mixed $value, array $attributes): float
{
    return (float) $value;
}
```

### Refactoring Strategy
1. Identify business logic calls through `$model` inside cast methods
2. Extract business logic to model methods, domain services, or actions
3. Replace the cast call with explicit method invocation at the controller/service level
4. If the cast needs sibling attribute values, access them via `$attributes` array parameter

### Detection Checklist
- [ ] Search for `$model->` calls inside cast `get()`/`set()` that are not pure attribute access
- [ ] Check if the cast calls methods beyond simple accessor/getter patterns
- [ ] Review cast test files — do they require full model bootstrapping?
- [ ] Assess if the cast would work on a plain PHP object (not Eloquent model)

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use Model Instance for Context Only, Not Business Logic |
| Knowledge | `04-standardized-knowledge.md` — Use model for context, not logic |
| Skill | `06-skills.md` — Inputs: transformation logic, not business orchestration |

---

## 5. Unimplemented get or set on Bidirectional Cast

### Category
Framework Usage

### Description
Implementing only one of the two required methods (`get` or `set`) on a `CastsAttributes` implementation, leaving the other to throw an exception or return incorrectly. The cast is registered as bidirectional but fails when the framework calls the missing direction.

### Why It Happens
Developers may only need read transformation initially and add the `$casts` entry, then forget to implement `set` when writes occur. Or they confuse `CastsAttributes` with `CastsInboundAttributes`. The cast works for reads but fails on saves.

### Warning Signs
- Cast class with only `get()` or only `set()` implemented, throwing `NotImplementedException` or ` LogicException` for the other
- Models with the cast attribute fail to save with cryptic errors
- Cast class implements `CastsAttributes` but only has one method body
- Unit tests only test `get()` or only test `set()`, never both
- Code review approves a cast with only one direction implemented

### Why Harmful
- Models cannot be saved or updated if `set()` is missing
- Reads succeed, writes fail — intermittent errors depending on the operation
- The interface contract is violated — Laravel's casting system expects both methods for `CastsAttributes`
- Confusing error messages: "Array to string conversion" or "Method ... not found" when the framework calls the missing method

### Consequences
- Runtime exceptions when saving models with the cast attribute
- Partial functionality: creating or updating records with the cast fails silently or loudly
- Wasted debugging time tracing save failures to missing `set()` implementation
- Confusion about whether the cast supports writes at all

### Preferred Alternative
```php
// Always implement both directions for CastsAttributes
class MoneyCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?Money
    {
        return $value === null ? null : new Money($value / 100);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        if ($value === null) {
            return [$key => null];
        }
        return [$key => $value instanceof Money ? $value->cents : $value];
    }
}
```

### Refactoring Strategy
1. Identify casts implementing `CastsAttributes` with only one method
2. If bidirectional transformation is needed, implement the missing method
3. If only one direction is needed, switch to `CastsInboundAttributes` (write-only) or accessor (read-only)
4. Add tests for both directions

### Detection Checklist
- [ ] Search for `implements CastsAttributes` and check both methods exist
- [ ] Search for `throw` or `NotImplemented` in `get()` or `set()` methods
- [ ] Check test files for both `get()` and `set()` test coverage
- [ ] Verify a model with the cast can be both read and saved

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Implement Both get and set for Bidirectional Casts |
| Decision Tree | `07-decision-trees.md` — Decision 2: Bidirectional vs Inbound vs Read-Only |
| Knowledge | `04-standardized-knowledge.md` — Bidirectional transformation contract |

---

## 6. Custom Cast When Built-in Converts Correctly

### Category
Design

### Description
Creating a `CastsAttributes` implementation to handle a transformation that Laravel's built-in casting system already supports (`int`, `bool`, `array`, `object`, `collection`, `datetime`, etc.). The custom cast duplicates built-in functionality with no added value.

### Why It Happens
Developers may not be familiar with the full range of built-in cast types. Some team cultures prefer custom code over framework conventions. Custom casts may have been created before the built-in option was available or known.

### Warning Signs
- Custom cast that simply calls `(int) $value`, `(bool) $value`, `json_decode()`/`json_encode()` without additional logic
- Cast class with less than 10 lines of actual transformation logic in both `get()` and `set()`
- Comment in the cast class says "same as built-in" or "just converts to X"
- Built-in `$casts` options (`int`, `bool`, `array`, `object`, `collection`, `datetime`) would handle the use case identically

### Why Harmful
- Unnecessary code to write, test, and maintain
- Extra class file per attribute that could be a single `$casts` entry
- Testing overhead — custom casts require tests that built-in casts don't
- Onboarding friction: new developers must learn custom cast classes for standard transformations
- Frame: the entire cast class could be replaced with `'attribute' => 'boolean'`

### Consequences
- Codebase bloat from unnecessary custom cast classes
- Higher maintenance burden for zero functional benefit
- Inconsistent patterns: some attributes use built-in casts, others use custom casts for the same transformation
- Wasted development time writing and testing redundant casts

### Preferred Alternative
```php
// Built-in cast — no custom class needed
protected $casts = [
    'is_active' => 'boolean',
    'config' => 'array',
    'metadata' => 'object',
    'items' => 'collection',
];
```

### Refactoring Strategy
1. Identify custom casts that replicate built-in transformations
2. Replace the custom cast registration with the appropriate built-in type
3. Remove the custom cast class and its tests
4. Update any code that depends on the custom cast class type

### Detection Checklist
- [ ] Review custom cast classes for simple typecast logic only
- [ ] Compare cast transformations to built-in `$casts` types
- [ ] Count custom cast classes that could be replaced with one-word cast types
- [ ] Check if the cast adds any behavior beyond what the built-in provides

### Related
| Reference | Link |
|---|---|
| Decision Tree | `07-decision-trees.md` — Decision 1: Custom Cast vs Built-in vs Accessor |
| Knowledge | `04-standardized-knowledge.md` — When NOT To Use: built-in covers use case |
| Rule | `05-rules.md` — Contract enforcement, not reinvention |
