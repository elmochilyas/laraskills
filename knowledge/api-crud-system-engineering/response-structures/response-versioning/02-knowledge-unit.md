# response-versioning
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** response-versioning  
**Difficulty Level:** Advanced  
**Last Updated:** 2026-06-02

## Executive Summary
Response versioning is the practice of serving different response structures for different API versions, allowing the API to evolve its data contracts without breaking existing clients. In Laravel, versioning is implemented through version-specific resource classes, conditional serialization logic, content negotiation via Accept headers, and URL-prefixed version routes. The key architectural challenge is balancing forward evolution with backward compatibility while minimizing code duplication.

## Core Concepts
- **Response Contract**: The structure of the response (keys, nesting, types) is a contract with the client. Changing it is a breaking change without versioning.
- **Backward Compatibility (Additive Only)**: A change is backward-compatible if it only adds new keys, never removes or renames existing ones. Versioned responses allow breaking changes between versions.
- **Version Manifestation**: API version is expressed via URL prefix (`/api/v1/users`), Accept header (`Accept: application/vnd.api.v1+json`), query parameter (`?api_version=1`), or subdomain (`v1.api.example.com`).
- **Version-Specific Resources**: Each API version has its own set of resource classes (`UserResourceV1`, `UserResourceV2`). Shared logic lives in a base class.
- **Transformer Versioning**: Different resource versions may share the same transformation logic but produce different output shapes. Conditional logic inside a single resource can select the version-specific output.
- **Deprecation Strategy**: Older versions are deprecated with a sunset timeline. Responses from deprecated versions include `Sunset` and `Deprecation` HTTP headers.

## Mental Models
- **Product Version**: API versions are like product versions. V1 is the original product. V2 is the new model. You stop manufacturing V1 but existing owners keep using it.
- **Translation Layer**: Each version is a translation layer between the internal domain model and the external API contract. The internal model evolves independently; the translation layer adapts it per version.
- **Contract Negotiation**: Versioning is like negotiating a contract. The client says "I agree to the V1 terms" and the server responds in V1 format. Renegotiation (version upgrade) requires both parties to agree.

## Internal Mechanics
- **Version Detection**: A middleware or route group detects the requested version from the URL, header, or parameter and stores it in the request attributes: `$request->attributes->set('api_version', 'v1')`.
- **Versioned Route Files**: Laravel convention is separate route files per version: `routes/api/v1.php`, `routes/api/v2.php`. Each file loads version-specific controllers and resources.
- **Resource Version Selection**: The controller instantiates version-specific resources: `new UserResourceV1($user)` vs `new UserResourceV2($user)`. A factory pattern resolves the resource class from the version.
- **Conditional Serialization**: A single resource class uses the detected version to conditionally include fields:
  ```php
  if ($version === 'v2') {
    $data['full_name'] = $this->first_name . ' ' . $this->last_name;
  }
  ```
- **Transformer Adapter**: The response goes through a transformation pipeline that applies version-specific formatting after the resource's `toArray()`. This centralizes version differences.
- **Deprecation Headers**: Middleware adds `Deprecation: true` and `Sunset: Sat, 31 Dec 2025 23:59:59 GMT` headers to deprecated version responses.

## Patterns
- **Version-Specific Resource Classes**: Create separate resource classes per version: `UserResourceV1`, `UserResourceV2`. Share base logic via inheritance or trait composition.
- **Shared Base Resource with Version Hooks**: A single base resource class with `versionFields()` or `versionMeta()` methods that return version-specific additions.
- **Versioned Resource Collection**: Collection resources follow the same versioning pattern. `UserCollectionV1`, `UserCollectionV2` with version-specific pagination metadata.
- **Response Transformer Pipeline**: Implement a middleware that transforms V1 responses into V2 format, allowing the controller to always work with the latest internal representation.
- **Version Negotiation Middleware**: A middleware that inspects the Accept header, resolves the version, and stores it in the request for downstream use.
- **Graceful Degradation**: If the requested version is not supported, return the latest version with a warning header or return 406 Not Acceptable.
- **API Version Registry**: A configuration file that maps version strings to resource classes, transformers, and deprecation dates.

## Architectural Decisions
- **URL vs. Header Versioning**: URL versioning is simpler for clients and easier to route. Header versioning is more RESTful and keeps the URL clean. Most Laravel APIs use URL versioning for practical reasons.
- **Granularity of Versioning**: Decide whether a version change applies to the entire API (monolithic version) or per-endpoint (fine-grained versioning). Monolithic is simpler for clients but requires major version bumps for minor changes.
- **Version Lifespan**: Define how long each version is supported. Common patterns: 6 months overlap between versions, 12 months total support, or N-2 version support (current + 2 previous).
- **Shared vs. Forked Code Paths**: Forked (separate resource classes) prevents accidental changes across versions but duplicates code. Shared (conditional logic) reduces duplication but risks cross-version side effects.
- **Data Transformation at Edge**: In microservice architectures, the API gateway handles version transformation, keeping individual services version-unaware.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Backward compatibility for clients | Code duplication across versions | Maintenance burden for each supported version |
| Controlled API evolution | Route and controller proliferation | Multiple route files and controller namespaces |
| Client chooses upgrade timing | Version testing matrix multiplies | Each version must be tested independently |
| Deprecation sunset timeline | Long-lived versions accumulate technical debt | V1-specific code may not receive improvements |
| URL versioning is simple for clients | Version is part of URL contract | Changing URL versioning strategy is breaking |

