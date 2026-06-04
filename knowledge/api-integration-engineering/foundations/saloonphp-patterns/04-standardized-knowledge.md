# ECC Standardized Knowledge — SaloonPHP Request Patterns

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-06 |
| Knowledge Unit | SaloonPHP Request Patterns |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K001, K016 |

## Overview (Engineering Value)
SaloonPHP provides an object-oriented abstraction layer over HTTP client calls, formalizing each external API interaction as a typed Request class with a corresponding Connector class for service configuration. This enforces consistent request/response handling, simplifies testing, and enables reusable middleware via pipelines.

## Core Concepts
- **Connector**: Class per external service holding base URL, headers, auth, and config
- **Request**: Class per API endpoint defining method, path, query params, and body
- **Response**: Typed response class mapping API responses to DTOs
- **Pipeline**: Middleware chain (auth, logging, retry) executed per request
- **Plugins**: Reusable connector traits (rate limiting, caching, pagination)
- **Mock Client**: Fake client for testing without real HTTP calls
- **DTOs**: Data Transfer Objects for typed response mapping

## When To Use
- Multiple endpoints for the same external service
- Complex API integrations requiring reusable configuration
- Teams needing consistent patterns across integrations
- Testing with mock responses via Saloon's fake response system

## When NOT To Use
- Single one-off API calls (overkill)
- Simple integrations where Http facade suffices
- When the team is unfamiliar with OOP patterns
- Very rapid prototyping phases

## Best Practices
- One Connector per external service, injected as singleton
- One Request class per endpoint
- Use DTOs for response mapping with `createFromResponse()`
- Pipeline for cross-cutting concerns (auth, logging, retry)
- Test with `MockClient` and assert request details
- Plugins for reusable connector behavior

## Architecture Guidelines
- Connector as service-level singleton registered in ServiceProvider
- Request classes in `Http/Integrations/{ServiceName}/Requests/`
- Response DTOs in `Data/{ServiceName}/`
- Pipeline plugs in connector constructor
- MockClient factory in test base class

## Performance Considerations
- Object overhead per request is negligible (~0.05ms)
- DTO mapping adds ~0.1ms per response
- Pipeline middleware processing ~0.01ms per plug
- MockClient responses pre-computed in test setup

## Common Mistakes
- Putting multiple endpoints in one Request class (violates SRP)
- Not using DTOs, relying on raw arrays throughout codebase
- Tight coupling between Connector and specific Request classes
- Skipping MockClient in tests (testing against real API)
- Over-abstracting endpoints that differ only in URL path

## Related Topics
- **Prerequisites**: Laravel Http facade, OOP design patterns
- **Closely Related**: Service class pattern, Guzzle internals
- **Advanced**: Custom plugins, response casting, Saloon v3 features
- **Cross-Domain**: API client SDK generation, structured logging

## Verification
- [ ] One Connector per external service
- [ ] One Request class per endpoint
- [ ] DTOs used for response mapping
- [ ] Pipeline configured for cross-cutting concerns
- [ ] MockClient used in integration tests
- [ ] Connector registered as singleton in container
