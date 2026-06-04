# Skill: Apply Middleware to Controller Actions

## Purpose

Assign HTTP middleware to specific controller methods using the constructor-based `$this->middleware()` registration pattern with `->only()` and `->except()` method scoping. Provides method-level middleware granularity without cluttering route definitions, while avoiding middleware duplication between route and controller layers.

## When To Use

- A resource controller where different actions need different middleware (e.g., auth on write actions, public on read actions)
- An admin-only action (`destroy`) in an otherwise public controller
- An API controller where some endpoints need rate limiting and others don't
- Method-level middleware granularity is needed beyond what route groups provide

## When NOT To Use

- All routes in a group share the same middleware (use route-group middleware)
- A controller with a single action (apply middleware in the route definition)
- Middleware should apply globally (use global middleware in `Kernel.php`)
- Authorization checks that require model-specific access (use FormRequest `authorize()` or Policy gates)

## Prerequisites

- Route definitions already register the controller (`Route::resource()` or individual routes)
- Middleware classes already exist and are registered in `app/Http/Kernel.php`
- Understanding of which controller actions will be protected vs. public

## Inputs

- Controller class that needs middleware
- List of middleware to apply (by key name, e.g., `'auth'`, `'admin'`, `'throttle:api'`)
- For each middleware, which methods it scopes to

## Workflow

1. **Open the controller and locate the constructor**

   Add a constructor if none exists:
   ```php
   public function __construct()
   {
   }
   ```

2. **For each middleware needed, add a `$this->middleware()` call**

   Use this pattern inside the constructor:
   ```php
   $this->middleware('{middleware-name}')->{scope}(['{action}', ...]);
   ```

3. **Decide the scoping strategy**

   a. If only a few actions need the middleware → use `->only(['action1', 'action2'])`.
   
   b. If most actions need the middleware and only a few should be excluded → use `->except(['action1'])`.
   
   c. For `auth` middleware on a resource controller → always use `->except(['index', 'show'])` to keep public read actions accessible.
   
   d. For destructive actions (`destroy`) requiring elevated privileges → use `->only(['destroy'])`.

4. **Verify middleware composition**

   Run `php artisan route:list` and inspect the "Middleware" column for each route handled by this controller. Ensure:
   
   - Expected middleware is present for each action
   - No middleware is duplicated (same middleware from route level AND controller level)
   - Public actions (`index`, `show`) do not have `auth` middleware (unless intended)

5. **Handle rate limiting**

   For API controllers, apply different throttle limits per action:
   ```php
   $this->middleware('throttle:60,1')->only(['index', 'show']);
   $this->middleware('throttle:10,1')->only(['store', 'update', 'destroy']);
   ```

## Validation Checklist

- [ ] All `$this->middleware()` calls are in the constructor only
- [ ] Every `$this->middleware()` call chains `->only()` or `->except()` (no unscoped middleware)
- [ ] Constructor contains no logic besides middleware registration
- [ ] `php artisan route:list` shows the correct middleware composition for each route
- [ ] No middleware is duplicated between route group and controller level
- [ ] Public resource actions (`index`, `show`) are excluded from `auth` middleware via `->except()`
- [ ] Authorization middleware (`can:...`) is NOT used — use FormRequest `authorize()` instead
- [ ] `->only()` is preferred over `->except()` unless the middleware applies to most actions

## Common Failures

- **Middleware registered outside constructor**: `$this->middleware()` in a controller method is silently ignored. Prevention: always place in constructor.
- **Forgetting `->except()` for public actions**: `auth` middleware without `->except(['index', 'show'])` blocks public read routes. Prevention: always scope `auth` on resource controllers with `->except(['index', 'show'])`.
- **Middleware duplication**: Same middleware applied at route-group and controller level, causing double execution. Prevention: run `php artisan route:list` after adding middleware.
- **Constructor logic mixed with middleware**: Database queries or service calls in the constructor execute on every request, even for unmatched methods. Prevention: keep constructors to middleware-only.

## Decision Points

- **Route-level vs. controller-level middleware**: If the same middleware applies to multiple controllers → route level. If it applies only to specific methods within one controller → controller level.
- **`->only()` vs. `->except()`**: If only a few actions need the middleware → `->only()`. If most actions need it and only a few are excluded → `->except()`.
- **Controller middleware vs. FormRequest authorize**: If the check is role-based (admin, editor) → middleware. If the check is model-specific (can user update this post) → FormRequest `authorize()`.

## Performance Considerations

- Controller middleware adds negligible overhead — it is merged into the route middleware list at registration time.
- Route-level middleware is slightly more performant because it is collected at route registration rather than controller resolution.
- Duplicate middleware doubles execution time for the affected routes.

## Security Considerations

- Controller middleware is invisible in route files — auditors must check both routes AND controllers to understand full security posture.
- Never use `$this->middleware('can:...')` for authorization — use FormRequest `authorize()` instead.
- Unscoped middleware applies to ALL methods, including future additions. Always use `->only()` or `->except()`.
- After modifying middleware, verify with `php artisan route:list` — this shows the effective middleware stack for every route.

## Related Rules

- `05-rules.md` Rule: "Register Middleware Only in Constructors"
- `05-rules.md` Rule: "Use only() or except() for Every Middleware Registration"
- `05-rules.md` Rule: "Keep Constructors Limited to Middleware Registration"
- `05-rules.md` Rule: "Prefer Route-Level Middleware for Shared Protection"
- `05-rules.md` Rule: "Do Not Use Controller Middleware as Authorization Gate"
- `05-rules.md` Rule: "Verify Middleware Composition with route:list"
- `05-rules.md` Rule: "Always Declare except() for Public Resource Actions"
- `05-rules.md` Rule: "Use ->only() as the Default, ->except() as the Exception"

