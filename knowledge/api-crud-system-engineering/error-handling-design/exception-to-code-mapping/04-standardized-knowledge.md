# Exception-to-Code Mapping

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-exception-to-code-mapping |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Advanced |
| Classification | Design Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

A centralised mapping layer translates every thrown exception — whether application-specific or originating from Laravel/PHP — into a standardised error code and envelope. This decouples the throwing code from the response shape and ensures no exception reaches the client unmapped.

## Core Concepts

- **Mapping Registry**: A configuration array or match expression that pairs exception class → error code.
- **Catch-All Fallback**: Any unmapped exception is caught by a fallback that returns a generic `INTERNAL_SERVER_ERROR` with no detail leak.
- **Framework Exception Coverage**: All Laravel exceptions have explicit mappings.
- **Third-Party Library Mappings**: Exceptions from packages are mapped in the service provider that configures the package.
- **Resolution Order**: Exact class match → parent class match → interface match → default fallback.

## When To Use

- When implementing a standardized error envelope with error codes
- When the API surface includes multiple exception sources (framework, packages, custom)
- When teams need to ensure every possible exception produces a proper error response
- When onboarding third-party packages that may throw undocumented exceptions
- When auditing or improving error handling coverage

## When NOT To Use

- For simple APIs with a single custom exception and no third-party packages
- When exceptions are already handled at the source (controller catch blocks) consistently
- During initial development before the error handling architecture is established
- When using a framework that already provides automatic exception-to-response mapping

## Best Practices (WHY)

- **Use explicit map array over conventions**: Hard-coded FQCN → code is easy to audit and debug.
- **Use chain-of-responsibility resolution**: Exact match → parent class → interface → fallback — extensible by packages.
- **Map all framework exceptions explicitly**: No surprises — every Laravel exception has a reviewed mapping.
- **Log unmapped exceptions with WARNING**: Signals a missing mapping for developer attention.
- **Validate mappings in CI**: Assert that all known custom exception classes have mappings.
- **Keep the mapping in the exception handler class**: Single location, easy to find and audit.
- **Use interface-based mapping for custom exceptions**: Exceptions implementing `HasErrorCode` return their own code.

## Architecture Guidelines

- Define mapping in `App\Exceptions\Handler` as an array or match expression.
- Register a fallback for `Throwable` as the last renderable callback with generic `SYSTEM.INTERNAL_ERROR`.
- Cover these Laravel exceptions explicitly: `AuthenticationException`, `AuthorizationException`, `ModelNotFoundException`, `ValidationException`, `ThrottleRequestsException`, `QueryException`.
- Use a service provider pattern for packages to register their own mappings.
- Pre-compile the map at boot into a flat structure for maximum speed.
- Tag Sentry/error tracking events with the resolved error code.

## Performance Considerations

- Array key lookup O(1). `instanceof` chain O(n) but n < 20.
- Pre-compile the map into `SplObjectStorage` or flattened array at boot.
- Mapping resolution is not on the hot path (exceptions are rare) — performance impact is negligible.
- Boot-time compilation adds < 1ms to service provider boot.

## Security Considerations

- Never map generic `Exception` or `Throwable` as the first entry — it catches everything and defeats the purpose.
- The catch-all fallback must return a safe generic message with no internal detail.
- Ensure `QueryException` mapping does not expose SQL in the response.
- When mapping third-party exceptions, review what context they carry before exposing any detail.
- Keep the mapping table internal — do not expose mapping logic in API responses.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Mapping without guard context | `AuthenticationException` mapped generically | Single mapping for all guards | API vs web auth errors get the same code | Vary mapping by guard name |
| Generic ModelNotFoundException | `NOT_FOUND` without model distinction | One-size-fits-all mapping | Client cannot tell which resource is missing | Switch on model class for domain-specific codes |
| Package exceptions not mapped | New package throws undocumented exceptions | Forgetting to update handler | Unmapped exceptions fall through to 500 | Register mappings in package service provider |
| `Exception::class` as map key | Catch-all hiding all error detail | Laziness | All errors return the same generic code | Use narrow catch-all only as last resort |
| No fallback for unmapped | Exception falls through to Symfony/Whoops | Assuming all exceptions covered | HTML error page for API request | Always register a Throwable fallback |
| Mapping to `INTERNAL_ERROR` for operational errors | `ValidationException` mapped as system error | Wrong category | Incorrect alert routing and client retry logic | Map operational exceptions to specific codes |

## Anti-Patterns

- **Single mapping callable that inspects every exception**: Switch-on-className in one giant method.
- **Mapping via exception message parsing**: Fragile — messages change with localization.
- **No fallback mapping**: Request defaults to Whoops/Symfony HTML error page.
- **Mapping in controllers instead of the handler**: Duplicated mapping logic across endpoints.
- **Mapping by exception code integer**: PHP exception codes are optional and often unused.

## Examples

```php
class Handler extends ExceptionHandler
{
    protected array $exceptionCodeMap = [
        AuthenticationException::class   => ErrorCodes::USER_AUTH_UNAUTHENTICATED,
        AuthorizationException::class    => ErrorCodes::USER_AUTH_FORBIDDEN,
        ModelNotFoundException::class    => ErrorCodes::RESOURCE_NOT_FOUND,
        ValidationException::class       => ErrorCodes::VALIDATION_ERROR,
        ThrottleRequestsException::class => ErrorCodes::SYSTEM_RATE_LIMITED,
        QueryException::class            => ErrorCodes::SYSTEM_DATABASE_ERROR,
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

## Related Topics

- Domain-Specific Error Codes (the codes being mapped to)
- Error Code Namespace Design (hierarchical code structure)
- Custom Exception Classes (many implement `HasErrorCode` interface)
- Global Exception Handler Config (where the mapping lives)
- Error Logging Context (enriching logs with resolved error code)

## AI Agent Notes

- When creating a new custom exception class, add its mapping to the handler simultaneously.
- Never use `Exception::class` or `Throwable::class` as a mapping key for specific codes.
- When adding a new package, check its exception classes and add explicit mappings.
- For framework exceptions, prefer explicit FQCN mappings over conventions.
- When writing tests, verify that each mapping produces the correct error code in the response.

## Verification

- [ ] All Laravel framework exceptions have explicit mappings in the handler
- [ ] A catch-all `Throwable` fallback is registered as the last renderable callback
- [ ] All custom exception classes have corresponding entries in the mapping
- [ ] Third-party package exceptions are mapped in their respective service providers
- [ ] CI asserts that every known `ApiException` subclass has a mapping
- [ ] Unmapped exceptions trigger a WARNING-level log entry
- [ ] Each mapping produces a distinct, appropriate error code
