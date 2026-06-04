# Skill: Choose Between Eloquent and Query Builder Using a Decision Framework

## Purpose
Make informed, data-driven decisions about when to use Eloquent ORM, `toBase()`, or Query Builder based on the operation's requirements for model features, performance, and security.

## When To Use
- Choosing the query approach for any new database operation
- Auditing existing queries for optimization opportunities
- Training team members on Eloquent vs Query Builder tradeoffs

## When NOT To Use
- Trivial queries where the choice is obvious (< 10 rows, simple CRUD)
- Operations driven by existing codebase conventions

## Prerequisites
- Builder Fundamentals
- Understanding of model hydration, scopes, and events
- Profiling tools (Debugbar, Telescope, Clockwork)

## Inputs
- Operation type (read vs write)
- Expected row count
- Model features needed (events, casts, relationships, scopes)
- Performance requirements

## Workflow
1. Default to Eloquent for all new queries — optimize only when profiling proves it matters
2. For reads on large datasets (50k+ rows), apply `toBase()` as the first optimization step
3. Only drop to `DB::table()` if `toBase()` is insufficient (CTEs, window functions, full-text)
4. Use Eloquent for all writes (model events, validation, relationships)
5. Never use `DB::table()` on models with security-critical global scopes (tenant isolation, soft deletes)
6. Abstract critical query paths behind query objects so strategy changes don't require changing callers
7. Document when and why `DB::table()` is chosen over Eloquent with profiling evidence

## Validation Checklist
- [ ] Decision between Eloquent and Query Builder justified by profiling data
- [ ] No premature optimization — Eloquent is the default for new queries
- [ ] `toBase()` considered as first optimization step before switching to `DB::table()`
- [ ] All writes use Eloquent when model events are required
- [ ] Query Builder queries on soft-deletable tables explicitly handle `deleted_at`
- [ ] N+1 prevention active (`preventLazyLoading()`) in development
- [ ] Performance rationale documented in code comments

## Common Failures
- Using Eloquent for mass updates — `User::where(...)->get()->each->update([...])` hydrates every row
- Using Query Builder when events are needed — `created`/`creating` events never fire
- Over-optimizing with QB for trivial queries — premature optimization adds complexity
- Missing relationship constraint methods — Query Builder lacks `whereHas`, `with`, `has`
- Assuming `toBase()` preserves eager loads — `with()` is NOT preserved

## Decision Points
- Eloquent vs `toBase()`: use Eloquent when model features needed; use `toBase()` when building constraints via Eloquent API but don't need hydration
- `toBase()` vs `DB::table()`: use `toBase()` as intermediate step — preserves Eloquent builder features without hydration overhead; use `DB::table()` only when database-specific features are needed

## Performance Considerations
- Hydration: ~2-5µs per model; `toBase()`: ~0.5µs per row — 5-10x difference
- Memory: ~2-4KB per model vs ~0.5KB per stdClass — 4-10x difference
- N+1 is the dominant problem — fix before optimizing hydration
- Hydration savings on < 100 rows are negligible

## Security Considerations
- Query Builder bypasses all Eloquent security scopes (soft deletes, multi-tenant, access control)
- Always use Eloquent for operations depending on scope-based security boundaries
- Model events (cache invalidation, audit logs) are skipped with Query Builder
- `stdClass` objects don't have the same serialization behavior as models

## Related Rules
- Default to Eloquent for All New Queries; Optimize Only When Profiling Proves It Matters (query-strategy/decision-framework)
- Use toBase() as the First Optimization Step Before Switching to DB::table() (query-strategy/decision-framework)
- Use Eloquent for All Writes; Use Query Builder or toBase() for Read-Heavy Paths (query-strategy/decision-framework)
- Never Use Query Builder on Models with Security-Critical Global Scopes (query-strategy/decision-framework)
- Audit N+1 with Model::preventLazyLoading() in Development (query-strategy/decision-framework)
- Abstract Data Access Behind Interfaces or Query Objects (query-strategy/decision-framework)
- Document When and Why Query Builder Is Chosen Over Eloquent (query-strategy/decision-framework)

## Related Skills
- Implement toBase Pattern for Hydration Bypass
- Implement Hybrid Strategies for Eloquent-QB Mixing
- Evaluate Performance Tradeoffs with Profiling

## Success Criteria
- Eloquent is the default for all new queries
- `toBase()` applied before `DB::table()` in optimization path
- All writes use Eloquent when events are required
- Query Builder usage documented with profiling evidence
- Security-critical scopes never bypassed accidentally
