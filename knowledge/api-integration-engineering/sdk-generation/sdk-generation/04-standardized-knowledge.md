---
id: ku-aie-001
title: "API Client SDK Generation & Distribution"
subdomain: "sdk-generation"
ku-type: "practice"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/api-integration-engineering/08-sdk-generation/04-standardized-knowledge.md"
---

# API Client SDK Generation & Distribution

## Metadata
- **Domain:** API Integration Engineering
- **Subdomain:** SDK Generation (08-sdk-generation)
- **KU Type:** Practice
- **Maturity:** Mature
- **Status:** Standardized
- **Created:** 2026-06-02

## Overview

API client SDKs encapsulate external API complexity behind typed, testable PHP interfaces. Laravel ecosystem primarily uses SaloonPHP's Connector/Request pattern for structured SDKs, with OpenAPI-driven auto-generation (Speakeasy, Fern) as an alternative. SDKs are distributed as Composer packages with semantic versioning, contract tests, and CI/CD pipelines.

## Core Concepts

- **Connector Pattern:** Base class defining base URL, headers, auth, timeout, middleware
- **Request Objects:** Typed classes per endpoint (method, path, body, response DTO mapping)
- **Response DTOs:** Typed PHP objects mapping JSON responses with type safety
- **SDK Generation:** Manual (Saloon) or auto (OpenAPI -> Speakeasy/Fern)
- **Contract Testing:** Verify SDK against sandbox API; mock testing with recorded fixtures
- **Package Distribution:** Composer package, semantic versioning, changelog, README

## When To Use

- Applications consuming one or more external APIs with structured request/response formats
- Teams maintaining multiple integrations that benefit from consistent patterns
- APIs that require authentication, pagination, rate limit handling
- Services that need to version SDKs alongside API evolution

## When NOT To Use

- Single-endpoint, no-auth API calls (Http facade suffices)
- Rapid prototyping where SDK overhead is premature
- APIs that rarely change and have trivial request/response shapes
- Webhook-only integrations (no outbound API calls)

## Best Practices

- Keep SDK separate from application code — distribute as Composer package
- Use Spatie Data or native DTOs for typed responses with nullable handling
- Implement retry at SDK level with exponential backoff and jitter
- Log all SDK errors with full context (endpoint, request ID, status, timing)
- Pin SDK versions in composer.json and review lockfile changes
- Test SDK against sandbox API in CI; mock in local development
- Cache connector instances per request to avoid Guzzle re-initialization

## Architecture Guidelines

1. **Connector as entry point:** Single class managing base URL, auth, default headers, timeout, middleware stack
2. **One Request class per endpoint:** Each HTTP verb + path combination gets a dedicated Request class
3. **Response DTO per endpoint pattern:** Each response has a typed DTO with nullable field handling
4. **Authentication as plugin:** Bearer token, OAuth2 client credentials, API key as swappable plugins
5. **Error handling as exception taxonomy:** NetworkException, AuthenticationException, RateLimitException, ValidationException, ServerException
6. **Pagination as iterator:** Return Laravel-compatible paginated/cursor collections from SDK methods

## Performance Considerations

- DTO casting: ~0.1-0.5ms per response (Spatie Data cached)
- Connector init: ~1-3ms — cache per request
- Large response serialization: 10-50ms for >1MB — use streaming
- Token refresh: 1 extra HTTP call per expiry window — cache tokens
- Pagination: latency proportional to page count — prefer parallel fetching

## Security Considerations

- Never log API keys, tokens, or credentials in SDK logging middleware
- Validate response DTO fields before returning to application
- Implement token storage encryption (Laravel's encrypt() for DB-stored tokens)
- Use timing-safe comparison for webhook signature verification in SDK
- Rate limit SDK calls to prevent accidental API abuse

## Common Mistakes

- Not handling nullable fields in generated DTOs — runtime type errors on null responses
- Leaking Guzzle/PSR-7 types outside SDK — application code must only see SDK types
- No request logging — production debugging becomes guesswork
- Assuming all responses have the same envelope structure
- Not regenerating SDK after OpenAPI spec changes — silent failures

## Anti-Patterns

- **Fat SDK:** Business logic mixed with API transport — keep SDK thin, add logic in service layer
- **Inconsistent Auth:** Some requests using Connector auth, others overriding incorrectly
- **No Version Strategy:** SDK version not aligned with API version — confusion about compatibility
- **Monolithic SDK Package:** One package for all API versions — use separate packages or namespaces per version
- **Documentation as Afterthought:** No README, no changelog, no upgrade guide — adoption friction

## Examples

### Saloon Connector
```php
class GitHubConnector extends Connector
{
    public function resolveBaseUrl(): string
    {
        return 'https://api.github.com';
    }

    protected function defaultHeaders(): array
    {
        return [
            'Accept' => 'application/vnd.github.v3+json',
        ];
    }
}
```

### Request with DTO
```php
class GetUserRequest extends Request
{
    protected Method $method = Method::GET;

    public function __construct(
        private string $username,
    ) {}

    public function resolveEndpoint(): string
    {
        return "/users/{$this->username}";
    }

    public function createDtoFromResponse(Response $response): UserDto
    {
        return UserDto::fromArray($response->array());
    }
}
```

## Related Topics

- ku-aie-002: Package Landscape (SDK package evaluation criteria)
- ku-aie-003: SaloonPHP Architecture (Connector/Request internals)
- ku-aie-004: Contract Testing for SDKs
- ku-http-001: HTTP Client Foundations
- ku-ver-001: API Versioning (SDK version alignment with API versions)

## AI Agent Notes

- When building a new SDK, start with manual Saloon approach before considering auto-generation
- The Connector class is the most important design decision — it shapes auth, middleware, and error handling
- Always add request logging middleware early — retrofitting is disruptive
- DTOs must handle nulls explicitly — use nullable types for optional response fields
- For OpenAPI-generated SDKs, review the generated code before committing — auto-generation often misses edge cases

## Verification

- [ ] SDK is a separate Composer package with semantic versioning and README
- [ ] Connector defines base URL, default headers, auth, timeout, and middleware
- [ ] Each endpoint has a dedicated Request class with typed response DTO
- [ ] Error handling maps HTTP status codes to typed exceptions (Network, Auth, RateLimit, Validation, Server)
- [ ] Pagination returns Laravel-compatible paginator/cursor collections
- [ ] Contract tests run against sandbox API in CI; mock tests run locally
- [ ] DTOs handle nullable fields with explicit null types (not bare string/int)
- [ ] Request logging middleware captures endpoint, status, timing, and request ID
- [ ] Guzzle/PSR-7 types are not exposed outside the SDK
- [ ] Token storage uses encryption when persisting credentials
