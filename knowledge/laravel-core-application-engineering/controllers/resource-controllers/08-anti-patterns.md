# ECC Anti-Patterns — Resource Controllers

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Resource Controllers |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Non-Resource Actions Mixed in Resource Controllers
2. Overloaded Store/Update Without FormRequest
3. Resource Controller for Non-CRUD Resources
4. Fat Resource Actions (50+ Lines)
5. Manual Model Resolution Instead of Route Model Binding

---

## Repository-Wide Anti-Patterns

- `--resource` Flag for API Controllers (Dead create/edit Methods)
- Non-Standard Method Names (list, add, view, change, delete)
- Manual Route Registration Instead of `Route::resource()`
- Missing `->only()`/`->except()` on Resource Routes
- Controller Generated Manually Instead of via Artisan

---

## Anti-Pattern 1: Non-Resource Actions Mixed in Resource Controllers

### Category
Architecture | Maintainability

### Description
Adding `publish()`, `archive()`, `approve()`, `export()`, or other custom methods alongside the standard 7 resource actions in a single controller.

### Why It Happens
Developers find it convenient to keep all operations for a resource in one class, not realizing the resource controller contract is the 7 standard actions only.

### Warning Signs
- Controller has 10+ public methods beyond index, create, store, show, edit, update, destroy
- Manual route registrations exist for custom methods alongside `Route::resource()`
- Team members cannot quickly tell if a method is standard or custom
- A method like `publish()` is routed with `Route::post('/posts/{post}/publish', [PostController::class, 'publish'])`

### Preferred Alternative
Extract non-CRUD operations to single-action controllers. Keep the resource controller to exactly the 7 (or 5 for API) standard actions.

### Related Rules
- Rule: Do Not Add Non-Resource Actions to Resource Controllers
- Rule: Use Single-Action Controllers for Non-CRUD Operations

---

## Anti-Pattern 2: Overloaded Store/Update Without FormRequest

### Category
Architecture | Security

### Description
The `store()` and `update()` methods receiving raw `Request` type-hints with inline validation, or no validation at all, instead of dedicated FormRequest classes.

### Why It Happens
Developers skip creating FormRequest classes and validate inline, or forget validation entirely for "internal" endpoints.

### Warning Signs
- `store(Request $request)` type-hint instead of `StorePostRequest`
- `$request->validate([...])` call inside store or update method body
- No `authorize()` method exists for the store/update action
- Validation rules are duplicated in both store and update methods

### Preferred Alternative
Create dedicated FormRequest classes for each store and update action. Type-hint them in the method signature. Move authorization to `authorize()`.

### Related Rules
- Rule: Use Form Requests for Store and Update Validation
- Rule: Keep Each Resource Action Under 10 Lines

---

## Anti-Pattern 3: Resource Controller for Non-CRUD Resources

### Category
Architecture | Maintainability

### Description
Creating a full resource controller (with all 7 methods) for a resource that only needs one or two actions, such as a dashboard, search page, or read-only report.

### Why It Happens
Developers apply the resource controller pattern by default without evaluating whether the resource supports CRUD operations.

### Warning Signs
- Resource controller has `create()`, `store()`, `edit()`, `update()`, `destroy()` methods that are never routed
- `Route::resource()` registers 7 routes but only 1-2 are actually used
- Unused methods contain placeholder code or `abort(404)`
- Debugging shows routes like `/users/create` returning 404 or broken responses

### Preferred Alternative
Use `Route::resource()->only(['index', 'show'])` for read-only resources. Use single-action controllers for single-operation endpoints.

### Related Rules
- Rule: Avoid Resource Controllers for Non-CRUD Resources

---

## Anti-Pattern 4: Fat Resource Actions (50+ Lines)

### Category
Maintainability

### Description
Resource action methods (index, store, show, update, destroy) containing 30-100+ lines of code with inline queries, formatting, and side effects.

### Why It Happens
Resource controllers are the most common entry point for data operations. Developers keep adding logic directly to the action method instead of extracting to services.

### Warning Signs
- `store()` method calls Eloquent, formats JSON, dispatches events, sends emails, and manages transactions inline
- `index()` method has 5+ query conditions, pagination, filtering, and inline data transformation
- Method body scrolls beyond one screen
- No service or action class is injected in the constructor

### Preferred Alternative
Extract all non-HTTP concerns to service classes. Each resource action should be 3-10 lines following validate-delegate-return.

### Related Rules
- Rule: Keep Each Resource Action Under 10 Lines

---

## Anti-Pattern 5: Manual Model Resolution Instead of Route Model Binding

### Category
Framework Usage | Maintainability

### Description
Using `Model::findOrFail($id)` or `Model::where('id', $id)->first()` inside resource actions instead of type-hinting the model for implicit route model binding.

### Why It Happens
Developers are accustomed to the controller receiving scalar `$id` parameters from other frameworks. They query the model manually out of habit.

### Warning Signs
- `show($id)` or `update(Request $request, $id)` with scalar parameter
- `Model::findOrFail($id)` call in method body
- `Model::where('column', $id)->first()` with manual null check
- Inconsistent 404 handling — some methods use `findOrFail`, others don't

### Preferred Alternative
Type-hint the bound model in the method signature: `show(Post $post)`, `update(UpdatePostRequest $request, Post $post)`. The framework resolves and returns 404 automatically.

### Related Rules
- Rule: Use Route Model Binding in Show, Edit, Update, Destroy
