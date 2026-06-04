# ECC Standardized Knowledge — API Versioning

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | API Versioning |
| **Difficulty** | Advanced |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

API versioning manages the coexistence of multiple API versions so that existing consumers are not broken when the API changes. Laravel supports three versioning strategies: **URI versioning** (`/api/v1/users`, `/api/v2/users`), **header versioning** (`Accept: application/vnd.app.v1+json`), and **query parameter versioning** (`/api/users?version=1`).

URI versioning is the most common and most practical for Laravel applications because it maps naturally to route groups, is cacheable, and is visible in documentation. Header versioning is more RESTful in theory but harder to implement, debug, and cache. Query parameter versioning is the least recommended due to cache pollution and ambiguous route matching.

---

## Core Concepts

### URI Versioning
Routes are grouped by version prefix. Each version has its own controllers and resources. The URL explicitly identifies the API version.

### Header Versioning
The version is specified in the `Accept` header. The same URI serves different versions. Middleware reads the header and routes to the appropriate handler.

### Query Parameter Versioning
The version is a query parameter. Same URI, different parameter value. Least recommended due to cache and routing complexity.

### Controller Inheritance
V2 controllers can extend V1 controllers to inherit unchanged endpoints, overriding only what changed between versions. This minimizes code duplication.

### Resource Versioning
API Resources are organized by version directory (`app/Http/Resources/V1/`, `V2/`) with the same approach — V2 resources extend V1 for unchanged fields.

---

## When To Use

- Public APIs with external consumers (mandatory — you cannot break consumers)
- APIs undergoing active development with breaking changes
- Multi-version mobile apps where consumers cannot upgrade immediately
- APIs serving different client types (web, mobile, third-party)

---

## When NOT To Use

- Internal-only APIs where all consumers can be updated simultaneously
- Pre-release APIs (use a single version until stable)
- Single-consumer applications (frontend + backend under same deployment)
- APIs in active development before first stable release

---

## Best Practices

### Prefer URI Versioning
Use `/api/v1/`, `/api/v2/` as the versioning strategy.

**Why:** URI versioning is explicit, cacheable, testable, and documented. Header versioning is invisible in URLs and harder to debug. Query parameter versioning pollutes cache keys.

### Use Controller Inheritance for Migration
Create V2 controllers that extend V1 controllers for unchanged endpoints.

**Why:** Inheritance minimizes code duplication during version migration. Only the changed methods need to be overridden.

### Version Resources Separately
Maintain separate Resource classes per version in version-specific directories.

**Why:** API response contracts change between versions. Separate resource classes prevent accidentally exposing new fields in old versions.

### Document Deprecation
Add deprecation headers to old versions and document sunset timelines.

**Why:** Consumers need visibility into which versions are deprecated and when they will be removed. Deprecation headers (`Sunset`, `Deprecation`) provide programmatic notification.

---

## Architecture Guidelines

### URI Version Structure
```php
Route::prefix('api')->group(function () {
    Route::prefix('v1')->group(function () {
        Route::apiResource('users', Api\V1\UserController::class);
    });
    Route::prefix('v2')->group(function () {
        Route::apiResource('users', Api\V2\UserController::class);
    });
});
```

### Controller Inheritance
```php
namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Api\V1\UserController as V1UserController;

class UserController extends V1UserController
{
    // Override only changed endpoints
    public function show($id)
    {
        // V2-specific implementation
    }
}
```

### Resource Directory Structure
```
app/Http/Resources/
├── V1/
│   ├── UserResource.php
│   └── UserCollection.php
└── V2/
    ├── UserResource.php    (extends V1 for unchanged fields)
    └── UserCollection.php
```

---

## Performance Considerations

Versioning adds no direct performance overhead. The routing layer handles version-specific matching via standard group prefixing. Controller inheritance adds minimal PHP overhead (parent constructor calls). Resource inheritance adds minimal overhead per response.

---

## Security Considerations

### Deprecated Version Vulnerabilities
Old API versions often lack security fixes applied to newer versions. Consider rate-limiting deprecated versions more aggressively or blocking them entirely after a sunset period.

### Authentication Consistency
All versions should use the same authentication mechanism. Different auth schemes per version create security confusion and maintenance burden.

---

## Common Mistakes

### Not Versioning from the Start
Desc: Building an API without versioning, then needing to add it later.
Cause: Assuming the API won't need breaking changes.
Consequence: Painful migration when the first breaking change is needed.
Better: Add versioning from the first release, even if initially only one version exists.

### Code Duplication Across Versions
Desc: Copying entire controllers and resources for each version.
Cause: Not using inheritance or shared base classes.
Consequence: Bug fixes must be applied across multiple files; they inevitably diverge.
Better: Use controller inheritance and share common code via traits or base classes.

### Supporting Too Many Versions
Desc: Maintaining 5+ API versions simultaneously.
Cause: Not enforcing sunset policies.
Consequence: Exponential maintenance burden; every change must be tested against all versions.
Better: Set a maximum supported versions policy (e.g., last 2 major versions).

---

## Anti-Patterns

### Versioning by Database Schema
Tying API versions to database schema versions. Schema changes should not dictate API contract changes. Use transformers/resources to decouple.

### Mixing Versioning Strategies
Using URI versioning for some endpoints and header versioning for others. Choose one strategy and apply consistently.

---

## Examples

### URI Versioning with Groups
```php
Route::prefix('api/v1')->name('v1.')->group(function () {
    Route::apiResource('users', Api\V1\UserController::class);
    Route::apiResource('posts', Api\V1\PostController::class);
});

Route::prefix('api/v2')->name('v2.')->group(function () {
    Route::apiResource('users', Api\V2\UserController::class);
    Route::apiResource('posts', Api\V2\PostController::class);
});
```

### Versioned Resource
```php
// V2/UserResource.php
class UserResource extends \App\Http\Resources\V1\UserResource
{
    public function toArray($request): array
    {
        return array_merge(parent::toArray($request), [
            'phone' => $this->phone, // New field in V2
            'bio' => $this->bio,
        ]);
    }
}
```

---

## Related Topics

### Prerequisites
- **Route Groups** — Prefix-based version groups
- **Resourceful Routing** — API resource registration per version

### Closely Related
- **API Resources** — Response transformation per version
- **Resource Organization** — Versioned resource directory structure

### Advanced
- **Versioned Resources** — Resource inheritance across versions
- **Sparse Fieldsets** — Client-specified field selection per version

### Cross-Domain
- **API & CRUD System Engineering** — API contract management

---

## AI Agent Notes

### Important Decisions
- URI versioning is the recommended strategy for Laravel APIs
- Controller inheritance reduces code duplication between versions
- Resource classes should be versioned separately from controllers
- Deprecation headers should be added to old versions proactively

### Important Constraints
- All versions share the same authentication system
- Route caching works with versioned route groups
- Controller inheritance only works for compatible method signatures
- A maximum supported versions policy prevents exponential maintenance

### Rules Generation Hints
- Enforce URI versioning over header or query parameter versioning
- Enforce controller inheritance for V2+ over code duplication
- Enforce maximum of 2 active major versions at any time

---

## Verification

This document has been validated against:
- Laravel route group prefix patterns for versioning
- Production API versioning patterns (Stripe, GitHub, Twilio)
- Controller inheritance patterns in versioned APIs
