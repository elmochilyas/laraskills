# Skill: Keep Nested Resource Routes Shallow (Max One Level Deep)
## Purpose
Design nested resource routes to a maximum of one level of nesting (e.g., `posts/{post}/comments`) to keep URLs readable, controllers simple, and avoid deeply nested route resolution.
## When To Use
When resources logically belong to a parent (comments belong to posts); when building hierarchical API endpoints; during route design phase.
## When NOT To Use
Top-level resources with no parent; resources that can be accessed both nested and top-level (use top-level as default, nested as filter); deeply nested hierarchies (use query parameters instead).
## Prerequisites
Laravel route model binding; Resource Controller Pattern; route naming conventions.
## Inputs
Parent resource (e.g., Post); child resource (e.g., Comment); route definition file.
## Workflow
1. Use `Route::resource('posts.comments', CommentController::class)` — only one level
2. Never nest deeper than `parent/{parent}/child/{child}`
3. For third-level resources, use top-level routes with parent ID as query param
4. Use `scoped()` route model binding to scope child to parent
5. Use `shallow()` to generate shallow routes where child ID alone suffices for show/update/destroy
6. Keep the nested controller focused on the child resource scoped to parent
7. Validate parent existence when creating nested resources
## Validation Checklist
- [ ] Max nesting is one level (`parent/{parent}/child`)
- [ ] No routes with three or more nested levels
- [ ] `shallow()` is used when child can be identified independently
- [ ] Child controller uses scoped binding to ensure child belongs to parent
- [ ] Third-level resources are exposed as top-level with parent filter parameters
- [ ] URLs are readable and RESTful
- [ ] Route names follow Laravel conventions for nested resources
## Common Failures
- Three levels of nesting (`a/{a}/b/{b}/c/{c}`) — URLs are long and controllers are complex
- Not using `shallow()` — show/update/destroy URLs include unnecessary parent chain
- Not scoping child to parent — child from different parent is accessible
- Using query string for parent scoping when nested routes are more appropriate
- Over-nesting when the child has meaning outside the parent context
## Decision Points
- Shallow routes vs fully nested routes for show/update/destroy
- Top-level + parent filter parameter vs nested route
- Route resource (convention) vs manual route definitions (explicit control)
## Performance/Security Considerations
Shallow routes reduce URL parsing overhead (negligible). Security: scoped binding ensures child belongs to parent — prevents ID tampering across parents.
## Related Rules/Skills
Resource Controller Pattern; Route Model Binding; Partial Resource Routes; Controller Organization by Domain.
## Success Criteria
All nested routes are at most one level deep; `shallow()` is applied where appropriate; scoped binding prevents cross-parent access; third-level resources use top-level routes with parameters.
