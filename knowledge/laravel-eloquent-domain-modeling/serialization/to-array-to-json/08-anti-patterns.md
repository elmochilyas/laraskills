# Anti-Patterns: ToArray / ToJson

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** ToArray / ToJson

## Anti-Patterns

### Heavy Computation in toArray()
Running database queries or expensive logic inside a `toArray()` override. `toArray()` is called on every serialization — heavy computation multiplies cost across collections, endpoints, and response formats.

**Problem:** Slow API responses; unexpected database queries during serialization; N+1 hidden in serialization layer.

**Solution:** Keep `toArray()` lightweight. Pre-compute values and eager-load relationships before serialization.

### No $hidden Safety Net
Failing to configure `$hidden` for sensitive attributes (passwords, tokens, PII). A developer override of `toArray()` that forgets to exclude sensitive columns exposes them in all serialized output.

**Problem:** Sensitive data leakage in API responses, logs, queues, and broadcast events.

**Solution:** Always list sensitive columns in `$hidden` on the model as a safety net, even with custom `toArray()`.

### Overriding toArray for API Shape Instead of Resources
Using model `toArray()` overrides to shape HTTP API responses instead of API Resources. This couples model serialization to HTTP concerns and loses pagination, conditional attributes, and wrapping.

**Problem:** Model serialization tied to HTTP concerns; cannot use pagination or conditional attributes; harder to version.

**Solution:** Use API Resources for HTTP response shaping; reserve model `toArray()` for non-HTTP channels.

### Serializing Lazy-Loaded Relations
Calling `toArray()` on a model with unloaded relationships, triggering lazy loading during serialization. Each relationship access inside serialization triggers a separate query.

**Problem:** N+1 query explosion inside serialization loops in views, API resources, and collection responses.

**Solution:** Eager-load all relationships that will appear in serialized output before calling `toArray()`.

### Overriding toArray Without Calling Parent
Overriding `toArray()` without calling `parent::toArray()`, breaking recursive relationship serialization. Only explicitly specified attributes appear — all relationship data is lost.

**Problem:** Lost relationship data in serialized output; missing nested data.

**Solution:** Either call `parent::toArray()` and merge, or explicitly handle relationship serialization.

### Ignoring json_encode Failures
Calling `toJson()` without `JSON_THROW_ON_ERROR`. Encoding failures silently return `false`, which serializes to the JSON value `null`, masking the error.

**Problem:** Silent data corruption — null responses instead of meaningful errors.

**Solution:** Use `$model->toJson(JSON_THROW_ON_ERROR)` in critical paths.

### Circular Relation References
Having models with circular relationship definitions that cause infinite recursion in `toArray()`. The serialization pipeline recurses endlessly through the relation graph.

**Problem:** Infinite recursion; stack overflow; request timeout.

**Solution:** Manually break circular references in `toArray()` overrides or use API Resources to control depth.
