# Metadata
Domain: API Integration Engineering
Subdomain: HTTP Client & API Consumption Patterns
Knowledge Unit: SaloonPHP Connector/Request/Response Pattern
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
SaloonPHP is the dominant structured API integration framework in the PHP/Laravel ecosystem (v4.0.0 released March 2026). Its Connector/Request/Response architecture provides a declarative, testable pattern for building API integrations and SDKs. The Connector defines base configuration (URL, headers, auth), Request objects represent individual API endpoints with typed methods, and Response handling includes DTO casting, error handling, and pagination support.

## Core Concepts
- **Connector**: Top-level class defining base URL, default headers, authentication, HTTP client configuration, and middleware
- **Request**: Single class per API endpoint, defining HTTP method, URL path, query parameters, body, headers, and response type
- **Response**: Wrapper around Guzzle's PSR-7 response with DTO casting, JSON/array access, and error inspection
- **Plugins**: Composable behaviors (Cache, Rate Limit, Pagination, OAuth2, DTO) installed per connector
- **MockClient**: Global or per-connector fake response system for testing with request recording and fixture replay
- **Laravel Plugin**: Artisan commands (`saloon:connector`, `saloon:request`), facade, Telescope/Pulse/Nightwatch integration

## Mental Models
- **API as Configuration**: Each connector declaratively describes an API; requests fill in the endpoint specifics
- **Factory Pattern**: Connector acts as a factory for requests and specifies how they're sent and authenticated
- **Plugin Architecture**: Mixin-style traits add capabilities to connectors without inheritance

## Internal Mechanics
- Saloon wraps Guzzle's `HandlerStack`, adding middleware for auth, plugins, mocking, and recording
- `Connector::send(Request)` resolves the full URL (base + endpoint), applies middleware, sends via Guzzle, and wraps the result in a Saloon `Response`
- `Response::dto()` calls `Request::createDtoFromResponse()` which maps response data to a typed DTO using the configured mapper
- Plugins are Laravel-style traits that hook into connector lifecycle: `bootConnector()`, `bootRequest()`, `addMiddleware()`
- MockClient intercepts at the Guzzle middleware level, matching requests by class or URL pattern
- Request recording stores request/response pairs in files for deterministic replay

## Patterns
- **Connector Per Service**: One connector per external API (StripeConnector, GitHubConnector)
- **Resource Grouping**: Group related requests into `BaseResource` subclasses accessed via connector methods
- **DTO Casting**: Implement `createDtoFromResponse()` on requests to return typed data transfer objects
- **Custom Response Classes**: Extend `Saloon\Http\Response` for API-specific response handling (error parsing, pagination helpers)
- **Connector Factory**: Use a factory pattern to create configured connector instances with different credentials per tenant

## Architectural Decisions
- Prefer Saloon over raw Guzzle or Http facade for projects with 3+ external API integrations
- Use Saloon's DTO plugin for structured data mapping instead of manual array access
- Implement custom `Response` classes when APIs return non-standard error formats
- Use `MockClient::global()` in tests with fixture recording for reliable, fast test suites
- Choose Saloon over vendor SDKs for consistent patterns across all integrations

## Tradeoffs
- More classes per integration (minimum 2: connector + request) compared to Http facade's single call
- Learning curve for Connector/Request/Plugin architecture vs Guzzle's simpler client
- Saloon v4 introduces breaking changes from v3 (serialization removed, base URL override requires opt-in, fixture path restriction)
- Plugin ecosystem covers common cases but custom plugin development requires understanding Guzzle middleware composition
- Saloon adds abstraction layers that may obscure low-level HTTP debugging

## Performance Considerations
- Saloon's middleware adds negligible overhead (~1-2ms per request) compared to network latency
- MockClient runs in-memory, eliminating network latency entirely in tests
- DTO mapping cost scales with response size; lazy loading of collection DTOs reduces overhead
- Response recording writes to disk; may be slow in write-constrained CI environments

## Production Considerations
- Configure timeouts and retries at the Connector level for consistent behavior across all requests
- Use Saloon's Laravel plugin for automatic Telescope/Pulse/Nightwatch integration
- Register `SendingSaloonRequest`/`SentSaloonRequest` event listeners for audit logging
- Pin Saloon version in `composer.json` and test upgrades due to potential breaking changes
- Use `Config` interface to inject per-environment configuration into connectors

## Common Mistakes
- Creating a new connector instance per request instead of reusing (loses Guzzle connection pooling)
- Not handling non-success HTTP codes (Saloon throws `ServerException`/`ClientException` by default)
- Mixing v3 and v4 Saloon patterns after upgrade (serialization, base URL override changes)
- Overriding `resolveBaseUrl()` with user input without `allowBaseUrlOverride` opt-in (security CVE in v4)
- Forgetting to call `Saloon::fake()` before requests in tests, causing real HTTP calls

## Failure Modes
- Saloon v3-to-v4 upgrade breaks serialization-dependent code and base URL override behaviors
- MockClient without matching request class/URL returns `RequestNotFoundException`
- Plugin order matters; rate limit plugin must run before cache plugin for correct behavior
- Fixture directory not writable causes test failures during recording mode
- Custom middleware that throws exceptions can leave Saloon in inconsistent state

## Ecosystem Usage
- De facto standard for Laravel API integrations; recommended by Laravel community leaders
- Used by major open-source projects and commercial Laravel applications
- Plugin ecosystem covers caching, rate limiting, pagination, OAuth2, DTO, and Laravel integration
- Compatible with Laravel Telescope, Pulse, Nightwatch, and Horizon
- Framework-agnostic; also used with Symfony and vanilla PHP projects

## Related Knowledge Units
- K001: Laravel Http Facade API (alternative pattern for simpler integrations)
- K002: Guzzle HTTP Client Internals (transport layer for Saloon)
- K025: Rate Limit Plugin for SaloonPHP (built-in rate limiting extension)
- K026: Cache Plugin for SaloonPHP (response caching extension)
- K027: Pagination Plugin for SaloonPHP (pagination handling extension)
- K016: DTOs vs Resources Pattern (DTO plugin usage)

## Research Notes
- Saloon v4 released March 2026 as a security update fixing three CVEs (serialization, base URL override, fixture path traversal)
- v4 requires opt-in `allowBaseUrlOverride` for requests that compose endpoints from user input
- Laravel plugin v4 supports Laravel Nightwatch natively since v3.6.0
- Sam Carré is the primary author; the package is framework-agnostic with dedicated Laravel plugin
- Community adoption is high; Ash Allen's "Consuming APIs In Laravel" book features Saloon prominently
