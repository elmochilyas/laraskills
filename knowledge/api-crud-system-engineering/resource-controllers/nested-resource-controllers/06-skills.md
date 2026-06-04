# Skill: Implement Nested Resource Controllers

## Purpose
Structure nested API resource routes and controllers (`users/{user}/posts`) using scoped bindings to authorize parent-child relationships, with shallow nesting and `only()` for non-CRUD restrictions.

## When To Use
- Dependent child resources that don't exist without parent
- Parent-child route hierarchies
- Authorization scoping by parent

## When NOT To Use
- Independent resources — use top-level resources
- Deep nesting (>2 levels) — use shallow routes
- Resources referenced by global ID — use top-level only

## Prerequisites
- Route model binding
- Resource controller conventions

## Inputs
- Parent-child relationship definitions
- Nested route specifications

## Workflow
1. Register nested routes with `Route::apiResource('users.posts', PostController::class)`
2. Use scoped bindings to authorize child belongs to parent: `Route::apiResource('users.posts', ...)->scoped(['post' => 'post'])`
3. Limit nesting to maximum 2 levels — beyond that, use top-level with include parameters
4. Use `shallow()` for 3-level nesting where justified — generates top-level routes for deepest
5. Receive scoped models in controller: `show(User $user, Post $post)` — resolved from route
6. Apply `only()`/`except()` for non-standard nested CRUD
7. Filter index results to parent scope: `$user->posts()->paginate()`
8. Ensure authorization — scoped binding fails naturally when child doesn't belong to parent
9. Use `Route::apiResource()` consistently for nested — not manual route registration
10. Document parent-child relationship in API documentation

## Validation Checklist
- [ ] Nested routes registered with `apiResource()` dotted syntax
- [ ] Scoped bindings used to authorize parent-child relationship
- [ ] Nesting depth ≤ 2 levels
- [ ] Shallow routes used for 3-level nesting where justified
- [ ] Controller methods receive scoped models when applicable
- [ ] Index queries filtered to parent scope
- [ ] Authorization enforced via scoped binding (child not found if wrong parent)
- [ ] `only()`/`except()` restricts non-standard nested CRUD
- [ ] API doc describes nested resource relationship
- [ ] Integration tests verify parent-child authorization

## Common Failures
- Deep nesting (3+ levels) — makes URLs and authorization complex
- No scoped binding — child `show` returns post even if wrong user (authorization gap)
- Index not filtered to parent — returns all children across all parents
- Manual route registration instead of `apiResource()` — inconsistent, verbose
- Nested routes for resources that are referenceable by ID globally — prefer top-level
- Missing soft-delete scope — child post shows even when parent user soft-deleted

## Decision Points
- Nested vs top-level with parent_id filter — nested for parent-dependent, top-level for referenceable by ID
- Scoped binding implicit vs custom — implicit for standard `{user}` → `Post belongsTo User`
- Depth threshold — 2 levels for most APIs, 3 only with strong justification and shallow top routes

## Performance Considerations
- Scoped bindings add one extra query per nesting level
- Index filtered to parent may not use optimal indexes — ensure `belongsTo` foreign key is indexed
- Deep nesting (3+) increases query load exponentially — avoid unless justified

## Security Considerations
- Scoped binding prevents child enumeration across parents — unauthorized parent returns 404
- Soft-deleted parent — child routes should 404 when parent is soft-deleted
- `shallow()` creates top-level routes — ensure authorization on those routes separately
- Index endpoint must scope to authenticated user's parent resources

## Related Rules
- Limit Nesting To Maximum 2 Levels
- Use Scoped Bindings For Parent-Child Authorization
- Use shallow() For Third-Level Nesting Justification Only
- Filter Index Results To Parent Scope
- Use apiResource Dotted Syntax For Nested Routes
- Document Parent-Child Relationship

## Related Skills
- Resource Controllers — for base controller patterns
- Route Model Binding Scoping — for scoped binding detail
- Authorization via Binding — for authorization patterns

## Success Criteria
- Nested routes resolve resources scoped to parent
- Direct access to child with wrong parent returns 404 via scoped binding
- Index endpoints filter correctly to parent scope
- Nesting depth does not exceed 2 levels
- Nested and top-level routes coexist where parent is not required for identification
- Integration tests verify parent-child authorization for show, update, and destroy
