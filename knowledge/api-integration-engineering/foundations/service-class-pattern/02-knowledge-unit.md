# Metadata
Domain: API Integration Engineering
Subdomain: HTTP Client & API Consumption Patterns
Knowledge Unit: Service Class Pattern for API Encapsulation
Difficulty Level: Foundation
Last Updated: 2026-06-02

## Executive Summary
The service class pattern encapsulates external API logic into dedicated PHP classes, separating HTTP concerns from application business logic. It is the primary architectural pattern for organizing API integrations in Laravel applications, replacing the antipattern of inline API calls in controllers. Service classes abstract authentication, request formation, response parsing, and error handling into reusable, testable units.

## Core Concepts
- Service classes are plain PHP classes (often with Laravel dependency injection) that encapsulate API interactions
- Single responsibility: one service class per external API or logical API group
- Service classes receive dependencies via constructor injection (Http facade, config, logger)
- Methods map to API operations: `createCustomer()`, `listInvoices()`, `sendNotification()`
- Service classes return typed data (DTOs, collections, models) rather than raw Response objects
- Services are injected into controllers, jobs, or other services via Laravel's container

## Mental Models
- **API as Repository**: Treat the external API like a database repository; the service class is the repository implementation
- **Facade for the External World**: The service class presents a clean Laravel-native interface hiding HTTP complexity
- **Adapter Pattern**: The service class adapts the external API's interface to your application's expected interface

## Internal Mechanics
- Service classes typically use constructor property promotion for dependencies: `public function __construct(protected Http $http) {}`
- Configuration (base URL, API keys, timeouts) comes from Laravel config files bound to the service
- Response handling maps HTTP status codes to domain exceptions: `NotFoundException`, `ValidationException`, `ApiException`
- Method chaining or fluent builders manage request parameters before final execution
- Service classes can extend base classes that provide shared functionality (auth, logging, retry)

## Patterns
- **Constructor Configuration**: Accept credentials and configuration in the constructor for per-instance customization
- **DTO Return Types**: Return typed DTOs or collections instead of raw arrays for type safety
- **Exception Mapping**: Transform HTTP errors into domain-specific exceptions with appropriate HTTP status mapping
- **Logging Decorator**: Use Laravel's logging facade to record all API calls with duration and status
- **Cache Integration**: Wrap GET requests with Laravel's Cache facade for response caching
- **Queue Fallback**: Provide synchronous and queued execution paths for the same service method

## Architectural Decisions
- Place service classes in `App\Services\` or grouped by domain: `App\Services\Payment\StripeService`
- Use interfaces for services that may have multiple implementations (different providers)
- Keep service classes stateless where possible; inject state via method parameters
- Do not extend Eloquent Model; services are independent of the persistence layer
- Use Laravel's `AppServiceProvider` or dedicated service providers for binding and configuration

## Tradeoffs
- More classes than inline calls, increasing file count but improving maintainability
- DTO mapping adds upfront cost but provides type safety and IDE autocompletion
- Abstracting too early (before third API call) can lead to over-engineering with interfaces
- Service classes can grow large; split at the point where methods exceed ~15-20 per class

## Performance Considerations
- Service class instantiation is negligible overhead compared to HTTP call latency
- Constructor injection via container adds minimal overhead (service resolution cached after first resolution)
- Response DTO creation adds CPU time proportional to payload size; lazy DTO mapping can defer cost
- Service caching (memoizing results per request) prevents duplicate API calls within a single request lifecycle

## Production Considerations
- Always log service calls with duration and response status for debugging and monitoring
- Implement health check methods for integration health endpoints: `public function ping(): bool`
- Use Laravel's `Http::fake()` in tests for service classes; inject a fake-aware Http instance
- Register services as singletons in the container if they hold no per-request state
- Configure separate service instances per tenant in multi-tenant applications

## Common Mistakes
- Making API calls directly in controllers, bypassing service layer encapsulation
- Returning raw `Response` objects from service methods, leaking HTTP abstractions
- Mixing business logic (validation, authorization) with API transport concerns in the same service
- Not using constructor injection, instead creating services with `new` and manual dependency wiring
- Hardcoding API configuration in service classes instead of using Laravel config files

## Failure Modes
- Service class becomes a god class with methods for all API operations; violates Single Responsibility Principle
- Over-abstraction with unnecessary interfaces for single-implementation services
- Missing error handling in service methods propagates HTTP exceptions to controllers
- Service class instantiated inside a loop causing repeated dependency resolution overhead
- Inconsistent exception types across different services confuse error handling in callers

## Ecosystem Usage
- Ash Allen's "Consuming APIs In Laravel" book centers entirely on service class patterns
- Laravel community standard: service classes in `app/Services/` with `BaseService` abstract class
- Service classes are the recommended pattern for wrapping both Http facade and SaloonPHP connectors
- Domain-driven design uses service classes as "domain services" within bounded contexts
- Framework-agnostic PHP libraries increasingly follow this pattern for API wrappers

## Related Knowledge Units
- K001: Laravel Http Facade API (underlying transport for service classes)
- K010: SaloonPHP Connector/Request/Response Pattern (structured alternative to service classes)
- K016: DTOs vs Resources Pattern (DTOs as return types from service classes)
- K004: Service Class Pattern (this document; foundational pattern reference)

## Research Notes
- Laravel community consensus strongly recommends service classes over inline API calls
- Ash Allen's 440+ page book "Consuming APIs In Laravel" provides the definitive treatment
- Multiple sources identify inline API calls in controllers as the #1 antipattern in Laravel API integration
- The pattern converges with hexagonal architecture: service classes form the "driven ports" layer
