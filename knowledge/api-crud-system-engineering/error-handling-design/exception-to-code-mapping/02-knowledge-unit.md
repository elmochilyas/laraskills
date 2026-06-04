# Exception-to-Code Mapping

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
A centralised mapping layer translates every thrown exception — whether application-specific or originating from Laravel/PHP — into a standardised error code and envelope. This decouples the throwing code from the response shape and ensures no exception reaches the client unmapped.

## Core Concepts
- **Mapping Registry**: A configuration array or match expression that pairs exception class → error code.
- **Catch-All Fallback**: Any unmapped exception is caught by a fallback that returns a generic `INTERNAL_SERVER_ERROR` with no detail leak.
- **Framework Exception Coverage**: All Laravel exceptions (`AuthenticationException`, `AuthorizationException`, `ModelNotFoundException`, `ValidationException`, `ThrottleRequestsException`) have explicit mappings.
- **Third-Party Library Mappings**: Exceptions from packages (e.g., Stripe, AWS SDK) are mapped in the service provider that configures the package.

## Mental Models
Think of the mapping registry as a telephone switchboard. Each incoming exception class is a phone number; the switchboard routes it to the correct error-code extension. If a number isn't in the directory, the operator (fallback) picks up.

## Internal Mechanics
1. Global exception handler catches all exceptions.
2. `Handler->registerMapping()` loads a configuration array.
3. A `match(exception::class)` expression finds the matching code.
4. If no match is found, the fallback handler runs.
5. The code is injected into the error envelope.

```php
class Handler extends ExceptionHandler
{
    protected array $exceptionCodeMap = [
        AuthenticationException::class     => ErrorCodes::USER_AUTH_UNAUTHENTICATED,
        AuthorizationException::class      => ErrorCodes::USER_AUTH_FORBIDDEN,
        ModelNotFoundException::class      => ErrorCodes::RESOURCE_NOT_FOUND,
        ValidationException::class         => ErrorCodes::VALIDATION_ERROR,
        ThrottleRequestsException::class   => ErrorCodes::SYSTEM_RATE_LIMITED,
        QueryException::class              => ErrorCodes::SYSTEM_DATABASE_ERROR,
    ];

    public function register(): void
    {
        $this->renderable(function (Throwable $e, Request $request) {
            $code = $this->resolveCode($e);
            // build envelope with $code
        });
    }
}
```

## Patterns
- **Explicit Map Array**: Hard-coded FQCN → code; easy to audit.
- **Interface-Based Mapping**: Exceptions implementing `HasErrorCode` return their own code (for custom exceptions).
- **Hierarchical Fallback**: Check for exact class match → parent class match → interface match → default fallback.
- **Mapping Provider**: A service provider that registers mappings during boot, allowing packages to add their own.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Map location | Exception handler class | Single location, easy to find and audit |
| Resolution strategy | Exact match, then instanceof, then fallback | Balances specificity with simplicity |
| Framework exceptions | Explicit mappings, not automatic | No surprises — every case reviewed |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Map source | PHP array | Database/config file | PHP array — type-safe, no cache invalidation |
| Resolution | match statement | chain-of-responsibility | Chain-of-responsibility — extensible by packages |
| Framework catch-all | One generic code | Domain-inferred code | Generic — safer than guessing domain |

## Performance Considerations
- Array key lookup O(1). `instanceof` chain O(n) but n < 20.
- Pre-compile the map at service provider boot into a flattened `SplObjectStorage` for maximum speed.
- Mapping resolution is not on the hot path (exceptions are rare); performance impact is negligible.

## Production Considerations
- Log every unmapped exception with a WARNING level — it signals a missing mapping.
- Include the mapped code in structured error logs.
- If using Sentry, tag each event with the resolved error code.
- Deployment pipeline checks: CI asserts that all known custom exceptions have mappings.

## Common Mistakes
- Mapping Laravel's `AuthenticationException` to a generic `UNAUTHORIZED` without checking guard context (web vs API).
- Mapping `ModelNotFoundException` to `NOT_FOUND` without considering the model type (user vs product).
- Forgetting to map exceptions from newly added packages.
- Using `Exception` as a map key — catches everything, defeats the purpose.

## Failure Modes
- **Overly Broad Map**: `Exception::class => INTERNAL_ERROR` hides all detail. Fix: use a narrow catch-all only as last resort.
- **Dead Mapping**: A mapped exception class is removed but mapping entry remains (harmless but untidy).
- **Unmapped Exception**: Falls through to HTTP 500 with no code. Fix: monitoring alert on unmapped exception count.

## Ecosystem Usage
- **Laravel**: `Handler->mapException()` — core framework method.
- **Symfony**: `ExceptionListener` with `getStatusCode()`.
- **Spatie/Laravel-Error-Solutions**: Maps exception to solution suggestions.
- **API Platform**: Built-in exception-to-status mapper.

## Related Knowledge Units
### Prerequisites
- KU-03 Domain-Specific Error Codes
- KU-04 Error Code Namespace Design

### Related Topics
- KU-13 Custom Exception Classes (often implement `HasErrorCode`)
- KU-14 Global Exception Handler Config

### Advanced Follow-up Topics
- Dynamic mapping via attributes (PHP 8 attributes on exception classes).

## Research Notes
### Source Analysis
Pattern drawn from Symfony's `ExceptionHttpCodeMap` and Laravel's built-in exception-to-HTTP-status mapping. Extends it to additionally map to error codes.

### Key Insight
The mapping layer is the **central nervous system** of error handling. Every decision about what an error means to the client flows through this one file. Keep it simple, explicit, and well-documented.

### Version-Specific Notes
- Laravel 10+ `register()` method replaced `$this->renderable()` callbacks; both work.
- PHP 8.0+ `match` expression makes mapping concise: `match ($e::class) { ... }`.
