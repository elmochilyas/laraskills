# ECC Standardized Knowledge — Client SDK Generation

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | api-client-sdk-design |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | Client SDK Generation |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K010, K038, K016, K027 |

## Overview (Engineering Value)
API client SDK generation produces type-safe, language-specific client libraries from OpenAPI specifications or structured patterns like SaloonPHP, dramatically reducing the effort of building and maintaining API integrations. In the Laravel ecosystem, SDKs can be hand-built using Saloon's Connector/Request/Response pattern for full control, or auto-generated from OpenAPI specs via tools like Speakeasy, Fern, and OpenAPI Generator for rapid development. The engineering value lies in consistent abstractions, type safety, reduced boilerplate, and maintainable integration code across multiple external APIs.

## Core Concepts
- **OpenAPI as Source of Truth**: Machine-readable API specification that drives SDK generation
- **Saloon Connector Pattern**: Declarative base URL, headers, auth, and middleware configuration per API service
- **Request Objects**: Single class per API endpoint defining method, path, query params, body, and response type
- **Response DTOs**: Typed data transfer objects representing API response structures with type safety
- **Code Generation Pipeline**: OpenAPI spec → generator → typed SDK with models, client, serialization
- **Pagination Abstraction**: Unified cursor/page/offset pagination handling via Saloon's pagination plugin
- **Plugin Architecture**: Composable traits (Cache, Rate Limit, OAuth2, DTO) extending connector capabilities

## When To Use
- Building structured integrations with 3+ external APIs: use Saloon SDK pattern for consistency
- Consuming APIs with well-maintained OpenAPI specs: use auto-generation for speed
- Distributing a PHP client library for your own API: use Saloon-based SDK for Laravel ecosystem compatibility
- Multiple developers working on integrations: SDKs enforce consistent patterns across the team

## When NOT To Use
- Single simple API call (e.g., one POST to Slack): raw Http facade suffices
- API without stable spec or with frequent breaking changes: generation becomes a maintenance burden
- Prototype/exploratory code where speed of iteration trumps structure
- Vendor already provides an official well-maintained PHP SDK

## Best Practices (explain WHY)
- **Use Saloon for 3+ integrations**: Consistency reduces cognitive load across different API integrations; each follows the same Connector/Request/Response pattern
- **Generate SDKs from verified specs only**: A wrong spec produces broken SDKs; test generated code against real API responses
- **Wrap generated SDKs in service classes**: Generated code is generic; Laravel service classes add caching, logging, circuit breaker integration without modifying generated code
- **Pin generator versions in CI**: Different generator versions produce different output with the same spec, causing unexpected SDK changes
- **Keep generated code separate from hand-written**: Never modify generated files directly; extend or wrap them to preserve regeneration capability

## Architecture Guidelines
- One Connector per external API service (StripeConnector, GitHubConnector)
- One Request class per API endpoint grouped by resource domain
- DTOs in `App\Data\{Service}\` namespace with `fromResponse()` factory methods
- SDKs in separate package/repository for independent versioning
- Service classes wrap connectors for Laravel-specific concerns (cache, queue, events)

## Performance Considerations
- Connector reuse preserves Guzzle connection pooling for lower latency
- DTO instantiation overhead is negligible (~0.001ms) vs HTTP call latency (50-5000ms)
- Auto-generated SDKs add minimal overhead (serialization/deserialization method calls)
- Response recording in tests eliminates network latency entirely
- Cached responses at the connector level serve in ~1-5ms (Redis) vs 50-5000ms (API call)

## Security Considerations
- Never commit signing secrets or API keys in SDK configuration; use environment variables or vaults
- Saloon v4 requires `allowBaseUrlOverride` opt-in for requests composing endpoints from user input (CVE fix)
- Validate and sanitize any user input passed to SDK methods to prevent SSRF
- Auto-generated SDKs may expose internal implementation details if generated from overly permissive specs
- Rotate API credentials used by SDKs regularly via multi-key rotation support

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Creating new connector per request | Not understanding connection reuse | No connection pooling, higher latency, socket exhaustion | Inject a single connector instance (singleton) per service |
| Modifying auto-generated SDK code | Convenience over maintainability | Changes lost on regeneration; SDK drift | Extend generated classes or wrap in service layer |
| Not handling non-success HTTP codes | Assuming 2xx always | Silent failures when API returns errors | Register error handling middleware on connector |
| Mixing v3 and v4 Saloon patterns | Upgrade without migration | Serialization errors, base URL override failures | Read v4 upgrade guide; use v4 patterns consistently |
| No DTOs for return types | Speed over safety | Raw array access, no autocompletion, brittle code | Define DTOs from day one; type safety pays for itself |

## Anti-Patterns
- **God Connector**: One connector for all APIs (violates single responsibility; breaks per-service configuration)
- **Inline SDK Generation**: Generating SDKs during request processing instead of build-time
- **Unversioned SDKs**: SDK deployed without version constraints; breaks consumers on regeneration
- **Over-abstraction**: Creating interfaces and factories when only one implementation exists

## Examples (concise, architectural)
```php
// Saloon SDK structure
class StripeConnector extends Connector
{
    public function resolveBaseUrl(): string { return 'https://api.stripe.com/v1/'; }
    protected function defaultHeaders(): array { return ['Authorization' => 'Bearer '.config('services.stripe.secret')]; }
}

class ListChargesRequest extends Request
{
    protected Method $method = Method::GET;
    public function resolveEndpoint(): string { return '/charges'; }
    public function createDtoFromResponse(Response $response): ChargesList { /* ... */ }
}

// Usage in service class
class StripeService
{
    public function __construct(private StripeConnector $connector) {}
    public function listCharges(): ChargesList {
        return $this->connector->send(new ListChargesRequest)->dto();
    }
}
```

## Related Topics
- **Prerequisites**: HTTP client fundamentals (Guzzle, PSR-18), service layer patterns
- **Closely Related**: API versioning strategies, DTO patterns, OpenAPI documentation generation
- **Advanced**: Multi-tenant connectors, custom Saloon plugins, SDK distribution via Composer
- **Cross-Domain**: Package development (PHP package engineering)

## AI Agent Notes
- When generating SDK code, prefer SaloonPHP v4 Connector/Request pattern
- Create both connector and at least one request class per API endpoint as reference
- Include DTO mapping from response data in the request class
- Add tests using Saloon's MockClient with fixture recording

## Verification
- [ ] Connector resolves correct base URL for all environments
- [ ] Request objects produce correct HTTP method and endpoint path
- [ ] DTO casting succeeds with real API response fixtures
- [ ] MockClient tests pass without real HTTP calls
- [ ] Pagination handles all pages for multi-page responses
- [ ] Error responses map to typed exceptions, not raw Guzzle exceptions
