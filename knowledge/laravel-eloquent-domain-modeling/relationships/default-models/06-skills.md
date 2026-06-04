# Default Models Skills

## Skill: Apply withDefault for null-safe relationship access

### Purpose
Use `withDefault()` on singular relationships to return a default model instance instead of null, eliminating conditional null checks across the codebase.

### When To Use
- Guest author fallback: `Post::belongsTo(Author::class)->withDefault(['name' => 'Guest'])`
- Always-present settings: `User::hasOne(Settings::class)->withDefault()`
- Templates and API responses that should always include the relationship key
- Eliminating null checks where the relationship is genuinely optional

### When NOT To Use
- On `HasMany` or `BelongsToMany` (only works on singular relationships)
- When it's important to distinguish between "no relation" and null
- When the default model needs to persist — `save()` creates but doesn't auto-link
- When the default model's accessors/casts depend on database values that don't exist

### Prerequisites
- Singular relationship: `BelongsTo`, `HasOne`, or `MorphOne`
- Model to serve as the default (no actual record needed)

### Inputs
- Relationship method name
- Default attribute values (array) or callable for dynamic defaults
- Relationship type (BelongsTo, HasOne, MorphOne)

### Workflow
1. Identify the relationship that should never return null
2. Define `->withDefault()` on the relationship method
3. For static defaults, pass an array: `->withDefault(['name' => 'Guest Author'])`
4. For dynamic defaults based on the parent, use a callable: `->withDefault(fn($post) => new Author(['name' => "Author of {$post->title}"]))`
5. For empty defaults with no attributes, call `->withDefault()` with no arguments
6. Ensure accessors on the related model handle null/default attribute values safely
7. Document the default behavior — other developers may be surprised that the relationship never returns null

### Validation Checklist
- [ ] `withDefault()` is applied only on singular relationships (BelongsTo, HasOne, MorphOne)
- [ ] `$parent->relation` returns a model instance (never null)
- [ ] Default model has `$exists = false`
- [ ] Array defaults set expected attribute values
- [ ] Callable defaults generate correct values based on parent
- [ ] Accessors on the model handle potentially null attributes on default instances
- [ ] No `=== null` checks are used to detect absence (they never trigger)

### Common Failures
- Applying `withDefault()` on HasMany/BelongsToMany (only works on singular relations)
- Not handling null attribute values in accessors — default model attributes may be null
- `withDefault()` masking data loss bugs that should be investigated
- Serialization changes — null becomes an object, breaking API contracts

### Decision Points
- **Array defaults vs callable?** — Use array defaults for simple static fallback values; use callable when the fallback depends on the parent model
- **withDefault or nullsafe operator?** — Use `withDefault()` when the relationship is genuinely optional and a null object is the correct domain behavior; use nullsafe (`$post->author?->name`) for occasional null handling

### Performance Considerations
- Zero query cost — default model is constructed in PHP without a database call
- Callable defaults performing database lookups should be avoided in hot paths
- Default model's relationships trigger lazy loading unless also eager-loaded

### Security Considerations
- Default models are serialized like real models — ensure they don't expose sensitive computed values
- `withDefault()` changes API serialization: null becomes an object — may break API contracts
- Check whether `$exists` on default models is sufficient for your client's needs

### Related Rules
- [WithDefault-Only-Singular](../default-models/05-rules.md)
- [WithDefault-Not-For-Data-Loss](../default-models/05-rules.md)
- [WithDefault-Callback-Not-Heavy](../default-models/05-rules.md)
- [WithDefault-Save-Awareness](../default-models/05-rules.md)
- [WithDefault-Serialization-Impact](../default-models/05-rules.md)
- [WithDefault-Accessor-Safety](../default-models/05-rules.md)

### Related Skills
- Distinguish between real and default relationship models

### Success Criteria
- Relationship never returns null — always a model instance
- Default attributes reflect the expected fallback values
- No null pointer errors from accessors on default instances
- API serialization change is documented if applicable
- Data integrity issues are not masked by inappropriate defaults

---

## Skill: Distinguish between real and default relationship models

### Purpose
Check whether an eagerly- or lazy-loaded relationship returned a real persisted model or a default model created by `withDefault()`.

### When To Use
- Conditional logic based on whether the relationship actually exists
- Displaying different UI for real vs default relationships
- Validation that a relationship must exist (reject defaults)
- API responses that need to differentiate null vs default

### When NOT To Use
- When distinguishing is not needed (just use the default values)
- When `$exists` checks proliferate — the point of `withDefault()` is to avoid conditionals

### Prerequisites
- Relationship with `withDefault()` configured

### Inputs
- Relationship model instance
- The `$exists` property on that instance

### Workflow
1. Access the relationship: `$post->author`
2. Check `$model->exists` to determine if the model is real or default:
   ```php
   if ($post->author->exists) {
       // Real persisted author
   } else {
       // Default model — no real author exists
   }
   ```
3. In API resources, conditionally include based on `$exists`:
   ```php
   'author' => $this->author->exists ? new AuthorResource($this->author) : null,
   ```
4. Do NOT use `=== null` checks — they never trigger with `withDefault()`

### Validation Checklist
- [ ] `$exists` is used instead of `=== null` for detecting defaults
- [ ] Conditional behavior correctly distinguishes real vs default
- [ ] API response correctly maps defaults to appropriate representation

### Common Failures
- Using `=== null` checks that never trigger because `withDefault()` always returns a model
- Forgetting to check `$exists` and treating default model attributes as authoritative
- API contracts breaking because null suddenly becomes an object

### Decision Points
- **$exists check or always show defaults?** — Check `$exists` when the difference matters to the consumer; don't check when the default values are sufficient

### Performance Considerations
- `$exists` check is zero-cost — it's a boolean property on the model

### Security Considerations
- `$exists` is not a security boundary — it can be set manually
- API responses that expose `$exists` may leak information about database state

### Related Rules
- [Check-Exists-On-Default](../default-models/05-rules.md)

### Related Skills
- Apply withDefault for null-safe relationship access

### Success Criteria
- Default detection works correctly via `$exists` property
- No stale `=== null` checks hiding in the codebase
- Conditional logic correctly distinguishes real vs default relationships
