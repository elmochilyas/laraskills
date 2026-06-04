# SerializesCastableAttributes — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | SerializesCastableAttributes |
| Focus | Anti-patterns in custom cast serialization |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Non-Serializable Return From serialize() | Framework Usage | Critical |
| 2 | Model State Access in serialize() | Design | High |
| 3 | Business Logic in serialize() | Design | High |
| 4 | Unnecessary SerializesCastableAttributes Implementation | Maintainability | Medium |
| 5 | Using SerializesCastableAttributes When API Resources Are Needed | Architecture | High |

## Repository-Wide Cross-Cutting Patterns

- `serialize()` is frequently implemented unnecessarily — developers add it even when the PHP and API representations are identical
- The `$model` parameter is the most common source of misuse, with developers using it for authorization and relationship loading
- Custom casts with `serialize()` often try to handle both type-level and context-level serialization, violating single responsibility

---

## 1. Non-Serializable Return From serialize()

### Category
Framework Usage

### Description
The `serialize()` method returns a value object, object instance, or other non-JSON-serializable type instead of a plain array, scalar, or null. When `json_encode()` processes this return value during model serialization, it fails silently or throws.

### Why It Happens
Developers may not understand that `serialize()` output is passed directly to `json_encode()`. The method signature's return type (`mixed`) is too permissive, offering no compile-time guidance. Developers may return the value object directly, assuming Eloquent handles the conversion.

### Warning Signs
- `serialize()` return type is a value object class (e.g., `Money`, `Email`) instead of `array`
- Silent `null` values in JSON output for cast attributes
- `json_encode()` errors in logs referencing model serialization
- API responses with missing fields for cast attributes
- Tests that fail with "Serialization of '...' is not allowed" exceptions
- `toArray()` returning incomplete data for models with custom casts

### Why Harmful
- API responses silently drop attribute values (null instead of the expected data)
- JSON serialization failures may partially render responses
- Queue jobs serializing models may fail or lose data
- Logging and broadcasting operations that serialize models produce incomplete output
- Debugging is difficult because the error may be swallowed by Laravel's JSON encoding

### Consequences
- Broken API endpoints with missing or null attribute values
- Corrupted data in queues and job payloads
- Silent data loss when models are serialized for caching
- Debugging sessions that trace "null values" back to serialization failures
- Inconsistent behavior: `$user->toArray()` works in some contexts but not others

### Preferred Alternative
```php
public function serialize(Model $model, string $key, mixed $value, array $attributes): array
{
    return [
        'amount' => $value->format(),
        'currency' => $value->currency(),
    ];
}
```

### Refactoring Strategy
1. Identify all `serialize()` methods with non-JSON-serializable return types
2. Change the return type to `array` (or `string|int|float|bool|null`)
3. Transform the value object into plain data before returning
4. Test model serialization with `$model->toArray()` and `$model->toJson()`
5. Verify all API endpoints return expected data for cast attributes

### Detection Checklist
- [ ] Search for `function serialize(` in cast classes and check return types
- [ ] Test `json_encode($model)` for models with custom casts
- [ ] Verify `$model->toArray()` output for cast attributes
- [ ] Check API response payloads for missing or null cast attribute fields
- [ ] Review error logs for JSON serialization errors

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Return Plain Arrays or Scalars From serialize() |
| Skill | `06-skills.md` — Implement SerializesCastableAttributes for Custom JSON Output |

---

## 2. Model State Access in serialize()

### Category
Design

### Description
Using the `$model` parameter in `serialize()` to access model state, relationships, or perform authorization checks. This creates hidden coupling between serialization format and model internals, and can trigger N+1 query problems.

### Why It Happens
The `$model` parameter is available in the method signature, so using it seems natural. Developers need context from other model attributes or relationships to provide complete serialization. The convenience of having the model reference outweighs architectural concerns in the moment.

### Warning Signs
- `$model->relation` or `$model->load()` calls inside `serialize()`
- Authorization checks in `serialize()` (e.g., `$model->user->can()`)
- Sibling attribute access (`$attributes` parameter used extensively)
- N+1 query problems traced to model serialization
- Serialization behavior that differs depending on whether relationships are loaded
- `serialize()` that throws exceptions when certain model relationships are missing

### Why Harmful
- N+1 query problems: each serialized model loads additional relationships
- Serialization behavior depends on model state, making it non-deterministic from the value alone
- Authorization logic runs during serialization, which may happen in queue jobs without user context
- Coupling the value object's serialization to the model's internal structure
- Testing serialization requires building full model instances with related data

### Consequences
- Performance degradation from relationship loading during serialization
- N+1 queries in API responses for lists of models
- Authorization failures during queue serialization (no authenticated user)
- Tests that are more complex than necessary for serialization verification
- Hidden dependencies on model structure that break when the model changes

