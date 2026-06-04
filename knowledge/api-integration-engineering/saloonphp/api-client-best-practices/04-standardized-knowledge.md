# ECC Standardized Knowledge — API Client Best Practices

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | api-client-sdk-design |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | API Client Best Practices |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K001, K004, K010, K016, K014 |

## Overview (Engineering Value)
API client best practices define the architectural patterns for consuming external APIs in Laravel applications: service layer encapsulation, DTO-based data transfer, authentication management, error handling, and testing strategies. The primary engineering value is maintainability — structured patterns prevent the common antipattern of inline API calls in controllers, ensure consistent error handling, enable comprehensive testing, and allow swapping providers without rewriting business logic.

## Core Concepts
- **Service Class Pattern**: Dedicated PHP classes encapsulating all API interaction for an external service
- **DTOs as Return Types**: Typed immutable objects replacing raw arrays for type safety and IDE autocompletion
- **Constructor Injection**: Dependencies (Http facade, config, logger) injected via constructor for testability
- **Exception Mapping**: HTTP errors mapped to domain-specific exceptions for clean error handling
- **Authentication Abstraction**: OAuth2 client credentials, Bearer tokens, API keys managed at the service layer
- **Configuration Externalization**: Base URLs, keys, timeouts from Laravel config files, never hardcoded
- **Fake-First Testing**: Predefined responses via `Http::fake()` for deterministic test suites

## When To Use
- Every external API integration in a Laravel application
- Projects with multiple developers where consistent patterns reduce cognitive load
- Any integration that needs to be unit-testable without real HTTP calls
- Services that may need provider swapping (e.g., Mailgun → Postmark)

## When NOT To Use
- One-off scripts and maintenance tasks
- Very simple integrations (one GET endpoint, no auth): Http facade inline is acceptable
- Prototypes where speed dominates over structure

## Best Practices (explain WHY)
- **Never call APIs directly in controllers**: Controllers should orchestrate, not transport; service classes keep HTTP concerns separate from HTTP request handling
- **Return DTOs, not raw responses**: Typed return values provide autocompletion, prevent array key typos, and document the API contract
- **Inject Http facade via constructor**: Enables `Http::fake()` injection in tests without modifying service code
- **Extract config to Laravel config files**: Environment-specific credentials and endpoints change independently of code; config files manage this cleanly
- **Map HTTP errors to domain exceptions**: Business logic should catch `PaymentFailedException`, not raw `ClientException`; this decouples error handling from transport

## Architecture Guidelines
- Service classes in `App\Services\{Provider}\` grouped by provider
- DTOs in `App\Data\{Provider}\` with `readonly` properties and `fromResponse()` factory
- One service class per external API, maximum 15-20 methods before splitting
- Configuration in `config/services/{provider}.php`
- OAuth2 token management delegated to Saloon OAuth2 plugin or dedicated service
- Separate synchronous and queued execution paths via service methods

## Performance Considerations
- Service resolution cached after first instantiation via Laravel container
- DTO construction is negligible overhead compared to HTTP call latency
- Authentication token caching eliminates repeated auth requests
- Constructor injection overhead is sub-millisecond and one-time
- Response caching at service layer (via `Cache::remember()`) reduces API calls for GET endpoints

## Security Considerations
- Store API keys and secrets in environment variables, not in service classes or config files committed to version control
- Redact sensitive data (tokens, PII) in all service logging
- Never log raw request/response bodies that may contain credentials
- OAuth2 tokens should be cached securely (encrypted if stored in database)
- Implement input validation before passing user data to external APIs

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Inline API calls in controllers | Convenience, lack of pattern awareness | Untestable, duplicated code, mixing concerns | Extract to service classes immediately at first API call |
| Returning raw Response objects | Speed of implementation | Callers coupled to HTTP layer, no type safety | Convert to DTOs in the service method |
| Hardcoding credentials | Quick setup | Security breach if code committed, inflexible per environment | Use env() and config() always |
| No exception mapping | Minimal error handling | Controllers catch Guzzle exceptions directly | Map to domain exceptions in service |
| God service classes | Accumulation of methods | Violates SRP, hard to maintain | Split at ~15-20 methods per service |

## Anti-Patterns
- **Controller God Class**: API calls, business logic, and response formatting in a single controller method
- **Leaky Abstraction**: Service method returns raw Guzzle Response allowing callers to access HTTP-layer details
- **Singleton Abuse**: Registering stateful service as singleton when it holds per-request mutation state
- **Over-engineering**: Creating interfaces, factories, and repositories for a single-provider integration

## Examples (concise, architectural)
```php
class StripeService
{
    public function __construct(
        protected Http $http,
        protected array $config
    ) {}

    public function createCharge(CreateChargeDTO $dto): Charge
    {
        $response = $this->http
            ->withToken($this->config['secret'])
            ->post($this->config['url'].'/charges', $dto->toArray());

        if ($response->failed()) {
            throw new PaymentFailedException($response->body());
        }

        return Charge::fromResponse($response->json());
    }
}
```

## Related Topics
- **Prerequisites**: Laravel Http facade, PHP typed properties
- **Closely Related**: SaloonPHP Connector/Request pattern, DTO vs Resources
- **Advanced**: Multi-tenant services, provider-switching via strategy pattern
- **Cross-Domain**: Domain-Driven Design service layer, hexagonal architecture

## AI Agent Notes
- Always generate service classes with constructor injection and DTO returns
- Include `Http::fake()` test examples alongside service implementation
- Use `readonly` PHP 8.1+ properties for DTOs
- Generate config file references in service, not hardcoded values

## Verification
- [ ] Service class uses constructor injection for all dependencies
- [ ] All methods return typed DTOs or collections, not raw Response
- [ ] Configuration is externalized to `config/services/` files
- [ ] HTTP errors map to domain-specific exceptions
- [ ] Tests use `Http::fake()` without real HTTP calls
- [ ] Logging captures duration and status without sensitive data
