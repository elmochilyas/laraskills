# Anti-Patterns: Fluent Through Relationships

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Part 1: Relationship Types
- **Knowledge Unit:** Fluent Through Relationships

## Anti-Patterns

### Fluent Syntax in Laravel 9
Using the fluent `through()->has()` API in a Laravel 9 or below project. The fluent API relies on the `ThroughRelation` class introduced in Laravel 10.

**Problem:** Fatal runtime error, broken deployment.

**Solution:** Only use fluent through syntax in Laravel 10+ projects. Verify `composer.json` requires `^10.0`.

### Fluent for Everything
Using the verbose fluent syntax for simple two-table through chains where traditional `hasOneThrough()`/`hasManyThrough()` is more concise and widely recognized.

**Problem:** Unnecessary verbosity, reduced readability for simple relationships.

**Solution:** Use traditional positional syntax for single-hop through chains; reserve fluent for multi-hop chains.

### Wrong Cardinality
Using `has()` when the chain should return a collection (`hasMany()`) or vice versa. The final method determines cardinality — `has()` returns a single model; `hasMany()` returns a collection.

**Problem:** Type errors, broken iteration, unexpected null vs collection behavior.

**Solution:** Use `has()` for one-to-one final hops and `hasMany()` for one-to-many.

### Missing Keys Per Hop
Defining custom foreign keys in the chain without scoping them to the correct `through()` call. Unlike positional syntax, keys in the fluent API must be specified per hop.

**Problem:** Wrong foreign keys used, incorrect join SQL, query failures.

**Solution:** Scope custom keys to each `through()` or `has()` call: `->through(Model::class, 'foreign_key', 'local_key')`.

### Over-Nesting Chains
Creating 4+ hop fluent through chains that generate complex, unoptimizable multi-JOIN SQL.

**Problem:** Slow multi-join queries, difficulty optimizing with EXPLAIN, maintenance complexity.

**Solution:** Limit fluent through chains to a maximum of 3 hops.

### Unvalidated Chain SQL
Defining a fluent chain without testing the generated SQL. The fluent API does not validate intermediate relationships at definition time — errors only surface at query time.

**Problem:** Silent incorrect queries, wrong data, difficult debugging.

**Solution:** Test the chain by inspecting `toSql()` during development with assertions.

### Undocumented Multi-Hop Chains
Defining multi-hop fluent chains without DocBlocks describing each hop. Developers unfamiliar with the chain cannot understand its structure.

**Problem:** Confusion about chain structure, difficulty maintaining and debugging.

**Solution:** Add DocBlocks documenting the full chain: `/** Organization → Dept (org_id) → Emp (dept_id) → Report (emp_id) */`.