### Preferred Alternative
```php
public function serialize(Model $model, string $key, mixed $value, array $attributes): array
{
    // Use only the cast value — don't access model state
    return [
        'amount' => $value->format(),
        'currency' => $value->currency(),
    ];
}
```

### Refactoring Strategy
1. Identify all uses of `$model` inside `serialize()` methods beyond simple key access
2. Determine if the model state access is truly necessary for serialization
3. If model context is needed, extract that logic to API Resources
4. If sibling data is needed, include it in the value object itself or use a composite value object
5. Remove model state access from `serialize()` and update API Resources accordingly

### Detection Checklist
- [ ] Grep for `$model->` inside `serialize()` methods
- [ ] Check for `->load(`, `->with(`, or relationship access in serialize
- [ ] Profile API endpoints for N+1 queries traced to serialization
- [ ] Test serialize with and without relationships loaded — check for different behavior
- [ ] Review `$attributes` parameter usage for sibling attribute dependencies

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Access Model State in serialize() |
| Decision Tree | `07-decision-trees.md` — SerializesCastableAttributes vs API Resources |
| Skill | `06-skills.md` — Implement SerializesCastableAttributes for Custom JSON Output |

---

## 3. Business Logic in serialize()

### Category
Design

### Description
Including business rules, conditional filtering, or data transformation beyond format conversion in the `serialize()` method. The method filters, reorders, or conditionally excludes data based on the value, creating implicit business logic during serialization.

### Why It Happens
Developers think of serialization as "preparing data for the API" and include filtering logic as part of that preparation. The convenience of having a dedicated serialization hook encourages putting "one more check" in the method. Business rules are often discovered late and added to the nearest available hook.

### Warning Signs
- `if` conditions inside `serialize()` that return different structures based on value
- `serialize()` returning `null` conditionally (filtering values out of serialization)
- Sorting, filtering, or transforming data beyond format conversion
- Business rule exceptions thrown from `serialize()`
- Different serialization output for the same value object type depending on value
- `serialize()` calls helper methods that contain business logic

### Why Harmful
- Business rules executed during serialization run in unexpected contexts: logging, queuing, broadcasting
- API output depends on serializer state rather than explicit Resource control
- Tests for serialization must account for business rules, making them more complex
- Changing a business rule in the value object affects serialization implicitly
- The serialization path becomes non-deterministic: same model, same request, same output — unless business rules change

### Consequences
- Business rules triggered during queue job serialization (unexpected side effects)
- Inconsistent serialization output depending on when business rules are evaluated
- Hard-to-predict serialization behavior during broadcasting and caching
- Business logic scattered across value objects, casts, and serialization methods
- Migration of business rules to API Resources requires untangling from serialize

### Preferred Alternative
```php
public function serialize(Model $model, string $key, mixed $value, array $attributes): array
{
    // Format conversion only — no business rules
    return [
        'amount' => $value->format(),
        'currency' => $value->currency(),
    ];
}
```

### Refactoring Strategy
1. Identify business rules inside `serialize()` methods (conditions, filtering, exceptions)
2. Extract business rules to the appropriate layer (service, action, or API Resource)
3. Simplify `serialize()` to pure format conversion
4. Add tests that verify `serialize()` behavior is deterministic and context-free
5. Audit queue, broadcast, and logging code for behavior changes after extraction

### Detection Checklist
- [ ] Search for `if`, `switch`, `return null`, `throw` inside `serialize()` methods
- [ ] Check for transformation logic beyond format conversion (e.g., summing, averaging, filtering)
- [ ] Test `serialize()` output is consistent for the same value across different contexts
- [ ] Review business rule test coverage — are rules tested independently of serialization?
- [ ] Check queue payloads for serialized data that includes/excludes fields based on business logic

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Keep serialize() Focused on Format Conversion |
| Decision Tree | `07-decision-trees.md` — SerializesCastableAttributes vs API Resources |
| Skill | `06-skills.md` — Implement SerializesCastableAttributes for Custom JSON Output |

---

## 4. Unnecessary SerializesCastableAttributes Implementation

### Category
Maintainability

### Description
Implementing `SerializesCastableAttributes` when the PHP representation and the API representation are identical. The `serialize()` method duplicates the `get()` output with no transformation, adding unnecessary code and a redundant serialization path.

### Why It Happens
Developers may implement the interface "just in case" it's needed later. Copy-paste patterns from other casts that genuinely need serialization. Unclear documentation about when the interface is necessary. Teams that standardize on implementing the interface for all custom casts.

