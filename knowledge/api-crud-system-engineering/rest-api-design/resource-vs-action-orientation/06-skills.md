# Skill: Design Resource vs Action Endpoints

## Purpose
Distinguish between CRUD resources (nouns, standard methods) and action endpoints (verbs, POST only) — use `Route::apiResource()` for resources, explicit POST routes for actions.

## When To Use
- API endpoint design decisions
- Route organization
- API architecture planning

## When NOT To Use
- Simple CRUD-only APIs

## Prerequisites
- HTTP method semantics
- Resource naming conventions

## Workflow
1. Use resources for standard CRUD: users, posts, comments — mapped to `apiResource()`
2. Use actions for non-CRUD operations: cancel, export, approve, resend — mapped to POST routes
3. Resource endpoints use standard HTTP methods: GET, POST, PUT/PATCH, DELETE
4. Action endpoints always use POST: `POST /orders/{order}/cancel`
5. Never overload resource endpoints for actions: `POST /orders/{order}` for create, not update
6. Place action after resource: `/resource/{id}/action`
7. Use separate controller for actions: `OrderCancelController` (invokable)
8. Keep action in same URL namespace as related resource
9. Document whether endpoint is resource or action
10. Don't mix resource and action in same controller

## Validation Checklist
- [ ] Resources use `apiResource()` with standard methods
- [ ] Actions use POST routes with descriptive names
- [ ] Actions placed at `/resource/{id}/action`
- [ ] Separate controllers for actions
- [ ] Actions documented as non-CRUD

## Related Skills
- HTTP Method Semantics
- Resource Naming Conventions
- Single-Action Controllers
