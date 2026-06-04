# Skill: Configure Model Serialization for API Responses

## Purpose

Control how Eloquent models and collections convert to arrays and JSON — using `$hidden` to exclude sensitive attributes, `$visible` to whitelist permitted fields, `$appends` to include computed accessors, and API Resources for endpoint-specific shaping.

## When To Use

- Returning model data from API endpoints
- Queuing models with serialized relationships
- Excluding sensitive fields from JSON output

## When NOT To Use

- Simple responses where the default toArray/toJson is sufficient
- Endpoints with complex transformation requirements (use API Resources)

## Prerequisites

- Knowledge of which attributes are sensitive and should be hidden
- Understanding of accessors and $appends interaction

## Inputs

- Model attributes to hide or show
- Computed accessors to append
- Relationship loading requirements for serialization

## Workflow

1. Set `protected $hidden = ['password', 'remember_token']` for sensitive fields
2. Alternatively, set `protected $visible = ['id', 'name', 'email']` to whitelist
3. Add computed accessors to `protected $appends = ['full_name']`
4. Use `toArray()` or `toJson()` for serialization
5. Use API Resource classes for per-endpoint customization

## Validation Checklist

- [ ] Sensitive attributes (passwords, tokens, keys) are in $hidden
- [ ] Accessors in $appends don't trigger lazy loading
- [ ] API Resources used when different endpoints need different field sets
- [ ] $appends attributes are computed, not stored in DB

## Common Failures

### $appends triggering N+1
An accessor in `$appends` that lazy loads a relationship causes N+1 on every serialization.

### Not hiding sensitive attributes
`toJson()` on a user model exposes `password` if not in `$hidden`.

## Decision Points

### $hidden vs $visible?
Use $hidden for models with few sensitive fields. Use $visible for models where most fields are sensitive.

### $appends vs API Resource?
$appends for model-wide computed fields. API Resources for endpoint-specific fields.

## Performance Considerations

Serialization triggers accessors. If accessors lazy-load relationships, serialization cost multiplies. Use eager loading for all relationships accessed during serialization.

## Security Considerations

Hidden attributes are excluded from JSON output. Never expose passwords, tokens, or internal IDs. API Resources provide fine-grained control per endpoint.

## Related Rules

- Hide sensitive attributes in $hidden
- Append computed accessors via $appends
- Use API Resources for endpoint-specific serialization

## Related Skills

- Transform Model Attributes with Accessors and Mutators
- Cast Model Attributes for Type Safety
- Shape API Responses with Resource Classes

## Success Criteria

- No sensitive attributes exposed in JSON responses
- $appends accessors don't cause N+1 queries
- Appropriate serialization strategy chosen ($hidden/$visible/API Resource)
- Queued models serialize correctly without relationship issues
