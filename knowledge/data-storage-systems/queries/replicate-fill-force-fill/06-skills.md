# Skill: Clone and Mass-Assign Models Safely

## Purpose

Use `replicate` to clone model instances (without PK), `fill` for mass-assignment respecting `$fillable`, and `forceFill`/`forceCreate` with caution when bypassing mass-assignment protection — controlling how model attributes are populated and persisted.

## When To Use

- Creating duplicate content instances (replicate)
- Mass-assigning validated request data (fill)
- Admin panel updates requiring unfillable attribute access (forceFill)

## When NOT To Use

- User-facing input (never use forceFill with user data)
- Creating new models from scratch (use create or make)

## Prerequisites

- Understanding of mass-assignment protection ($fillable/$guarded)
- Knowledge that replicate doesn't copy relationships

## Inputs

- Model instance to replicate
- Attribute data to fill
- Except array (attributes to exclude from replication)

## Workflow

1. Use `$post->replicate(['published_at'])->save()` to clone without specified attributes
2. Use `$model->fill($request->validated())` for safe mass-assignment from validated data
3. Use `$model->forceFill(['internal_flag' => true])` only with trusted data
4. Use `Model::forceCreate([...])` only in admin/system contexts

## Validation Checklist

- [ ] forceFill/forceCreate never used with user-supplied input
- [ ] replicate excludes timestamps and PKs when appropriate
- [ ] Dependent relationships replicated separately if needed
- [ ] fill used with validated data (not raw request input)

## Common Failures

### Using forceFill with user input
Bypassing `$fillable` with user-supplied data allows mass-assignment of any attribute. Only use `forceFill` with trusted data.

### Replicate doesn't copy relationships
Only the model's direct attributes are copied. Related records must be replicated separately.

## Decision Points

### replicate vs manual create?
Replicate is cleaner for duplicating existing records. Manual create is better for new records with different data.

### fill vs forceFill?
Use fill for all user-facing operations. Use forceFill only for internal/system operations where you control all input.

## Performance Considerations

replicate creates a new model instance in memory — cheap. fill/forceFill don't persist until save(). forceCreate combines creation + save.

## Security Considerations

forceFill and forceCreate bypass mass-assignment protection. Never use with user-supplied data. Always validate and authorize before using.

## Related Rules

- Never use forceFill with user input
- Replicate doesn't copy relationships
- Use fill with validated data

## Related Skills

- Configure Eloquent Model Conventions for Table Mapping
- Cast Model Attributes for Type Safety
- Transform Model Attributes with Accessors and Mutators

## Success Criteria

- forceFill only used with trusted, internal data
- replicate correctly excludes specified attributes
- fill receives validated data from form requests
- Relationship replication handled separately when needed
