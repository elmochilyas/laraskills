# Anti-Patterns: Gates (Closure-Based Authorization)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Gates (Closure-Based Authorization) |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-GC-01 | Gate::before Returning False | Critical | Medium | Low |
| AP-GC-02 | Server-Side Gate Check Missing | Critical | High | Medium |
| AP-GC-03 | Role Names as Gate Names | Medium | High | Low |
| AP-GC-04 | Heavy Logic in Gate::before | High | Medium | Low |
| AP-GC-05 | Gate Over Policy for Model Auth | Medium | Medium | Medium |

---

## Repository-Wide Anti-Patterns

- **Gate::allows() Without Fallback**: Checking a gate but not handling the unauthorized case
- **Multiple Gate::before() Registrations**: Registering `before()` in multiple providers — only the last takes effect
- **Type-Hinting Non-Nullable User**: Assuming user is always authenticated, causing errors on guest access

---

## 1. Gate::before Returning False

### Category
Security · Critical

### Description
Returning `false` from `Gate::before()` for non-super-admin users, which denies all authorization checks for regular users regardless of what individual gates or policies allow.

### Why It Happens
The ternary operator is the most common culprit: `return $user->isSuperAdmin() ? true : false;`. The developer thinks "super-admin gets true, everyone else gets false." While `true` grants access, `false` denies access immediately — it doesn't "let the gate decide." The documentation explicitly warns about this, but it's counterintuitive.

### Warning Signs
- `Gate::before()` uses a ternary returning `true` or `false`
- `Gate::before()` returns `false` for non-super-admin users
- All non-super-admin users get 403 on every route
- Adding a new gate does not fix the authorization — because `before()` denies before the gate runs
- The `Gate::before()` closure has an `else` branch returning `false`

### Why Harmful
`Gate::before()` returning `false` is an immediate denial for all authorization checks. No gate or policy is evaluated. Every user who is not a super-admin is denied access to everything — dashboards, profiles, settings. This is a complete authorization failure for the entire non-admin user base. Debugging is confusing because `Gate::allows()` returns `false` for every check, and individual gates appear to be broken.

### Real-World Consequences
- All non-admin users cannot access any part of the application after deployment
- Support tickets: "Regular users cannot do anything"
- Rollback required while developers search for the gate bug
- Hours of debugging before discovering the `false` return in `before()`
- Test suite may not catch this if tests only use admin users

### Preferred Alternative
Return `true` for super-admin bypass and `null` (implicitly) for all other users. Never return `false`.

### Refactoring Strategy
1. Find the `Gate::before()` registration in service providers
2. Remove any `return false` or `else` branch that returns `false`
3. Change to: `if ($user->isSuperAdmin()) { return true; }` — no else
4. Verify that non-super-admin users can access authorized routes
5. Add a test that confirms `Gate::before()` does not block regular users

### Detection Checklist
- [ ] Does `Gate::before()` ever return `false`?
- [ ] Is there an `else` clause returning `false` in `before()`?
- [ ] Do non-super-admin users get 403 on all routes?
- [ ] Does `Gate::before()` use a ternary returning boolean for both branches?
- [ ] Are regular users able to access authorized functionality?

### Related Rules/Skills/Trees
- Use Gate::before() for Super-Admin Bypass Only (05-rules.md)
- Define Authorization Gates Using Closures for Simple Access Rules (06-skills.md)
- Gate::before Return Value Handling decision tree (07-decision-trees.md)

---

## 2. Server-Side Gate Check Missing

### Category
Security · Critical

### Description
Using `@can` in Blade views for gate-based authorization without calling `Gate::authorize()` in the controller, allowing direct URL access to bypass the gate.

### Why It Happens
Gates are often defined for actions like "view dashboard" or "export reports." Developers add `@can('view-dashboard')` to hide the dashboard link from unauthorized users but forget to add `Gate::authorize('view-dashboard')` in the dashboard controller. The hidden link makes the dashboard seem protected.

### Warning Signs
- No `Gate::authorize()` or `$this->authorize()` call in controller methods
- All authorization appears in Blade `@can` directives
- Routes exist without middleware or controller authorization checks
- Hidden UI elements correspond to unprotected routes
- Direct URL access grants unauthorized functionality

