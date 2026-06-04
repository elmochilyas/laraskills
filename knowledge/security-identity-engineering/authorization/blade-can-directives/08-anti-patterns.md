# Anti-Patterns: Blade Authorization Directives

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Blade Authorization Directives |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-BC-01 | Blade-Only Authorization | Critical | High | Medium |
| AP-BC-02 | Role Names in @can | Medium | High | Low |
| AP-BC-03 | Missing Model Argument | High | Medium | Low |
| AP-BC-04 | Complex PHP Logic in Blade | Medium | Medium | Medium |
| AP-BC-05 | Nested @can Without @canany | Low | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **Using @can on Routes Without Server-Side Checks**: Hiding UI elements while the underlying route is unprotected
- **@can Without @else Fallback**: Not providing fallback content for unauthorized users (blank UI)
- **Template-Only Authorization**: All authorization logic in Blade, no controller/middleware enforcement

---

## 1. Blade-Only Authorization

### Category
Security · Critical

### Description
Using Blade `@can` directives as the sole authorization mechanism without server-side `$this->authorize()` or `Gate::authorize()` in the controller, creating an easily bypassed authorization gate.

### Why It Happens
`@can` appears to control access — it hides buttons, links, and UI elements from unauthorized users. Developers mistake UI hiding for security enforcement. Since the hidden UI element makes the action seem inaccessible, the server-side check feels redundant. The oversight persists because the typical user flow never reveals the gap.

### Warning Signs
- Controller methods have no `$this->authorize()` or `Gate::authorize()` call
- All authorization is done via `@can` in Blade templates
- A user who knows the URL can access protected functionality directly
- Routes are registered but controllers have no authorization checks
- No `can:` middleware on routes

### Why Harmful
Blade directives control only what is displayed. They do not prevent a user from navigating directly to a URL, sending a cURL request, or submitting a form. Any route hidden by `@can` is still accessible to anyone who knows the URL pattern. This is a full authorization bypass vulnerability.

### Real-World Consequences
- User cannot see "Edit" button but navigates to `/posts/1/edit` directly — edits the post
- Hidden admin panel link — user visits `/admin/dashboard` — has full admin access
- API endpoint hidden from UI — attacker discovers endpoint via directory scanning — accesses it
- Security penetration test: "Authorization bypass via direct URL access"
- Production data modified by unauthorized users who discovered hidden routes

### Preferred Alternative
Always pair `@can` in Blade with `$this->authorize()` or `Gate::authorize()` in the controller.

### Refactoring Strategy
1. For every `@can` that controls access to an actionable UI element, find the corresponding route
2. Add `$this->authorize('ability')` or `Gate::authorize('ability')` to the controller method
3. For routes without a controller, add `can:` middleware
4. Remove any Blade-only authorization that cannot be enforced server-side
5. Add authorization tests that verify both Blade rendering and server-side enforcement

### Detection Checklist
- [ ] Are there `@can` directives without corresponding `$this->authorize()` calls?
- [ ] Can a route hidden by `@can` be accessed directly via URL?
- [ ] Do all controller methods with `@can`-protected views have authorization checks?
- [ ] Are there routes with no middleware and no controller authorization?
- [ ] Is there a route that returns a view without any authorization check?

### Related Rules/Skills/Trees
- Always Pair @can With Server-Side Authorization (05-rules.md)
- Use Blade Authorization Directives for Conditional UI Rendering (06-skills.md)
- Server-Side Enforcement vs Blade-Only decision tree (07-decision-trees.md)

---

## 2. Role Names in @can

### Category
Maintainability

### Description
Using role names like `admin`, `editor`, or `user` in `@can` directives instead of permission names like `edit-articles` or `view-dashboard`.

### Why It Happens
The most natural authorization concept is roles — "admin can do everything, editor can edit content." Developers use `@can('admin')` or `@role('editor')` because it matches the mental model of user hierarchies. Permission-based checks require defining a separate permission system, which feels like extra work.

### Warning Signs
- `@can('admin')`, `@can('editor')`, or similar role name strings
- `@role('editor')` or `@hasRole('admin')` used in templates
- Changing role permissions requires updating Blade templates
- No permission names exist — only role-based checks
- UI element visibility does not update when role permissions change

