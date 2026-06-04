# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Controller Dependency Injection
**Generated:** 2026-06-03

---

# Decision Inventory

* Constructor Injection vs Method Injection
* Service Locator (`app()->make()`) vs Explicit Injection
* FormRequest vs Request Type Hinting

---

# Architecture-Level Decision Trees

---

## Decision 1: Constructor Injection vs Method Injection

---

## Decision Context

Whether to inject a dependency via the controller's constructor (available to all methods) or via the specific method signature.

---

## Decision Criteria

* Whether the dependency is used by multiple methods or just one
* Whether the dependency is request-scoped (Request, FormRequest)
* Whether the dependency is optional for the controller

---

## Decision Tree

Is the dependency `Illuminate\Http\Request`, a FormRequest, or route model binding?
↓
YES → Method injection ONLY:
    FormRequest: `public function store(StoreUserRequest $request)`
    Request: `public function index(Request $request)`
    Route binding: `public function show(User $user)`
NO → Is the dependency used by 2+ controller methods?
    YES → Constructor injection with `private readonly`:
        `public function __construct(private readonly UserService $service) {}`
NO → Is the dependency used by exactly 1 method?
    YES → Method injection — keep constructor lean:
        `public function export(ExportRequest $request, UserExportService $service)`
NO → Is the dependency optional (only needed in some requests)?
    YES → Method injection — constructor injection resolves on every request
    NO → Constructor injection

---

## Rationale

Constructor injection makes shared dependencies visible in the class signature and resolves them once. Method injection resolves dependencies only when the specific method is called. FormRequests and Request objects must be method-injected because they are request-scoped and must be resolved at method-call time, not construction time.

---

## Recommended Default

**Default:** Constructor injection for services used by 2+ methods; method injection for FormRequests, Request, and single-method services
**Reason:** Constructor injection avoids repeating DI in every method. Method injection keeps the constructor lean for request-specific and single-use dependencies.

---

## Risks Of Wrong Choice

* Request in constructor: Stale request state, auth not yet available
* FormRequest in constructor: Validation runs at wrong time (construction vs method call)
* All deps in constructor: Unnecessary resolution for methods that don't use them

---

## Related Rules

* Use Constructor Injection for Shared Service Dependencies (05-rules.md)
* Use Method Injection for Form Requests (05-rules.md)
* Never Inject Request in Controller Constructors (05-rules.md)
* Use Method Injection for Single-Method Dependencies (05-rules.md)

---

## Related Skills

* Skill: Apply Dependency Injection to Controllers

---

## Decision 2: Service Locator vs Explicit Injection

---

## Decision Context

Whether to resolve a dependency using `app()->make()`, `resolve()`, or `App::make()` inside a controller method, or declare it via constructor or method injection.

---

## Decision Criteria

* Whether the dependency class is known at compile time
* Whether the dependency is conditionally resolved based on runtime config
* Whether the controller needs to be testable

---

## Decision Tree

Is the dependency class known and fixed at compile time (always resolves to same class)?
↓
YES → Explicit injection (constructor or method) — NEVER use service locator
NO → Does the dependency resolve to different implementations based on runtime conditions?
    YES → Extract to a factory/strategy class — inject the factory:
        ```php
        $storage = $this->storageFactory->forRequest($request);
        ```
        Not: `app(FileStorage::class)` vs `app(S3Storage::class)` in method body
    NO → Is the dependency genuinely dynamic (class unknown until runtime)?
        YES → Service locator is acceptable but document why
        NO → Explicit injection
NO → Does the controller need to be unit-testable?
    YES → Explicit injection (service locator cannot be mocked without modifying code)
    NO → Service locator is a code smell even without testing requirements

---

## Rationale

Service locator calls (`app()->make()`) create hidden dependencies that are invisible in the class or method signature. They cannot be mocked or substituted during testing without modifying the controller code. Explicit injection makes dependencies visible and testable.

---

## Recommended Default

**Default:** Explicit injection (constructor for shared, method for single-use). Never use `app()->make()` in controller methods.
**Reason:** Explicit injection documents dependencies in the method/class signature, enables mocking, and follows Laravel's intended DI pattern. Service locators hide dependencies and bypass container resolution optimizations.

---

## Risks Of Wrong Choice

* Service locator in methods: Hidden dependencies, cannot mock in tests
* Factory for simple static resolution: Over-engineering for a class that always resolves the same
* `app()->make()` in constructor: Same hidden dependency problem, but at construction time

---

## Related Rules

* Avoid Service Locator Calls in Controller Methods (05-rules.md)
* Limit Constructor Dependencies to a Reasonable Count (05-rules.md)

---

## Related Skills

* Skill: Refactor Away Service Locator Calls in Controllers

---

## Decision 3: FormRequest vs Request Type Hinting

---

## Decision Context

Whether to type-hint a dedicated FormRequest class or the base `Illuminate\Http\Request` in a controller method that receives input.

---

## Decision Criteria

* Whether the method accepts input data that needs validation
* Whether the input is simple query-string filters or complex payload
* Whether authorization hooks are needed

---

## Decision Tree

Does the method accept POST/PUT/PATCH data that needs validation?
↓
YES → FormRequest (dedicated class):
    `public function store(StoreUserRequest $request)`
    Validation happens automatically before method body
    `authorize()`, `prepareForValidation()`, `after()` hooks available
NO → Does the method accept query-string parameters (filters on index)?
    YES → Is there only 1-2 simple optional filters?
        YES → `Request` is acceptable: `$request->input('sort')`
        NO → 3+ filters with validation rules?
            YES → FormRequest (dedicated filter request class)
            NO → Request
NO → Does the method need `authorize()` to check permissions?
    YES → FormRequest — `authorize()` is only available in FormRequest
    NO → Request may be sufficient

---

## Rationale

Type-hinting `Request` instead of a FormRequest means validation is not automatically performed. The method must manually call `$request->validate()`, pushing validation logic into the controller and preventing the FormRequest's hooks from executing. FormRequests are the standard pattern for any action that receives input.

---

## Recommended Default

**Default:** FormRequest for every method that accepts input (store, update, filter-heavy index). `Request` only for simple query-string filters on read actions.
**Reason:** FormRequests provide automatic validation, authorization hooks, and input preparation. `Request` should be reserved for the simplest cases where a dedicated FormRequest would have only 1-2 rules.

---

## Risks Of Wrong Choice

* `Request` for store: Manual validation in controller method, no FormRequest hooks
* FormRequest for trivial single-field filter: Unnecessary class for a simple `$request->input('sort')`
* `Request` when authorize() needed: No `authorize()` method, auth check moved to controller

---

## Related Rules

* Always Type-Hint FormRequest Instead of Request (05-rules.md)
* Use Method Injection for Route Model Binding (05-rules.md)

---

## Related Skills

* Skill: Apply Dependency Injection to Controllers
