# Skill: Define Eloquent Relationship Types for Data Associations

## Purpose

Implement the correct Eloquent relationship type (hasOne, hasMany, belongsTo, belongsToMany, hasManyThrough, morphMany) for each database association, enabling efficient eager loading, proper SQL generation, and clear code semantics for data navigation.

## When To Use

- Defining model associations for querying related data
- Setting up one-to-one, one-to-many, many-to-many, or polymorphic relationships
- Enabling eager loading to prevent N+1 queries

## When NOT To Use

- Direct query builder joins for reporting/aggregation
- Scenarios better served by subqueries or raw SQL

## Prerequisites

- FK columns defined in migrations
- Pivot table created for many-to-many relationships
- Morph columns (type, id) for polymorphic relationships

## Inputs

- Relationship cardinality (one-to-one, one-to-many, many-to-many)
- FK column names
- Pivot table name (for belongsToMany)
- Morph column names (for polymorphic)

## Workflow

1. For child referencing parent (FK on child table): define `belongsTo` on the child model
2. For parent with children: define `hasMany` or `hasOne` on the parent model
3. For many-to-many: define `belongsToMany` on both models with the pivot table
4. For polymorphic: define `morphMany` on the parent and `morphTo` on the child
5. Always define the inverse relationship explicitly for bidirectional eager loading
6. For belongsToMany, use `->withPivot('column')` to access additional pivot columns

## Validation Checklist

- [ ] FK column matches between child and parent
- [ ] Pivot table exists for belongsToMany relationships
- [ ] Inverse relationship defined on the related model
- [ ] Foreign key name matches convention or is explicitly set
- [ ] Morph columns (type, id) properly indexed

## Common Failures

### Not defining the inverse relationship
`Comment belongsTo Post` is not defined. You can't eager load `comment->post`. Always define both sides of the relationship.

### Polymorphic for simple cases
Using `morphMany` when `hasMany` with a dedicated FK column works. Polymorphic adds index complexity (two-column index on type + id) and makes schema evolution harder.

## Decision Points

### hasMany vs belongsToMany?
hasMany when child has a FK to parent (one-to-many). belongsToMany when a pivot table joins them (many-to-many). The FK location determines the type.

### Polymorphic vs separate tables?
Polymorphic when multiple model types share the same child structure (images, comments, tags). Separate tables when each parent type has different child requirements.

## Performance Considerations

Eager loading reduces N+1 to 2 queries. belongsToMany generates JOIN on pivot table. Polymorphic queries have two-column `WHERE type=?, parent_id IN (?)` condition — index both columns.

## Security Considerations

Relationships can expose related data through serialization. Use `$hidden` or `$with` carefully. Queued models with loaded relationships can cause large serialization payloads.

## Related Rules

- Always define both sides of a relationship
- Index polymorphic (type, id) columns
- Eager load relationships in loops

## Related Skills

- Configure Model Definition Conventions
- Query with Eager Loading
- Count Related Records

## Success Criteria

- All relationships have both sides defined
- FK columns match between related tables
- Pivot tables exist for many-to-many relationships
- Polymorphic columns are indexed for performance
- Eager loading prevents N+1 query problems
