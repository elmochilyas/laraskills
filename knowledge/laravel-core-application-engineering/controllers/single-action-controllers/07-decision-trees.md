# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Single-Action Controllers
**Generated:** 2026-06-03

---

# Decision Inventory

* Single-Action Controller vs Closure Route
* Single-Action Controller vs Resource Controller Method
* Single-Action Controller vs Full Controller Class

---

# Architecture-Level Decision Trees

---

## Decision 1: Single-Action Controller vs Closure Route

---

## Decision Context

Whether to define a route handler as an inline Closure in the route file or as a dedicated single-action (invokable) controller class.

---

## Decision Criteria

* Whether route caching is needed
* Whether the handler needs testing in isolation
* Whether the handler has more than 5 lines of logic
* Whether IDE navigation is important

---

## Decision Tree

Does the route need to be cached by `php artisan route:cache`?
↓
YES → Single-action controller (Closures cannot be cached)
NO → Does the handler have more than 5 lines of logic?
    YES → Single-action controller (manages complexity)
NO → Does the handler need unit testing?
    YES → Single-action controller (testable in isolation)
NO → Is the handler a trivial redirect or static view?
    YES → Use `Route::redirect()` or `Route::view()` — no controller needed
NO → Is this a prototype that will be rewritten before production?
    YES → Closure is acceptable temporarily — convert before production

---

## Rationale

Closure routes cannot be cached, are invisible to IDE navigation, and cannot be tested independently. Single-action controllers support route caching, are IDE-resolvable, and can be tested with standard controller test patterns.

---

## Recommended Default

**Default:** Single-action controller for any production route handler; `Route::redirect()`/`Route::view()` for trivial cases
**Reason:** Route caching requires controllers. Testability requires named classes. IDE navigation requires explicit files. Closures sacrifice all three for minor convenience.

---

## Risks Of Wrong Choice

* Closure in production: Route caching fails, cannot be tested independently, invisible to IDE refactoring
* Controller for trivial redirect: Unnecessary file for a one-line route definition

---

## Related Rules

* Prefer Single-Action Controllers Over Closure Routes (05-rules.md)
* Keep __invoke() Under 15 Lines (05-rules.md)
* Register Single-Action Controllers by Class Only (05-rules.md)

---

## Related Skills

* Skill: Create a Single-Action Controller for a Non-CRUD Operation
* Skill: Convert a Closure Route to a Single-Action Controller

---

## Decision 2: Single-Action Controller vs Resource Controller Method

---

## Decision Context

Whether to add a non-CRUD operation as a method in an existing resource controller or create a dedicated single-action controller.

---

## Decision Criteria

* Whether the operation is CRUD or non-CRUD
* How many related non-CRUD operations exist
* Whether the operation is tightly coupled to the resource lifecycle

---

## Decision Tree

Is the operation a standard CRUD action (index, store, show, update, destroy)?
↓
YES → Resource controller method (use Route::resource())
NO → Is it a non-CRUD operation (publish, archive, approve, search)?
    YES → Is it tightly coupled to the resource lifecycle AND agreed by team?
        YES AND team agrees → May be added as named method with explicit route
        NO → Single-action controller (PublishPostController, SearchUsersController)
NO → Is it a utility operation (export, import, send-email)?
    YES → Single-action controller
NO → Is it a reporting or dashboard operation?
    YES → Single-action controller or plain controller

---

## Rationale

Non-CRUD operations added to a resource controller violate the predictable resource contract and require manual route registration anyway. Single-action controllers give each operation its own class with clear naming and explicit route registration.

---

## Recommended Default

**Default:** Single-action controllers for all non-CRUD operations; keep resource controllers to the standard 7 (or 5) actions
**Reason:** Resource controllers should be predictable. Non-CRUD operations deserve their own named class. This separation makes both patterns clearer.

---

## Risks Of Wrong Choice

* Non-CRUD method in resource controller: Violates resource contract, requires manual routes, confusing API surface
* Single-action for CRUD: Excessive files — 5 controllers instead of 1 resource controller

---

## Related Rules

* Use Single-Action Controllers for Non-CRUD Operations (05-rules.md)
* Do Not Use Single-Action Controllers for CRUD Operations (05-rules.md)
* Name Single-Action Controllers by Operation (05-rules.md)

---

## Related Skills

* Skill: Extract Non-CRUD Operations from a Resource Controller

---

## Decision 3: Single-Action Controller vs Full Controller Class

---

## Decision Context

Whether to create an invokable controller (one `__invoke()` method) or a plain controller (multiple named methods) for a group of related operations.

---

## Decision Criteria

* Number of related operations
* Whether operations are independent or grouped by resource
* Whether operations share dependencies

---

## Decision Tree

How many operations need to be grouped?
↓
Exactly 1 operation?
YES → Single-action (invokable) controller — use `__invoke()`
NO → 2+ related operations?
    YES → Do operations share the same service/action dependency?
        YES → Do operations group naturally (dashboard stats + reports + export)?
            YES → Plain controller with named methods
            NO → Multiple single-action controllers (each gets its own class)
NO → Is the single operation a standard CRUD action?
    YES → Resource controller (group all CRUD)
    NO → Single-action controller

---

## Rationale

Single-action controllers are for atomic operations. Plain controllers are for grouping related operations that share dependencies and context. The decision depends on whether the operations are truly independent or naturally grouped.

---

## Recommended Default

**Default:** Single-action controller for atomic operations; plain controller for groups of related non-CRUD operations
**Reason:** Atomic operations benefit from the clarity of a single-purpose class. Related operations benefit from shared dependencies and co-location in a plain controller.

---

## Risks Of Wrong Choice

* Single-action for every operation: Excessive files, no shared dependency management
* Plain controller for completely unrelated operations: Confusing class with no cohesive purpose
* Single-action with second public method: Dead code that can never be routed

---

## Related Rules

* Expose Only __invoke() as a Public Method (05-rules.md)
* Use Constructor Injection in Single-Action Controllers (05-rules.md)
* Keep Single-Action Controllers Free of Custom Traits (05-rules.md)

---

## Related Skills

* Skill: Create a Single-Action Controller for a Non-CRUD Operation
