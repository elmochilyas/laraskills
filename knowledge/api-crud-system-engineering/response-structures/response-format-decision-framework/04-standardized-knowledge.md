# response-format-decision-framework

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: response-format-decision-framework
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
The response-format-decision-framework provides a systematic approach to choosing between envelope, bare-body, JSON:API, and RFC 9457 problem detail formats for API responses. Each format optimizes for different constraints: client diversity, payload efficiency, specification compliance, and error clarity.

The framework maps API characteristics — public vs. private, consumer types, bandwidth constraints, tooling ecosystem — to the appropriate response format. No single format is universally best; the most mature APIs often use different formats for different concerns: JSON:API for resources, RFC 9457 for errors, envelope for collections, and bare-body for internal microservices.

## Core Concepts
- **Format Selection Dimensions**: Consumer diversity, bandwidth sensitivity, metadata requirements, ecosystem compatibility, team maturity.
- **Envelope Format**: Best for public APIs with diverse consumers; structural consistency at the cost of payload overhead.
- **Bare-Body Format**: Best for internal/BFF APIs where consumers are known; optimizes payload size at the cost of extensibility.
- **JSON:API Format**: Best for specification compliance, client-side tooling, or compound documents; strict format, high consistency, steep learning curve.
- **RFC 9457 Format**: Best for error responses; standardized problem details structure parseable by HTTP libraries and API gateways.
- **Hybrid Approaches**: Common patterns include JSON:API for resources, RFC 9457 for errors, and envelope for collection metadata.
- **Format Negotiation**: `Accept` headers or query parameters determine format; `Accept: application/vnd.api+json` for JSON:API, `Accept: application/problem+json` for RFC 9457.
- **Adapter Pattern**: Resource adapters transform internal representations into the target format — one internal model, multiple format adapters.

## When To Use
- **Envelope**: Public APIs with unknown client types, multi-version APIs, APIs requiring rich metadata per response
- **Bare-Body**: Internal microservices, BFF endpoints, bandwidth-constrained environments, IoT/mobile metered data
- **JSON:API**: APIs with rich client tooling (Ember, Orbit), compound document requirements, strict specification compliance
- **RFC 9457**: Error responses in any API, API gateway integrations, machine-readable error taxonomy
- **Hybrid**: Large APIs where different endpoint categories have different format needs

## When NOT To Use
- **Envelope**: Internal APIs where envelope overhead provides no benefit, streaming endpoints
- **Bare-Body**: Public APIs with unknown third-party clients (lack of extensibility creates future breaking changes)
- **JSON:API**: Simple 3-endpoint APIs (specification overhead outweighs benefits), teams unfamiliar with the spec
- **RFC 9457**: Clients that cannot parse `application/problem+json` (legacy integrations)
- **Hybrid**: Small APIs where format consistency matters more than per-endpoint optimization

## Best Practices (WHY)
- **Lock format to API version**: Response format should not change within a version. V1 uses envelope, V2 upgrades to JSON:API. Format is part of the contract.
- **Use RFC 9457 for all errors**: Regardless of the success format, always format errors as RFC 9457 problem details. Clients write a single error parsing path.
- **Start envelope, optimize later**: Starting with bare-body is easy but upgrading to envelope later requires client changes. Start with envelope and strip overhead for performance-critical endpoints.
- **Document format in API profile**: Record the chosen format(s) in an API profile document consumers read to understand response structure.
- **Apply format at middleware layer**: A middleware layer transforms responses into the selected format, decoupling format from controller logic. Controllers return data; middleware formats.

## Architecture Guidelines
- Format selection must be deterministic per endpoint and version — never dynamic at runtime.
- Use middleware or response adapters to transform internal representations into the target format.
- For multi-format APIs, implement content negotiation via `Accept` headers with proper `Vary` header.
- Error format can and should differ from success format. RFC 9457 errors + JSON:API resources is a common and defendable combination.
- Microservices internally use bare-body; API gateway transforms to envelope or JSON:API for external consumers.
- Cache granularity must account for format variants — cache the internal representation and format at the edge.

## Performance
- JSON:API compound documents serialize more data per request than envelope or bare-body due to included resources.
- RFC 9457 adds the `type` URI field to every error, increasing size slightly but providing machine-readable error taxonomy.
- Multi-format support via content negotiation adds response-time branching — pre-compute format strategy at route registration time.
- Serialization caching per format variant multiplies cache storage; cache internal representation and format at the edge.

