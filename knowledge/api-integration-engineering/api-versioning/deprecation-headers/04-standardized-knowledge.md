# ECC Standardized Knowledge — Deprecation Headers

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | api-versioning-compatibility |
| Knowledge Unit ID | ku-03 |
| Knowledge Unit | Deprecation Headers |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K009, K023 |

## Overview (Engineering Value)
Deprecation headers (RFC 8594 `Deprecation`, RFC 7231 `Sunset`) provide a standard HTTP mechanism for communicating API version lifecycle information to consumers. These headers enable automated tooling to detect when an API version is deprecated and when it will be removed, facilitating smooth consumer migration without manual communication. The Laravel package Grazulex/laravel-apiroute implements full lifecycle management with automatic header injection, usage analytics, and Artisan commands for version state transitions.

## Core Concepts
- **RFC 8594 Deprecation Header**: `Deprecation: true` signals that the endpoint or version is deprecated
- **RFC 7231 Sunset Header**: `Sunset: Sat, 31 Dec 2026 23:59:59 GMT` announces the removal date
- **Lifecycle States**: Active → Deprecated → Sunset → Removed
- **Migration Window**: Period between Deprecation and Sunset for consumer migration
- **Version Analytics**: Tracking which versions consumers use to drive deprecation decisions
- **Link Header**: Optional `Link: </v2>; rel="successor-version"` pointing to the replacement

## When To Use
- Any deprecated API endpoint or version
- APIs with formal lifecycle management policies
- Public APIs where consumers need automated deprecation detection
- Internal APIs with known consumer teams that may miss manual communications

## When NOT To Use
- Experimental endpoints clearly marked as unstable
- Internal endpoints that will be removed within days (coordinate directly)
- Already-removed endpoints (return 410 Gone instead)

## Best Practices (explain WHY)
- **Add Deprecation header immediately when deprecating**: Delaying header addition delays consumer awareness; add headers the moment deprecation is decided to maximize migration time
- **Set realistic Sunset dates based on analytics**: Analytics show actual usage; use this data to set Sunset dates that give consumers adequate time (minimum 6 months for public APIs)
- **Include Link header pointing to replacement**: Consumers need to know where to migrate; `Link: </v2/users>; rel="successor-version"` provides the URL
- **Monitor deprecated version usage drop-off**: Track whether consumers are migrating; if usage isn't declining, Sunsets may need extension
- **Use middleware for header injection**: Middleware ensures consistent header application across all deprecated endpoints without duplicating logic in each controller

## Architecture Guidelines
- Implement deprecation headers via middleware applied to deprecated version route groups
- Store version lifecycle state in configuration files (not database) for deployment consistency
- Use Grazulex/laravel-apiroute for automated lifecycle transitions with Artisan commands
- Log header injection events for analytics on deprecated version usage
- Sample analytics logging (1/100 requests) to reduce overhead while tracking trends

## Performance Considerations
- Header injection adds negligible overhead (~0.1ms per request)
- Analytics logging adds configurable overhead; use sampling for high-traffic endpoints
- Route group middleware applies to all deprecated endpoints with no per-endpoint cost
- Sunset date parsing is a one-time operation at middleware registration

## Security Considerations
- Deprecation headers should not reveal internal versioning strategy or future plans beyond what's intended
- Analytics on deprecated versions should not expose individual consumer identity
- Removed versions returning 410 Gone with migration info should not leak information about the new version's security posture

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not adding deprecation headers | Ignorance of RFC 8594 | Consumers unaware of upcoming removal | Always add Deprecation/Sunset on deprecated versions |
| Unrealistic Sunset dates | Pressure to clean up | Consumers forced to migrate too fast | Base Sunsets on analytics showing minimal usage |
| Headers without migration info | Minimal implementation | Consumers don't know where to migrate | Include Link header with successor version |
| Analytics without action | Data collection without decision | Data is noise without driving sunset timing | Review analytics monthly; act on the data |
| Inconsistent header application | Manual per-endpoint headers | Some deprecated endpoints miss headers | Use middleware for consistent application |

## Anti-Patterns
- **Silent deprecation**: Deprecating without any header notification
- **Evergreen deprecation**: Setting Sunsets that are perpetually extended, never enforced
- **Reactive removal**: Removing versions based on developer frustration rather than analytics
- **Header-only communication**: Relying solely on headers without direct communication to known consumers

## Examples (concise, architectural)
```php
// Deprecation middleware for v1 routes
class DeprecationMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->header('Deprecation', 'true');
        $response->header('Sunset', 'Sat, 31 Dec 2026 23:59:59 GMT');
        $response->header('Link', '</v2/users>; rel="successor-version"');
        return $response;
    }
}

// Route group application
Route::prefix('v1')
    ->middleware(DeprecationMiddleware::class)
    ->group(base_path('routes/api/v1.php'));
```

```http
# Deprecated response headers
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 31 Dec 2026 23:59:59 GMT
Link: </v2/users>; rel="successor-version"
```

## Related Topics
- **Prerequisites**: API versioning strategies, HTTP headers
- **Closely Related**: Backward compatibility, version lifecycle management
- **Advanced**: Automated consumer notification, deprecation dashboard, SLA enforcement
- **Cross-Domain**: HTTP standards (RFC 8594, RFC 7231), API lifecycle management

## AI Agent Notes
- Always include Deprecation header when version is marked deprecated
- Generate Sunsets with minimum 6-month window for public APIs
- Include Link header with successor-version relation

## Verification
- [ ] All deprecated versions return Deprecation: true header
- [ ] All sunset versions return Sunset header with valid HTTP-date
- [ ] Link header with successor-version relation present on deprecated endpoints
- [ ] Version analytics show usage trends per version
- [ ] Artisan commands for lifecycle transitions work correctly
- [ ] Removed versions return 410 Gone, not 404
