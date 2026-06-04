---
id: ku-aie-001
title: "API Client SDK Generation & Distribution"
subdomain: "sdk-generation"
ku-type: "practice"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "draft"
file-path: "research/workspaces/api-integration-engineering/08-sdk-generation/02-knowledge-unit.md"
---

# API Client SDK Generation & Distribution

## Executive Summary

API client SDKs encapsulate the complexity of interacting with external APIs behind a clean, typed, testable interface. In the Laravel ecosystem, the dominant approach is building structured SDKs using SaloonPHP's Connector/Request pattern, with manual or OpenAPI-driven generation. SDKs are distributed as Composer packages with semantic versioning, comprehensive documentation, and CI/CD pipelines for testing against sandbox and production API environments.

## Core Concepts

- **Connector Pattern:** Base class defining API base URL, default headers, authentication, timeout, and HTTP middleware stack.
- **Request Objects:** Typed classes representing individual API endpoints with method, path, body, query params, and response DTO mapping.
- **Response DTOs:** Typed data transfer objects mapping API JSON responses to PHP objects with type safety and serialization.
- **SDK Generation:** Manual (Saloon-based structured SDK) or automatic (OpenAPI spec -> code generators like Speakeasy, Fern).
- **Package Distribution:** Composer package with semantic versioning, README, changelog, and upgrade guides.
- **Contract Testing:** Tests ensuring the SDK correctly communicates with the actual API (sandbox/staging environment).
- **Mock Testing:** Tests using fake responses to verify SDK behavior without network calls.
- **Versioning:** The SDK version aligns with the API version; major version bumps indicate breaking API changes.

## Mental Models

- **API as Contract:** Think of the SDK as a legally binding contract between your application and the external service. Every method signature is a promise about request/response format.
- **Translator Pattern:** SDK translates between PHP-native constructs (objects, methods, types) and API-native constructs (JSON, HTTP verbs, endpoints).
- **Connector as Embassy:** The Connector is your application's embassy in the API's territory—it handles authentication, protocol, and cultural (format) differences.

## Internal Mechanics

- Saloon Connector creates a Guzzle client instance with configured defaults, middleware, and plugins. Each `send()` call resolves the full request pipeline: Connector middleware -> Request middleware -> Guzzle middleware stack -> HTTP transport.
- Response DTO mapping happens after the HTTP response is received. The `createDtoFromResponse()` method casts JSON response data to typed PHP objects using array/JsonSerializable interfaces or Spatie data packages.
- Pagination handling wraps consecutive API calls into a Laravel-compatible `Paginator` or `CursorPaginator` instance with `next_page_url`, `prev_page_url`, and per-page configuration.
- Authentication plugins (Bearer token, OAuth2 client credentials) intercept requests to inject authorization headers, automatically refresh expiring tokens via middleware hooks.

## Patterns

- **Manual SDK Build:** Define Connector + Request classes manually. Full control, no generation dependency. Best for small APIs or evolving specs.
- **OpenAPI-Generated SDK:** Import OpenAPI spec via Speakeasy/Fern. Fast initial generation, but regeneration handling and customization can be complex.
- **Hybrid SDK:** Auto-generate DTOs and basic request structure from OpenAPI; manually customize Connector authentication, error handling, and pagination.
- **SDK + Service Layer:** Wrap the SDK in a Laravel service class that adds business logic, caching, fallback, and event dispatching.
- **Versioned SDK Skeleton:** Maintain multiple SDK versions for different API versions, using Composer version constraints for selection.

## Architectural Decisions

| Decision | Option A | Option B | Rationale |
|----------|----------|----------|-----------|
| Generation Approach | Manual (Saloon) | Auto (Speakeasy) | Manual for small APIs, auto for large/complex OpenAPI specs |
| DTO Library | Spatie Data | Native array/object | Spatie for type safety and validation; native for simple pass-through |
| Auth Handling | Connector plugin | Request-level override | Plugin for consistent auth, override for per-request overrides |
| Error Taxonomy | Custom exceptions | Saloon error types | Custom for business-specific errors, Saloon for HTTP-level |
| Pagination | Saloon pagination plugin | Manual cursor tracking | Plugin for standard pagination, manual for non-standard APIs |

## Tradeoffs