## Security
- Format adapter must never expose internal model fields not intended for the target format — each format has its own serialization contract.
- Content negotiation fallback must not silently serve wrong format — if no matching format exists, return 406 Not Acceptable.
- RFC 9457 `type` URIs should point to documentation, not internal endpoints or debug pages.
- JSON:API compound documents must respect sparse fieldsets and include permissions — never include resources the client is not authorized to see.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Inconsistent format per endpoint | Envelope for users, bare-body for posts | No centralized format policy | Clients must learn per-endpoint format | Define format policy per version, enforce via middleware |
| Over-engineering with JSON:API | Full JSON:API for a 3-endpoint API | Following trends without assessing need | Spec overhead outweighs benefits for small APIs | Start with envelope or bare-body; adopt JSON:API when tooling demands it |
| Bare-body at public API | Exposing bare-body to unknown third-party clients | Convenience during development | Any new metadata requirement becomes a breaking change | Use envelope for public APIs; reserve bare-body for internal |
| Custom error format | Returning `{"error": "message"}` instead of RFC 9457 | Simplicity during initial implementation | Gateways cannot parse errors automatically | Adopt RFC 9457 from day one — `type`, `title`, `detail`, `status`, `instance` |
| Dynamic format detection | Choosing format based on runtime client sniffing | Attempting to optimize per request | Untestable, unpredictable behavior | Lock format to version; support multi-format via explicit content negotiation |
| Format mismatch on error | Success uses JSON:API, errors use custom structure | Not unifying error path | Error handling code must parse two structures | Always use RFC 9457 for errors regardless of success format |

## Anti-Patterns
- **Format Per Developer**: Each team member chooses their preferred format per endpoint. Enforce via middleware.
- **Format via User-Agent**: Detecting browser vs. app to choose format. Use explicit `Accept` headers instead.
- **Silent Format Fallback**: Content negotiation with no matching format returns a default without notifying the client. Return 406.
- **Partial JSON:API Compliance**: Claiming JSON:API but omitting required fields (`type`, `id`). Causes client-side validation failures.
- **RFC 9457 Without Type URI**: Omitting `type` makes errors non-compliant and breaks machine classification.

## Examples
```php
// Format selection via middleware based on Accept header
public function handle($request, Closure $next)
{
    $accept = $request->header('Accept', 'application/json');
    
    $format = match (true) {
        str_contains($accept, 'vnd.api+json') => 'json-api',
        str_contains($accept, 'problem+json') => 'problem-details',
        default => 'envelope',
    };
    
    $request->attributes->set('response_format', $format);
    return $next($request);
}

// Decision matrix summary:
// | Characteristic          | Envelope | Bare-Body | JSON:API | RFC 9457 |
// |-------------------------|----------|-----------|----------|----------|
// | Consumer diversity      | High     | Low       | High     | High     |
// | Bandwidth efficiency    | Low      | High      | Low-Med  | High     |
// | Extensibility           | High     | Low       | High     | Medium   |
// | Specification rigidity  | Low      | Low       | High     | High     |
// | Client tooling support  | Low      | None      | High     | Medium   |
// | Implementation cost     | Low      | None      | High     | Low      |
```

## Related Topics
- **Prerequisites**: envelope-response-design, bare-body-response-design, data-wrapping-configuration
- **Related**: json-api-resource-structure, rfc-9457-problem-details
- **Advanced**: response-versioning, json-api-compound-documents

## AI Agent Notes
- Choose envelope for public APIs, bare-body for internal/BFF, JSON:API when client tooling demands specification compliance.
- Use RFC 9457 for ALL error responses regardless of the success response format.
- Lock format to API version — format changes require a version bump.
- Use middleware to apply format transformation, keeping controllers format-agnostic.
- For multi-format APIs, implement explicit content negotiation via `Accept` headers.

## Verification
- Every endpoint returns a consistent format per version (verified via integration tests).
- Error responses use RFC 9457 structure (`type`, `title`, `detail`, `status`, `instance`) across all endpoints.
- Content negotiation returns 406 Not Acceptable for unsupported formats — no silent fallback.
- Format policy is documented and enforced at the middleware or base controller level.
- All endpoints within a version use the same format — no per-endpoint variation.
- OpenAPI schema documents the response format correctly for each version.
