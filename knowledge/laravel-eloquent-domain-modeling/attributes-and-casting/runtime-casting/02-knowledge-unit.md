# runtime-casting

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Knowledge Unit:** runtime-casting
- **Last Updated:** 2026-06-02

---

## Executive Summary

Runtime casting allows dynamically modifying a model's cast configuration during a request lifecycle, overriding or merging cast definitions that were declared statically on the model class. Using `withCasts()` and `mergeCasts()`, developers can temporarily change how attributes are cast for specific queries or code paths without altering the model class definition. This is essential for read-model projections, tenant-specific serialization formats, and testing scenarios where static cast definitions are insufficient.

---

## Core Concepts

- **withCasts()**: Returns a new model instance with an overridden `$casts` property. The original model is not modified.
- **mergeCasts()**: Adds or overwrites specific cast definitions without replacing the entire `$casts` array.
- **Immutable by convention**: `withCasts()` returns a new instance; `mergeCasts()` modifies the existing instance's in-memory cast configuration but does not persist changes.
- **Scope-limited**: Runtime casts apply only to the specific model instance or query result, not to the class globally.
- **Resolution timing**: Runtime casts are applied when the model's cast configuration is accessed, overriding the class-level `$casts` property.

---

## Mental Models

- **Request-scoped configuration**: Think of runtime casts as environment variables for a single model instance — they override defaults for the current scope without changing the global configuration.
- **Decorator pattern**: `withCasts()` wraps the model with a temporary cast overlay. The underlying model class is unchanged.
- **Query-time adapter**: Similar to how database `VIEW`s present data differently without altering tables, runtime casts present model attributes differently without changing the schema.
- **Test double for casts**: In testing, runtime casts can replace expensive custom casts with lightweight fakes, similar to mocking a service.

---

## Internal Mechanics

- **`withCasts()` implementation**: Creates a new model instance using `new static([], $this)` (copying existence state), then sets `$this->casts = array_merge($this->casts, $casts)` on the new instance.
- **`mergeCasts()` implementation**: Directly merges the given casts array into `$this->casts` on the existing instance, overwriting any existing keys.
- **Existing cast removal**: There is no built-in method to remove a cast at runtime. Setting a cast to `null` or an empty string does not work — the attribute must be removed from the `$casts` array manually.
- **Query builder chaining**: Eloquent query builder does not support `withCasts()` natively on the query itself. It must be called on an existing model instance.
- **Fresh model interaction**: When a model is freshly retrieved from the database, its casts are resolved from the class definition. `withCasts()` must be called after retrieval.

---

## Patterns

### Read Model Projection Pattern

**Purpose**: Cast an attribute differently when the model is used in a specific read context (e.g., API vs internal processing).

**Benefits**: The same model can support multiple representations without multiple model classes.

**Tradeoffs**: The cast override is non-obvious in the code — developers must find where `withCasts()` was called.

### Test Isolation Pattern

**Purpose**: Replace a slow or side-effectful cast with a test double during testing.

**Benefits**: Tests run faster and do not require external services.

**Tradeoffs**: Test coverage of the actual cast is lost unless there is a separate integration test.

### Tenant-Specific Serialization Pattern

**Purpose**: Change how attributes serialize based on the current tenant's configuration.

**Benefits**: Multi-tenant models can adapt their cast behavior per tenant without per-tenant model subclasses.

**Tradeoffs**: Runtime cast logic must be applied in every controller or service that returns the model; easy to forget.

### Temporary Null Cast Pattern

**Purpose**: Temporarily disable a custom cast (reverting to raw attribute access) for debugging or data migration.

**Benefits**: Direct access to raw database values for inspection or transformation.

**Tradeoffs**: The model's behavior changes silently; other code observing the model may receive unexpected types.

---

## Architectural Decisions

- **When to use `withCasts()`**: The model needs a different attribute representation for a specific code path (API response, export, report).
- **When to avoid**: The cast configuration should be consistent across all model usage. Runtime casts create invisible configuration drift.
- **When to use `mergeCasts()` instead**: Only a single attribute needs overriding, and the existing model instance should be modified in-place.
- **When to prefer model subclassing**: Multiple distinct representations with different casts are better served by dedicated model subclasses (e.g., `User` vs `UserExport`).

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Dynamic cast configuration per code path | Cast changes are invisible to developers reading the model | Debugging "why is this attribute returning a different type" is harder |
| No model class modification needed | `withCasts()` creates a new instance | Object identity is lost — `===` comparison with original instance fails |
| Useful for testing and query isolation | `mergeCasts()` modifies the instance in place | Stateful modification can cause subtle bugs in shared model instances |
| Avoids model class proliferation | No query-builder-level support | Casts cannot be changed before hydration; only after |

