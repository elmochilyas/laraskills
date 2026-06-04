# ECC Anti-Patterns — Single-Action Controllers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Single-Action Controllers |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Invokable Controllers for CRUD Operations (File Explosion)
2. Multiple Public Methods Alongside __invoke()
3. Fat __invoke() Exceeding 15 Lines
4. Vague Controller Names (Not Operation-Based)
5. Specifying `__invoke` in Route Registration

---

## Repository-Wide Anti-Patterns

- Closure Routes Not Converted to Controllers (No Route Caching)
- Service Locator in `__invoke()` Instead of Constructor Injection
- Single-Action Controller Extends `Controller` With Unnecessary Traits
- Route Model Binding Forgotten in `__invoke()` Parameters
- Missing FormRequest for Input-Receiving Operations

---

## Anti-Pattern 1: Invokable Controllers for CRUD Operations

### Category
Architecture | Code Organization

### Description
Creating separate invokable controllers for every CRUD action — `ListPostsController`, `CreatePostController`, `ShowPostController`, `UpdatePostController`, `DeletePostController` — instead of using a single resource controller.

### Why It Happens
Developers apply the single-action pattern universally, not distinguishing between CRUD and non-CRUD operations. Each action gets its own file regardless of fit.

### Warning Signs
- 5+ invokable controllers for the same resource (one per CRUD action)
- Route file registers 5+ routes to different controllers for the same resource
- Developers struggle to find all handlers for a resource
- Resource-related code is scattered across 5+ files instead of one `PostController`

### Preferred Alternative
Use resource controllers for CRUD operations. Reserve single-action controllers for non-CRUD operations like publish, approve, search, export.

### Related Rules
- Rule: Do Not Use Single-Action Controllers for CRUD Operations
- Rule: Use Resource Controllers for All CRUD Operations

---

## Anti-Pattern 2: Multiple Public Methods Alongside __invoke()

### Category
Architecture

### Description
Adding a second public method to an invokable controller alongside `__invoke()`, violating the single-action contract and creating unreachable dead code.

### Why It Happens
Two operations seem related (e.g., `publish` and `unpublish`), so the developer adds both to one controller even though only `__invoke()` can be routed.

### Warning Signs
- Controller has both `__invoke()` and another `public function` like `unpublish()`
- Second public method has no route registration and can never be reached
- IDE or static analysis warns about unused methods
- Developer must add a second route registration for the second method but can't (invokable controllers register by class only)

### Preferred Alternative
Every operation gets its own controller with exactly one public `__invoke()` method. Related operations become `PublishPostController` and `UnpublishPostController`.

### Related Rules
- Rule: Expose Only __invoke() as a Public Method

---

## Anti-Pattern 3: Fat __invoke() Exceeding 15 Lines

### Category
Maintainability

### Description
The `__invoke()` method containing business logic, queries, formatting, and side effects that exceed 15 lines.

### Why It Happens
Developers treat `__invoke()` as a self-contained operation method without extracting internal steps to services.

### Warning Signs
- `__invoke()` has inline Eloquent queries, loops, conditional branches
- Method body contains file parsing, CSV imports, or complex data transformation
- Multiple `try/catch` blocks for error handling within the method
- Service or action class is not injected — logic lives entirely in the controller

### Preferred Alternative
Delegate to a service or action class injected via the constructor. `__invoke()` should be 3-10 lines: validate (if applicable), delegate, return.

### Related Rules
- Rule: Keep __invoke() Under 15 Lines

---

## Anti-Pattern 4: Vague Controller Names

### Category
Code Organization | Maintainability

### Description
Naming single-action controllers with vague or generic names like `PostActionController`, `PostHelperController`, or `PostMiscController` instead of operation-based names like `PublishPostController`.

### Why It Happens
Developers don't consider that the controller name is the primary documentation for the operation. They use generic names because they plan to add multiple operations later.

### Warning Signs
- Class name contains generic terms like "Action", "Helper", "Manager", "Misc"
- Multiple operations from different domains share a single vague controller
- Developers must read the `__invoke()` body to understand what the controller does
- Route file has routes to `PostActionController`, `PostHelperController` — unclear what each does

### Preferred Alternative
Name by operation using the `{Verb}{Resource}Controller` format: `PublishPostController`, `SearchUsersController`, `ApproveOrderController`.

### Related Rules
- Rule: Name Single-Action Controllers by Operation

---

## Anti-Pattern 5: Specifying `__invoke` in Route Registration

### Category
Framework Usage

### Description
Registering single-action controllers with `[Controller::class, '__invoke']` instead of `Controller::class`.

### Why It Happens
Developers register single-action controllers using the same array syntax as multi-method controllers, not leveraging Laravel's invokable detection.

### Warning Signs
- Route registration uses `[DashboardController::class, '__invoke']` instead of `DashboardController::class`
- Team does not immediately recognize that the controller is invokable from the route registration
- Inconsistency — some invokable controllers registered by class, others with array syntax

### Preferred Alternative
Register by class name only: `Route::get('/dashboard', DashboardController::class)`. This signals the controller is invokable and is shorter.

### Related Rules
- Rule: Register Single-Action Controllers by Class Only
