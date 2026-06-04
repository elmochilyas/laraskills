# Skill: Prevent SQL Injection with Parameter Binding and Eloquent

## Purpose
Eliminate SQL injection vectors by using Eloquent ORM, query builder parameter binding, and raw expression safeguards — never concatenating user input into SQL strings.

## When To Use
- Every database query in a Laravel application
- Code review for legacy applications with raw SQL patterns
- Any raw DB::statement, DB::select, or whereRaw usage

## When NOT To Use
- Read-only queries from trusted sources (still use best practices)

## Prerequisites
- Understanding of SQL injection attack vectors
- Laravel query builder and Eloquent basics

## Workflow
1. Use Eloquent for all model queries by default (parameter binding built-in)
2. Use query builder with array-based where clauses (uses PDO parameter binding)
3. For raw expressions (`whereRaw`, `DB::raw`, `DB::statement`): use parameter binding with `?` placeholders
4. Never concatenate user input into SQL strings: `->whereRaw("name = '$input'")` is forbidden
5. Use `orderByRaw('FIELD(id, ?)', [$ids])` with binding for raw ORDER BY
6. Validate and cast user input types before using in queries
7. Run Enlightn or Shield scan to detect raw SQL patterns

## Validation Checklist
- [ ] All Eloquent queries use parameter binding
- [ ] Query builder where clauses use array syntax or `?` bindings
- [ ] `whereRaw`, `orderByRaw`, `selectRaw` use parameter binding for user input
- [ ] No string concatenation in SQL anywhere in the codebase
- [ ] User input cast to expected types before query usage
