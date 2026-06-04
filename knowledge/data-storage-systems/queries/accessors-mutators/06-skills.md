# Skill: Transform Model Attributes with Accessors and Mutators

## Purpose

Define accessors (`getNameAttribute`) to transform attribute values when read from the database, and mutators (`setNameAttribute`) to transform values before saving, centralizing data transformation logic in the model rather than scattering it across controllers.

## When To Use

- Computing derived attributes (full name from first + last)
- Normalizing input values (trimming, formatting, hashing)
- Transforming database values for presentation

## When NOT To Use

- Simple type conversions (use attribute casting instead)
- Query-scoped transformations (use API resources for endpoint-specific shaping)

## Prerequisites

- Understanding of Eloquent model attribute lifecycle
- Knowledge of `$this->attributes` array for mutator storage

## Inputs

- Attribute name and transformation logic
- Raw database value (accessor) or input value (mutator)

## Workflow

1. Define accessor: `public function getNameAttribute($value)` — return transformed value
2. Define mutator: `public function setNameAttribute($value)` — set `$this->attributes['name'] = $transformed`
3. For computed accessors (not in DB), append to serialization via `$appends`
4. Prefer attribute casting for simple type conversions

## Validation Checklist

- [ ] Accessors don't query the database (no lazy loading inside accessors)
- [ ] Mutators use `$this->attributes['name']` not `$this->name =` (avoids recursion)
- [ ] Computed accessors are listed in `$appends` if needed in JSON output
- [ ] Simple type conversions use casts instead of accessors

## Common Failures

### Accessors that query the database
Calling `$this->relation()->first()` in an accessor triggers lazy load. Eager load the relationship instead.

### Mutators that don't set the attribute
`$this->name = $value` in a mutator causes infinite recursion. Use `$this->attributes['name']`.

## Decision Points

### Accessor vs Cast?
Casts for type conversion (boolean, JSON, datetime). Accessors for computed or transformed values.

### Accessor vs API Resource?
Accessors for model-wide transformations. API Resources for endpoint-specific shaping.

## Performance Considerations

Accessors execute on every read of the attribute. Avoid database queries inside accessors. Use eager loading for any relationship data needed.

## Security Considerations

Mutators can sanitize input (strip HTML, hash passwords). Don't trust raw user input — normalize in mutators before storage.

## Related Rules

- Never query the database inside accessors
- Use `$this->attributes` in mutators, not `$this->name`
- Prefer casts over accessors for type conversion

## Related Skills

- Cast Model Attributes
- Configure Model Serialization
- Define Eloquent Relationship Types

## Success Criteria

- Accessors are side-effect-free and don't query the database
- Mutators properly normalize input and use `$this->attributes`
- Simple type conversions use casts, not accessors
- Computed accessors are listed in `$appends` when needed
