# Multi-Attribute Mutators

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Attributes & Casting
- **Last Updated:** 2026-06-02

## Executive Summary
Multi-attribute mutators allow a single `Attribute::make()` set closure to modify multiple model attributes simultaneously by returning an associative array. This is essential for computed fields, denormalized columns, and aggregations — for example, setting `first_name` and `last_name` individually when `full_name` is assigned, or updating a `searchable_text` denormalized column whenever `title` or `body` changes. This pattern bridges user-facing input with optimized storage schemas.

## Core Concepts
- **Array return from set closure:** When the set closure returns `['attribute1' => 'value1', 'attribute2' => 'value2']`, each key-value pair is stored in `$attributes` individually.
- **Single vs. multi distinction:** If the set closure returns a non-array value, only the attribute matching the method name is set. Returning an array with the method's own key is valid but redundant.
- **No accessor equivalent:** There is no multi-attribute accessor. Each read access is independent.
- **Denormalization enabler:** The primary use case is maintaining computed/denormalized columns as read optimizations.

## Mental Models
- **Event Sourcing on Set:** When attribute A changes, the mutator emits attribute B and C updates as side effects, keeping the model's read-optimized columns consistent.
- **Observer Pattern in a Closure:** The mutator observes a change to one attribute and responds by updating other attributes within the same write operation.
- **Write-Time Materialization:** The mutator materializes computed columns at write time so reads never compute.

## Internal Mechanics
1. `Model::__set($key, $value)` calls the set closure for the matching attribute.
2. The closure returns a value. If the return value is an array, `Model::setAttribute()` iterates over the array and calls `$this->attributes[$key] = $value` for each pair.
3. Each array key is treated as an attribute name; each value is stored directly (without invoking additional mutators for those keys, to prevent cycles).
4. Casts for the target attributes still run after the multi-attribute set, transforming values to storage format.
5. The originally assigned attribute is NOT set a second time if its key is in the returned array — the return value replaces the original assignment.

## Patterns
- **Computed Full Name:** `set: fn (string $value) => ['first_name' => explode(' ', $value)[0], 'last_name' => explode(' ', $value)[1] ?? '']` — splits a full name into components.
- **Denormalized Search Column:** `set: fn (string $value) => ['title' => $value, 'searchable_text' => $value . ' ' . $this->body]` — keeps a searchable text column in sync.
- **Slug Generation:** `set: fn (string $value) => ['title' => $value, 'slug' => Str::slug($value)]` — auto-generates slug when title changes.
- **Transaction Rollup:** `set: fn (int $value) => ['net_amount' => $value, 'gross_amount' => $value * (1 + $this->tax_rate)]` — keeps computed financial fields consistent.

## Architectural Decisions
- **Decision:** Array return signals multi-attribute update; non-array updates only the calling attribute.
  - **Rationale:** Single return type serves dual purpose. Avoids needing a separate method or attribute configuration for multi-attribute behavior.
- **Decision:** Returned array values bypass further mutator resolution for those keys.
  - **Rationale:** Prevents infinite recursion (attribute A mutator calls attribute B mutator which calls attribute A). Direct `$attributes` assignment is the only safe approach.
- **Decision:** Casts still process the returned values.
  - **Rationale:** Ensures type consistency. The mutator returns domain-level values; casts convert them to storage format.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Single user input populates multiple columns | Implicit coupling between columns | Schema changes must update all relevant mutators |
| Denormalized columns always consistent at write time | Write amplification — one input field updates N columns | Monitor write throughput; consider queuing for N > 3 |
| Reduces read-time computation | Mutator must know about all related attributes | Fragile when attributes are renamed or removed |
| Works transparently with mass-assignment | Array return keys are not visible in model `$fillable` | The returned keys must be in `$fillable` or set as `$guarded` |

## Performance Considerations
- Each multi-attribute set results in N array assignments. For small N (2-5), overhead is negligible (~3µs).
- Multi-attribute mutators that reference `$this->{$otherAttribute}` trigger accessors for those attributes. Use `$this->attributes['other']` for raw access to avoid accessor overhead.
- In batch operations, each row's multi-attribute mutator runs individually. Bulk inserts (`Model::insert()`) bypass all mutators.
- Denormalized columns increase storage size and may slow `SELECT *` queries. Only denormalize for measurable read performance gains.