---

## Performance Considerations

- **Instance creation overhead**: `withCasts()` creates a new model instance, which includes resolving all casts from the container and copying attributes. For large models or collections, this cost is non-trivial.
- **Container resolution**: Runtime cast classes are resolved through the container each time a new model instance is created via `withCasts()`.
- **No caching for runtime casts**: Unlike class-level casts (resolved once per class), runtime casts are resolved per instance. Repeated creation of `withCasts()` instances multiplies cast resolution overhead.
- **Memory**: Each `withCasts()` instance is a separate object in memory with its own copy of attributes and casts.

---

## Production Considerations

- **Invisible configuration drift**: A model passed through multiple layers may have different runtime casts applied at each layer. The final representation depends on the execution path, not the class definition.
- **Serialization inconsistency**: If `withCasts()` changes serialization behavior, the same model may produce different JSON in different contexts, causing API inconsistency.
- **Testing debt**: Tests that rely on runtime casts without testing the default casts can pass while production fails because the default casts behave differently.
- **Documentation requirement**: Every runtime cast override should be documented at the call site, explaining why the default cast is insufficient.

---

## Common Mistakes

- **Modifying the original model's `$casts` directly**: `$model->casts['attribute'] = 'string'` bypasses any `mergeCasts` logic and may not trigger proper cast resolution.
- **Expecting `withCasts()` to persist to database**: Runtime casts are in-memory only. Saved attributes still go through the model's class-level cast.
- **Using `mergeCasts()` on a shared model instance**: If the same model instance is used for multiple purposes, `mergeCasts()` mutates it, causing unexpected behavior for other consumers.
- **Forgetting that `withCasts()` returns a new instance**: The original model is unchanged. Code that ignores the return value silently does nothing.
- **Assuming runtime casts affect query results**: `User::withCasts(['status' => 'string'])->get()` does not work — `withCasts()` is an instance method, not a query builder method.
- **Applying runtime casts after serialization**: Calling `toArray()` or `toJson()` before `withCasts()` uses the default casts. The order of operations matters.

---

## Failure Modes

- **Lost runtime cast on save**: If a model has runtime casts applied and is then saved, the save uses the runtime casts, but subsequent fresh queries from the database use the class-level casts. Inconsistency between the saved representation and the retrieved representation can occur.
- **Silent cast type mismatch**: If the runtime cast returns a type incompatible with the column, the error surfaces at save time, potentially corrupting data if the DB driver coerces silently.
- **Memory leak in loops**: Creating `withCasts()` instances inside a loop without releasing references prevents garbage collection of model instances.
- **Runtime cast conflict with mutators**: If the model also defines accessors/mutators for the same attribute, runtime casts can override or conflict with mutator behavior in unpredictable ways.

---

## Ecosystem Usage

- **Laravel Framework**: Laravel does not use `withCasts()` internally in core components. It is a developer-facing utility.
- **Spatie Laravel Translatable**: May benefit from runtime cast patterns for locale-specific serialization, though typically uses dedicated methods.
- **Laravel Nova**: Nova resource fields can define their own cast handling, conceptually similar to runtime casting but at the presentation layer.
- **Testing frameworks**: Commonly used in PHPUnit tests where a model's expensive cast (e.g., encryption, external API call) needs to be replaced with a lightweight passthrough.
- **Reporting/export packages**: Export packages (CSV, XLSX) often use runtime casts to flatten value objects into export-friendly formats.

---

## Related Knowledge Units

### Prerequisites
- casts-attributes-interface — the bidirectional custom casting contract
- Native Attribute Casting — built-in Eloquent casting (int, bool, json, object)

### Related Topics
- cast-parameters
- value-object-casting

### Advanced Follow-up Topics
- Eloquent Model Lifecycle
- Query Scopes

---

## Research Notes

- `withCasts()` is defined in `Illuminate\Database\Eloquent\Concerns\HasAttributes`.
- `mergeCasts()` was added later as a convenience for in-place modification.
- The method signature `withCasts(array $casts): static` returns a new instance, not `$this`.
- There is no `withoutCasts()` method to remove all casts. To access raw attributes, `getRawOriginal()` is the recommended approach.
- The lack of query-builder-level support means runtime casts are applied post-hydration, which is less efficient than configuring casts before hydration.
- Runtime casts are not serialized when the model is queued — only the raw attributes are queued, and the job worker uses class-level casts on unserialization.
