# Skill: Touch Parent Timestamps on Child Changes

## Purpose

Use `touch()` to update a model's `updated_at` timestamp, and `touchOwners()` or `$touches` to cascade timestamp updates up the relationship chain — for cache invalidation, change tracking, and parent awareness of child activity.

## When To Use

- Invalidating caches that depend on model timestamps
- Updating parent `updated_at` when a child record changes
- Signaling that a model has been modified (touch without data change)

## When NOT To Use

- Frequent updates on high-write tables (touch adds write load)
- Deep relationship hierarchies (cascading touch creates many queries)

## Prerequisites

- Understanding of the `$touches` property on child models
- Knowledge that touch triggers a database UPDATE even if data hasn't changed

## Inputs

- Model to touch
- Relationship name for cascading (belongsTo, morphTo)
- $touches array on child model

## Workflow

1. For single model: `$model->touch()` to update `updated_at`
2. For cascading on specific events: call `$model->touchOwners()` manually
3. For automatic cascading: set `protected $touches = ['post']` on the Comment model
4. When comment is created/updated/deleted, parent post's `updated_at` updates automatically

## Validation Checklist

- [ ] touch frequency doesn't cause excessive write load
- [ ] Cascading touch depth is reasonable (not deeply nested)
- [ ] Cache invalidation strategy correctly uses timestamp as key component
- [ ] $touches array contains correct relationship method names

## Common Failures

### touch causing unnecessary saves
`touch()` triggers a database UPDATE even if the model hasn't changed. In high-frequency updates, this adds write load.

### Cascading touch on deep hierarchies
`$touches` on multiple levels creates a chain of UPDATE queries. Excessive on deeply nested relationships.

## Decision Points

### Manual touch vs $touches property?
Use $touches for consistent cascading on every child save. Use manual touch() for specific events only.

### Touch vs direct updated_at update?
Touch() is cleaner and fires model events. Direct `$model->updated_at = now()` works but bypasses touches system.

## Performance Considerations

Each touch() generates a separate UPDATE query. Deep cascading chains multiply this. For high-write tables, consider alternative cache invalidation strategies.

## Security Considerations

Touch updates happen during model save. Ensure authorization is in place — touching doesn't bypass any security, but ensure the cascade doesn't update models the user shouldn't affect.

## Related Rules

- Use touch for cache invalidation
- Limit cascading touch depth
- Monitor write load from touch operations

## Related Skills

- Hook into Model Lifecycle with Events and Observers
- Define Eloquent Relationship Types
- Cast Model Attributes for Type Safety

## Success Criteria

- touch correctly updates `updated_at` and fires events
- $touches cascades updates up the relationship chain
- Excessive write load from touch is monitored and controlled
- Cache invalidation strategy correctly leverages timestamps