### Warning Signs
- `serialize()` is a one-line passthrough: `return $value;`
- `serialize()` returns the same type and structure as `get()`
- The value object's `__toString()` or `toArray()` is called directly in `serialize()` with no transformation
- Every custom cast in the project implements `SerializesCastableAttributes` even for simple types
- Removal of `serialize()` causes no test failures or behavior changes
- GitHub PRs where `serialize()` is implemented but never called differently from `get()`

### Why Harmful
- Extra code to maintain with no benefit
- Redundant serialization path that must be kept in sync with `get()`
- Confusion about which method controls serialization (is it `serialize()` or `get()`?)
- False sense of control: developers think they're customizing output but are just echoing the default
- More methods to test and document without any behavioral difference

### Consequences
- Unnecessary complexity in cast classes
- Code reviewers must verify `serialize()` actually differs from `get()`
- Extra method that can drift out of sync with `get()` over time
- Wasted developer attention on a method that doesn't add value
- More code to read and understand when debugging

### Preferred Alternative
```php
// No serialize() needed — get() value is used automatically for serialization
public function get(Model $model, string $key, mixed $value, array $attributes): Money
{
    return Money::fromCents($value);
}
```

### Refactoring Strategy
1. Identify `serialize()` methods that return the same value as `get()`
2. Remove the `SerializesCastableAttributes` interface implementation
3. Remove the `serialize()` method
4. Verify `$model->toArray()` and `$model->toJson()` output is unchanged
5. Update tests to remove `serialize()` test cases

### Detection Checklist
- [ ] Compare `serialize()` return value with `get()` return value for each cast
- [ ] Remove `serialize()` and check if any tests fail
- [ ] Search for `implements SerializesCastableAttributes` and evaluate each implementation
- [ ] Review PR history for intentionally different serialize outputs
- [ ] Check if `toArray()` output changes after removing serialize

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Only Implement SerializesCastableAttributes When Representation Differs |
| Skill | `06-skills.md` — Implement SerializesCastableAttributes for Custom JSON Output |
| Decision Tree | `07-decision-trees.md` — Implement serialize() vs Rely on get() |

---

## 5. Using SerializesCastableAttributes When API Resources Are Needed

### Category
Architecture

### Description
Using `SerializesCastableAttributes` to control serialization when the format must vary per model, per endpoint, or depends on the request context. The interface provides global, type-level serialization that cannot adapt to different contexts.

### Why It Happens
Developers may not be aware of API Resources. The convenience of a single `serialize()` method seems simpler than creating multiple Resource classes. Initial requirements may not demand per-context serialization, but requirements evolve to need it.

### Warning Signs
- Conditional logic inside `serialize()` that checks the model type or class
- `serialize()` that accesses `request()` helper or `auth()` to vary output
- Different API endpoints need different attribute formats but all use the same cast
- Workarounds where serialization logic inspects the model's loaded relationships
- API Resources that override the cast's serialization with `when()` or `merge()`
- Comments in `serialize()` about "admin view" vs "public view"

### Why Harmful
- The cast applies globally to all models, making per-endpoint variation impossible without hacks
- Conditional logic inside `serialize()` violates single responsibility and is untestable
- No access to request context (user, role, permissions) for serialization decisions
- Adding a new endpoint with different serialization requires modifying the global cast
- Testing serialization variance requires workarounds rather than dedicated Resource tests

### Consequences
- Cast class grows complex with conditional serialization logic
- Inconsistent serialization across endpoints (some override with Resources, others don't)
- Difficulty implementing role-based field visibility
- Harder to migrate to API Resources when the pattern becomes unmanageable
- Serialization logic that's tightly coupled to the cast rather than the API layer

### Preferred Alternative
```php
class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'salary' => $this->salary->detailedFormat(),
        ];
    }
}

class PublicUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'salary' => $this->salary->obfuscatedFormat(),
        ];
    }
}
```

### Refactoring Strategy
1. Identify `serialize()` methods with conditional logic or model-type checking
2. Create API Resource classes with per-endpoint serialization
3. Move format variance from `serialize()` to the appropriate Resource classes
4. Simplify `serialize()` to a single, context-agnostic format (or remove it)
5. Update controllers to use the appropriate Resource for each endpoint

### Detection Checklist
- [ ] Search for `instanceof`, `get_class`, or model type checks in `serialize()`
- [ ] Check for `request()` or `auth()` calls in `serialize()` methods
- [ ] Review whether the same cast attribute is formatted differently across endpoints
- [ ] Check if API Resources use `merge()` or `when()` to override cast serialization
- [ ] Profile the cast class for serialization-related complexity (lines of code, conditionals)

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use API Resources Instead When Serialization Varies Per Model |
| Decision Tree | `07-decision-trees.md` — SerializesCastableAttributes vs API Resources |
| Knowledge | `04-standardized-knowledge.md` — serialize() controls JSON/array output |
