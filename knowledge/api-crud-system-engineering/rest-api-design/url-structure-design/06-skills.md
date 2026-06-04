# Skill: Design URL Structure

## Purpose
Design API URL hierarchy with consistent resource paths, query parameters for filtering/sorting, kebab-case, plural nouns, limited nesting (2-3 levels), and no file extensions.

## When To Use
- API route design
- URL scheme specification
- API style guide creation

## When NOT To Use
- Non-API routes (web, admin, CLI)

## Prerequisites
- Resource naming conventions
- REST design principles

## Workflow
1. Base URL: `/api/` for all API routes
2. Collection paths: `/api/users` (plural, kebab-case)
3. Singleton paths: `/api/profile` (singular for single-instance resources)
4. Nested paths: `/api/users/{user}/posts` — max 2-3 levels
5. Action paths: `/api/orders/{order}/cancel` — POST for actions
6. Query parameters: `?filter[status]=active&sort=-created_at&include=user`
7. No file extensions: `/api/users` not `/api/users.json`
8. Version prefix: `/api/v1/` when using URL path versioning
9. Consistent parameter names: `{user}`, `{post}` matching model names
10. Use `Route::apiResource()` for standard CRUD routing

## Validation Checklist
- [ ] Base URL is `/api/`
- [ ] Plural kebab-case for collections
- [ ] Nesting ≤ 3 levels
- [ ] Actions via POST with action name in path
- [ ] Query parameters for filter/sort/include
- [ ] No file extensions
- [ ] Consistent parameter naming
- [ ] `apiResource()` for CRUD routes

## Related Skills
- Resource Naming Conventions
- HTTP Method Semantics
- Query Parameter Filtering
