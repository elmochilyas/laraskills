# to-array-to-json

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Last Updated:** 2026-06-02

## Executive Summary

Eloquent models serialize to arrays and JSON through a layered system of methods (`toArray`, `toJson`, `jsonSerialize`) that control how model data is exposed. Understanding this stack is essential for customizing API output, controlling attribute visibility, and integrating with Laravel's response system. The serialization pipeline flows from internal attribute resolution → array transformation → JSON encoding, with hooks at each layer for customization.

## Core Concepts

- **`toArray()`** — Converts the model instance to an associative array. Recursively serializes loaded relationships, accessors, and casts. This is the primary method to override for custom output.
- **`toJson()`** — Wraps `toArray()` with `json_encode`, returning a JSON string. Accepts `$options` passed directly to `json_encode`.
- **`jsonSerialize()`** — Implements `JsonSerializable` interface. Called automatically by `json_encode` when serializing a model. By default returns `$this->toArray()`.
- **`attributesToArray()`** — Internal method that converts raw model attributes to an array, applying date formatting and casts. Does not include relationships or appends.
- **`relationsToArray()`** — Internal method that recursively calls `toArray()` on loaded relationships.
- **`serializeDate()`** — Controls Carbon date serialization format. Defaults to `'Y-m-d H:i:s'` or the `$dateFormat` property.
- **Recursive serialization** — When a model has loaded relationships, serialization cascades through the entire graph.

## Mental Models

1. **Onion layers** — `json_encode` → `jsonSerialize` → `toArray` → `relationsToArray` + `attributesToArray`. Each layer delegates inward.
2. **Snapshot mechanism** — `toArray()` takes a snapshot of the model's current state (attributes, loaded relations, appends) at the moment of call. Late changes after serialization are not reflected.
3. **Filter vs transform** — `toArray` is the transform layer (control output shape); `$hidden`/`$visible` are the filter layer (control output inclusion).

## Internal Mechanics

```php
// Illuminate\Database\Eloquent\Model
public function toArray(): array
{
    return array_merge($this->attributesToArray(), $this->relationsToArray());
}

public function toJson($options = 0): string
{
    return json_encode($this->jsonSerialize(), $options);
}

public function jsonSerialize(): array
{
    return $this->toArray();
}
```

`attributesToArray()` iterates through `$this->getAttributes()`, applies mutators, casts, and date formatting. `relationsToArray()` iterates loaded relationships and calls `toArray()` on each. `appends` are merged into the final array via `mutatedAttributeValues()`.

## Patterns

- **Override `toArray()`** on the model to define custom serialization shapes (rename keys, include computed values, nest data).
- **Override `serializeDate()`** globally on the model to change date format for all date attributes.
- **Use `jsonSerialize()`** when you need different behavior for `json_encode` vs explicit `toArray()` calls.
- **Resource → `toArray()` bridge** — API Resources call `$this->resource->toArray()` by default; overriding `toArray()` on the model automatically affects all resources wrapping that model.

## Architectural Decisions

- Laravel chose a unified `toArray` → `toJson` pipeline with `jsonSerialize` conformance rather than separate serialization pathways for different output formats.
- Date serialization defaults to Carbon's `__toString` (which respects `$dateFormat`) rather than ISO 8601, to maintain backward compatibility.
- The model serialization is eager — it serializes all loaded relationships. Lazy serialization (lazy loading during serialization) is intentionally not supported to prevent N+1 during API responses.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Simple, predictable serialization pipeline | No built-in shape transformation (renaming, flattening) | Developers reach for API Resources or custom `toArray()` overrides |
| `jsonSerialize()` provides clean PHP integration | `toArray()` runs on every `json_encode` call — can be expensive for deeply nested models | Use cached representations or resources for hot paths |
| Recursive serialization works automatically | Accidental over-serialization exposes internal data | Rely on `$hidden` to whitelist/blacklist; audit serialized output |

## Performance Considerations

- Calling `toArray()` on a model with many appends triggers all accessor methods — each may run queries or computations.
- Serialization of a deeply nested relation graph creates many intermediate arrays; memory usage scales with graph size.
- Date serialization applies Carbon formatting per attribute — large date sets see overhead.
- For bulk serialization, consider `Collection->toArray()` or chunked resource responses.

## Production Considerations

- Never log raw model `toArray()` output in production without filtering — sensitive attributes may be exposed.
- Test serialization output explicitly in feature tests using `assertJsonStructure` and `assertJsonFragment`.
- When overriding `toArray()`, ensure array keys are consistent across all serialization paths (API, notifications, broadcast events).
- `json_encode` failures (e.g., non-UTF8 strings) silently return `false` unless `JSON_THROW_ON_ERROR` is used.

## Common Mistakes

- Defining accessors expected in `toArray()` but forgetting `$appends`.
- Overriding `toArray()` and breaking recursive relationship serialization by not calling parent.
- Expecting `toArray()` on a fresh model (not yet persisted) to include the primary key.
- Relying on `toJson()` options for pretty-print in production — use response-level formatting instead.

## Failure Modes

- **Circular relations** — Models that belong to each other cause infinite recursion in `relationsToArray()`. Laravel prevents this by checking `relationLoaded()` but custom `toArray()` overrides must handle it.
- **Max call stack** — Deeply nested serialization (5+ levels) can hit PHP recursion limits. Use explicit depth limiting in resources.
- **Memory exhaustion** — Serializing a model with thousands of loaded relations allocates arrays for every record.
- **Silent null** — `json_encode` returning `false` (on failure) propagates as `null` in responses.

## Ecosystem Usage

- **Laravel API Resources** — The `JsonResource` class calls `toArray()` on the underlying model as the default serialization strategy.
- **Laravel Nova** — Nova resource fields serialize model attributes via `toArray()`.
- **Laravel Telescope** — Captures serialized model snapshots for request entry visualization.
- **Laravel Horizon / Queues** — Job payloads serialize models via `toArray()` when dispatching.
- **Broadcasting** — Event broadcast data serializes models through `toArray()` / `jsonSerialize()`.

## Related Knowledge Units

### Prerequisites

No formal prerequisites — this is the foundational serialization unit.

### Related Topics

- **hidden-visible** — Controls attribute inclusion in `toArray()` output.
- **appends** — Adds computed attributes to the `toArray()` output.
- **json-resource** — Higher-level serialization layer built on `toArray()`.

### Advanced Follow-up Topics

- **resources-vs-dtos** — Context for when to use model serialization vs dedicated DTOs.

## Research Notes

- Laravel 11 introduced no changes to the core `toArray` pipeline. The mechanism remains stable since Laravel 5.x.
- `jsonSerialize()` conformance was added in PHP 5.4 and is fully utilized by Eloquent.
- Community packages like `laravel-fractal` predate API Resources and were the primary alternative before Laravel 5.5.
- The `attributesToArray` method changed in Laravel 5.7 to respect `$dates` property for date casting.
