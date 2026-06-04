# data-wrapping-configuration
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** data-wrapping-configuration  
**Difficulty Level:** Intermediate  
**Last Updated:** 2026-06-02

## Executive Summary
Data wrapping configuration controls how Laravel API resources wrap their payload inside a container key (e.g. `data`, `user`, `post`) or omit wrapping entirely. This is governed by the `$wrap` static property on resource classes and the `withoutWrapping()` / `withoutWrappingCollection()` methods. Misconfiguration here is the most common source of response inconsistency in Laravel APIs.

## Core Concepts
- **`$wrap` Property**: A static string property on a Resource class that defines the wrapping key for a single resource. Default changed from resource class name to `'data'` in Laravel 8.
- **`withoutWrapping()`**: A static method that globally disables wrapping for an individual resource class.
- **`withoutWrappingCollection()`**: A static method that disables wrapping specifically for collection responses.
- **Global Wrapping Default**: The framework-level default wrapping behavior is determined by `Resource::$wrap` base class property.
- **Conditional Wrapping**: Resources can conditionally apply wrapping based on the response context (e.g. wrap only for external API consumers).
- **Inheritance Behavior**: Child resource classes inherit the parent's `$wrap` value unless explicitly overridden.

## Mental Models
- **Light Switch**: Wrapping is either on or off. When on, the resource is nested under a key. When off, the resource's keys sit at the top level.
- **Label Maker**: The `$wrap` property is the label on the box. The default label is `"data"`. Renaming it changes what the client sees as the container.
- **Per-Class Configuration**: Think of wrapping as a per-resource concern, not a global setting. Each resource class independently decides its wrapping behavior.

## Internal Mechanics
- **`ResourceResponse` Class**: When `Resource::toResponse()` is called, it creates a `ResourceResponse` instance. This class checks `$this->resource::$wrap` to determine if wrapping should occur.
- **`PaginatedResourceResponse`**: Handles paginated responses separately. It merges the paginated data into the wrapping key, then appends `meta` and `links` at the top level.
- **`$wrap` Resolution Order**: `$wrap` is resolved from the called resource class — not polymorphically. If `UserResource` extends `JsonResource`, `UserResource::$wrap` is checked, not `JsonResource::$wrap`.
- **`withoutWrapping()` Implementation**: Sets a static flag `$withoutWrapping = true` on the resource class. This flag is checked during response construction to skip the wrapping step.
- **`Response::setResourceWrapper()`**: There is no built-in global way to set the wrapper for all resources. Each resource class configures itself.

## Patterns
- **Consistent Global Wrapping**: Set all resource `$wrap` to `'data'` for JSON:API-like consistency. Override only where specific API contract demands different wrapping.
- **Version-Based Wrapping**: Use different resource classes per API version, with different wrapping configuration: `UserResourceV1` ($wrap = 'data'), `UserResourceV2` (withoutWrapping).
- **Resource Wrapper Inheritance**: Create a `BaseResource` that sets `$wrap = 'data'`, then all concrete resources inherit the same wrapping behavior.
- **Collection-Only Wrapping**: Use `withoutWrapping()` on single resources but keep collection wrapping enabled. This gives mobile clients simpler single-resource responses while maintaining pagination metadata on collections.

## Architectural Decisions
- **Default Wrapping Strategy**: Choose a default wrapping strategy for the entire API. Changing per-resource creates confusion. Document the choice in API style guide.
- **Custom Wrapper Keys**: Using resource-specific keys (`user`, `post`) couples clients to resource names. Renaming the model forces an API version change. Prefer generic `'data'`.
- **Global vs. Per-Resource Configuration**: Laravel lacks a native global wrapping config. Implement a base resource class or a response macro to enforce consistent wrapping across all resources.
- **Resource vs. Collection Wrapping**: These can be configured independently. Decide whether collections use the same wrapping key as single resources.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Consistent response shape with `'data'` wrapper | Extra layer of nesting on every resource | Clients always access `response.data` |
| Custom wrapper keys improve readability | Renaming model becomes breaking change | Clients depend on wrapper key matching model name |
| `withoutWrapping()` reduces payload size | Metadata cannot be added later without breaking change | Evolution of the API response is constrained |
| Per-resource configuration is flexible | Inconsistency across resources | Different resources have different response shapes |
| Inheritance reduces duplication | Overriding wrapping per resource is error-prone | A child class may accidentally inherit `$wrap` from parent |