## Related Skills

- "Design and Implement Controller Architecture" — foundation for controller constructors
- "Create a Resource Controller for CRUD Operations" — common middleware use case

## Success Criteria

- All middleware is registered in the constructor with explicit method scoping
- `php artisan route:list` confirms the correct middleware stack for every route
- No middleware duplication between route and controller levels
- Public read actions are accessible without authentication
- Constructor contains only `$this->middleware()` calls with scoping

---

# Skill: Audit Controller Middleware Composition for Security and Duplication

## Purpose

Systematically verify that the effective middleware stack for every route protected by controller middleware is correct — no unintended gaps, no double application, and no invisible security posture. Ensures the middleware pipeline is auditable from a single command.

## When To Use

- After adding or modifying controller middleware in any controller
- During code review of a pull request that touches controller constructors
- As part of a security audit before deployment
- When debugging unexpected 302 redirects (unauthenticated) or 429 errors (rate limit)

## When NOT To Use

- Applications with no controller middleware (all middleware at route or global level)
- During initial scaffolding before middleware decisions are made

## Prerequisites

- `php artisan route:list` available and working
- List of all controllers that use `$this->middleware()` in their constructors
- Access to the route files for comparison

## Inputs

- Controller files that register middleware in constructors
- Route files (`routes/web.php`, `routes/api.php`)
- Output of `php artisan route:list`

## Workflow

1. **Collect all controllers with middleware**

   a. Search for `$this->middleware(` across `app/Http/Controllers/`:
      ```bash
      grep -r "\$this->middleware(" app/Http/Controllers/
      ```
   
   b. List every controller and the middleware it registers, including scoping.

2. **Compare route-level and controller-level middleware**

   a. For each route handled by these controllers, run `php artisan route:list -c {ControllerName}`.
   
   b. Note the middleware column for each route.
   
   c. Identify middleware applied at both route-group and controller level.

3. **Flag each duplication scenario**

   a. If the SAME middleware appears in both the route group and the controller `->only()`:
      - Example: Route group has `throttle:api`, controller also has `->only(['store'])` with same throttle.
      - Action: Remove from one layer. Prefer route-level for shared protection.

   b. If DIFFERENT parameters of the same middleware are applied (e.g., `throttle:60,1` at route level and `throttle:10,1` at controller level):
      - This is valid — it applies different limits per action.
      - Document the intent clearly in a comment.

4. **Verify authorization middleware is not used**

   a. Reject any `$this->middleware('can:...')` or `$this->middleware('can:...')` pattern.
   
   b. Require migration to FormRequest `authorize()` or Policy gates.

5. **Verify public actions are accessible**

   a. For resource controllers with `auth` middleware, confirm `->except(['index', 'show'])` is present.
   
   b. Hit each public route with an unauthenticated test request to confirm 200 (not 302 to login).

6. **Document the middleware strategy**

   a. For each controller, add a class-level docblock summarizing the middleware strategy.
   
   b. Example:
      ```php
      /**
       * Middleware strategy:
       * - auth: all except index, show (public reads)
       * - admin: only destroy (elevated delete)
       * - throttle:api: only store, update, destroy (write operations)
       */
      ```

## Validation Checklist

- [ ] Every controller with `$this->middleware()` has been audited via `route:list`
- [ ] No middleware is duplicated between route and controller layers
- [ ] No `$this->middleware('can:...')` exists in any controller
- [ ] Public read actions (`index`, `show`) are accessible without authentication
- [ ] All destructive actions have the intended protection
- [ ] Middleware strategy is documented in class docblocks
- [ ] No unscoped `$this->middleware()` calls exist (all have `->only()` or `->except()`)

## Common Failures

- **Ignoring route-group middleware when adding controller middleware**: Adding the same throttle at controller level that already exists at route-group level. Prevention: run `route:list` before adding controller middleware.
- **Assuming `route:list` shows everything**: The command shows the pipeline, but doesn't highlight duplication. Prevention: manually compare route-group middleware with controller middleware for overlaps.
- **Missing documentation**: Developers must read every controller constructor to understand middleware. Prevention: add class-level docblocks summarizing the strategy.

## Decision Points

- **Resolve duplication by moving to route level**: If the middleware applies to multiple controllers, move it from the controller constructor to a route group.
- **Resolve duplication by removing from route level**: If the middleware only applies to specific methods of one controller, remove it from the route group and keep it in the controller constructor with `->only()`.

## Performance Considerations

- Duplicate middleware doubles execution time for the affected request path.
- `php artisan route:list` reads from cache — after modifying routes or middleware, run `php artisan route:clear && php artisan route:list` to see current state.

## Security Considerations

- Controller middleware is invisible at the route level — security auditors who only read route files will miss it.
- From a security perspective, route-level middleware is superior because it is visible in a single audit location.
- Always include middleware strategy documentation in the controller class docblock for auditors.

## Related Rules

- `05-rules.md` Rule: "Verify Middleware Composition with route:list"
- `05-rules.md` Rule: "Prefer Route-Level Middleware for Shared Protection"
- `05-rules.md` Rule: "Register Middleware Only in Constructors"
- `05-rules.md` Rule: "Use ->only() as the Default, ->except() as the Exception"

## Related Skills

- "Apply Middleware to Controller Actions" — the implementation counterpart

## Success Criteria

- A complete audit report listing every controller's middleware, route-group middleware, and any duplication
- All duplication resolved (middleware applied at exactly one layer)
- No `can:` middleware in any controller constructor
- All public read actions confirmed accessible without authentication
- Middleware strategy documented in every controller that uses `$this->middleware()`
