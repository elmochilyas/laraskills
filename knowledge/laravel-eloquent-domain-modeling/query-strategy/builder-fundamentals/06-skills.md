# Skill: Compose Fluent Eloquent Query Chains with Correct Termination

## Purpose
Build correct Eloquent and Query Builder chains using constraint methods (WHERE, JOIN, ORDER BY) and terminal methods (get, first, paginate) with proper method chaining, binding management, and execution semantics.

## When To Use
- Every Eloquent or Query Builder query for data retrieval
- Debugging complex query chains during development
- Building filter/search APIs with conditional constraints
- Constructing queries that compose multiple constraints

## When NOT To Use
- Trivial fetch-by-ID operations (use `find()`)
- Raw SQL operations requiring database-specific features not in the builder

## Prerequisites
- Basic SQL knowledge (SELECT, WHERE, JOIN, ORDER BY, LIMIT)
- PHP method chaining concepts

## Inputs
- Model class or DB facade
- WHERE constraints, JOINs, ORDER BY clauses
- Terminal method for execution

## Workflow
1. Start the chain with `Model::query()` or `Model::where(...)` for Eloquent, or `DB::table(...)` for Query Builder
2. Add constraint methods (WHERE, JOIN, ORDER BY, LIMIT, OFFSET)
3. Always include a terminal method: `get()`, `first()`, `paginate()`, `count()`, `cursor()`, `chunk()`
4. Use `where(fn $q => ...)` closures for nested OR/AND logic instead of raw boolean expressions
5. Use `toSql()` or `dd()` during development to verify generated SQL
6. Use `select(['id', 'name'])` to limit hydration overhead
7. Never reuse a builder instance after a terminal method has been called on it

## Validation Checklist
- [ ] Builder chain produces correct SQL (verified via `toSql()`)
- [ ] All terminal methods return expected types
- [ ] No N+1 queries in loops (verified via `DB::listen()` or Telescope)
- [ ] `whereRaw` and `DB::raw` calls use parameterized bindings
- [ ] `chunk()` or `cursor()` used for result sets > 1000 rows
- [ ] Builder instances not reused across separate queries
- [ ] Builder chain ends with a terminal method

## Common Failures
- Forgetting terminal methods — `User::where('active', true)` returns a Builder, not results
- Assuming builder immutability — stored builder includes previous constraints
- Wrong `where` signature — `where('age', 18)` is equality; `where('age', '>', 18)` needs three arguments
- Binding count mismatches in `whereRaw` — use `?` placeholders, not string interpolation
- Calling `get()` on the builder after `toBase()` returns a Query Builder, not an Eloquent Builder

## Decision Points
- Eloquent Builder vs Query Builder: use Eloquent as default for model queries; use Query Builder for raw SQL features or maximum performance
- `where($col, $op, $val)` three-argument form: always use for non-equality comparisons

## Performance Considerations
- Builder instantiation is negligible — optimize at query-execution level
- Hydration overhead: 2-5µs per model, 2-4KB memory per model
- N+1 is the dominant performance problem — always eager-load relationships in loops
- `cursor()` uses unbuffered queries; connection stays busy until iteration completes

## Security Considerations
- Always use parameterized `where` clauses, never concatenate user input into SQL strings
- `whereRaw` with `?` placeholders is safe; avoid `whereRaw("col = '$input'")`
- `DB::raw()` bypasses binding — ensure raw expressions do not contain user input
- Validate and whitelist column names passed to `orderBy($userInput)`

## Related Rules
- Always Terminate Builder Chains with a Terminal Method (query-strategy/builder-fundamentals)
- Never Reuse Builder Instances Across Separate Queries (query-strategy/builder-fundamentals)
- Use Parameterized Bindings Instead of String Interpolation (query-strategy/builder-fundamentals)
- Use `where` Closure Syntax for Nested OR/AND Logic (query-strategy/builder-fundamentals)
- Use chunkById or cursor Instead of get for Large Result Sets (query-strategy/builder-fundamentals)
- Prefer Eloquent Builder API Over DB::raw() for Standard SQL Clauses (query-strategy/builder-fundamentals)
- Never Reuse Builder After Terminal Method Execution (query-strategy/builder-fundamentals)
- Extract Builder Chains Longer Than 20 Methods to Scopes or Query Objects (query-strategy/builder-fundamentals)

## Related Skills
- Compose Conditional Query Chains with when()
- Implement Local Scopes for Reusable Constraints
- Implement Custom Builder Pattern for Rich Query APIs

## Success Criteria
- Builder chain produces correct, expected SQL
- All queries have terminal methods — no silent Builder returns
- Parameterized bindings used for all user-influenced values
- Builder instances are not reused across separate queries
