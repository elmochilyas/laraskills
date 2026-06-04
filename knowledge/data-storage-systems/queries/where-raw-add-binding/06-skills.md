# Skill: Use Raw Expressions with Safe Parameter Binding

## Purpose

Use `DB::raw`, `whereRaw`, `selectRaw`, `orderByRaw`, and `addBinding` to express custom SQL logic that the query builder cannot represent, while preventing SQL injection through proper parameter binding.

## When To Use

- Complex WHERE expressions (CASE statements, MATCH...AGAINST, JSON path queries)
- Database-specific SQL syntax not supported by query builder
- Constructed queries built programmatically with dynamic clauses

## When NOT To Use

- Standard conditions expressible with where() methods
- Queries where query builder provides equivalent functionality

## Prerequisites

- Understanding of SQL injection risks
- Familiarity with parameterized queries

## Inputs

- Raw SQL expression string
- Bound parameter values
- Clause type (where, join, having, order)

## Workflow

1. Try query builder methods first — only use raw when necessary
2. Write the SQL expression with `?` placeholders for values
3. Pass values as the second argument: `whereRaw('MATCH(title) AGAINST(?)', [$search])`
4. For constructed queries, use `addBinding($values, $type)` to attach parameters to specific clauses
5. Never concatenate user input into raw SQL strings

## Validation Checklist

- [ ] All user-influenced values use `?` placeholders, not string interpolation
- [ ] addBinding uses the correct clause type (where, join, having, order)
- [ ] Raw expressions cannot be replaced by query builder methods

## Common Failures

### String interpolation in raw SQL
`whereRaw("status = '$status'")` — SQL injection vulnerability. Use `whereRaw('status = ?', [$status])`.

### No addBinding for constructed queries
Building raw SQL with `implode()` and embedding values creates injection vectors.

## Decision Points

### Query Builder vs Raw SQL?
Use Query Builder for most queries — it's portable and secure. Raw SQL only for database-specific features.

### addBinding vs passing bindings array?
Use bindings array for simple whereRaw calls. Use addBinding when building queries programmatically across multiple clauses.

## Performance Considerations

Raw expressions may bypass query builder optimizations. Ensure raw SQL uses indexes by keeping columns unwrapped (sargable). Verify with EXPLAIN.

## Security Considerations

Raw expressions without bound parameters are vulnerable to SQL injection. Always bind user input. Never concatenate values into raw SQL strings.

## Related Rules

- Always bind parameters in raw expressions
- Never use string interpolation in raw SQL
- Use addBinding for programmatically constructed queries

## Related Skills

- Apply Where Clause Types for Sargable Queries
- Execute Joins with Query Builder
- Build Complex Queries with the Fluent Query Builder

## Success Criteria

- All user input in raw expressions uses parameter binding
- No string interpolation in raw SQL anywhere in codebase
- addBinding correctly associates parameters with their clause type
- Raw expressions are necessary (not replaceable by query builder)
