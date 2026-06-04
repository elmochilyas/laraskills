# Resource Controller Methods

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** resource-controllers
- **Knowledge Unit:** Resource Controller Methods
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-04

---

## Executive Summary
Resource Controller Methods define the standard set of controller actions for CRUD operations — index, show, store, update, destroy — and their corresponding HTTP methods, routes, and conventions. Mastery ensures consistent API design and predictable developer experience.

---

## Core Concepts
- **Seven Standard Actions**: `index` (GET list), `create` (GET form — not used in APIs), `store` (POST create), `show` (GET detail), `edit` (GET form — not used in APIs), `update` (PUT/PATCH update), `destroy` (DELETE remove)
- **API-Only Resources**: Using `apiResource()` which registers only `index`, `show`, `store`, `update`, `destroy` (skipping `create`, `edit`)
- **Method Signatures**: Each action receives the request and optionally route parameters: `index(Request $request)`, `store(StoreRequest $request)`, `show(User $user)`
- **Response Conventions**: `index` returns collection, `show` returns single resource, `store` returns created resource with 201, `update` returns updated resource, `destroy` returns 204
- **Route-Controller Binding**: `Route::resource('users', UserController::class)` maps all actions in one line

---

## Mental Models
1. **Restaurant Kitchen Model**: Each action is a station in a kitchen. `index` is the menu (list of dishes), `show` is the plate (one dish), `store` is cooking a new dish, `update` is modifying a dish, `destroy` is discarding it.
2. **Library CRUD Model**: Like library operations — browse (index), check details (show), add (store), update catalog (update), remove (destroy).

---

## Internal Mechanics
`Route::resource('users', UserController::class)` registers seven named routes with appropriate HTTP methods and URLs. The action methods receive type-hinted dependencies via Laravel's service container. Route model binding automatically resolves `User $user` from the URL `{user}` parameter. The response type and status code follow REST conventions.

---

## Patterns

### Pattern 1: Thin Controller
**Purpose**: Controllers only handle HTTP concerns — delegate business logic to actions/services
**Benefits**: Single responsibility, easy to test
**Tradeoffs**: Requires additional classes for business logic

### Pattern 2: Form Request Injection
**Purpose**: Type-hint form requests in store/update methods for automatic validation
**Benefits**: Validation is encapsulated and reusable
**Tradeoffs**: More files, but the standard approach

---

## Architectural Decisions
### When To Use
- Any CRUD API following REST conventions
- New Laravel API projects using Route::resource
- Teams needing consistent controller structure

### When To Avoid
- Non-CRUD endpoints (search, bulk operations, custom actions)
- Read-only APIs (use only index and show)
- Micro-controllers for single-action endpoints (use invokable controllers instead)

### Alternatives
- Invokable single-action controllers for custom operations
- API resource controllers for JSON-only responses
- Explicit route-to-controller mapping for fine-grained control

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Consistent, predictable structure | Fixed 7-action pattern doesn't fit all cases | Use apiResource() for APIs |
| One-line route registration | Learning curve for the conventions | Document resource action mappings |
| Framework-optimized | Controllers grow large with complex logic | Delegate to actions/services |
| Built-in route model binding | Implicit bindings can be confusing | Add type hints and policy checks |

---

## Performance Considerations
- Controller method resolution is negligible
- Form request validation runs before controller — plan validation overhead
- Route model binding adds one query per bound model
- Use `chunk()` or `cursor()` in index for large collections

---

## Production Considerations
- Log controller action invocations for audit
- Monitor the distribution of requests across actions (hot endpoints)
- Add middleware to resource routes for auth, rate limiting, etc.
- Test all seven (or five) actions for each resource
- Document which actions are available for each resource

---

## Common Mistakes
**Using full resource() for APIs**: Registers `create` and `edit` routes that return HTML forms. Use `apiResource()` instead.
**Not using route model binding**: Manually fetching models with `Model::findOrFail()` instead of type-hinting `User $user`.
**Inconsistent response codes**: Using 200 for store and destroy instead of 201 and 204.
**Fat controllers**: Controllers with complex business logic should delegate to actions or services.

---

## Failure Modes
**Missing action**: A resource controller called for a non-registered action returns 404. *Detection:* Route listing shows missing actions. *Mitigation:* Use `Route::resource()` to ensure all actions exist.
**Incorrect method signature**: Type-hinting the wrong request or model causes resolution errors. *Detection:* Runtime exceptions. *Mitigation:* Stick to convention signatures.

---

## Ecosystem Usage
Laravel's `Route::resource()` and `Route::apiResource()` are the standard registration methods. `php artisan make:controller UserController --resource` generates the skeleton. `--api` flag generates an API-only resource controller.

---

## Related Knowledge Units
### Prerequisites
- HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Laravel routing basics

### Related Topics
- Nested resource controllers
- Single-action invokable controllers
- Controller middleware assignment

### Advanced Follow-up Topics
- Controlling route names and parameters
- Custom resource controller methods
- Resource controller response customization

---

## Research Notes
- `apiResource()` was introduced in Laravel 5.5 and is preferred for JSON APIs
- `Route::resource()` registers routes in a specific order — parameters must be declared before optional ones
- Resource controllers are a REST convention, not a Laravel invention; they mirror typical Rails and Django REST patterns
