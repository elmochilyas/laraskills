# Form Request Organization — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Form requests encapsulate validation and authorization logic per API endpoint. Version-specific form requests allow different validation rules, required fields, and authorization logic per API version. Phase 2 covers directory structure, rule inheritance, rule addition/removal across versions, and authorization changes.

## Core Concepts
- **Versioned Form Request Path:** `App\Http\Requests\V1\StoreUserRequest`, `App\Http\Requests\V2\StoreUserRequest`.
- **Rule Inheritance:** V2 extends V1's rules, adds or removes rules.
- **Authorization Per Version:** Different `authorize()` logic per version (e.g., V1 allows self-registration, V2 requires admin).
- **Rule Composition:** Shared rules via traits or base request classes.

## Mental Models
- **Checklist Evolution:** Each version is a checkout checklist. V1 requires name and email. V2 adds phone and address. V3 removes address but adds tax ID. Each version has its own checklist card.
- **Security Gate:** Form requests are security gates. V1's gate checks ID card. V2's gate checks ID card + background check. The gate configuration changes per version but the gate posts (endpoints) stay the same.

## Internal Mechanics
- Laravel's `FormRequest` resolves from the container. Version resolution happens via controller method injection.
- `rules()` method returns an array; V2 overrides to add/remove keys.
- `prepareForValidation()` merges or sanitizes input per version.
- `failedValidation()` can produce version-specific error formats.

## Patterns
- Base form request per entity with shared rules; version extends and overrides.
- Rule traits for reusable rule groups (e.g., `WithPhoneValidation`, `WithTaxIdValidation`).
- Version-specific `failedValidation` to customize error response shape per version.
- Deprecated field rules: allow old fields but mark them as nullable in new versions.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Request location | `Requests\V1\` namespace | Consistent with controllers and resources |
| Inheritance pattern | V{n} extends V{n-1} | Progressive rule enhancement |
| Authorization in request | Per-version authorize() | Version-specific access control |
| Rule removal | Override rules() and unset keys | Clean, explicit removal |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Request inheritance | Reuse validation rules | Rule changes in parent affect all children |
| Separate requests | Full isolation, no side effects | Duplication across versions |
| Inline validation (no Form Request) | Faster to write | Mixed concerns, less testable |
| Rule traits | Clean composition | More files, indirection |

## Performance Considerations
- Form request resolution adds ~0.2ms per request.
- Rule inheritance adds no runtime cost (rules are arrays built at call time).
- Complex `prepareForValidation()` logic can add measurable overhead — keep it light.
- Rule caching (Laravel 11) applies per request class, not per version.

## Production Considerations
- Write dedicated tests for each version's form request rules.
- Validate that V2 doesn't silently accept V1-only rules (regression protection).
- Use form request tests to document which fields are required in which version.
- Log validation failures per version to identify common consumer errors.

## Common Mistakes
- Modifying V1's rules() method and forgetting V2 extends it — V2 gets the change too.
- Adding a required field in V2 without considering V1 consumers who don't send it.
- Overriding `authorize()` in V2 but forgetting to call `parent::authorize()`.
- Using the same form request for store and update — they need separate versions too.

## Failure Modes
- **Rule leak:** V2 inherits outdated V1 validation rules, allowing invalid data.
- **Authorization gap:** V2 override of `authorize()` is too permissive.
- **Error format mismatch:** V1 returns field-level errors, V2 returns string errors — client can't parse.
- **Missing request:** New V2 endpoint created without a version-specific form request.

## Ecosystem Usage
- **Laravel Spark:** Uses versioned form requests for team invitation and billing validation.
- **October CMS:** Plugin form requests organized by version in Requests directories.
- **Laravel Nova:** Action requests and resource requests versioned alongside controllers.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Resource class organization
- Controller inheritance

### Advanced Follow-up Topics
- Custom validation rules per version
- Versioned error response formats

## Research Notes
### Source Analysis
Laravel's form request documentation (2024) covers inheritance naturally since PHP classes support extends. The pattern is reinforced by Laravel's own official packages.

### Key Insight
The most common form request versioning mistake is rule inheritance coupling — a parent rule change silently affecting all child versions. Test each version independently.

### Version-Specific Notes
Laravel 11's `FormRequest` is unchanged from Laravel 10. The `after()` method (Laravel 10+) works for post-validation hooks in versioned requests.
