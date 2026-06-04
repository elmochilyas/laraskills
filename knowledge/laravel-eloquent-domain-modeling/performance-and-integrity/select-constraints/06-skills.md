# Skill: Implement Select Constraints for Efficient Data Retrieval

## Purpose
Limit which columns and related records are retrieved from the database using `select()`, `addSelect()`, and constrained eager loading to reduce I/O, memory, and network transfer.

## When To Use
- List/index views — only columns needed for display instead of all columns
- API endpoints with large models — select only the fields the API resource exposes
- Models with large columns (BLOBs, TEXT, JSON) — avoid loading unless needed
- Dashboard/aggregate queries — select only the columns needed for computation

## When NOT To Use
- Write operations (save, update) — partial models overwrite unloaded columns with null
- Complex model comparison — partial models may lack columns needed for equality checks
- Development/administrative queries — `SELECT *` is acceptable for debugging

## Prerequisites
- Eloquent query builder basics
- Model serialization concepts

## Inputs
- Query pattern (list vs detail)
- Required column list
- Foreign key columns for relation matching

## Workflow
1. Identify whether the query is list/index (minimal columns) or detail/show (all needed columns)
2. Add `->select('col1', 'col2', ...)` with only the needed columns
3. For constrained eager loading: include the foreign key column in the select list
4. Use `addSelect()` in query scopes to extend rather than override the column list
5. For sensitive columns: use `select()` to exclude them entirely (not just `$hidden`)
6. Never save partial models — always load full model (or at minimum all non-nullable columns) before writes
7. Enable `preventAccessingMissingAttributes()` in development to catch partial model access bugs

## Validation Checklist
- [ ] List/index queries use explicit `select()` with minimal columns
- [ ] Constrained eager loading includes the foreign key column
- [ ] Partial models loaded with `select()` are never saved to the database
- [ ] Sensitive columns excluded via `select()` (not just `$hidden`)
- [ ] `preventAccessingMissingAttributes()` enabled in development
- [ ] Separate select lists used for list vs detail views

## Common Failures
- Saving partial models — unloaded columns set to null/default
- Missing FK in constrained select — relations fail to match
- Using `$hidden` instead of `select()` — still loads data into memory
- Not disambiguating joined selects — ambiguous column error

## Decision Points
- `select()` vs `$hidden`: use `select()` to avoid loading columns entirely (I/O reduction); use `$hidden` only for serialization control
- List vs detail selects: list views get minimal columns; detail views get all needed columns

## Performance Considerations
- Selecting 5 columns instead of 20 reduces row data transfer by ~75%
- Column reduction helps InnoDB read fewer pages from disk
- Constrained eager loading reduces memory significantly
- `$hidden` does not reduce I/O — data is still loaded

## Security Considerations
- Never select sensitive columns (SSN, password reset tokens) in non-privileged queries
- Use `select()` to avoid loading sensitive data entirely, not just `$hidden` to hide it

## Related Rules
- Never Save Partial Models (performance-and-integrity/select-constraints)
- Always Include the Foreign Key in Constrained Eager Loading (performance-and-integrity/select-constraints)
- Use $hidden for Serialization, select() for I/O Reduction (performance-and-integrity/select-constraints)
- Use Different Select Sets for List vs. Detail Views (performance-and-integrity/select-constraints)
- Never Select Sensitive Columns in Non-Privileged Queries (performance-and-integrity/select-constraints)

## Related Skills
- Prevent N+1 with Eager Loading Strategies
- Design Index-Aware Queries
- Implement Read-Only Export with toBase

## Success Criteria
- List endpoints use minimal column selects
- Foreign keys included in constrained eager loads
- No partial models are persisted to the database
- Sensitive columns excluded from non-privileged queries
- Memory and I/O reduction measured and confirmed
