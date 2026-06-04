# Skill: Encapsulate Query Logic with Global and Local Scopes

## Purpose

Use Eloquent global scopes (always-on filters for multi-tenancy, soft deletes) and local scopes (reusable chainable query fragments) to centralize query constraints and prevent scattered WHERE clauses across the codebase.

## When To Use

- Multi-tenant filtering that must apply to every query
- Soft delete filtering
- Reusable query fragments (active, recent, published)
- Parameterized filters with dynamic scope methods

## When NOT To Use

- One-off query conditions that don't repeat
- Simple filters that are clearer inline

## Prerequisites

- Understanding of global vs local scope semantics
- Knowledge of `withoutGlobalScope` for bypassing when needed

## Inputs

- Query constraint logic
- Scope type (global vs local vs dynamic)
- Parameters for dynamic scopes

## Workflow

1. For global scopes, register via `boot()` trait method or `addGlobalScope()`
2. For local scopes, define `scopeActive($query)` and call as `Model::active()->get()`
3. For dynamic scopes, define `scopeOfType($query, $type)` and call as `Model::ofType('admin')->get()`
4. Use `Model::withoutGlobalScope('scope_name')` to bypass when necessary

## Validation Checklist

- [ ] Global scopes don't accidentally leak data across tenants
- [ ] withoutGlobalScope usage is reviewed and justified
- [ ] Local scopes are named clearly (verb form: scopeActive, scopeRecent)
- [ ] Dynamic scopes accept parameters with clear names

## Common Failures

### Bypassing global scopes accidentally
Using `DB::table('posts')` instead of `Post::query()` bypasses the global scope. In multi-tenant apps, this leaks data.

### withoutGlobalScope in production code
Used as a shortcut instead of designing the query correctly. Should be reviewed carefully.

## Decision Points

### Global vs Local scope?
Global for always-on filters (tenancy, soft deletes). Local for reusable query fragments that are explicitly invoked.

### Scope vs query builder method?
Scopes centralize logic. Use scopes when the same filter appears in multiple places. Use direct methods for one-off queries.

## Performance Considerations

Global scopes add WHERE clauses to every query. Ensure indexed columns are used in global scope conditions. withoutGlobalScope bypass avoids the filter but may return unexpected data.

## Security Considerations

Global scopes are the primary mechanism for multi-tenant data isolation. Bypassing them can leak data across tenants. Always review withoutGlobalScope usage.

## Related Rules

- Use global scopes for mandatory tenant/soft-delete filters
- Use local scopes for reusable query fragments
- Review withoutGlobalScope usage in code review

## Related Skills

- Configure Eloquent Model Conventions for Table Mapping
- Query with Query Builder Methods
- Define Eloquent Relationship Types

## Success Criteria

- Global scopes properly isolate tenant data
- Local scopes are reused across the codebase
- withoutGlobalScope is used only in justified cases
- Scopes are clearly named and well-documented
