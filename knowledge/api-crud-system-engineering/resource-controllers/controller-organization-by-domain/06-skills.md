# Skill: Organize Controllers by Domain or Resource
## Purpose
Structure controller classes to represent a single domain concept or resource — not a database table or HTTP method group — keeping each controller focused on one bounded context.
## When To Use
New Laravel projects; refactoring an existing "god controller" (`PostController` with 20 methods); domain-driven design projects.
## When NOT To Use
Simple CRUD for a single resource (single controller is fine); prototype/MVP where speed > structure.
## Prerequisites
Resource Controller Pattern; Domain-Driven Design (tactical); Laravel routing.
## Inputs
Domain model boundaries (bounded contexts); list of resource endpoints; team conventions.
## Workflow
1. Identify bounded contexts in the application (e.g., Billing, Content, Users)
2. Create one controller per resource or domain concept within a context
3. Use folder structure matching the domain: `Controllers/Billing/InvoiceController`
4. Keep methods to standard resource actions (index, show, store, update, destroy)
5. For non-CRUD actions, create a separate controller (e.g., `PublishPostController`)
6. Use namespace prefixes for routing: `Route::prefix('billing')->group(...)`
7. Do not reuse a controller across different domains
8. Keep controller file count manageable — extract actions when a controller grows beyond 7 methods
## Validation Checklist
- [ ] Each controller maps to one resource or domain concept
- [ ] Controller namespace matches domain folder (e.g., `App\Http\Controllers\Billing`)
- [ ] Standard resource actions are in a single resource controller
- [ ] Non-CRUD actions have dedicated controllers or action classes
- [ ] No controller spans multiple domains
- [ ] Routing groups reflect domain boundaries
- [ ] Controller file structure is consistent across the team
## Common Failures
- `AdminController` with 15 unrelated actions — violates single responsibility
- Reusing `PostController` for both blog posts and forum posts (different domains)
- Mixing web and API actions in the same controller
- Putting all controllers in one flat directory — hard to navigate
- Non-CRUD actions shoehorned into resource controllers (`post.restore`, `post.duplicate`)
## Decision Points
- Resource controller + separate actions vs single controller with all actions
- Domain-based directory structure vs flat directory + descriptive names
- Single controller per resource vs split by action type (queries vs commands)
## Performance/Security Considerations
No performance impact. Security: domain boundaries make authZ easier to audit per controller.
## Related Rules/Skills
Resource Controller Pattern; Controller Code Limits; Namespace Conventions; Routing Structure.
## Success Criteria
Controllers are organized by domain; each controller handles one resource or concept; non-CRUD actions have dedicated controllers; directory structure reflects domain boundaries.
