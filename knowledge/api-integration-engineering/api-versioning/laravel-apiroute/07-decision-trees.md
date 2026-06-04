# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 05-api-versioning
**Knowledge Unit:** laravel-apiroute
**Generated:** 2026-06-03

---

# Decision Inventory

1. Versioning Strategy Selection (URI vs Header vs Mixed)
2. Route Organization Strategy (Separate Files vs Groups)
3. Controller Organization Strategy (Namespaced vs Shared)

---

# Architecture-Level Decision Trees

---

## Versioning Strategy Selection

---

## Decision Context

Choosing the versioning approach for Laravel API routes.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the API consumed by external developers?
↓
YES → Use URI path versioning (/api/v1/users)
  ↓
  Need to support header-based versioning for mobile clients?
  ↓
  YES → URI primary + Accept header fallback for cleaner mobile URLs
  NO → URI versioning alone for consistency
NO → Is the API internal within the same organization?
  ↓
  YES → Header-based or query parameter versioning (simpler URLs)
  NO → URI versioning recommended regardless
  ↓
  Need to use a package like Grazulex/laravel-apiroute?
  ↓
  YES → Package handles multiple strategies + lifecycle management
  NO → Manual route group versioning with prefix()

---

## Rationale

URI versioning is the most straightforward for Laravel route files. Packages add lifecycle management features. Manual prefix-based versioning works for simple cases.

---

## Recommended Default

**Default:** URI versioning with Route::prefix('v1') in separate route files
**Reason:** Simplest to implement; most visible; works with route caching

---

## Risks Of Wrong Choice

Header versioning without middleware adds per-route complexity. Mixed strategies confuse consumers. Over-engineering with packages for simple APIs adds unnecessary dependency.

---

## Related Rules

Prefer URI Versioning for Simplicity and Visibility

---

## Related Skills

Implement SaloonPHP Pagination Plugin

---

## Route Organization Strategy

---

## Decision Context

Structuring route files for multiple API versions.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Are there multiple API versions active simultaneously?
↓
YES → Separate route files per version: routes/api/v1.php, routes/api/v2.php
  ↓
  Do versions share some common routes?
  ↓
  YES → Common routes in shared file; version-specific routes in version files
  NO → Fully independent route files per version
NO → Single version in active development?
  ↓
  YES → Single route file with prefix() for future versioning
  NO → No versioning needed; single set of routes
  ↓
  Need route caching for performance?
  ↓
  YES → Separate route files support php artisan route:cache
  NO → Group-based versioning without separate files

---

## Rationale

Separate route files per version provide clean organization and support route caching. Shared route files reduce duplication for identical endpoints across versions.

---

## Recommended Default

**Default:** Separate routes/api/v1.php, routes/api/v2.php with RouteServiceProvider registration
**Reason:** Clean separation; route cache support; easy to add/remove versions

---

## Risks Of Wrong Choice

Single route file with mixed version logic becomes complex and hard to maintain. No route caching impacts production performance on APIs with many routes.

---

## Related Rules
Version at the Route Level, Not Individual Endpoints

---

## Related Skills
Implement SaloonPHP Pagination Plugin

---

## Controller Organization Strategy

---

## Decision Context

Structuring controllers and service layers for versioned APIs.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Do different API versions share business logic?
↓
YES → Namespaced controllers per version; shared service layer
  ↓
  Do response formats differ significantly between versions?
  ↓
  YES → Versioned DTOs/Resources per version; shared domain services
  NO → Controllers only differ in routing; services are identical
NO → Are versions completely independent?
  ↓
  YES → Fully separate controllers and services per version
  NO → Shared service layer with versioned response transformation
  ↓
  Need to deprecate a controller namespace?
  ↓
  YES → Deprecation middleware on controller group; remove namespace on removal
  NO → Namespace persists until version is fully removed

---

## Rationale

Shared service layer with versioned controllers follows the DRY principle while keeping HTTP concerns separated. Versioned DTOs enable different response shapes per version.

---

## Recommended Default

**Default:** App\Http\Controllers\Api\V1\ and V2\ namespaces; shared App\Services\ namespace
**Reason:** Clean separation at HTTP layer; shared domain logic; version-specific responses

---

## Risks Of Wrong Choice

Copying all service logic per version violates DRY and causes drift. Fully shared controllers without versioning make it impossible to evolve responses independently.

---

## Related Rules
Versioned Request/Response DTOs Per Version

---

## Related Skills
Implement SaloonPHP Pagination Plugin
