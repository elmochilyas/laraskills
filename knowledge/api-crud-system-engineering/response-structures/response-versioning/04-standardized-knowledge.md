# response-versioning

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: response-versioning
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Response versioning is the practice of serving different response structures for different API versions, allowing the API to evolve its data contracts without breaking existing clients. In Laravel, versioning is implemented through version-specific resource classes, conditional serialization logic, content negotiation via Accept headers, and URL-prefixed version routes.

The key architectural challenge is balancing forward evolution with backward compatibility while minimizing code duplication. Separate resource classes per version are safer than conditional logic inside a single resource — forked classes make version-specific code explicit and testable in isolation.

## Core Concepts
- **Response Contract**: The structure of the response (keys, nesting, types) is a contract with the client. Changing it is a breaking change without versioning.
- **Backward Compatibility (Additive Only)**: A change is backward-compatible only if it adds new keys without removing or renaming existing ones.
- **Version Manifestation**: API version expressed via URL prefix (`/api/v1/users`), Accept header (`Accept: application/vnd.api.v1+json`), query parameter (`?api_version=1`), or subdomain.
- **Version-Specific Resources**: Each version has its own resource classes (`UserResourceV1`, `UserResourceV2`). Shared logic lives in a base class.
- **Deprecation Strategy**: Older versions receive `Sunset` and `Deprecation` HTTP headers. Version sunset follows a documented timeline with client notification.
- **Transformer Adapter**: A transformation pipeline applies version-specific formatting after `toArray()`, centralizing version differences.

## When To Use
- Public APIs with external clients that cannot be updated in lockstep with the server
- APIs that have undergone or anticipate breaking changes to response structure
- Multi-consumer APIs where different clients migrate at different paces
- APIs serving mobile apps where app store approval delays client-side updates
- Enterprise APIs where contractual response guarantees are negotiated per version

## When NOT To Use
- Internal microservices where all consumers are controlled by the same team (use additive-only changes instead)
- Prototypes or MVPs where API surface is still being discovered (versioning adds friction before stability)
- Single-consumer APIs where client and server are deployed together (lockstep deployment)
- APIs with no breaking changes planned — versioning overhead without benefit
- Server-to-server APIs with version-pinned dependencies (both sides upgrade simultaneously)

## Best Practices (WHY)
- **Use separate resource classes per version**: Conditional branching (`if version === 'v1'`) scatters version logic across files and creates cross-version mutation risk. Forked classes isolate version concerns.
- **Share base logic via inheritance**: Common field transformations live in a base class. Version-specific subclasses override only the differences.
- **Require explicit version specification**: A client that omits version should receive a clear error, not a default version. Default fallback creates ambiguity.
- **Use Deprecation and Sunset headers**: Inform clients programmatically that a version is deprecated. `Deprecation: true` and `Sunset: Sat, 31 Dec 2025 23:59:59 GMT`.
- **Backport security fixes**: Critical security patches must be applied to all supported versions. Plan for security maintenance costs in version lifecycle budgeting.

## Architecture Guidelines
- Use URL prefix versioning (`/api/v1/`, `/api/v2/`) for simplicity. Route files per version: `routes/api/v1.php`, `routes/api/v2.php`.
- Implement a resource factory that resolves version-specific resource classes from the detected version string.
- Keep the database schema version-agnostic — only the response layer varies by version.
- Versioned pagination metadata follows the same pattern: `UserCollectionV1`, `UserCollectionV2`.
- Cache per version — each version creates a separate cache namespace. Versioned cache keys multiply storage.
- Test all versions in CI/CD — regression in one version must not affect others.

## Performance
- Version detection from URL or header adds ~0.01ms per request — negligible.
- Separate resource classes avoid branching entirely; conditional serialization adds branching cost that grows with field count.
- Each version creates a separate cache namespace, multiplying storage requirements.
- Version negotiation middleware adds one extra middleware execution — measurable but negligible at single-digit percentages.

## Security
- Deprecated versions must still receive security patches — attackers target older, unpatched versions.
- Version detection must be robust against header injection — validate `Accept` header format before parsing version.
- Rate limits per version can encourage migration — lower limits on deprecated versions drive adoption of newer versions.
- A deprecated version with a known vulnerability must be force-sunset immediately, not on the planned timeline.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Versioning URL but ignoring response | Changing URL to `/v2/` but returning same response structure | Misunderstanding versioning purpose | Version meaningless without contract changes | Change response structure alongside URL version |
| Conditional logic in single resource | `if (version === 'v1')` scattered across resource class | Avoid perceived overhead of separate classes | V1 changes accidentally affect V2 | Use separate resource classes per version |
| No sunset planning | Adding versions without planning removal | Optimism about maintenance cost | Accumulated maintenance burden from indefinitely supported versions | Define sunset timeline at version creation (e.g., 6 months overlap, 12 months total support) |
| Breaking changes in patch version | Altering response structure in minor/patch version update | Not applying semver to API contracts | Clients break unexpectedly | Breaking changes require a new API version |
| Version in database schema | Making DB schema version-dependent | Tightly coupling internal and external representations | Database migrations become entangled with API versions | Database remains version-agnostic; response layer varies by version |
| Default fallback ambiguity | No explicit version default, silently choosing latest | Convenience during development | Client expects V1 but receives V2 | Require explicit version; return error if unspecified |

## Anti-Patterns
- **Single Resource with Version Branches**: One resource class with `if/else` for each version. Use separate classes.
- **Versionless API Then Sudden Versioning**: Starting without versioning and retrofitting it later. All existing clients break on the first versioned release.
- **Per-Endpoint Version Support**: Some endpoints support V2, others only V1. Document and minimize version surface inconsistencies.
- **Indefinite Version Support**: Never sunsetting old versions. Maintenance burden grows linearly with version count.
- **Version in API Response Body**: Putting version number in response JSON. Version is a transport concern, not a data concern.

## Examples
```php
// routes/api/v1.php
Route::prefix('v1')->group(function () {
    Route::get('/users', [UserControllerV1::class, 'index']);
});

// routes/api/v2.php
Route::prefix('v2')->group(function () {
    Route::get('/users', [UserControllerV2::class, 'index']);
});

// Version-specific resource classes
class UserResourceV1 extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
        ];
    }
}

class UserResourceV2 extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'email_address' => $this->email,
            'profile_url' => $this->profileUrl(),
        ];
    }
}

// Deprecation headers middleware
$response->header('Deprecation', 'true');
$response->header('Sunset', 'Sat, 31 Dec 2025 23:59:59 GMT');
```

## Related Topics
- **Prerequisites**: envelope-response-design, json-api-resource-structure
- **Related**: response-format-decision-framework
- **Advanced**: api-versioning (top-level domain)

## AI Agent Notes
- Create separate resource classes per version — never branch on version inside a single resource.
- Use a resource factory to resolve version-specific classes from the detected version.
- Always include `Deprecation` and `Sunset` headers on deprecated version responses.
- Share common serialization logic via base class inheritance, not conditional branching.
- Keep the database schema version-agnostic — only the response layer varies.

## Verification
- Each API version has its own set of resource classes — no conditional version branching in shared resources.
- Deprecated version responses include `Deprecation` and `Sunset` headers.
- The version detection strategy (URL, header, or parameter) is consistent across all endpoints.
- The full test suite passes for all supported API versions.
- Database schema is version-agnostic — no version-specific columns or tables.
- Version lifecycle is documented with sunset dates and migration guides.