### Why Harmful
Role names are fragile. When `editor` is renamed to `content-manager`, every `@can('editor')` in templates must be updated. More importantly, role-based checks are binary — a user is either an admin or not. Permission-based checks allow granular control: a user with `edit-articles` permission can edit articles even if they aren't an `editor`.

### Real-World Consequences
- Role renamed from `editor` to `content-manager` — all `@can('editor')` directives show incorrect state
- User needs article editing ability but not the `editor` role — impossible with role-based checks
- Adding a new role requires auditing every `@can` directive in every template
- UI shows wrong state because role name in directive doesn't match renamed role

### Preferred Alternative
Use permission names in `@can` directives. Map roles to permissions in the authorization layer.

### Refactoring Strategy
1. Audit all `@can` and `@role` directives in Blade templates
2. Replace role-name directives with permission-name directives
3. Ensure permission names are stable and meaningful
4. Verify that role-to-permission mapping is correct
5. Remove any `@role` directives in favor of `@can`

### Detection Checklist
- [ ] Are role names (`admin`, `editor`) used in `@can` directives?
- [ ] Are `@role` or `@hasRole` directives present in templates?
- [ ] Are permission names (`edit-articles`) used instead of role names?
- [ ] Would renaming a role break Blade directives?
- [ ] Can a user have a specific permission without having the associated role?

### Related Rules/Skills/Trees
- Use Permission Names, Not Role Names in @can (05-rules.md)
- Use Blade Authorization Directives for Conditional UI Rendering (06-skills.md)

---

## 3. Missing Model Argument

### Category
Framework Usage · Reliability

### Description
Using `@can('update')` without passing the model instance, causing the check to skip model-specific Policy methods and only evaluate gate-level permissions.

### Why It Happens
The model argument is optional for gate-level checks (`@can('view-dashboard')`). Developers naturally omit it for model-related checks too, especially when the model is not immediately available in the view context. The directive still "works" — it just evaluates a different, broader check.

### Warning Signs
- `@can('update')` used on an index or list page showing multiple items
- Policy exists with an `update` method but it's never called from Blade
- Model-specific ownership checks are never evaluated in Blade
- Hidden model name in the controller is not passed to the view

### Why Harmful
Without the model, `@can('update')` calls `Gate::check('update')` with no model context. This only checks if there's a gate named `update` or a generic policy check. The `PostPolicy@update` method that checks ownership (`$user->id === $post->user_id`) is never invoked. The directive may show the edit button to a user who should not be able to edit that specific post.

### Real-World Consequences
- User sees "Edit" button on another user's post because `@can('update')` passes without model context
- Administrator sees edit buttons for all posts in a list, but gets 403 when clicking (confusing UX)
- User unauthorized for model-specific action sees UI controls they cannot use
- Conflicting behavior: Blade shows `@can` passes but controller `$this->authorize()` fails

### Preferred Alternative
Always include the model instance as the second argument to `@can` for model-specific authorization.

### Refactoring Strategy
1. Identify all `@can` directives missing the model argument for model-specific checks
2. Ensure the model is available in the view context
3. Pass the model: `@can('update', $post)` instead of `@can('update')`
4. For lists, pass the model within the loop: `@can('update', $post)`
5. Verify that Policy methods are being called from Blade directives

### Detection Checklist
- [ ] Is the model instance passed to model-specific `@can` directives?
- [ ] Are Policy methods being called from Blade (check with `Gate::inspect()`)?
- [ ] Do Blade checks match controller authorization behavior?
- [ ] Are model-specific ownership checks reflected in Blade visibility?
- [ ] Are list items individually authorized with their model?

### Related Rules/Skills/Trees
- Pass Model Arguments for Model-Specific Checks (05-rules.md)
- Use Blade Authorization Directives for Conditional UI Rendering (06-skills.md)

---

## 4. Complex PHP Logic in Blade

### Category
Code Organization · Maintainability

### Description
Embedding complex PHP authorization conditionals in Blade templates instead of using `@can`, `@canany`, or extracted components.

### Why It Happens
When `@can` doesn't quite match the required condition, the path of least resistance is adding inline PHP logic: `@if(Auth::user()->can('x') && $post->status === 'published')`. This starts small but accumulates into unreadable template logic.