## Performance Considerations
- **Version Detection Overhead**: Checking version from URL or header adds ~0.01ms per request. Negligible.
- **Conditional Serialization Cost**: Version-conditional logic inside resources adds branching cost. Over many fields, this compounds. Separate resource classes avoid branching entirely.
- **Cache Fragmentation**: Each version creates a separate cache namespace. Versioned cache keys multiply storage requirements.
- **Middleware Pipeline Overhead**: Version negotiation middleware adds one extra middleware execution per request. Measurable but negligible at single-digit percentages.

## Production Considerations
- **Deprecation Communication**: Use `Deprecation` and `Sunset` HTTP headers to inform clients of upcoming version removal. Regularly audit version usage via API analytics.
- **Version Sunset Process**: Document the sunset process: announce deprecation 6 months before, enforce deprecation headers 3 months before, return 410 Gone after sunset.
- **Monitoring Per-Version Usage**: Track which API versions clients use. This data drives deprecation timelines and version support decisions.
- **Version-Specific Rate Limits**: Older versions may receive different rate limits to encourage migration. Lower limits on deprecated versions are common.
- **Automated Version Testing**: CI/CD should run the full test suite against all supported API versions. Regression in one version should not affect others.
- **Security Patch Backporting**: Critical security fixes must be backported to all supported versions. Plan for security maintenance costs.

## Common Mistakes
- **Versioning the URL But Ignoring the Response**: Changing the URL to `/v2/` but returning the same response structure. The version is meaningless without response contract changes.
- **Inconsistent Version Support**: Some endpoints support V2, others only V1. Clients must check version support per endpoint.
- **No Sunset Planning**: Adding new versions without planning how to remove old ones. The API accumulates maintenance burden from indefinitely supported versions.
- **Breaking Changes in Patch Version**: Introducing breaking response changes in what is advertised as a backward-compatible version. Semantic versioning applies to API contracts.
- **Version in the Database Schema**: Making the database schema version-dependent. The database should remain version-agnostic; only the response layer should vary by version.
- **Shared Resource Mutations**: Using a single resource class with `if (version === 'v1')` scattered throughout creates untestable, brittle code where V1 changes accidentally affect V2.

## Failure Modes
- **Default Fallback to Wrong Version**: A client doesn't specify a version and receives V2 when expecting V1 (or vice versa). Require explicit version specification.
- **Resource Class Not Found for Version**: A controller tries to instantiate `UserResourceV4` that doesn't exist. The error surfaces as a 500. Implement a version-to-resource mapping with fallback.
- **Version-Specific Serialization Bug Fixed Only in Latest Version**: A data format bug is fixed in V3 but persists in V2. Clients on V2 never get the fix. Backport critical fixes.
- **Content Negotiation Content-Type Collision**: Two versions use the same media type but different response structures. Content negotiation fails to differentiate.
- **Deprecated Version Security Vulnerability**: An unpatched security issue in a deprecated version forces early sunset. Have a security patch plan for all supported versions.

## Ecosystem Usage
- **Laravel Framework**: Laravel does not enforce any particular versioning strategy. Route prefixes (`Route::prefix('v1')`) are the most common approach.
- **Laravel Nova**: Nova does not expose a versioned public API. Internal versioning is handled through Nova package updates.
- **Spatie/laravel-json-api-paginate**: Version-agnostic; the pagination metadata format is configured independently of API version.
- **Laravel API Boilerplate**: Community starter projects often include versioned route files and version detection middleware as templates.
- **Laravel Sanctum/Passport**: Authentication tokens are version-agnostic. Token format changes are handled at the package level, not the API version level.

## Related Knowledge Units
### Prerequisites
- envelope-response-design
- json-api-resource-structure

### Related Topics
- response-format-decision-framework

### Advanced Follow-up Topics
- api-versioning (top-level domain)

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\Router` — route prefixing for `/v1`, `/v2` URL versioning
- `Illuminate\Http\Request` — `Accept` header parsing for content negotiation
- `Illuminate\Http\Resources\Json\JsonResource` — version-specific resource subclasses
- `Symfony\Component\HttpKernel\EventListener\AbstractSessionListener` — `Deprecation` and `Sunset` header support

### Key Insight
Separate resource classes per version (e.g., `UserResourceV1`, `UserResourceV2`) are safer than conditional logic inside a single resource — conditional branching scatters version concerns across the file and creates cross-version mutation risk, while forked classes make version-specific code explicit and testable in isolation.

### Version-Specific Notes
- Laravel 10/11/12/13: No framework-enforced versioning strategy — route prefixes remain the convention
- `Deprecation` and `Sunset` header helpers available via Symfony HttpFoundation (used by Laravel)
- Laravel 11 introduced slimmer default structure but versioning middleware patterns unchanged
- Content-type negotiation (`Accept: application/vnd.api.v2+json`) works identically across versions