## Performance Considerations
- **Negligible Overhead**: The wrapping operation is a single `array_merge` or key assignment. Performance impact is immeasurable at the microsecond level.
- **Serialization Pipeline**: Wrapping adds one extra array level. The primary performance cost is in the resource's `toArray()` implementation, not the wrapping step.
- **Collection Wrapping**: For collections of 1000+ items, the wrapping step loops through the entire collection to nest it under the key.

## Production Considerations
- **Testing Wrapping Behavior**: Write exhaustive tests that assert the presence or absence of the wrapper key. A single test file covers all resources if they share a base class.
- **Monitoring Wrapper Consistency**: Add a middleware that inspects all JSON responses for wrapper key consistency and logs violations.
- **API Version Transitions**: When changing wrapping strategy between versions, version-specific resources prevent accidental wrapping changes from leaking across versions.
- **Documentation Generation**: OpenAPI/Scribe generators may need configuration to correctly represent wrapped vs. unwrapped responses.

## Common Mistakes
- **Overriding `$wrap` Incorrectly**: Defining `$wrap` as an instance property instead of static. `public $wrap = 'data'` won't work; it must be `public static $wrap = 'data'`.
- **Expecting `withoutWrapping()` to Be Global**: `withoutWrapping()` only affects the called resource class. Calling it on `UserResource` does not affect `PostResource`.
- **Child Class Wrapping Surprise**: If `AdminResource extends UserResource` and `AdminResource` doesn't set `$wrap`, it inherits `UserResource::$wrap`. This is usually correct but can surprise if the parent changes.
- **`withoutWrapping()` Called Too Late**: Calling `withoutWrapping()` after the resource is instantiated may not work. Call it statically before the response is built.
- **Forgetting Collection Wrapping**: `ResourceCollection` has its own wrapping behavior independent of the single resource class. Configure both.

## Failure Modes
- **Inconsistent Wrapping Across Resources**: One resource wraps, another doesn't. Clients that parse based on one resource's shape break on others.
- **Silent Inheritance Change**: Changing `$wrap` on a base resource class propagates to all child classes without explicit notice.
- **Collection Without Wrapping Key**: A paginated collection without a wrapping key lacks `meta` and `links` placement — they get merged into the resource data itself.
- **Double Wrapping**: Using `Resource::collection()` on already-wrapped resources can nest them under `data.data`.

## Ecosystem Usage
- **Laravel Framework**: `Illuminate\Http\Resources\Json\JsonResource` defines the base `$wrap` property. `ResourceResponse` and `PaginatedResourceResponse` consume it.
- **Laravel Nova**: Nova resources use wrapping with specific wrapper keys for its admin panel API.
- **Spatie/laravel-query-builder**: Integrates with API resources; respects `$wrap` configuration when building responses.
- **JSON:API Packages**: `laravel-json-api` or `cloudcreativity/laravel-json-api` enforce JSON:API wrapping conventions, overriding Laravel's default `$wrap`.

## Related Knowledge Units
### Prerequisites
- envelope-response-design
- bare-body-response-design

### Related Topics
- response-format-decision-framework

### Advanced Follow-up Topics
- json-api-resource-structure
- top-level-meta-and-links

---

## Research Notes

### Source Analysis
- `Illuminate\Http\Resources\Json\JsonResource::$wrap` (static property)
- `Illuminate\Http\Resources\Json\ResourceResponse` (wrapping assembly)
- `Illuminate\Http\Resources\Json\PaginatedResourceResponse` (collection wrapping)
- `Illuminate\Http\Resources\Json\JsonResource::withoutWrapping()` (static flag)

### Key Insight
The `$wrap` property is resolved statically at the class level, not per-instance — calling `withoutWrapping()` sets a static flag that affects all subsequent responses from that class, making wrapping a class-level concern rather than a response-level one.

### Version-Specific Notes
- Laravel 6: Default `$wrap` was the resource class name (e.g., `user`)
- Laravel 8+: Default `$wrap` changed to `'data'` for new resource classes
- Laravel 10/11/12/13: No further changes to wrapping mechanics; backward compatible with older wrapping behavior
