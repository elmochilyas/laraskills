# Skill: Implement Singleton Resource Controllers for One-Per-Parent Resources
## Purpose
Use `Route::singleton()` to define routes for resources that have at most one instance per parent (profile, avatar, settings), simplifying URLs and eliminating the need for ID parameters.
## When To Use
User profile/settings (one per user); avatar/image (one per user); configuration (one per tenant); any resource where the parent and child are one-to-one.
## When NOT To Use
One-to-many resources (comments, posts); resources with independent identity (standalone products); when the resource may become one-to-many in the future.
## Prerequisites
Resource Controller Pattern; Laravel route definitions; route model binding.
## Inputs
Resource name (singular, e.g., `profile`); parent route binding; controller class.
## Workflow
1. Define a singleton route: `Route::singleton('profile', ProfileController::class)`
2. For nested singletons: `Route::singleton('users.profile', ProfileController::class)`
3. The controller uses only `show`, `update`, `destroy` (no index, no create/store)
4. The `show` method returns the singleton resource (creates it if it doesn't exist, or returns 404)
5. The `update` method replaces the entire resource (PUT) or merges (PATCH)
6. The `destroy` method deletes or resets the singleton to default
7. No `{id}` parameter appears in the URL — the singleton is identified by the parent
## Validation Checklist
- [ ] Route uses `singleton()` not `resource()` — no ID parameter in URL
- [ ] Controller has only `show`, `update`, `destroy` methods
- [ ] `show` returns 200 with the resource (or 404 if convention says not found)
- [ ] `update` returns 200 or 204 after modification
- [ ] `destroy` returns 204 after deletion
- [ ] Singleton is scoped to parent (user profile is tied to the authenticated user)
- [ ] Creatable singleton (`->creatable()`) is used when show should auto-create
- [ ] API documentation reflects the lack of ID parameter
## Common Failures
- Using `resource()` for a one-to-one relationship — misleading URL with `{id}` parameter
- Forgetting `->creatable()` when auto-creation on first access is desired
- Singleton controller has `index` or `store` methods — doesn't match the pattern
- Singleton route is not scoped to the correct parent — user A can access user B's profile
## Decision Points
- `Route::singleton()` vs explicit `Route::get()` / `Route::put()` definitions
- Creatable singleton (auto-create on show) vs manual creation via separate endpoint
- Singleton API resource response vs top-level resource response
## Performance/Security Considerations
Singleton routes avoid ID resolution overhead (no route parameter). Security: parent scoping is critical — always nest under the authenticated user or validated parent.
## Related Rules/Skills
Resource Controller Pattern; Partial Resource Routes; Nested Resources Shallow Nesting; Controller Response Selection.
## Success Criteria
Singleton routes have no ID parameters; controller has only show/update/destroy; parent scoping is enforced; `creatable` is used when appropriate.
