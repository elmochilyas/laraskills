# withDefault — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** default-models
- **ECC Version:** 1.0

## Overview
`withDefault()` on a `BelongsTo` (or `HasOne`, `MorphOne`) relationship configures Eloquent to return a default model instance instead of `null` when no related record exists. This implements the Null Object pattern at the ORM layer — eliminating conditional null checks throughout the codebase.

## Core Concepts
- `->withDefault()` — returns a bare instance with default attribute values
- `->withDefault(['name' => 'Guest'])` — returns an instance with pre-set attributes
- `->withDefault(fn($parent) => new Author(...))` — dynamic default generation via callable
- Default model has `$exists = false` — it was never fetched from the database
- `$relationLoaded = true` on the parent model — prevents further lazy loading attempts
- Works on `BelongsTo`, `HasOne`, and `MorphOne` only (singular relationships)

## When To Use
- Guest author fallback: `Post::belongsTo(Author::class)->withDefault(['name' => 'Guest'])`
- Always-present settings: `User::hasOne(Settings::class)->withDefault()`
- Chain-safe access: eliminating `$post->author?->name` → `$post->author->name`
- Default values for optional relationships where the null-check burden is high
- Templates and API responses that should always include the relationship key

## When NOT To Use
- Do NOT use on `HasMany` or `BelongsToMany` — only works on singular relationships
- Do NOT use when it's important to distinguish between "no relation" and "null" — masks missing data bugs
- Do NOT use when the default model needs to persist — `save()` creates a new record but doesn't auto-link
- Do NOT use when the default model's accessors/casts depend on database values that don't exist

## Best Practices (WHY)
- Use `withDefault()` to centralize fallback logic in the model definition rather than spreading null checks
- Prefer array defaults over callables for simple static fallback values
- Use callable defaults when the fallback depends on the parent model's attributes
- Check `$model->exists` on the default model when you need to distinguish default from real
- Document the default behavior clearly — developers may be surprised that a relationship never returns null

## Architecture Guidelines
- Place defaults at the relationship layer, not in accessors or application code
- Use callable defaults sparingly — they create coupling between the parent and default generation logic
- For API responses, be aware that introducing `withDefault()` changes serialization output from null to an object
- Combine with `$casts` on custom pivot models when defaults need type conversion
- Add monitoring for expected relationships that are always returning defaults (may indicate data loss)

## Performance
- Zero query cost — default model is constructed in PHP without a database call
- Instantiation of a default model is negligible (microseconds)
- Accessing default model's relationships will trigger lazy loading unless also eager-loaded
- Callable defaults performing database lookups should be avoided in hot paths

## Security
- Default models are serialized like real models — ensure they don't expose sensitive computed values
- Accessors on default models may crash if they assume database values exist
- The `$exists = false` flag allows detection but is not a security boundary
- Default models in API responses always include the relationship key — may change client expectations

## Common Mistakes
- Applying `withDefault()` on a `HasMany` relation (only works on singular relations)
- Expecting the default model to persist when saved — `save()` creates but doesn't auto-link
- Using attributes on the default model that trigger null errors in accessors or casts
- Forgetting that `withDefault()` applies to lazy loading as well — even `$post->author` returns the default

## Anti-Patterns
- **withDefault as data-loss cover-up**: masking missing data that should be investigated
- **Heavy callable defaults**: performing expensive database queries in the default callable
- **Default on both sides**: using withDefault on both BelongsTo and HasOne, creating circular defaults
- **No exists check when needed**: relying on `=== null` checks that never trigger because of withDefault

## Examples
```php
// Simple default
class Post extends Model
{
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class)->withDefault([
            'name' => 'Guest Author',
        ]);
    }
}

// Always-present settings
class User extends Model
{
    public function settings(): HasOne
    {
        return $this->hasOne(Settings::class)->withDefault();
    }
}

// Dynamic default
class Post extends Model
{
    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class)->withDefault(
            fn($post) => new Author(['name' => "Author of {$post->title}"])
        );
    }
}

// Usage
$post->author->name; // 'Guest Author' if no author exists
$post->author->exists; // false — it's a default

// No null checks needed
echo $post->author->name; // safe — never null

// Save creates but doesn't link
$post->author()->save(new Author(['name' => 'Real']));
// Creates Author record but doesn't update post.author_id

// Check if default
if (! $post->author->exists) {
    // This is a default model — no real author exists
}
```

## Related Topics
- BelongsTo — relationship type
- HasOne / MorphOne — other supported relationship types
- Null Object Pattern — design pattern background
- Model Serialization — how defaults appear in API responses

## AI Agent Notes
- Only works on singular relationships: BelongsTo, HasOne, MorphOne
- Default model has `$exists = false` — check this to distinguish from real models
- `save()` on a default model creates a new record but doesn't auto-link the FK
- Callable defaults receive the parent model as the argument
- Introducing `withDefault()` changes serialization — null becomes an object

## Verification
- [ ] `$parent->relation` returns a model instance (never null)
- [ ] Default model has `$exists = false`
- [ ] Array defaults set expected attribute values
- [ ] Callable defaults generate correct values based on parent
- [ ] No null errors when accessing default model's attributes
- [ ] `save()` on default creates record but doesn't auto-associate
- [ ] Serialization includes the relationship key with default values
