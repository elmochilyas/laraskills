# Form Request Organization

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-form-request-organization |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Intermediate |
| Classification | Organization Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

As endpoint count grows, a flat `App\Http\Requests` directory becomes unmaintainable. Per-resource and per-action organization patterns, inheritance hierarchies, and versioned namespaces keep validation logic discoverable and maintainable. The FormRequest directory structure should mirror the API surface, creating a 1:1 mapping between filesystem and API contract.

## Core Concepts

- **Per-Resource Subdirectories**: Each API resource gets a dedicated subdirectory (e.g., `Posts/`, `Comments/`, `Auth/`).
- **Per-Action Suffix Convention**: `Index*Request`, `Store*Request`, `Show*Request`, `Update*Request`, `Destroy*Request`, `BulkStore*Request`.
- **Versioned Namespace**: `App\Http\Requests\Api\V1\{Resource}\{Action}Request.php`.
- **Base Request per Resource**: Shared rules captured in a `Base{Resource}Request` class for Store/Update rule reuse.
- **ApiRequest Base Class**: Application-wide base providing consistent error handling, headers, and shared behavior.

## When To Use

- For any API with more than 5-10 endpoints
- When multiple developers work on the same codebase and need consistent navigation
- When API versioning requires parallel request class sets
- For any team that values convention-over-configuration for developer experience
- When CI checks need to validate directory structure matches API routes

## When NOT To Use

- For trivial APIs with 1-2 endpoints (flat directory suffices)
- For prototype-stage applications before structure is settled
- When using Spatie Laravel Data's `DataRequest` which centralizes validation in DTOs
- For micro-endpoints that use inline validator creation

## Best Practices (WHY)

- **Mirror the API surface**: Filesystem maps to API contract — developers locate validation by knowing the URL.
- **Use action-suffixed names**: `StorePostRequest` is more natural than `PostStoreRequest`.
- **Version the namespace**: `Api\V1\*` allows breaking changes across API versions without file conflicts.
- **Use Base per-resource request**: Reduces rule duplication across Store/Update without fragile conditionals.
- **Keep ApiRequest abstract**: Prevents direct instantiation and forces endpoint-specific implementations.
- **Enforce directory structure with CI**: PHPStan/Larastan rule ensures consistency.
- **Document conventions in CONTRIBUTING.md**: Ensures consistency across teams.

## Architecture Guidelines

- Layout: `App\Http\Requests\Api\V1\{Resource}\{Action}Request.php`
- Suffix mapping: `Index`, `Store`, `Show`, `Update`, `Destroy`, `BulkStore` + resource name.
- Base request per resource: `Base{Resource}Request` with shared rules.
- Application-wide base: `App\Http\Requests\Api\ApiRequest` overriding `failedValidation()` and `failedAuthorization()`.
- Use `git mv` when renaming endpoints to preserve file history.
- For versioned APIs, maintain parallel directory trees (`V1/`, `V2/`).

## Performance Considerations

- Deep namespaces have zero runtime cost — autoloader only loads used files.
- Avoid loading all FormRequests in a ServiceProvider — register only when needed.
- Base request classes should be `abstract` to prevent direct instantiation.
- Autoloader caching (Composer optimized) reduces filesystem lookups.

## Security Considerations

- Versioned namespaces prevent old request classes from being accidentally loaded.
- Base request classes enforce consistent authorization and error handling.
- Inheritance chains should be limited to 2 levels max to prevent security logic from being buried.
- CI should validate that all FormRequests extend the correct base class.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Flat directory with 50+ files | Unmaintainable request folder | No organization strategy | Hard to find files; naming collisions | Per-resource subdirectories |
| Single file with isMethod() sniffing | Store/Update in one class | Convenience | Harder to test; fragile conditionals | Separate files per action |
| Forgetting namespace move | Class not found after moving | Manual file moves without autoloader update | Runtime errors | Run `composer dump-autoload` after move |
| Over-abstracting base requests | 3+ level deep inheritance | Too much reuse | Hard to debug; fragile base class problem | Limit to 2 levels max |
| No version namespace | V1 and V2 requests collide | Starting without versioning | Breaking changes affect old endpoints | Always namespace by version |

## Anti-Patterns

- **Flat `Requests/` directory with 100+ files**: No organization — naming collisions and discovery issues.
- **Actions as directories**: `Posts/Store/Request.php` instead of `Posts/StorePostRequest.php` — excessive nesting.
- **No base request class**: Each FormRequest duplicates `failedValidation()` and headers.
- **Abstract naming without Base prefix**: `PostRequest` as abstract — confuses with concrete request.
- **Mix of web and API requests in same directory**: Web requests (redirects) and API requests (JSON) have different error handling.

## Examples

```
App\Http\Requests\Api\V1\
├── ApiRequest.php                     (base)
├── Posts\
│   ├── BasePostRequest.php            (shared rules)
│   ├── IndexPostsRequest.php
│   ├── StorePostRequest.php
│   ├── ShowPostRequest.php
│   ├── UpdatePostRequest.php
│   ├── DestroyPostRequest.php
│   └── BulkStorePostsRequest.php
├── Comments\
│   ├── BaseCommentRequest.php
│   ├── StoreCommentRequest.php
│   └── UpdateCommentRequest.php
└── Auth\
    ├── LoginRequest.php
    ├── RegisterRequest.php
    └── ResetPasswordRequest.php
```

## Related Topics

- Form Request Design for APIs (the request class structure being organized)
- Authorization in Form Requests (authorize() placement)
- DTO Integration: payload() Method (payload() within organized requests)
- Conditional Validation Patterns (conditional rules across request classes)

## AI Agent Notes

- Place FormRequests in `App\Http\Requests\Api\V1\{Resource}\{Action}Request.php`.
- Use action-suffixed naming: `StorePostRequest`, not `PostStoreRequest`.
- Create a `Base{Resource}Request` for shared rules when Store and Update overlap.
- Always version the namespace (`V1`, `V2`) even if only one version exists.
- Limit inheritance to 2 levels max: `ApiRequest` → `BasePostRequest` → `StorePostRequest`.

## Verification

- [ ] All FormRequests follow `App\Http\Requests\Api\V{N}\{Resource}\{Action}Request` convention
- [ ] Action suffix matches HTTP method (Index, Store, Show, Update, Destroy)
- [ ] A base `ApiRequest` class exists in `App\Http\Requests\Api\`
- [ ] Per-resource base requests are prefixed `Base`
- [ ] No flat directory with mixed resources
- [ ] No single file handling both Store and Update via `isMethod()`
- [ ] CI validates directory structure against API route definitions
