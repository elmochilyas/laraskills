# data-wrapping-configuration

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: data-wrapping-configuration
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Data wrapping configuration controls how Laravel API resources nest their payload under a container key (`data`, `user`, `post`) or omit wrapping. Governed by the `$wrap` static property and `withoutWrapping()` / `withoutWrappingCollection()` methods, this is the most common source of response inconsistency in Laravel APIs. Misconfiguration causes clients to encounter different response shapes from different endpoints.

The default `$wrap` changed from the resource class name (Laravel 7-) to `'data'` (Laravel 8+). Each resource class independently configures its wrapping — there is no native global setting.

## Core Concepts
- **`$wrap` Property**: Static string on a Resource class defining the wrapping key. Defaults to `'data'` (Laravel 8+).
- **`withoutWrapping()`**: Static method disabling wrapping for a single resource class.
- **`withoutWrappingCollection()`**: Disables wrapping specifically for collection responses.
- **Inheritance**: Child resource classes inherit parent's `$wrap` unless explicitly overridden.
- **Static Resolution**: `$wrap` is resolved from the called resource class, not polymorphically.
- **`ResourceResponse` Class**: Reads `$wrap` during `toResponse()` to apply or skip wrapping.
- **`PaginatedResourceResponse`**: Handles paginated responses separately — merges data into wrapping key, appends meta/links at top level.

## When To Use
- **Generic `'data'` wrapper**: Default for most APIs — consistent, predictable, matches JSON:API convention.
- **No wrapper (`withoutWrapping`)**: Internal APIs, BFFs, or when an API gateway adds wrapping later.
- **Custom wrapper keys**: Rare — only when an existing client contract requires a specific key (migration scenarios).

## When NOT To Use
- **Different wrapper keys per resource**: Creates inconsistency — clients must know which key to look for per endpoint.
- **`$wrap` as instance property**: Must be `static` — `public $wrap = 'data'` does not work.
- **`withoutWrapping()` on single resource but not collection**: Creates asymmetric response shapes unless intentional.

## Best Practices (WHY)
- **Use generic `'data'` everywhere**: Clients always access `response.data`. Changing wrapper key per resource forces clients to conditional-parse.
- **Set `$wrap` on a base resource class**: Since Laravel has no global wrapping config, create `App\BaseResource` with `$wrap = 'data'` and extend it.
- **Document wrapping strategy in API style guide**: Every developer should know whether resources wrap or not.
- **Test wrapping behavior exhaustively**: A single test can verify all resources by checking a base class.
- **Version-based wrapping**: Use different resource classes per API version with different wrapping configuration.

## Architecture Guidelines
- All resource classes should either wrap consistently or all not wrap — mixing creates the worst client experience.
- For JSON:API compliance, `$wrap` must always be `'data'` — custom wrapper keys violate the spec.
- Collection wrapping and single-resource wrapping can be configured independently — decide both.
- When migrating from wrapped to unwrapped (or vice versa), use version-specific resource classes to avoid breaking existing clients.

## Performance
- Wrapping operation is a single `array_merge` — performance impact is negligible.
- For collections of 1000+ items, the wrapping step loops to nest under the key.
- Serialization pipeline cost is dominated by `toArray()`, not the wrapping step.

## Security
- No direct security impact. However, inconsistent wrapping can mask response structure issues during security review.
- If wrapper key names match resource names, they leak model naming conventions to clients.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Non-static `$wrap` | `public $wrap = 'data'` instead of `public static $wrap = 'data'` | Copy-paste from instance property patterns | Wrapping silently falls back to default | Always declare `$wrap` as static |
| Expecting global `withoutWrapping` | Calling `withoutWrapping()` on one resource and expecting all to unwrap | Misunderstanding per-class scope | Other resources remain wrapped | Apply to each resource class or use a base class |
| Child class wrapping surprise | `AdminResource` inherits `UserResource::$wrap` without explicit override | Inheritance transparency | Changing parent's `$wrap` propagates to all children | Explicitly declare `$wrap` on each concrete resource |
| Late `withoutWrapping()` call | Calling after resource instantiation | Order-of-operations confusion | Wrapping not disabled | Call `withoutWrapping()` statically before response assembly |
| Collection wrapping mismatch | `ResourceCollection` wrapping differs from single resource | Forgetting collection has independent wrapping | Asymmetric response shapes | Configure both `withoutWrapping()` and `withoutWrappingCollection()` |

## Anti-Patterns
- **Per-Resource Custom Wrapper Keys**: `UserResource` wraps in `user`, `PostResource` wraps in `post`. Clients cannot predict.
- **Mixing Wrapped and Unwrapped Endpoints**: Some endpoints return `{data: {...}}`, others return `{...}` directly.
- **Relying on Default `$wrap` Inheritance**: Changing a base class `$wrap` silently changes all child resources.
- **`Data` Key Inside Wrapped Data**: `assignUsers` resource returns `{data: {data: [...]}}` due to double wrapping.

## Examples
```php
// Consistent wrapping — base class approach
class BaseResource extends JsonResource
{
    public static $wrap = 'data';
}

class UserResource extends BaseResource { /* inherits $wrap = 'data' */ }
class PostResource extends BaseResource { /* inherits $wrap = 'data' */ }
// Output: { "data": { "id": 1, "name": "Alice" } }

// No wrapping
UserResource::withoutWrapping();
return new UserResource($user);
// Output: { "id": 1, "name": "Alice" }

// Collection without wrapping
UserResource::withoutWrappingCollection();
return UserResource::collection($users);
// Output: [ { "id": 1, "name": "Alice" }, ... ]
```

## Related Topics
- **Prerequisites**: envelope-response-design, bare-body-response-design
- **Related**: response-format-decision-framework
- **Advanced**: json-api-resource-structure, top-level-meta-and-links

## AI Agent Notes
- Always declare `$wrap` as `public static` — never as an instance property.
- Use a base resource class with `$wrap = 'data'` to enforce consistency.
- When generating resources, check if the project convention is wrapped or unwrapped before deciding.
- For new resource classes, inherit `$wrap` from the base class rather than declaring it.

## Verification
- Every resource class either explicitly declares `$wrap` or inherits from a base class that does.
- All endpoints in the same API version return the same wrapping structure.
- Integration tests verify wrapping key presence/absence for every resource endpoint.
- `withoutWrapping()` and `withoutWrappingCollection()` are not called conditionally in response to request state.
