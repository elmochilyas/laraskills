# Skill: Apply the Resource Controller Pattern for Standard CRUD Actions
## Purpose
Map the seven RESTful actions (index, show, store, update, destroy) to controller methods using Laravel's resource controller convention, providing a predictable structure for CRUD endpoints.
## When To Use
Any resource with standard CRUD operations (posts, users, comments, products); new Laravel API projects; teams that value convention over configuration.
## When NOT To Use
Non-CRUD operations (use dedicated controllers or actions); read-only resources (use `only` with fewer methods); simple pass-through proxies (use single-action controllers).
## Prerequisites
Laravel routing (`Route::resource()`); HTTP method/status code conventions; Controller Organization by Domain.
## Inputs
Resource name (e.g., `posts`); Eloquent model; controller class.
## Workflow
1. Define the controller with the seven standard methods: index, create, store, show, edit, update, destroy
2. Register routes with `Route::resource('posts', PostController::class)`
3. For API routes, exclude `create` and `edit` using `->only(['index', 'store', 'show', 'update', 'destroy'])`
4. Map each method to the correct HTTP method + URI + status code
5. Keep methods thin — delegate to services, actions, Form Requests, and API Resources
6. Use route model binding for `show`, `update`, `destroy`
7. Follow the convention strictly — don't overload a resource method with non-standard behavior
## Validation Checklist
- [ ] Controller methods follow the standard resource signature
- [ ] `create` and `edit` are excluded for API routes
- [ ] Route model binding is used for `{post}` parameters
- [ ] Each method returns the correct HTTP status code
- [ ] Methods are thin (<15 lines) — delegation is used
- [ ] No non-standard logic pollutes the resource methods
- [ ] Non-standard actions have dedicated routes and controllers
- [ ] `php artisan route:list` confirms correct URI → method mapping
## Common Failures
- `store` returns 200 instead of 201 — clients can't distinguish creation
- `destroy` returns JSON body instead of 204 — violates convention
- Using `post.restore` inside the resource controller — needs separate controller
- Overloading `update` to handle both partial and full updates inconsistently
- Route model binding not used — manual `Model::findOrFail()` in every method
## Decision Points
- Full resource controller vs single-action controllers per route
- API resource controller (`apiResource`) vs web resource controller
- Overloading resource methods vs creating dedicated endpoints for special cases
## Performance/Security Considerations
Route model binding adds a query per resolved model — use `withCount` or eager loading where needed. Security: route model binding scopes to the model type — prevents type confusion.
## Related Rules/Skills
Controller Organization by Domain; Partial Resource Routes; Controller Response Selection; Controller Code Limits.
## Success Criteria
All CRUD endpoints follow the resource pattern; methods are thin and delegate to the right layer; HTTP methods and status codes are correct; create/edit are excluded for APIs.