## Production Considerations
- Test multi-attribute mutators explicitly: assign a value and assert that all expected attributes are set in `$model->getAttributes()`.
- Be cautious with `$fillable`: the attribute you assign must be `$fillable`, but the attributes returned in the array must also be `$fillable` or guarded if they should not be mass-assigned.
- Multi-attribute mutators that include non-`$fillable` keys in the return array will throw a `MassAssignmentException`. Guard the returned keys explicitly or mark them as `$guarded`.
- When refactoring: replacing a multi-attribute mutator with individual mutators changes behavior — individual mutators do NOT have access to the values of other attributes being set simultaneously.

## Common Mistakes
- **Recursive multi-attribute set:** Returning a key in the array that has its own mutator does NOT trigger that mutator (by design). To invoke other mutators, set attributes individually after the initial assignment.
- **Assuming order preservation:** The order of keys in the returned array is not guaranteed to match the order of assignment in `setAttribute`. Each key is set loop-order from the array.
- **Forgetting `$fillable` for all returned keys:** If the mutator returns `['column_b' => 'x']` but `column_b` is not `$fillable`, mass-assignment protection throws.
- **Overwriting the primary assigned attribute:** If the set closure for `full_name` returns `['first_name' => ..., 'full_name' => ...]`, the `full_name` value from the return array overwrites the original assignment value.

## Failure Modes
- **Array return on a single-attribute mutator:** A mutator that accidentally returns an array for a single-attribute scenario sets multiple attributes unexpectedly. Validate the return type in tests.
- **Missing key in return array:** If a multi-attribute mutator stops returning a previously expected key, the denormalized column falls out of sync. Add monitoring or a scheduled consistency check.
- **MassAssignmentException from returned keys:** If `$fillable` changes and a mutator returns a key no longer fillable, writes fail silently or throw. Keep mutators and `$fillable` in sync.

## Ecosystem Usage
- **Laravel Nova:** A single Nova field that maps to a multi-attribute mutator works transparently — assign `full_name` in Nova, and `first_name`/`last_name` are set via the mutator.
- **Laravel Filament:** Use `mutateDehydratedState()` on form fields as an alternative to multi-attribute mutators when you want the logic in the form layer, not the model.
- **Elasticsearch / Meilisearch:** Multi-attribute mutators are commonly used to build a `searchable_text` column that aggregates multiple fields for full-text search indexing.

## Related Knowledge Units

### Prerequisites
- [Mutator Patterns](../mutator-patterns/02-knowledge-unit.md) — base mutator mechanics; multi-attribute is an extension of set-closure behavior.
- [Accessor Patterns](../accessor-patterns/02-knowledge-unit.md) — read-side counterpart; no multi-attribute equivalent exists.

### Related Topics
- [Attribute Caching](../attribute-caching/02-knowledge-unit.md) — caching denormalized column reads after multi-attribute writes.
- [Primitive Casts](../primitive-casts/02-knowledge-unit.md) — casts applied to the individual attribute values returned by the array.

### Advanced Follow-up Topics
- [Event-Driven Denormalization](../../domain-modeling-patterns/event-driven-denormalization/02-knowledge-unit.md) — alternatives to write-time denormalization using events and projections.
- [Read Models vs. Write Models](../../domain-modeling-patterns/cqrs-read-models/02-knowledge-unit.md) — separating read-optimized schemas from write-optimized schemas.

## Research Notes
- Multi-attribute mutators were implicitly supported since Laravel 9's `Attribute::make()` introduction but formally documented as a pattern in Laravel 11.
- The array return is processed in `Model::setAttribute()` with `if (is_array($result))` branching. This means any cast or mutator that returns an array triggers multi-attribute behavior — use caution with cast classes that might return arrays unexpectedly.
- There is no inverse pattern (multi-attribute accessor). Laravel's read path handles each attribute independently. To compute a synthetic value from multiple attributes, use an appended accessor or an `appends` property.
