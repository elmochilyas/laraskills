# Fluent Through Relationships — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** Fluent Through Relationships
- **ECC Version:** 1.0

## Overview
The fluent "through" relationship API allows defining `HasOneThrough` and `HasManyThrough` relationships using a readable, chainable syntax. Instead of positional arguments to `hasOneThrough`/`hasManyThrough`, the developer uses `through()` to specify the intermediate, then chains `has()` or `hasMany()` for the target.

## Core Concepts
- Fluent definition: `return $this->through(Profile::class)->has(Avatar::class);`
- Multiple intermediates: `$this->through(A::class)->through(B::class)->hasMany(C::class)`
- `has()` returns a single model (like `HasOneThrough`); `hasMany()` returns a collection (like `HasManyThrough`)
- Custom keys scoped per hop: `through(Model::class, 'foreign_key', 'local_key')`
- The fluent API resolves to the same underlying `HasOneThrough`/`HasManyThrough` instances at runtime

## When To Use
- Complex through relationships with multiple intermediate hops (3+ tables)
- Chains with custom foreign keys on different hops — keys are scoped to each `through()` call
- Readability: when the positional argument syntax of `hasOneThrough`/`hasManyThrough` becomes confusing
- Multi-hop chains: Organization → Department → Employee → Report

## When NOT To Use
- Do NOT use in Laravel versions below 10 (fluent API requires `ThroughRelation` class)
- Do NOT use for simple two-table through relationships — traditional syntax is more concise
- Do NOT use when you need write support — through relationships remain read-only regardless of syntax
- Do NOT use when the intermediate model's relationship method is ambiguous

## Best Practices (WHY)
- Verify Laravel version >= 10.0 before using the fluent API
- Use `has()` for one-to-one final hops and `hasMany()` for one-to-many
- Document the chain with clear DocBlocks describing each hop
- Call `toSql()` during development to verify the generated SQL matches expectations
- Add a fallback using traditional syntax if supporting Laravel 9

## Architecture Guidelines
- Limit chain depth to 3 hops for maintainability and query performance
- Extract very long chains into dedicated relationship methods with descriptive names
- Use the fluent API when readability matters — simple chains can use traditional syntax
- Validate the chain definition in tests to catch resolution errors early

## Performance
- Zero runtime overhead — fluent API resolves to the same underlying `HasOneThrough`/`HasManyThrough` classes
- Same index requirements as traditional through relationships per hop
- Multi-hop chains generate multi-JOIN SQL — monitor with `EXPLAIN`
- No performance penalty for the fluent syntax itself

## Security
- Same security considerations as `HasOneThrough`/`HasManyThrough` — read-only access
- The chain does not validate intermediate relationships at definition time
- Ensure authorization gates check through the full chain, not just the target

## Common Mistakes
- Using `has()` for what should be `hasMany()` — `has()` returns a single model, not a collection
- Missing `through()` call — calling `has()` without a preceding `through()` throws an exception
- Assuming intermediate relationships are validated — the fluent API doesn't verify cardinality
- Expecting `create()` to work — read-only constraint is preserved

## Anti-Patterns
- **Fluent for everything**: using the verbose fluent syntax for simple 2-table through chains
- **No fallback**: using fluent syntax in a codebase that supports Laravel 9
- **Unvalidated chains**: not testing the chain produces the expected SQL
- **Over-nesting**: 4+ hop chains that create unreadable and unmaintainable SQL

## Examples
```php
// Simple one-to-one through
class User extends Model
{
    public function avatar(): ThroughRelation
    {
        return $this->through(Profile::class)->has(Avatar::class);
    }
}

// One-to-many through with one hop
class Country extends Model
{
    public function posts(): ThroughRelation
    {
        return $this->through(User::class)->hasMany(Post::class);
    }
}

// Multi-hop with custom keys
class Organization extends Model
{
    public function reports(): ThroughRelation
    {
        return $this
            ->through(Department::class, 'organization_id', 'id')
            ->through(Employee::class, 'department_id', 'id')
            ->hasMany(Report::class, 'employee_id', 'id');
    }
}

// Eager loading works identically
$users = User::with('avatar')->get();

// Existence queries
$usersWithAvatar = User::has('avatar')->get();

// Compare SQL with traditional syntax
assert(
    $user->avatar()->toSql() === $user->traditionalAvatar()->toSql()
);
```

## Related Topics
- HasOneThrough — traditional syntax for one-to-one through
- HasManyThrough — traditional syntax for one-to-many through
- HasOne / HasMany — base relationship types

## AI Agent Notes
- The fluent API is Laravel 10+ only — check version compatibility before generating
- `has()` = single result (HasOneThrough), `hasMany()` = collection (HasManyThrough)
- Each `through()` adds a hop; the final `has()`/`hasMany()` specifies the target
- Custom keys are scoped to each `through()`/`has()` call, not positional
- The fluent API is syntactic sugar — identical SQL to traditional syntax

## Verification
- [ ] Fluent syntax produces identical SQL to traditional syntax
- [ ] `through(A)->has(B)` returns single model
- [ ] `through(A)->hasMany(B)` returns collection
- [ ] Multi-hop chain works with 3+ intermediates
- [ ] Custom keys are positionally scoped per hop
- [ ] Eager loading produces correct joins
- [ ] Exception thrown if `has()` called without `through()`
