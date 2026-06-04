# ECC Anti-Patterns — Controller Middleware

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Controller Middleware |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Business Logic in Controller Constructors
2. Middleware Registered Outside Constructor
3. Unscoped Middleware (No only()/except())
4. Middleware Duplication (Route and Controller Levels)
5. Authorization Middleware Instead of FormRequest authorize()

---

## Repository-Wide Anti-Patterns

- `auth` Middleware Without `except(['index', 'show'])` on Resource Controllers
- Using `->except()` When `->only()` Is Safer (Permissive Scoping)
- Invisible Security Posture (Middleware Hidden in Controller Files)
- Same Middleware Applied at Both Route-Group and Controller Level

---

## Anti-Pattern 1: Business Logic in Controller Constructors

### Category
Architecture | Reliability

### Description
Placing database queries, service calls, cache warm-ups, or side effects in the controller constructor alongside `$this->middleware()` registrations.

### Why It Happens
Developers treat the constructor as a general "setup" method, not realizing it runs at container resolution time — before the route is dispatched and before middleware runs.

### Warning Signs
- Constructor contains `$this->service->something()` or `Cache::get()` calls
- Constructor has queries (`User::count()`) or service initialization
- Side effects occur on every request to any method, even unmatched ones
- Debug logs show constructor logic executing for `index` and `show` when middleware targets only `store`

### Preferred Alternative
Keep constructors exclusively for `$this->middleware()` calls. Move initialization logic to the specific method that needs it, or use lazy initialization in the service layer.

### Related Rules
- Rule: Keep Constructors Limited to Middleware Registration
- Rule: Register Middleware Only in Constructors

---

## Anti-Pattern 2: Middleware Registered Outside Constructor

### Category
Security | Reliability

### Description
Calling `$this->middleware()` inside a controller method (e.g., `index()`, `store()`) instead of the constructor.

### Why It Happens
Developers do not know that `$this->middleware()` only works in the constructor. They add it in the method thinking it will apply before the method executes.

### Warning Signs
- `$this->middleware('auth')` appears inside `index()`, `store()`, or other action methods
- Routes are unexpectedly unprotected despite `$this->middleware()` calls existing in the file
- Code review finds middleware registrations scattered across methods

### Preferred Alternative
Always register middleware in the constructor. If method-level scoping is needed, use `->only()` or `->except()` chained to the constructor call.

### Related Rules
- Rule: Register Middleware Only in Constructors

---

## Anti-Pattern 3: Unscoped Middleware (No only()/except())

### Category
Security | Maintainability

### Description
Registering `$this->middleware('auth')` without chaining `->only()` or `->except()`, causing the middleware to apply to every method including public read actions.

### Why It Happens
Developers do not consider that unscoped middleware applies to the entire controller, including methods added in the future.

### Warning Signs
- `$this->middleware('auth')` with no `->only()` or `->except()` chain
- Public `index` and `show` actions unexpectedly redirecting to login
- New methods added to the controller silently inherit middleware without explicit decision

### Preferred Alternative
Always scope every middleware registration with `->only()` (restrictive) or `->except()` (permissive). For `auth` on resource controllers, use `->except(['index', 'show'])`.

### Related Rules
- Rule: Use only() or except() for Every Middleware Registration
- Rule: Always Declare except() for Public Resource Actions
- Rule: Use ->only() as the Default, ->except() as the Exception

---

## Anti-Pattern 4: Middleware Duplication (Route and Controller Levels)

### Category
Performance | Reliability

### Description
Applying the same middleware at both the route-group level and the controller constructor level, causing the middleware to execute twice for every request.

### Why It Happens
Route-group middleware is applied first, then the controller constructor adds the same middleware. Developers forget to check which middleware is already applied at the route level.

### Warning Signs
- `php artisan route:list` shows the same middleware appearing twice for a route
- Rate-limit headers show double counting (e.g., `X-RateLimit-Remaining: 58` after 1 of 60 requests)
- Authentication challenges fire twice, confusing API clients
- Duplicate middleware entries in the "Middleware" column of `route:list` output

### Preferred Alternative
Run `php artisan route:list` before adding controller middleware. Remove the duplicate from one layer — prefer route-level for shared protection, controller-level for method-specific granularity.

### Related Rules
- Rule: Verify Middleware Composition with route:list
- Rule: Prefer Route-Level Middleware for Shared Protection

---

## Anti-Pattern 5: Authorization Middleware Instead of FormRequest authorize()

### Category
Architecture | Security

### Description
Using `$this->middleware('can:update,post')` in the controller constructor for model-specific authorization instead of placing the check in FormRequest `authorize()`.

### Why It Happens
Developers are not aware that controller middleware runs authorization before the controller method resolves but couples the check to the route resolution layer rather than the validated request.

### Warning Signs
- `$this->middleware('can:...')` pattern in constructor
- Authorization logic for model-specific access (can user update this post?) in middleware layer
- FormRequest `authorize()` is missing or returns `true` unconditionally
- Policy checks are split between middleware and FormRequest

### Preferred Alternative
Use FormRequest `authorize()` for model-specific authorization. Keep `$this->middleware()` for role-based checks (admin, editor) that apply broadly.

### Related Rules
- Rule: Do Not Use Controller Middleware as Authorization Gate
