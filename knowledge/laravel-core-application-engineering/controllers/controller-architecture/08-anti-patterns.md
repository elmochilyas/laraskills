# ECC Anti-Patterns — Controller Architecture

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Controller Architecture |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Business Logic in Controllers (Validate-Database-Format-Respond)
2. Fat Controller Methods (50+ Lines)
3. God Controller (20+ Methods, Multiple Resources)
4. Mixing Web and API Response Types in One Controller
5. Inline Validation Instead of FormRequest

---

## Repository-Wide Anti-Patterns

- Controllers Importing Model and Query Builder Classes Directly
- Service Locator Calls (`app()->make()`) Inside Methods
- Controllers with Empty Implicit Return Types
- Controller as Orchestrator (Transaction Management in Method)
- Forgotten Route Model Binding (Manual `findOrFail`)

---

## Anti-Pattern 1: Business Logic in Controllers

### Category
Architecture | Maintainability

### Description
Writing database queries, calculations, conditional workflows, and multi-step processes directly inside controller methods instead of delegating to services or actions.

### Why It Happens
The controller is the first code reached by an HTTP request. Developers add logic inline for convenience, and the method grows organically without extraction.

### Warning Signs
- `User::where()`, `Model::query()`, or `DB::table()` calls in the method body
- Price calculations, discount rules, or tax computation in a controller
- 3+ distinct operations (validate + query + calculate + format) in one method
- No service or action class is injected in the constructor

### Preferred Alternative
Delegate to a service or action class injected via the constructor. Keep the method to validate, delegate, return — 3 lines maximum.

### Related Rules
- Rule: Delegate All Business Logic to Services or Actions
- Rule: Follow the Three-Step Controller Flow

---

## Anti-Pattern 2: Fat Controller Methods

### Category
Maintainability

### Description
Controller methods exceeding 15-50+ lines that mix validation, data retrieval, response formatting, logging, event dispatching, and side effects.

### Why It Happens
Developers treat the controller method as the single entry point for the entire operation, adding steps sequentially without extracting concerns.

### Warning Signs
- Method body exceeds 15 lines including blank lines
- A single method calls `$request->validate()`, then queries, then formats JSON, then dispatches events
- Multiple `try/catch` blocks for transaction management
- Method handles 3+ distinct responsibilities

### Preferred Alternative
Extract each concern to its proper layer: validation to FormRequest, queries/logic to Service, formatting to API Resource or View.

### Related Rules
- Rule: Enforce Maximum Controller Method Length (10-15 lines)
- Rule: Keep Controller Methods Under 10 Lines

---

## Anti-Pattern 3: God Controller

### Category
Architecture | Maintainability

### Description
A single controller with 15-30+ public methods handling multiple resources, concerns, or domains — combining CRUD for one resource with reporting, exports, and admin operations.

### Why It Happens
Developers put all related operations in one file for "convenience," and new features continue to be added to the same controller.

### Warning Signs
- Controller has 12+ public methods
- Controller handles multiple resources (e.g., both User and Role operations)
- Controller mixes CRUD with non-CRUD operations (publish, export, import, reports)
- Constructor has 5+ injected dependencies

### Preferred Alternative
Extract non-CRUD operations to single-action or dedicated controllers. Keep resource controllers to 5-7 methods. Split multipurpose controllers by domain.

### Related Rules
- Rule: Avoid God Controllers (max 7-10 public methods)

---

## Anti-Pattern 4: Mixing Web and API Response Types

### Category
Architecture | Maintainability

### Description
A single controller returning both `View`/`RedirectResponse` (web) and `JsonResponse`/`Resource` (API) from different methods, or conditionally switching response types based on `request()->wantsJson()`.

### Why It Happens
Developers try to serve both web and API consumers from one controller to avoid duplication, not realizing the separate concerns.

### Warning Signs
- Return type includes union types like `View|JsonResponse`
- Method uses `request()->wantsJson()` to switch between HTML and JSON
- Some methods return views, others return `response()->json()`
- Controller imports both Blade helpers and JSON response classes

### Preferred Alternative
Separate into `App\Http\Controllers\Web\UserController` and `App\Http\Controllers\Api\UserController`. Each follows its own response conventions.

### Related Rules
- Rule: Separate Web and API Controllers

---

## Anti-Pattern 5: Inline Validation Instead of FormRequest

### Category
Architecture | Security

### Description
Using `$request->validate([...])` inside a controller method instead of type-hinting a dedicated FormRequest class.

### Why It Happens
Creating a FormRequest class feels like "extra work" for validation that seems simple enough to inline.

### Warning Signs
- `$request->validate()` call in method body
- Method type-hints `Illuminate\Http\Request` instead of a specific FormRequest
- Authorization checks are inline (`if (auth()->user()->isAdmin())`) in the method body
- Validation rules are duplicated across multiple controllers

### Preferred Alternative
Create a FormRequest class for every store and update action. Type-hint it in the method signature. Move authorization to `authorize()`.

### Related Rules
- Rule: Use FormRequest Classes for All Validation
- Rule: Always Type-Hint FormRequest Instead of Request
