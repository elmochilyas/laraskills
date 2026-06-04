# ECC Standardized Knowledge — API Versioning Strategies

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | api-versioning-compatibility |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | API Versioning Strategies |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K009, K023 |

## Overview (Engineering Value)
API versioning enables evolving public APIs without breaking existing consumers. The four primary strategies — URI path, header-based, query parameter, and Accept header — offer distinct trade-offs in visibility, routing complexity, and consumer effort. Choosing the right strategy and combining it with lifecycle management (RFC 8594 Deprecation, RFC 7231 Sunset headers) ensures smooth transitions, clear communication, and minimal disruption. For Laravel, the Grazulex/laravel-apiroute package provides multi-strategy support with lifecycle management.

## Core Concepts
- **URI Path Versioning**: `/v1/resource`, `/v2/resource` — most visible, simplest to route and test
- **Header-Based Versioning**: `Accept: application/vnd.api+json;version=2` — cleaner URLs, harder to test
- **Query Parameter Versioning**: `/resource?version=2` — simple but pollutes analytics and caching
- **Accept Header Versioning**: Content negotiation via `Accept` header — RESTful but less discoverable
- **Backward Compatibility**: Additive-only changes (new fields, new endpoints) avoid breaking existing clients
- **Breaking Changes**: Field removal, type changes, required field addition require new version
- **Deprecation Lifecycle**: Active → Deprecated (RFC 8594) → Sunset (RFC 7231) → Removed

## When To Use
- Public APIs consumed by external developers beyond your control
- Long-lived APIs that will evolve over multiple years
- SaaS platforms where different customers use different API versions
- APIs with formal SLAs and backward compatibility guarantees

## When NOT To Use
- Internal microservices that all deploy together (version via deployment)
- Single-consumer APIs where consumer and API are in the same codebase
- Prototypes and early-stage products without established consumers
- APIs where additive-only changes suffice indefinitely

## Best Practices (explain WHY)
- **Prefer URI versioning for most APIs**: Most visible, easiest to route, simplest to test with curl and browser tools; consumers can immediately see which version they're using
- **Support minimum 6-month migration window**: Consumers need time to update; aggressive deprecation erodes trust in your API
- **Use parallel version deployment**: Run v1 and v2 simultaneously so consumers can migrate at their own pace without service disruption
- **Communicate deprecation via standard headers**: RFC 8594 `Deprecation` and RFC 7231 `Sunset` headers allow automated consumer tooling to detect and plan for changes
- **Version from day one**: Even `/v1/` from the first release; adding versioning later is significantly harder than including it initially

## Architecture Guidelines
- Separate versioned namespaces: `App\Http\Controllers\Api\V1\`, `V2\`
- Versioned route files: `routes/api/v1.php`, `routes/api/v2.php`
- Middleware for cross-version concerns (deprecation headers, analytics)
- Shared domain services between versions; only HTTP layer differs
- Use Grazulex/laravel-apiroute for multi-strategy support with lifecycle management
- Store version registry in configuration, not database, for deployment consistency

## Performance Considerations
- URI versioning: no overhead beyond route matching (fastest)
- Header versioning: middleware parsing adds ~1ms per request
- Multiple versions double route table entries but with negligible performance impact
- Version analytics logging adds per-request overhead; use sampling for production
- Route caching (`php artisan route:cache`) mitigates version route registration cost

## Security Considerations
- Old versions may have known vulnerabilities; ensure security patches are backported to all active versions
- Deprecated versions should still receive security updates during the migration window
- Removed versions should return 410 Gone with migration instructions, never 404 (which suggests the resource doesn't exist)
- Version analytics should not expose consumer-identifying information beyond what's necessary

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| No versioning from the start | Short-term thinking | Adding versioning later requires breaking all existing consumers | Start with `/v1/` even for first release |
| Removing v1 when v2 ships | Assuming instant migration | Production integrations break | Maintain both versions during migration window |
| Mixed strategies in same API | Design by committee | Consumer confusion, inconsistent tooling | Choose one strategy and apply uniformly |
| Breaking changes within a version | Convenience over contract | Silent consumer breakage on minor releases | Breaking changes require new version number |
| No deprecation headers | Missing standard practice | Consumers unaware of upcoming changes | Always add Deprecation/Sunset headers |

## Anti-Patterns
- **Versionless drift**: Evolving API without versioning, breaking consumers silently with every change
- **Cosmetic versioning**: Changing version number without strategy (v1 → v2 with no real changes)
- **Eternal version support**: Never removing deprecated versions, accruing infinite maintenance debt
- **Database schema versioning**: Coupling API version to database schema version

## Examples (concise, architectural)
```php
// routes/api/v1.php
Route::get('/users', [V1\UserController::class, 'index']);

// routes/api/v2.php
Route::get('/users', [V2\UserController::class, 'index']);

// Deprecation middleware
class DeprecationHeaderMiddleware
{
    public function handle(Request $request, Closure $next, string $version)
    {
        $response = $next($request);
        if ($version === 'v1') {
            $response->header('Deprecation', 'true');
            $response->header('Sunset', 'Sat, 31 Dec 2026 23:59:59 GMT');
        }
        return $response;
    }
}
```

## Related Topics
- **Prerequisites**: HTTP fundamentals, REST API design
- **Closely Related**: Backward compatibility, deprecation headers, OpenAPI documentation
- **Advanced**: Date-based versioning (GitHub, Stripe pattern), version negotiation middleware
- **Cross-Domain**: API gateway version routing, consumer SDK management

## AI Agent Notes
- Default to URI versioning with versioned controller namespaces
- Include deprecation headers from the start of version implementation
- Generate both v1 and v2 route files when creating versioned API

## Verification
- [ ] Versioning strategy is chosen and documented (URI/header/query/Accept)
- [ ] All active versions are explicitly listed in version registry
- [ ] Deprecated versions return Deprecation and Sunset headers
- [ ] Removed versions return 410 Gone, not 404
- [ ] Route cache works with all versioned routes
- [ ] CI tests run against all supported versions
