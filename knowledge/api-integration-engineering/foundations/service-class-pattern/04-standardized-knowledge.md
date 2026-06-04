# ECC Standardized Knowledge — Service Class Pattern for API Communication

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | http-client-api-consumption |
| Knowledge Unit ID | ku-03 |
| Knowledge Unit | Service Class Pattern for API Communication |
| Difficulty | Beginner |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K001, K016 |

## Overview (Engineering Value)
The service class pattern encapsulates all external API communication logic into dedicated, injectable service classes. Instead of scattering Http facade calls across controllers, jobs, or commands, a single service class owns the integration — including request construction, response parsing, error handling, and retry logic. This centralization makes integrations testable, maintainable, and consistent.

## Core Concepts
- **Service Class**: Dedicated PHP class for one external API integration
- **Single Responsibility**: The service only handles API communication and response mapping
- **Dependency Injection**: Service receives dependencies (Http client, logger, config) via constructor
- **Contract/Interface**: Interface defines service methods for mockability
- **Response Mapping**: API responses mapped to DTOs or collections within the service
- **Error Boundary**: Service handles HTTP errors, timeouts, and malformed responses internally

## When To Use
- Any project consuming external APIs
- Teams needing consistent integration patterns
- When testability of API calls is important
- Multiple endpoints for the same external service

## When NOT To Use
- One-off API calls in a prototype
- When using SaloonPHP which already formalizes this pattern
- Extremely simple integrations (single GET endpoint)

## Best Practices
- Define an interface for each service to enable DI and testing
- Inject Guzzle/Saloon client via constructor, never instantiate inside
- Return DTOs or collections, never raw arrays or Response objects
- Handle all HTTP-level errors within the service (4xx, 5xx, timeouts)
- Log all requests and responses at debug level
- Single responsibility: one service class per external system

## Architecture Guidelines
- Service classes in `Services/{ExternalSystemName}.php`
- DTOs in `Data/{ExternalSystemName}/`
- Interface in `Contracts/Services/{ExternalSystemName}.php`
- Registered in ServiceProvider with interface-to-implementation binding
- Factory pattern for services needing runtime configuration

## Performance Considerations
- Service instantiation overhead is negligible (~0.01ms)
- DTO mapping adds ~0.05-0.1ms per response
- No additional overhead beyond underlying HTTP client

## Common Mistakes
- Mixing business logic with API communication in service class
- Returning Eloquent models from API service classes
- Not defining interfaces (tight coupling, hard to mock)
- Catching all exceptions with generic `catch (\Throwable $e)`
- Service classes with implicit dependencies on global state

## Related Topics
- **Prerequisites**: Dependency injection, SOLID principles
- **Closely Related**: SaloonPHP patterns, Guzzle internals
- **Advanced**: Repository pattern with API data sources, CQRS
- **Cross-Domain**: Clean architecture, hexagonal architecture

## Verification
- [ ] Interface defined for each service class
- [ ] HTTP client injected via constructor
- [ ] DTOs used for response mapping
- [ ] Errors handled within service boundary
- [ ] Service registered as interface-to-implementation in ServiceProvider
- [ ] No Eloquent models returned from service methods