- **Manual vs. Auto:** Manual gives full control but is slower to create and update. Auto is faster initially but regeneration can break custom logic.
- **Thin vs. Thick SDK:** Thin SDKs pass through API responses minimally processed (flexible but leaky). Thick SDKs add business logic, caching, retry (robust but coupled).
- **Monolithic vs. Micro SDKs:** One SDK package per API provider vs. multiple focused packages per API domain. Monolithic simpler, micro is cleaner for large APIs.
- **Synchronous vs. Async Methods:** Laravel's HTTP client supports both; SDKs can expose both `get()` and `getAsync()` variants.

## Performance Considerations

- DTO casting overhead: ~0.1-0.5ms per response (Spatie Data with caching). Negligible for most APIs.
- Connector initialization: ~1-3ms (Guzzle client creation, middleware resolution). Cache connector instances per request.
- Serialization for large responses (>1MB): Can add 10-50ms. Consider streaming for large payloads.
- Automatic token refresh: Adds one extra HTTP call per token expiry window. Cache tokens with appropriate TTL.
- Pagination: Sequential page fetching adds latency proportional to page count. Use parallel fetching where API supports it.

## Production Considerations

- Pin SDK version in composer.json — never use `^` for third-party SDKs without lockfile review.
- Implement retry with exponential backoff at the SDK level, not just the HTTP client level.
- Log all SDK errors with context (endpoint, request ID, status code) for debugging.
- Monitor SDK error rates per endpoint — a spike in 500s from an external API needs alerting.
- Test SDK against sandbox API in CI; use recorded fixtures for local/dev testing.
- Document rate limits and pagination limits in SDK README.

## Common Mistakes

- Generating DTOs from OpenAPI spec without validating nullable fields — causes type errors on null responses.
- Assuming all API responses have the same structure — handle envelope variations (data wrapper, errors wrapper).
- Not handling API version deprecation — SDK should throw clear error when API version is sunset.
- Leaking Guzzle/PSR-7 types outside the SDK — application code should only see SDK-specific types.
- Forgetting to implement request logging middleware — debugging production issues becomes guesswork.

## Failure Modes

- **OpenAPI Spec Drift:** The spec changes but the generated SDK is not regenerated — silent failures or type mismatches.
- **Rate Limit Saturation:** SDK doesn't implement backpressure — sends requests into rate-limited API, all fail.
- **Auth Token Expiry Race:** Multiple concurrent requests trigger simultaneous token refresh — stale token used.
- **Response Shape Change:** API adds a required field or changes a field type — DTO casting fails at runtime.
- **SDK Compatibility Break:** Composer pulls a breaking SDK version — application deployment fails.

## Ecosystem Usage

- **SaloonPHP v4:** Primary framework for building structured PHP API SDKs. Connector, Request, Response, plugins (cache, rate limit, pagination, OAuth2, DTO).
- **Speakeasy:** OpenAPI-to-SDK generator supporting PHP output. Generates Saloon-compatible SDKs.
- **Fern:** OpenAPI-based SDK generator with PHP support, typed clients, and documentation generation.
- **Postman-to-OpenAPI:** Convert Postman collections to OpenAPI specs for SDK generation.
- **Scribe:** Generate OpenAPI documentation from Laravel routes (used server-side, but complementary for understanding API structure).
- **Spatie Data:** DTO library with type casting, validation, and array/JSON serialization.

## Related Knowledge Units

- ku-aie-002: Package Landscape (SDK package evaluation)
- ku-aie-003: SaloonPHP Deep Dive (Connector/Request internals)
- ku-aie-004: Contract Testing for SDKs
- ku-http-001: HTTP Client Foundations (underlying HTTP layer)

## Research Notes

- SaloonPHP v4 (released 2025) is the dominant SDK framework; the ecosystem of plugins and community adoption make it the default choice.
- OpenAPI SDK generation tools (Speakeasy, Fern) are maturing but PHP support lags behind TypeScript/Go — manual post-generation tweaks are often required.
- The trend is toward "thin SDK over typed connector" — minimal business logic in SDK, using Laravel service classes for domain-specific logic.
- DTOs generated from OpenAPI specs often need manual adjustment for nullable fields and polymorphic responses — pure auto-generation is rarely sufficient.
- SDK testing with sandbox environments in CI is increasingly standard practice for production-grade integrations.
