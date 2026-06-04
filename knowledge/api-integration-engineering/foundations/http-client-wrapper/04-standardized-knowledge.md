# ECC Standardized Knowledge — HTTP Client Wrapper

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | HTTP Client Wrapper |
| Difficulty | Foundation |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K001, K002, K010 |

## Overview (Engineering Value)
An HTTP client wrapper abstracts the underlying HTTP transport layer (Guzzle, Laravel Http facade, SaloonPHP) behind a consistent interface, decoupling application code from specific HTTP implementations. In Laravel, this is achieved through service classes that wrap the Http facade, or through Saloon connectors. The wrapper provides centralized configuration (base URL, default headers, auth, timeouts), consistent error handling (exception mapping), and testability (easy mocking/faking). This prevents vendor lock-in to specific HTTP libraries and enables swapping implementations without changing business logic.

## Core Concepts
- **Transport Abstraction**: Wrapper hides HTTP implementation details from callers
- **Centralized Configuration**: Base URL, headers, timeout, retry configured in one place
- **Consistent Error Handling**: HTTP status codes mapped to typed exceptions
- **Auth Injection**: Bearer tokens, API keys, OAuth2 managed by the wrapper
- **Testability**: Wrapper accepts injectable HTTP client for faking in tests
- **Logging/Tracing**: Outbound requests logged with duration, status, and context

## When To Use
- Every external API integration in a Laravel application
- Multiple endpoints from the same API service
- Services requiring consistent auth, logging, or error handling

## When NOT To Use
- Single one-off HTTP call (use Http facade directly)
- Prototype/exploratory code

## Best Practices
- Inject Http facade via constructor (enables `Http::fake()` in tests)
- Configure timeouts and retry at the wrapper level, not per-call
- Map HTTP exceptions to domain exceptions in the wrapper
- Log every outbound call with duration and status for observability

## Architecture Guidelines
- Service classes in `App\Services\{Service}\` or Saloon connectors
- Centralized in `config/services/{service}.php`
- Error mapping in `app/Exceptions/` or service-specific exceptions
- Middleware for cross-cutting concerns (logging, tracing headers)

## Performance Considerations
- Wrapper adds negligible overhead (~0.1ms) vs HTTP call latency (50-5000ms)
- Connection pooling via shared Guzzle client instance
- Auth token caching at wrapper level eliminates repeated auth requests

## Common Mistakes
- Making API calls directly in controllers without a wrapper
- Hardcoding URLs and credentials in the wrapper instead of config files
- Returning raw Response objects instead of typed data

## Related Topics
- **Prerequisites**: Laravel Http facade, Guzzle basics
- **Closely Related**: Service class patterns, Saloon connectors
- **Advanced**: Multi-tenant wrappers, custom Guzzle middleware
- **Cross-Domain**: Hexagonal architecture, dependency injection

## Verification
- [ ] Wrapper injects Http facade via constructor
- [ ] Configuration externalized to config files
- [ ] Error responses map to typed domain exceptions
- [ ] Tests use `Http::fake()` without real HTTP calls
- [ ] Logging captures duration and status
