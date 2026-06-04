# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Resource Controller Methods
**Difficulty:** Beginner
**Category:** Resource Controllers
**Last Updated:** 2026-06-03

---

# Overview

Resource Controller Methods are the seven standard actions in a Laravel resource controller — index, create, store, show, edit, update, and destroy — with specific focus on the five API-relevant methods (index, store, show, update, destroy). They exist as the canonical pattern for mapping CRUD operations to HTTP verbs and controller methods in RESTful APIs.

Engineers must care because resource controllers are the most widely-used pattern in Laravel API development. Understanding the responsibilities, conventions, and best practices for each method directly impacts API consistency, maintainability, and adherence to REST principles.

---

# Core Concepts

**Index (GET /resources):** List resources with pagination, filtering, sorting, and eager loading. Returns a collection of resources.

**Store (POST /resources):** Accept validated input, delegate to action/service, return 201 with created resource.

**Show (GET /resources/{id}):** Return a single resource with its relationships. 404 if not found.

**Update (PUT/PATCH /resources/{id}):** Accept validated input, update resource, return 200 with updated resource or 204 for no content.

**Destroy (DELETE /resources/{id}):** Delete resource, return 204 No Content. Return 404 if already deleted.

**Create/Edit:** Return views in web controllers. Not used in API controllers.

---

# When To Use

- Standard CRUD endpoints in RESTful APIs
- Resources with create, read, update, and delete operations
- Endpoints following REST conventions

---

# When NOT To Use

- Non-CRUD endpoints (dashboard, reports, search)
- Single-action operations (use invokable controllers)
- Resources with only read operations (use single-action controllers)

---

# Best Practices

**Keep index methods lean.** Apply filtering, sorting, and pagination via reusable traits or query builders, not inline in the controller.

**Store returns 201 with created resource.** The response should include the full resource representation and its Location header.

**Show always returns a single resource.** Handle not found via route model binding (automatic 404) or explicit findOrFail.

**Update should accept partial updates (PATCH).** Use `$request->validated()` to get only the fields that were sent.

**Destroy returns 204 with no body.** The resource is gone — no content to return.

**Thin controllers.** Each method should be 3-5 lines: validate, delegate, respond. Business logic lives in actions/services.

---

# Architecture Guidelines

**Index:** Compose query via scopes/filters → paginate → return ResourceCollection.

**Store:** Validate via FormRequest → create DTO → dispatch action → respond with Resource + 201.

**Show:** Route model binding resolves model → authorize → return Resource.

**Update:** Validate via FormRequest (different from store) → create DTO → dispatch action → return Resource.

**Destroy:** Route model binding resolves model → authorize → dispatch action → respond 204.

**All methods delegate business logic.** Controllers orchestrate; they don't implement.

---

# Performance Considerations

**Index: pagination per_page** must be clamped. Prevent clients from requesting 1000 records.

**Show: eager loading** prevents N+1. `UserResource::make($user->load('posts'))`.

**Store/Update: validation** is fast. DTO creation is negligible.

**Destroy: cascading deletes** may be slow. Test delete performance for resources with many relationships.

---

# Security Considerations

**Authorization in every method.** Index may need scoping; Store needs create permission; Show needs view permission; Update needs update permission; Destroy needs delete permission.

**Input validation in Store and Update.** Use Form Requests for both.

**Destroy: soft deletes** for recoverability. Use `SoftDeletes` trait for important resources.

**Index: filter allowlist** prevents enumeration and injection.

---

# Common Mistakes

**Fat controllers.** Each method has 20+ lines of business logic instead of delegating to actions/services.

**Incorrect status codes.** Store returns 200 instead of 201. Destroy returns 200 with body instead of 204.

**No authorization.** All methods accessible without permission checks.

**Missing validation in Update.** Using the same Form Request as Store, which requires fields that shouldn't be required on update.

**No eager loading in Index.** N+1 queries for every relationship displayed in the list.

---

# Anti-Patterns

**God Controller:** All CRUD methods in one class with 500+ lines. Each method contains business logic.
**Better approach:** Thin controller delegates to actions/services. Max ~50 lines per controller.

**Incorrect HTTP Semantics:** Store returning a list, Destroy returning the deleted resource, Update returning 200 without the updated resource.
**Better approach:** Follow REST conventions: Store=201+resource, Destroy=204, Update=200+resource.

**Missing Resource Transformation:** Returning raw Eloquent models from controller methods without using API Resources.
**Better approach:** Always transform through API Resource classes for consistent response structure.

**Validation In Controller:** Calling `$request->validate([...])` in controller methods instead of using Form Requests.
**Better approach:** Form Requests for all validation. Controllers should not contain validation logic.

---

# Examples

**Resource controller methods:**
```
class UserController extends Controller
{
    public function index(ListUsersRequest $request): AnonymousResourceCollection
    {
        $users = User::query()
            ->applyFilters($request->filters())
            ->applySort($request->sort())
            ->paginate($request->perPage());
        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->createUserAction->__invoke($request->toDto());
        return UserResource::make($user)->response()->setStatusCode(201);
    }

    public function show(User $user): UserResource
    {
        $this->authorize('view', $user);
        return UserResource::make($user->load('posts'));
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $user = $this->updateUserAction->__invoke($request->toDto(), $user);
        return UserResource::make($user);
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);
        $this->deleteUserAction->__invoke($user);
        return response()->json(null, 204);
    }
}
```

---

# Related Topics

**Prerequisites:**
- Laravel Controller Basics
- RESTful API Principles

**Closely Related Topics:**
- Resource Controller Pattern — comprehensive controller design
- Thin Controller Enforcement — keeping controllers thin
- Controller Response Selection — choosing response types

**Advanced Follow-Up Topics:**
- Controller Action Delegation — delegating to actions/services
- Controller Testing Strategies — testing controller methods

**Cross-Domain Connections:**
- Form Request Design — validation for store/update
- API Resource Transformation — response formatting
- Pagination Strategies — index method pagination