### Why Harmful
Without server-side `Gate::authorize()`, the controller performs the action for any user who knows the URL. The gate definition is effectively decorative — it defines the rule but never enforces it. A user who discovers the route can access admin functionality, export data, or trigger side effects without authorization.

### Real-World Consequences
- Dashboard route accessible to any authenticated user — data leak
- Export functionality accessible without permission — data exfiltration
- Settings route writable by unauthorized users — configuration tampering
- Security audit: "Gate defined but never enforced in controller"

### Preferred Alternative
Call `Gate::authorize()` or `$this->authorize()` in every controller method that corresponds to a gate.

### Refactoring Strategy
1. Identify all controllers with methods that should be gated
2. Add `Gate::authorize('gate-name')` at the top of each method
3. For routes using closures, add `can:` middleware
4. Verify that direct URL access without the permission returns 403
5. Add controller tests that verify server-side gate enforcement

### Detection Checklist
- [ ] Does every gate have a corresponding `Gate::authorize()` call?
- [ ] Are there `@can` directives in Blade with no server-side check?
- [ ] Can gated functionality be accessed directly via URL?
- [ ] Is there a route or controller method with no authorization?
- [ ] Are tests failing when no user is authenticated?

### Related Rules/Skills/Trees
- Check Gates Server-Side in Controllers, Not Only in Blade (05-rules.md)
- Define Authorization Gates Using Closures for Simple Access Rules (06-skills.md)

---

## 3. Role Names as Gate Names

### Category
Maintainability

### Description
Using role names like `admin`, `editor`, or `manager` as gate definition names instead of action-oriented names like `view-dashboard` or `export-reports`.

### Why It Happens
Role names are the most immediately available authorization concept. Defining `Gate::define('admin', ...)` feels natural — it maps directly to the admin role. The developer doesn't foresee that the "admin" gate will be used in multiple contexts and that access rules may diverge.

### Warning Signs
- Gate names are: `admin`, `editor`, `user`, `manager`, `super-admin`
- Gate checks are role-based: `@can('admin')`, `Gate::authorize('editor')`
- Multiple unrelated actions share the same gate (one "admin" gate for everything)
- Cannot grant access to "view dashboard" without also granting "delete users"
- Adding a granular permission requires creating separate logic outside the gate system

### Why Harmful
Role-named gates are binary — a user either has the `admin` gate or they don't. Every admin gets every permission the `admin` gate controls. There's no way to differentiate between an admin who can view dashboards and an admin who can export reports. As the application grows, the single `admin` gate becomes a catch-all that grants too much access.

### Real-World Consequences
- Support admin needs dashboard access but cannot be given the `admin` gate (too many permissions)
- Guest reporter needs export access but `admin` gate grants everything
- Cannot audit "who can export reports" because it's bundled in `admin` gate
- Refactoring `admin` gate into granular gates requires changing every usage site

### Preferred Alternative
Use action-oriented gate names: `view-dashboard`, `export-reports`, `manage-settings`.

### Refactoring Strategy
1. List all existing role-named gates
2. Replace each with granular action-oriented names
3. Update all `Gate::authorize()` and `@can` calls to use new names
4. Update user-to-gate mapping in `Gate::define()` closures
5. Test each gate with both authorized and unauthorized users

### Detection Checklist
- [ ] Are gate names role-based (`admin`, `editor`) or action-based (`view-dashboard`)?
- [ ] Can a subset of admin functionality be granted without granting all of it?
- [ ] Is there a gate that controls multiple unrelated actions?
- [ ] Would renaming a role break existing gate checks?
- [ ] Are gate names stable across role structure changes?

### Related Rules/Skills/Trees
- Name Gates With Action-Oriented Names, Not Roles (05-rules.md)
- Define Authorization Gates Using Closures for Simple Access Rules (06-skills.md)

---

## 4. Heavy Logic in Gate::before

### Category
Performance

### Description
Performing database queries, service calls, or complex logic inside `Gate::before()`, causing N+1 query overhead on every authorization check.

### Why It Happens
`Gate::before()` seems like a convenient place for authorization logic — it runs before every gate and policy. Developers add role lookups, permission checks, and even business logic there. Since the closure is called frequently (every authorization check), even a single database query multiplies across the application.

### Warning Signs
- `Gate::before()` contains `User::find()`, `$user->roles()`, or other database calls
- The closure is more than 3-5 lines
- Database query count per page is higher than expected
- Authorization-heavy pages are noticeably slower
- The `before()` closure calls service methods or external APIs