### Warning Signs
- `@if(Auth::user()->can(...))` used instead of `@can(...)`
- Multiple conditions mixed with authorization checks in Blade
- PHP logical operators (`&&`, `||`) combined with `Auth::user()->can()` in templates
- Template contains business logic conditions (status checks, date comparisons) alongside authorization
- Authorization logic in Blade is not covered by tests

### Why Harmful
Complex PHP logic in Blade templates is untestable, unreadable, and mixes presentation with business logic. The authorization conditions are scattered across templates instead of centralized in Policy classes. Changes to authorization logic require hunting through template files. The conditions cannot be unit tested.

### Real-World Consequences
- Authorization condition duplicated across 10 templates — updating it requires finding all copies
- Bug in Blade authorization logic goes undetected because templates are not tested
- New developer cannot find where authorization decisions are made
- Code review: "Why is this authorization logic in the Blade template?"
- Refactoring authorization breaks template conditions silently

### Preferred Alternative
Use `@canany` for multiple permission checks. Extract complex conditions to Blade components or computed properties.

### Refactoring Strategy
1. Replace `@if(Auth::user()->can('x'))` with `@can('x')` and `@canany(['x', 'y'])`
2. Extract business logic conditions (status checks, ownership) into the Policy method
3. For remaining complex conditions, create a Blade component that encapsulates the logic
4. Move any authorization-related PHP logic into the controller or Policy
5. Write tests for extracted authorization logic in components or services

### Detection Checklist
- [ ] Are there `Auth::user()->can()` calls in Blade templates?
- [ ] Is authorization logic mixed with business logic in templates?
- [ ] Are `@canany` directives used for multiple permission checks?
- [ ] Can authorization logic in templates be moved to Policy classes?
- [ ] Are Blade authorization conditions tested?

### Related Rules/Skills/Trees
- Avoid Complex Authorization Logic Inside Blade Directives (05-rules.md)
- Use @canany for Multiple Permission Checks (05-rules.md)
- Use Blade Authorization Directives for Conditional UI Rendering (06-skills.md)
- Blade @can vs @canany vs Custom PHP decision tree (07-decision-trees.md)

---

## 5. Nested @can Without @canany

### Category
Code Organization

### Description
Using nested `@can` directives or chained `@if` conditions for multiple permission checks instead of the `@canany` directive.

### Why It Happens
`@canany` is less well-known than `@can`. Developers naturally nest `@can` blocks or write `@if(Auth::user()->can('x') || Auth::user()->can('y'))` when they need to check if a user has any of several permissions.

### Warning Signs
- Multiple `@can` directives nested within each other for the same `@else` block
- `@if(Auth::user()->can('x') || Auth::user()->can('y'))` in Blade
- Or conditions in Blade authorization checks
- Repeated `@can` blocks with similar content for different permissions

### Why Harmful
Nested `@can` directives create redundant template code and make the conditional logic harder to read. Adding a new permission to the "any of" group requires adding another nested block. The template becomes harder to maintain as the permission list grows.

### Real-World Consequences
- Template has 5 nested `@can` blocks for the same content — any change requires updating all
- Adding a new admin permission requires adding another `@can` wrapper
- Code reviewer misses that nested blocks duplicate the same content
- Template readability degraded by nested authorization blocks

### Preferred Alternative
Use `@canany(['permission1', 'permission2'])` to check if the user has any of a list of permissions.

### Refactoring Strategy
1. Identify nested `@can` blocks that control the same content
2. Replace with `@canany(['permission1', 'permission2'])`
3. Remove the nested conditionals
4. Use `@else` with `@canany` for fallback content

### Detection Checklist
- [ ] Are `@can` directives nested for the same content block?
- [ ] Are `@canany` directives used where available?
- [ ] Are there or-conditions in authorization checks in templates?
- [ ] Would `@canany` simplify the template?
- [ ] Are permission groups maintained in a single `@canany` list?

### Related Rules/Skills/Trees
- Use @canany for Multiple Permission Checks (05-rules.md)
- Use Blade Authorization Directives for Conditional UI Rendering (06-skills.md)
- Blade @can vs @canany vs Custom PHP decision tree (07-decision-trees.md)
