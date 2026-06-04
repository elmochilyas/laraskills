# ToArray / ToJson — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** ToArray / ToJson
- **ECC Version:** 1.0

## Overview
Eloquent models serialize to arrays and JSON through a layered pipeline: `json_encode` → `jsonSerialize` → `toArray` → `relationsToArray` + `attributesToArray`. Each layer delegates inward, providing hooks for custom output. `toArray()` is the primary customization point; `toJson()` wraps it with JSON encoding; `jsonSerialize()` bridges PHP's native `JsonSerializable` interface.

## Core Concepts
- `toArray()` converts model+relations to an associative array; recurses through loaded relationships
- `toJson($options)` wraps `toArray()` with `json_encode`, passing `$options` for encoding flags
- `jsonSerialize()` implements `JsonSerializable`; default returns `$this->toArray()`
- `attributesToArray()` converts raw attributes applying casts, date formatting, and mutators
- `relationsToArray()` recursively serializes loaded relationships via their `toArray()`
- `serializeDate()` controls Carbon date format in serialization; default `Y-m-d H:i:s`
- Recursive serialization cascade through the entire loaded relation graph

## When To Use
- Exposing model data as JSON in API responses, notifications, broadcast events, and queue payloads
- Customizing serialization output shape without API Resources (rename keys, flatten, compute)
- Debugging/inspecting model state via `dd($model->toArray())`
- Generating array snapshots for caching or logging

## When NOT To Use
- Do NOT use raw model `toArray()` for public API responses if you need attribute renaming, conditional inclusion, or metadata — use API Resources instead
- Do NOT use `toArray()` on models with lazy-loaded relations in hot paths — triggers N+1
- Do NOT rely on `toArray()` for immutable data contracts — use DTOs for typed boundaries
- Do NOT use `toArray()` as a deep-clone mechanism — array values still hold object references for nested non-Eloquent objects

## Best Practices (WHY)
- Override `toArray()` on the model for custom shapes rather than post-processing the array
- Override `serializeDate()` on a base model to set a consistent date format across all models
- Pair with `$hidden`/`$visible` to filter sensitive attributes before they reach the array
- Test serialization output explicitly: `$response->assertJsonStructure()` catches regressions
- Use `JSON_THROW_ON_ERROR` in critical `toJson()` paths to surface encoding failures
- Keep `toArray()` fast — avoid SQL queries or heavy computations inside overrides

## Architecture Guidelines
- The serialization pipeline is eager — all loaded relations are serialized; there is no lazy serialization path
- Override `toArray()` in a base model for app-wide serialization conventions (key casing, date format)
- Use `jsonSerialize()` only when you need `json_encode` to differ from explicit `toArray()` calls
- Consider API Resources the default for HTTP serialization; override model `toArray()` only for non-HTTP channels
- Document which models have custom `toArray()` overrides — they are invisible to new developers

## Performance
- `toArray()` triggers all accessors listed in `$appends` — each may run queries or computations
- Serialization of a deeply nested relation graph creates many intermediate arrays; memory scales with graph size
- Date serialization applies `format()` per date attribute — overhead grows with date column count
- Bulk serialization with `Collection->toArray()` is efficient for pre-loaded relations
- Overriding `toArray()` with array manipulation has negligible cost unless it loops loaded relations

## Security
- Never log raw `$model->toArray()` without filtering — sensitive attributes may be exposed
- Apply `$hidden` to sensitive columns (passwords, tokens, PII) as a safety net
- Audit custom `toArray()` overrides during code review for accidental data exposure
- `json_encode` failures silently return `false` (which serializes to `null`) — use `JSON_THROW_ON_ERROR` in security-critical paths

## Common Mistakes
- Defining accessors expected in `toArray()` but forgetting `$appends` — the computed value is absent
- Overriding `toArray()` without calling `parent::toArray()` — breaks recursive relationship serialization
- Expecting `toArray()` on an unsaved (fresh) model to include the primary key — it won't be set yet
- Relying on `toJson()` options for pretty-print in production — use response-level formatting
- Forgetting that `toArray()` includes ALL loaded relations, including unintended ones

## Anti-Patterns
- **Heavy computation in `toArray()`**: running queries or expensive logic inside a `toArray()` override that's called on every serialization
- **No `$hidden` safety net**: exposing sensitive data because the developer forgot to hide it
- **Overriding `toArray()` for API shape instead of using Resources**: losing access to pagination, conditional attributes, and wrapping
- **Serializing lazy-loaded relations**: triggering N+1 inside a serialization loop in views or API responses

## Examples
```php
// Override toArray for custom shape
public function toArray(): array
{
    return [
        'id' => $this->id,
        'full_name' => "{$this->first_name} {$this->last_name}",
        'email' => $this->email,
        'registered_at' => $this->created_at->toIso8601String(),
        'roles' => $this->roles->pluck('name'),
    ];
}

// Override serializeDate globally on base model
protected function serializeDate(DateTimeInterface $date): string
{
    return $date->format('Y-m-d\TH:i:s\Z');
}

// Use jsonSerialize for different array vs JSON behavior
public function jsonSerialize(): array
{
    return array_merge($this->toArray(), [
        'type' => 'user',
    ]);
}

// Safe JSON encoding
$json = $model->toJson(JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
```

## Related Topics
- hidden-visible — attribute filtering layer applied in `attributesToArray()`
- appends — injects computed accessors into serialization output
- json-resource — higher-level serialization layer built on `toArray()`
- resources-vs-dtos — when to use model serialization vs dedicated DTOs

## AI Agent Notes
- When serializing a model, prefer `$model->toArray()` for arrays, `$model->toJson()` for JSON strings
- Override `toArray()` for custom shapes on non-HTTP channels; use API Resources for HTTP channels
- Always check `$hidden` contains sensitive columns before considering serialization complete
- The pipeline order is `json_encode` → `jsonSerialize` → `toArray` → `attributesToArray` + `relationsToArray`
- Circular relation references cause infinite recursion — Laravel checks `relationLoaded()` but custom overrides must handle it

## Verification
- [ ] `$model->toArray()` produces expected associative array structure
- [ ] `$model->toJson()` produces valid JSON string
- [ ] Loaded relationships appear in serialized output
- [ ] Sensitive attributes are excluded via `$hidden`
- [ ] Appended accessors are present in output
- [ ] Date attributes use the configured `serializeDate()` format
- [ ] Circular relationships do not cause infinite recursion
- [ ] Custom `toArray()` override calls `parent::toArray()` or handles relations explicitly
