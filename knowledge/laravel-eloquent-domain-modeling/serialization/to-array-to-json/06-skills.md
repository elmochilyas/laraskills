# ToArray / ToJson Skills

## Skill: Serialize Eloquent models to arrays and JSON via the serialization pipeline

### Purpose
Use Eloquent's built-in `toArray()` and `toJson()` methods for converting models (and their loaded relationships) to arrays and JSON strings, understanding the layered pipeline: `json_encode` → `jsonSerialize` → `toArray` → `attributesToArray` + `relationsToArray`.

### When To Use
- Exposing model data as JSON in queue payloads, broadcast events, and notifications
- Debugging/inspecting model state via `dd($model->toArray())`
- Generating array snapshots for caching or logging
- Customizing serialization output shape for non-HTTP channels

### When NOT To Use
- For public API responses that need attribute renaming, conditional inclusion, or metadata — use API Resources
- On models with lazy-loaded relations in hot paths — triggers N+1
- As immutable data contracts — use DTOs for typed boundaries
- As a deep-clone mechanism — nested non-Eloquent objects remain as references

### Prerequisites
- Eloquent model with optionally loaded relationships

### Inputs
- Model instance with loaded relations

### Workflow
1. Ensure all relationships that should appear in output are eager-loaded before serialization
2. Call `$model->toArray()` for array output or `$model->toJson(JSON_THROW_ON_ERROR)` for JSON
3. For custom non-HTTP shape, override `toArray()` on the model calling `parent::toArray()` for relation support
4. Set a consistent date format via `serializeDate()` on a base model
5. Never perform queries or heavy computation inside `toArray()` overrides
6. Never log raw `$model->toArray()` without filtering sensitive data
7. Use `JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE` in critical paths

### Validation Checklist
- [ ] `$model->toArray()` produces expected associative array structure
- [ ] `$model->toJson()` produces valid JSON string
- [ ] Loaded relationships appear in serialized output
- [ ] Sensitive attributes are excluded via `$hidden`
- [ ] Appended accessors are present in output
- [ ] Date attributes use the configured `serializeDate()` format
- [ ] Circular relationships do not cause infinite recursion
- [ ] Custom `toArray()` override calls `parent::toArray()` or handles relations explicitly

### Common Failures
- Defining accessors expected in `toArray()` but forgetting `$appends` — computed value absent
- Overriding `toArray()` without calling `parent::toArray()` — breaks recursive relation serialization
- Expecting `toArray()` on unsaved model to include primary key — not set yet
- Forgetting `toArray()` includes ALL loaded relations, including unintended ones
- Querying inside `toArray()` — N+1 explosion on collection serialization

### Decision Points
- **Model toArray() or API Resource?** — Use model `toArray()` for non-HTTP channels (queue, events); use API Resources for HTTP
- **Override toArray() or use accessors + $appends?** — Override `toArray()` for fundamentally different shapes; use `$appends` for additive computed values
- **toJson flags?** — Always use `JSON_THROW_ON_ERROR` in critical paths; use `JSON_UNESCAPED_UNICODE` for internationalized content

### Performance Considerations
- `toArray()` triggers all accessors in `$appends` — may run queries or computations
- Deeply nested relation graphs create many intermediate arrays — memory scales with graph size
- Date serialization applies per date attribute — overhead grows with date column count
- Bulk serialization with `Collection->toArray()` is efficient for pre-loaded relations

### Security Considerations
- Never log raw `$model->toArray()` without filtering — sensitive attributes may be exposed
- Apply `$hidden` to sensitive columns as a safety net
- Audit custom `toArray()` overrides for accidental data exposure
- `json_encode` failures silently return `false` — use `JSON_THROW_ON_ERROR` in critical paths

### Related Rules
- [ToArray-Override-Uses-Not-For-HTTP](../to-array-to-json/05-rules.md)
- [ToArray-Override-Only-For-Non-HTTP](../to-array-to-json/05-rules.md)
- [ToArray-Call-Parent-Or-Handle-Relations](../to-array-to-json/05-rules.md)
- [ToArray-No-Queries-Inside](../to-array-to-json/05-rules.md)
- [ToArray-JSON-THROW-ON-ERROR](../to-array-to-json/05-rules.md)
- [ToArray-SerializeDate-Base-Model](../to-array-to-json/05-rules.md)
- [ToArray-Never-Log-Raw](../to-array-to-json/05-rules.md)
- [ToArray-Preload-Before-Serialization](../to-array-to-json/05-rules.md)
- [ToArray-JSON-UNESCAPED-UNICODE](../to-array-to-json/05-rules.md)
- [ToArray-Audit-JsonSerialize](../to-array-to-json/05-rules.md)

### Related Skills
- Inject computed accessor values into serialization output using $appends
- Control attribute visibility in serialization output using $hidden/$visible

### Success Criteria
- `toArray()` returns correct associative array with all loaded relations
- `toJson()` returns valid JSON string (throws on failure with `JSON_THROW_ON_ERROR`)
- Sensitive attributes filtered via `$hidden`
- Appended accessors present in output
- Consistent date format via `serializeDate()`
- No SQL queries executed during serialization
