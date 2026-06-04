# Skill: Register Only Required Resource Routes with Partial Definitions
## Purpose
Use `Route::resource()->only()` or `->except()` to register a subset of RESTful actions on a resource controller — exposing only the routes the API actually needs.
## When To Use
When a resource doesn't need all seven RESTful actions; read-only resources (only index/show); create-only resources (only store); append-only resources (index + store).
## When NOT To Use
Full CRUD resources (use the default `Route::resource()`); when future actions are anticipated (add as needed, not preemptively); when using single-action controllers for each route.
## Prerequisites
Resource Controller Pattern; Laravel route definitions; understanding of RESTful action mapping.
## Inputs
Resource name; controller class; list of required actions (index, show, store, update, destroy).
## Workflow
1. Determine which actions the resource needs based on requirements
2. Use `Route::resource('photos', PhotoController::class)->only(['index', 'show'])` for read-only
3. Use `Route::resource('photos', PhotoController::class)->except(['destroy'])` for no-delete
4. Verify route list with `php artisan route:list`
5. Keep controllers free of placeholder methods for excluded routes
6. For non-standard actions, use explicit `Route::get()` / `Route::post()` outside the resource definition
## Validation Checklist
- [ ] `only()` or `except()` is used when less than 7 actions are needed
- [ ] Excluded actions are not implemented in the controller (no dead methods)
- [ ] `php artisan route:list` shows only the intended routes
- [ ] Non-standard actions use explicit route definitions outside the resource group
- [ ] Route naming is consistent with Laravel conventions for registered actions
- [ ] API documentation matches the registered routes (not the full RESTful set)
## Common Failures
- Using full `Route::resource()` then leaving controller methods empty — confusion and dead code
- Over-declaring actions that won't be implemented — generates route names that don't work
- Using `except(['create', 'edit'])` for API but still including `create`/`edit` methods — unnecessary
- Not verifying with `route:list` — missing routes discovered late
## Decision Points
- `only()` vs `except()` — `only()` is safer (explicit opt-in)
- Resource route with partial actions vs individual route definitions
- Partial resource controller vs single-action controllers per route
## Performance/Security Considerations
Fewer routes = smaller route cache = slightly faster route matching. Security: unregistered routes cannot be accessed — reduces attack surface.
## Related Rules/Skills
Resource Controller Pattern; Controller Code Limits; Nested Resources Shallow Nesting; API Route Design.
## Success Criteria
Only required RESTful actions are registered; no dead controller methods; route list matches requirements; API documentation matches registered routes.
