# Metadata
Domain: API Integration Engineering
Subdomain: API Versioning & Compatibility
Knowledge Unit: API Versioning Strategies and Lifecycle Management
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
API versioning enables evolution of public APIs without breaking existing consumers. The four primary strategies—URI path, header-based, query parameter, and Accept header—each offer different trade-offs in visibility, routing complexity, and consumer effort. Lifecycle management extends beyond versioning strategy to include deprecation communication (RFC 8594 Deprecation header), sunset timing (RFC 7231 Sunset header), backward compatibility guarantees, and migration documentation.

## Core Concepts
- **URI Path Versioning**: `/v1/resource`, `/v2/resource` — most visible, simplest to route
- **Header-Based Versioning**: `Accept: application/vnd.api+json;version=2` — cleaner URLs, harder to test
- **Query Parameter Versioning**: `/resource?version=2` — simple but pollutes query strings
- **Accept Header Versioning**: `Accept: application/vnd.api+json;version=2` — RESTful but less discoverable
- **Backward Compatibility**: Additive-only changes (new fields, new endpoints) don't break existing clients
- **Breaking Changes**: Field removal, type changes, required field addition require new version
- **Deprecation Lifecycle**: Active → Deprecated (RFC 8594) → Sunset (RFC 7231) → Removed
- **Migration Window**: Time between deprecation and removal for consumer migration

## Mental Models
- **Version as Contract**: Each version is a frozen contract; new versions add new contracts without breaking old ones
- **API as Product**: Versioning is product versioning; consumers choose which product version to use
- **Deprecation as Courtesy**: Deprecation headers inform consumers of upcoming changes; removal is the last resort

## Internal Mechanics
- URI versioning: Router matches `/v1/` → v1 controllers, `/v2/` → v2 controllers; namespace separation
- Header versioning: Middleware reads `Accept` header and routes to appropriate version handler
- Query param versioning: Route inspects `?version=1` parameter and selects controller
- Accept header: Content negotiation via `Accept` header; framework maps to versioned response formatters
- RFC 8594: `Deprecation: true` and `Sunset: Sat, 31 Dec 2026 23:59:59 GMT` headers on deprecated endpoints
- Version-specific middleware applies deprecation headers and monitors usage

## Patterns
- **Additive-Only Changes**: Never remove or modify existing fields; only add optional fields and new endpoints
- **Parallel Implementation**: Both versions run simultaneously; `v1` routes to versioned controllers
- **Versioned Namespaces**: `App\Http\Controllers\Api\V1\`, `App\Http\Controllers\Api\V2\` for route separation
- **Deprecation Header Middleware**: Register middleware that adds `Deprecation` and `Sunset` headers to deprecated versions
- **Usage Tracking**: Log which version each consumer uses to drive deprecation timelines
- **Changelog-Driven Migration**: Document breaking changes and migration paths per version

## Architectural Decisions
- Start with URI versioning for most APIs (simplest, most visible, easiest to route)
- Use header-based versioning only when URL cleanliness is critical (public APIs with strict aesthetic requirements)
- Avoid query parameter versioning for production APIs (easy to forget, pollutes analytics)
- Implement parallel version deployment: run v1 and v2 simultaneously during migration window
- Use middleware for cross-cutting version concerns (deprecation headers, routing)
- Maintain version support for a minimum period (6-12 months) with clear deprecation communication

## Tradeoffs
- URI versioning is simplest but copies/clones code between versions (code duplication)
- Header versioning keeps URLs clean but complicates caching, testing, and documentation
- Query parameter versioning is easy to implement but clutters URLs and analytics
- Versionless APIs (additive-only, never breaking) are ideal but impractical for major architectural changes
- Supporting multiple versions increases maintenance burden and testing complexity

## Performance Considerations
- URI versioning: no additional overhead beyond route matching
- Header versioning: middleware runs on every request to parse and route
- Query parameter versioning: minimal parsing overhead
- Parallel version deployment doubles route table size (negligible impact)
- Deprecation header injection: negligible overhead per request

## Production Considerations
- Implement version analytics to track version usage and plan deprecation
- Set minimum version support windows (6-18 months) and communicate clearly via changelogs
- Use `Deprecation` and `Sunset` headers on deprecated versions for automated consumer detection
- Provide migration guides and transition tooling for each breaking change
- Monitor consumer version adoption rates to decide when to remove old versions
- Test both old and new version endpoints in CI to prevent regressions

## Common Mistakes
- Starting with no versioning (difficult to add later without breaking all consumers)
- Removing v1 as soon as v2 is released (no migration window for consumers)
- Mixing versioning strategies within the same API (confusing for consumers)
- Breaking backward compatibility within a version (silently changing behavior)
- Not communicating deprecation via standard headers (consumers don't know change is coming)
- Versioning the database schema instead of the API contract (tight coupling)

## Failure Modes
- Consumer ignores deprecation and breaks when old version is removed
- Version routing middleware fails causing wrong version handler to execute
- Backward compatibility assumption is violated by a patch release
- Version documentation falls behind actual behavior (consumers rely on incorrect docs)
- Multiple versions drift apart with duplicate bug fixes (maintenance debt grows)

## Ecosystem Usage
- Google API Design Guide recommends URI versioning with major version increments
- Microsoft REST API Guidelines prefer header-based versioning for cleaner URLs
- GitHub API uses date-based versioning (`2022-11-28`) with `X-GitHub-Api-Version` header
- Stripe API uses date-based versioning with `Stripe-Version` header and automatic upgrade windows
- Laravel's `Grazulex/laravel-apiroute` provides multi-strategy versioning with lifecycle management
- IETF RFC 8594 (March 2025) standardizes the `Deprecation` HTTP header for API deprecation

## Related Knowledge Units
- K023: Grazulex/laravel-apiroute (Laravel-specific versioning implementation)
- K030: OpenAPI/Swagger Documentation Generation (API docs per version)
- K009: API Versioning Strategies (this document)

## Research Notes
- Roy Fielding's REST dissertation doesn't prescribe URI versioning; it favors content negotiation (Accept header)
- Industry trend: date-based versioning (GitHub, Stripe) over semantic versioning for APIs
- RFC 8594 (Deprecation HTTP Header) published March 2025 standardizes deprecation communication
- RFC 7231 (Sunset HTTP Header) provides the removal date standard
- Grazulex/laravel-apiroute supports URI, header, query, and Accept header strategies with lifecycle management
