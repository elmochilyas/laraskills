# Skill: Hydrate Eloquent Models from Raw Data

## Purpose

Use `hydrate` and `hydrateRaw` to create Eloquent model instances from cached data, query builder results, or external API responses — enabling Eloquent features (accessors, casts, relationships) on data that didn't originate from a model query.

## When To Use

- Populating models from cached data (cache-aside pattern)
- Bridging query builder results to Eloquent model instances
- Creating models from external API data

## When NOT To Use

- Standard Eloquent queries (use Model::query() or Model::find())
- Data that needs to be saved back to the database

## Prerequisites

- Understanding that hydrated models are not persisted to the database
- Knowledge that `hydrate` fires the `retrieved` model event

## Inputs

- Array of attribute arrays
- Data structure matching the model's attributes

## Workflow

1. Prepare data as array of attribute arrays: `[['id' => 1, 'name' => 'A'], ['id' => 2, 'name' => 'B']]`
2. Call `Model::hydrate($data)` to get a Collection of model instances
3. Access Eloquent features (accessors, casts, relationships) on hydrated models
4. For raw SQL results, use `Model::hydrateRaw($sql, $bindings)`

## Validation Checklist

- [ ] Hydrated data includes all attributes needed by accessors and casts
- [ ] `retrieved` event side effects are expected when hydrating
- [ ] Hydrated models are recognized as not persisted (exists = false)

## Common Failures

### Forgetting retrieved event fires
`hydrate` fires the `retrieved` model event. If the event has side effects, expect them when hydrating.

### Hydrating from stale data
The hydrated model may have attributes that differ from the database state. Don't assume hydrated data is current.

## Decision Points

### Hydrate vs Model query?
Use standard Eloquent queries for database-fresh data. Use hydrate for cached or transformed data that needs Eloquent features.

### Hydrate vs manual instantiation?
Hydrate returns a Collection with proper model instances. Manual `new Model()` requires individual attribute setting.

## Performance Considerations

Hydration avoids a database query but still runs casts, accessors, and the `retrieved` event. For large datasets, lazy() or cursor() may be more appropriate.

## Security Considerations

Hydrated models bypass Eloquent's attribute filtering from queries. Ensure the data source is trusted when hydrating from external sources.

## Related Rules

- Use hydrate for cache-to-Elixir pattern
- Expect `retrieved` event side effects when hydrating
- Don't persist hydrated models without verification

## Related Skills

- Transform Model Attributes with Accessors and Mutators
- Cast Model Attributes for Type Safety
- Process Large Datasets with Chunk and Cursor

## Success Criteria

- Hydrated models correctly use accessors and casts
- Cached data successfully restored to model instances
- `retrieved` event side effects accounted for
- Data is recognized as non-persisted (exists = false)
