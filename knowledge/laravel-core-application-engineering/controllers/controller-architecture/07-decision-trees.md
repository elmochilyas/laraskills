# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Controller Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

* Controller Pattern Selection (Resource vs Single-Action vs Plain)
* Constructor vs Method Injection in Controllers
* Web vs API Controller Separation

---

# Architecture-Level Decision Trees

---

## Decision 1: Controller Pattern Selection

---

## Decision Context

Choosing the right controller pattern for an HTTP endpoint — resource controller, single-action (invokable), or plain controller with custom methods.

---

## Decision Criteria

* Whether the endpoint is CRUD or non-CRUD
* Number of operations needed for the resource
* Whether operations share common dependencies
* Whether the endpoint is a simple single-purpose route

---

## Decision Tree

What type of operation does this endpoint handle?
↓
Standard CRUD (index, create, store, show, edit, update, destroy)?
YES → Resource controller with `Route::resource()` for web or `Route::apiResource()` for API
NO → Single non-CRUD operation (publish, approve, search, dashboard, webhook)?
    YES → Single-action (invokable) controller registered by class name only
NO → Multiple related non-CRUD operations (dashboard with stats/reports/exports)?
    YES → Plain controller with named methods
NO → Trivial redirect or static page?
    YES → `Route::redirect()` or `Route::view()` — no controller needed

---

## Rationale

Resource controllers enforce RESTful conventions and are the standard for CRUD. Single-action controllers provide clear naming for non-CRUD operations without cluttering resource controllers. Plain controllers group related non-CRUD operations. Each pattern has a specific use case.

---

## Recommended Default

**Default:** Resource controllers for CRUD, single-action controllers for non-CRUD operations, plain controllers for groups of related non-CRUD operations
**Reason:** Resource controllers provide predictable 7-method structure. Single-action controllers give each non-CRUD operation its own class. This combination keeps controllers focused and testable.

---

## Risks Of Wrong Choice

* Non-CRUD methods in resource controller: Violates predictable contract, requires manual routing
* Single-action controller for CRUD: Excessive file proliferation, loses organizational benefit
* Resource controller for read-only resource: Dead methods (create, store, edit, update, destroy)

---

## Related Rules

* Follow the Three-Step Controller Flow (05-rules.md)
* Enforce Maximum Controller Method Length (05-rules.md)
* Avoid God Controllers (05-rules.md)

---

## Related Skills

* Skill: Design and Implement Controller Architecture
* Skill: Create a Resource Controller for CRUD Operations
* Skill: Create a Single-Action Controller for a Non-CRUD Operation

---

## Decision 2: Constructor vs Method Injection in Controllers

---

## Decision Context

Whether to inject a dependency via the constructor (available to all methods) or via method injection (available only to one method).

---

## Decision Criteria

* Whether the dependency is used by multiple methods or just one
* Whether the dependency is request-specific (FormRequest, Request)
* Whether the dependency is a service vs input data

---

## Decision Tree

Is the dependency a Form Request or the HTTP Request object?
↓
YES → Method injection (type-hint in method signature)
NO → Is the dependency used by 2+ controller methods?
    YES → Constructor injection with `private readonly` promoted property
    NO → Single method only?
        YES → Method injection (keep constructor clean)
        NO → Constructor injection (preferred for all services)

---

## Rationale

Constructor injection makes shared dependencies visible in the class signature and resolved once per request. Method injection provides dependencies only where needed and is required for FormRequests (which must be validated before the method executes).

---

## Recommended Default

**Default:** Constructor injection for services used across multiple methods; method injection for request-specific dependencies (FormRequest, Request) and single-method services
**Reason:** Constructor injection avoids repeating DI in every method. Method injection keeps the constructor lean for request-specific dependencies that change per action.

---

## Risks Of Wrong Choice

* Request in constructor: Captures request state at construction time, may be stale
* All dependencies in constructor for single-use: Unnecessary injection, unused parameters in other methods
* Method injection for shared service: Repeated `$service->method()` in every action, harder to mock

---

## Related Rules

* Use Constructor Promotion for Injected Dependencies (05-rules.md)
* Use FormRequest Classes for All Validation (05-rules.md)

---

## Related Skills

* Skill: Design and Implement Controller Architecture
* Skill: Refactor a Fat Controller into a Thin Controller

---

## Decision 3: Web vs API Controller Separation

---

## Decision Context

Whether to use a single controller for both web (view/redirect) and API (JSON) responses or separate into dedicated controllers.

---

## Decision Criteria

* Whether the resource serves both HTML and JSON
* Number of routes for the resource
* Whether response types differ significantly
* Whether different middleware applies

---

## Decision Tree

Does the resource serve both web (HTML) and API (JSON) consumers?
↓
NO → Single controller with appropriate response type
YES → Does the application have 10+ routes total?
    YES → Separate into dedicated Web and API controllers:
        `App\Http\Controllers\Web\UserController` → `View`/`RedirectResponse`
        `App\Http\Controllers\Api\UserController` → `JsonResponse`/`UserResource`
    NO → Single controller with minimal `wantsJson()` conditional (< 3 lines)
NO → Does API require different middleware (auth, throttle, CORS)?
    YES → Separate controllers — middleware differs per channel
    NO → Separate controllers still recommended for clarity

---

## Rationale

Mixed response types create inconsistent consumer experiences and make it impossible to enforce API-specific behavior at the controller level. Separate controllers allow each to follow its own conventions without conditional logic.

---

## Recommended Default

**Default:** Separate Web and API controllers for any application with 10+ routes or distinct response format requirements
**Reason:** Dedicated controllers eliminate `wantsJson()` conditionals, allow API-specific middleware, and keep response types consistent per controller.

---

## Risks Of Wrong Choice

* Mixed response types: Every method has HTTP negotiation logic, tests must assert both formats, API changes affect web output
* Separate controllers for tiny app: Unnecessary files, route duplication
* `wantsJson()` at scale: Every method checks format, API and web concerns interleaved

---

## Related Rules

* Separate Web and API Controllers (05-rules.md)
* Return Explicit Response Types (05-rules.md)

---

## Related Skills

* Skill: Design and Implement Controller Architecture