### Why Harmful
`Gate::before()` runs on every single `Gate::allows()`, `$user->can()`, `$this->authorize()`, and `@can()` call. A page with 15 permission checks results in 15 executions of `before()`. If `before()` contains a single database query, that's 15 extra queries per page load. With an N+1 pattern inside `before()` (loading roles, then loading permissions), the query count multiplies further.

### Real-World Consequences
- Page with 20 `@can` directives triggers 20 database queries just for `before()` logic
- Server CPU spikes from repeated authorization queries
- Page load time increases by 200ms+
- N+1 query detection tools flag the `before()` closure
- Eager loading the same data in the controller is wasted because `before()` loads it again

### Preferred Alternative
Keep `Gate::before()` to a single boolean check. Pre-load authorization data in the controller or middleware.

### Refactoring Strategy
1. Move any database queries out of `Gate::before()` into the controller or middleware
2. Replace role/permission loading with a column check or cached property
3. Eager load authorization data in middleware and pass it to the view
4. If complex logic is unavoidable, move it to a dedicated authorization service
5. Profile the application to confirm query reduction

### Detection Checklist
- [ ] Does `Gate::before()` contain database queries?
- [ ] How many times does `before()` execute per page load?
- [ ] Are there N+1 query patterns originating from authorization checks?
- [ ] Is `before()` logic simple (boolean check) or complex (queries, services)?
- [ ] Is authorization data pre-loaded or loaded on every check?

### Related Rules/Skills/Trees
- Keep Gate::before() Lightweight — Single Boolean Check (05-rules.md)
- Define Authorization Gates Using Closures for Simple Access Rules (06-skills.md)

---

## 5. Gate Over Policy for Model Auth

### Category
Architecture · Maintainability

### Description
Using Gates for model-specific CRUD authorization instead of Policy classes, missing Policy-only features like `authorizeResource()`, auto-discovery, and structured CRUD methods.

### Why It Happens
Gates are simpler to define — one closure in a service provider versus a Policy class with multiple methods. For the first model, a gate seems sufficient. As more models are added, the service provider grows with gate closures for each model, none of which benefit from Policy auto-discovery or `authorizeResource()`.

### Warning Signs
- `Gate::define('create-post', ...)`, `Gate::define('update-post', ...)`, etc. for model actions
- No Policy classes exist for models with CRUD operations
- Controllers use `Gate::authorize('create-post')` instead of `$this->authorize('create', Post::class)`
- `authorizeResource()` is not used in any controller
- Service provider has 20+ gate definitions for model actions

### Why Harmful
Policy classes provide auto-discovery (Laravel finds them automatically by model naming convention), `authorizeResource()` (auto-maps controller methods to policy methods), structured methods (`view`, `create`, `update`, `delete`, `restore`, `forceDelete`), and consistent naming. Gates for model actions miss all of this — they must be manually registered, manually mapped in controllers, and have no consistent method structure.

### Real-World Consequences
- Adding a new model requires writing 5+ gate definitions and manually linking them in controllers
- Policy auto-discovery is unused — every gate must be manually registered
- `authorizeResource()` cannot be used — controller authorization is manual
- Service provider grows to 50+ gate definitions for model actions
- Inconsistent authorization naming across models

### Preferred Alternative
Use Policy classes for all model-specific CRUD authorization. Reserve Gates for non-model actions.

### Refactoring Strategy
1. Create Policy classes for each model that has CRUD gates
2. Remove model-specific gates from the service provider
3. Enable auto-discovery by following naming conventions
4. Replace `Gate::authorize('create-post')` with `$this->authorize('create', Post::class)`
5. Use `authorizeResource()` in controllers where applicable

### Detection Checklist
- [ ] Are there model-specific actions (create, update, delete) in gate definitions?
- [ ] Do Policy classes exist for models with CRUD operations?
- [ ] Is `authorizeResource()` used in controllers?
- [ ] Are gates manually registered for each model action?
- [ ] Would Policy auto-discovery simplify authorization?

### Related Rules/Skills/Trees
- Define Gates for Non-Model Actions Only (05-rules.md)
- Define Authorization Gates Using Closures for Simple Access Rules (06-skills.md)
- Gate vs Policy for New Authorization decision tree (07-decision-trees.md)
