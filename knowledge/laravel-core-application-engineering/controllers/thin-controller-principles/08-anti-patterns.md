# ECC Anti-Patterns — Thin Controller Principles

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Thin Controller Principles |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Query-and-Respond Controller (Inline Eloquent Everywhere)
2. Controller as Orchestrator (Multiple Services, Transactions)
3. Inline Response Formatting (No API Resources)
4. Inline Authorization Logic
5. Fat Controller with 50+ Line Methods

---

## Repository-Wide Anti-Patterns

- Controller Imports Model and DB Classes Directly
- `$request->validate()` in Every Store/Update Method
- No Service Layer — All Logic Lives in Controllers
- Manual `Model::findOrFail()` Instead of Route Model Binding
- No Architecture Tests Enforcing Thin Controller Discipline

---

## Anti-Pattern 1: Query-and-Respond Controller

### Category
Architecture | Maintainability

### Description
Every controller method calls Eloquent directly (`User::where(...)`, `Model::query()`, `DB::table()`) and builds the response inline, with no service layer or delegation.

### Why It Happens
This is the default pattern for beginners. Queries are written where the data is needed — in the controller method. No extraction occurs because the developer hasn't learned or doesn't prioritize service layer patterns.

### Warning Signs
- Every method starts with an Eloquent query or query builder call
- Controller imports `App\Models\User`, `App\Models\Post`, etc. for querying
- Same query pattern (`User::where('active', true)->with('posts')`) is repeated across multiple methods or controllers
- No service classes exist in the application for business logic
- Refactoring a query requires modifying every controller that uses it

### Preferred Alternative
Extract all queries to service class methods. Inject the service via the constructor. Keep controllers to validate → delegate → return.

### Related Rules
- Rule: Never Write Database Queries in Controllers
- Rule: Ban Eloquent Model and DB Imports in Controllers via Architecture Tests

---

## Anti-Pattern 2: Controller as Orchestrator

### Category
Architecture | Maintainability

### Description
A controller method that calls multiple services, manages database transactions, dispatches events, sends notifications, and coordinates complex multi-step workflows inline.

### Why It Happens
Developers think orchestration is the controller's job because the controller is the first code reached by a request. They orchestrate multiple services inline without extracting to a dedicated orchestration service.

### Warning Signs
- Method has `DB::beginTransaction()` / `DB::commit()` / `DB::rollBack()` calls
- Method calls 3+ different service methods (`$this->payment->charge()`, `$this->inventory->reserve()`, `$this->notify->send()`)
- Events are dispatched inline (`event(new OrderCreated($order))`) after delegation
- Logging statements (`Log::info(...)`) are scattered between business steps
- Catch block handles multiple exceptions with different rollback logic

### Preferred Alternative
Move all orchestration to a service class method. The controller calls one service method; the service handles transaction, events, and side effects.

### Related Rules
- Rule: Do Not Use Controllers as Orchestrators
- Rule: Delegate All Business Logic to Services or Actions

---

## Anti-Pattern 3: Inline Response Formatting (No API Resources)

### Category
Architecture | Maintainability

### Description
Constructing JSON arrays, formatting collections, and building response structures directly inside controller methods instead of using API Resource classes.

### Why It Happens
Inline formatting is the most direct path from data to response. Developers skip creating Resource classes because inline formatting seems simpler for "small" responses.

### Warning Signs
- `response()->json(['data' => ...])` with array mapping in method body
- Collection `->map(fn($item) => ['id' => $item->id, ...])` in controller
- Same transformation logic duplicated across `index()` and `show()` methods
- Changing response structure requires modifying every controller method
- No `JsonResource` subclasses exist in the codebase

### Preferred Alternative
Create API Resource classes for each response type. Return `new UserResource($user)` or `new UserCollection($users)` from controller methods.

### Related Rules
- Rule: Never Format Responses Inline in Controllers

---

## Anti-Pattern 4: Inline Authorization Logic

### Category
Security | Architecture

### Description
Writing `if (auth()->user()->isAdmin())`, `$user->can()`, `Gate::allows()`, or `abort(403)` inside controller methods instead of using FormRequest `authorize()`.

### Why It Happens
Developers add authorization checks at the point where they realize access control is needed — inside the controller method. The check feels "natural" at the top of the method body.

### Warning Signs
- `if (auth()->user()->isAdmin())` or `if (!$user->can(...))` at the top of a method
- `abort(403)` or `abort_unless()` calls in controller methods
- `$this->authorize()` calls directly in controller (not in FormRequest)
- Authorization logic is invisible to Policy audits — no Policy class exists
- Same authorization check (`if (auth()->user()->isAdmin())`) is duplicated across multiple controllers

### Preferred Alternative
Move authorization to FormRequest `authorize()` methods or Policy classes. Use `$this->middleware('admin')` for role-based checks in the constructor.

### Related Rules
- Rule: Never Perform Authorization Logic Directly in Controllers

---

## Anti-Pattern 5: Fat Controller with 50+ Line Methods

### Category
Maintainability | Testing

### Description
Controller methods exceeding 30-100 lines that mix validation, queries, business logic, formatting, logging, and side effects in a single method.

### Why It Happens
Methods grow incrementally. Each sprint adds "just one more line" to an existing method until it becomes unmanageable.

### Warning Signs
- Method body is 3+ screens long
- Method handles validation, querying, calculation, formatting, event dispatching, and logging
- Method has multiple `if` branches for different business scenarios
- Testing the method requires creating multiple test scenarios for unrelated concerns
- Code reviewer cannot understand the method's purpose without detailed reading

### Preferred Alternative
Extract each concern to its proper layer. The refactored method should be 3-10 lines: validate (FormRequest), delegate (Service), return (Response/Resource).

### Related Rules
- Rule: Keep Controller Methods Under 10 Lines
- Rule: Follow the Three-Step Pattern: Validate, Delegate, Return
