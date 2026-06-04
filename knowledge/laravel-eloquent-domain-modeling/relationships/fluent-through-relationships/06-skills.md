# Fluent Through Relationships Skills

## Skill: Define a fluent through relationship with proper key scoping

### Purpose
Use the fluent `through()` API to define readable multi-hop through relationships with custom keys scoped per hop.

### When To Use
- Complex through relationships with multiple intermediate hops (3+ tables)
- Chains with custom foreign keys on different hops
- When positional argument syntax of `hasOneThrough`/`hasManyThrough` becomes confusing
- Multi-hop chains: Organization → Department → Employee → Report

### When NOT To Use
- Laravel versions below 10 (fluent API requires `ThroughRelation` class)
- Simple two-table through relationships (traditional syntax is more concise)
- When you need write support (through relationships remain read-only)
- When the intermediate model's relationship method is ambiguous

### Prerequisites
- Laravel 10+ project
- Three or more related tables in a chain

### Inputs
- Through chain definition (intermediate model classes)
- Custom foreign key and local key per hop
- Final target model with cardinality (`has()` or `hasMany()`)

### Workflow
1. Verify `composer.json` requires Laravel `^10.0`
2. Define a method returning `ThroughRelation` (or use the return type from the chain builder)
3. Start the chain with `$this->through(Intermediate::class)`
4. For multi-hop chains, chain additional `->through()` calls
5. End with `->has(Target::class)` for singular or `->hasMany(Target::class)` for collection
6. Scope custom keys per hop: `->through(Model::class, 'foreign_key', 'local_key')`
7. Add DocBlocks documenting each hop: `/** Organization → Dept (org_id) → Emp (dept_id) → Report (emp_id) */`
8. Document the read-only constraint in the method DocBlock

### Validation Checklist
- [ ] Laravel version is ^10.0 (fluent API available)
- [ ] `through()` calls use correct model class names per hop
- [ ] Custom keys are scoped to their corresponding `through()` call
- [ ] Final call uses `has()` for singular or `hasMany()` for collection
- [ ] Chain is limited to maximum 3 hops
- [ ] DocBlock documents the full chain structure
- [ ] Read-only constraint is documented
- [ ] Generated SQL verified with `toSql()` during development

### Common Failures
- Using fluent API in Laravel 9 or below — class not found error
- Using `has()` for what should be `hasMany()` — wrong cardinality
- Missing keys per hop — defaults may not match custom schema
- Not calling `through()` before `has()` — exception thrown
- 4+ hop chains that are unreadable and produce complex SQL

### Decision Points
- **Fluent or traditional?** — Use fluent for 3+ hop chains with custom keys; use traditional for simple 2-hop chains
- **has() or hasMany()?** — Use `has()` for one-to-one final hop; use `hasMany()` for one-to-many

### Performance Considerations
- Zero runtime overhead — fluent API resolves to the same underlying classes
- Same index requirements as traditional through relationships per hop
- Multi-hop chains generate multi-JOIN SQL — monitor with `EXPLAIN`
- 3+ hop chains should be profiled carefully

### Security Considerations
- Same security considerations as `HasOneThrough`/`HasManyThrough` — read-only access
- Chain doesn't validate intermediate relationships at definition time
- Ensure authorization gates check through the full chain, not just the target

### Related Rules
- [Fluent-Laravel-Version-Check](../fluent-through-relationships/05-rules.md)
- [Fluent-Not-For-Simple-Chains](../fluent-through-relationships/05-rules.md)
- [Fluent-Keys-Per-Hop](../fluent-through-relationships/05-rules.md)
- [Fluent-Cardinality-Correct](../fluent-through-relationships/05-rules.md)
- [Fluent-Limit-Chain-Depth](../fluent-through-relationships/05-rules.md)
- [Fluent-DocBlock-Documentation](../fluent-through-relationships/05-rules.md)

### Related Skills
- Test and verify fluent through relationship SQL

### Success Criteria
- Fluent chain produces identical SQL to traditional syntax equivalent
- `has()` returns single model, `hasMany()` returns collection
- Custom keys are correctly applied per hop
- Multi-hop chain works with 2–3 intermediates
- Read-only constraint is documented

---

## Skill: Test and verify fluent through relationship SQL

### Purpose
Write tests that verify fluent through relationship chains generate the expected SQL, catching definition errors before deployment.

### When To Use
- After defining a new fluent through relationship
- During code review of multi-hop chains
- When debugging relationship queries
- As part of CI validation

### When NOT To Use
- Simple traditional `hasOneThrough`/`hasManyThrough` definitions

### Prerequisites
- Fluent through relationship defined on a model
- PHPUnit test setup

### Inputs
- Model instance (factory-made or `make()`)
- Fluent through relationship method name
- Expected SQL pattern or structure

### Workflow
1. Create a model instance using `Model::factory()->make()` (no DB needed)
2. Call the relationship method and chain `->toSql()` to get the generated SQL
3. Assert the SQL contains expected JOIN patterns and table names
4. Assert the SQL contains correct foreign key references
5. For eager loading, assert the number of queries with the `DB::fake()` approach or by capturing the query log

### Validation Checklist
- [ ] Generated SQL is verified via `toSql()`
- [ ] JOIN types are correct (INNER JOIN for required hops)
- [ ] Table aliases and key references are correct
- [ ] Multi-hop chains use all expected JOINs
- [ ] Test passes in CI with no database connection needed

### Common Failures
- Not testing SQL — silent failures in relationship definition
- Wrong key references due to mis-scoped key arguments
- Extra or missing JOINs from incorrect chain structure

### Decision Points
- **toSql() or DB assertion?** — Use `toSql()` for structural verification; use query logging for integration-level eager loading tests

### Performance Considerations
- `toSql()` tests require no database — fast and isolated
- Asserting SQL structure catches errors at definition time rather than query time

### Security Considerations
- None — SQL assertions don't involve user data

### Related Rules
- [Fluent-Test-Chain-SQL](../fluent-through-relationships/05-rules.md)

### Related Skills
- Define a fluent through relationship with proper key scoping

### Success Criteria
- Relationship SQL is verified in tests
- No silent definition errors reach production
- CI pipeline validates fluent chain correctness
