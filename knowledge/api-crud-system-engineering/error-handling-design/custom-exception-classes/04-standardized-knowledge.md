# Custom Exception Classes

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-custom-exception-classes |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Expert |
| Classification | Implementation Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

A hierarchy of domain-specific exception classes that encode the error type, HTTP status, error code, and context in the class itself. This eliminates conditional logic in the exception handler — the class **_is_** the error specification — and ensures that throwing the right exception automatically produces the right response.

## Core Concepts

- **Base Hierarchy**: `ApiException` → {`OperationalException`, `ProgrammerException`, `InfrastructureException`} → domain-specific classes.
- **Self-Contained**: Each exception carries its own `$statusCode`, `$errorCode`, `$message`, and `$context`.
- **Type-Safe Context**: `$context` is a typed array validated in the constructor.
- **No Business Logic**: Exceptions only carry data — they do not log, notify, or render.
- **One Class Per Error Code**: Every error code gets exactly one exception class.
- **Immutable After Construction**: All properties are `readonly` — context cannot be mutated after throw.

## When To Use

- When implementing a standardized error handling system with error codes and envelopes
- For domain-driven applications where errors are part of the ubiquitous language
- When exception classes should be self-documenting (class name = error description)
- For large applications with many distinct error scenarios
- When the exception handler should have zero conditional logic

## When NOT To Use

- For simple CRUD applications with few error scenarios
- When throwing generic exceptions with context is sufficient
- During early prototyping before the error taxonomy is established
- For packages/libraries where you don't control the exception hierarchy

## Best Practices (WHY)

- **One class per error code**: Each class is a single responsibility — name tells you exactly what error occurred.
- **Use readonly properties**: Immutability prevents context mutation after throw — predictable error handling.
- **No business logic in exceptions**: Logging, mailing, or DB queries in exceptions cause serialisation issues and violate single responsibility.
- **Use static factory methods**: For exceptions with varying context: `UserNotFound::forId($id)` is more readable than constructor.
- **Keep context to 5 fields max**: Prevents context overload and heavy serialisation.
- **Domain subdirectory**: All domain exceptions live in `app/Domains/{Domain}/Exceptions/`.
- **Mark classes as `final`**: They should not be extended — inheritance is handled by the base hierarchy.
- **Add PHPDoc `@property-read`**: IDE autocompletion for context keys.

## Architecture Guidelines

- Base `ApiException` extends `\RuntimeException` with abstract `getCategory(): ErrorCategory`.
- Category base classes (`OperationalException`, `ProgrammerException`, `InfrastructureException`) are abstract and final-constructor.
- Domain exception classes extend the appropriate category base class.
- Each domain exception sets error code, status code, message, and context in its constructor.
- Implement `HasErrorEnvelope` trait on the base class for `toEnvelope()` method.
- Register all custom exception classes in the handler's mapping table.
- PHPStan rule: all `ApiException` subclasses must be registered.

## Performance Considerations

- Exception construction is rare — not on the hot path.
- `readonly` properties reduce memory overhead slightly.
- Stack trace generation on `throw` is the dominant cost (not class design).
- Never inject services into exceptions — they are serialized and logged, services cause serialisation errors.

## Security Considerations

- Never include sensitive data (passwords, tokens, PII) in exception context.
- Context is logged — ensure sensitive data is not logged.
- Exception classes names should not leak internal system details.
- `__toString()` includes the stack trace with file paths — override to prevent log leakage.
- PHP 8.2+ `sensitive_parameter` attribute marks function parameters as redactable from stack traces.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Throwing generic Exception | `throw new \Exception('error')` | Laziness | No error code, no category, no automatic handling | Always throw a domain-specific exception |
| Business logic in exceptions | Logging, emailing, DB queries in constructor | Convenience | Serialisation errors, test coupling | Exceptions carry data only handle elsewhere |
| Mutable context | `$e->context['extra'] = 'value'` after construction | Not using readonly | Unpredictable error response | Make all properties readonly |
| Exception class explosion | 100+ exception classes with no reuse | Too many distinct scenarios | Unmaintainable catalog | Review quarterly; merge where no distinct handling exists |
| Constructor breaking changes | Adding required parameter to exception | Evolving error context | Breaks existing throw sites | Use named arguments for backward compatibility |
| Forgotten registration | New exception class not mapped in handler | No CI rule | Falls through to generic 500 | PHPStan/CI rule enforces registration |

## Anti-Patterns

- **Catch-all exception classes**: `ApiException` used directly instead of domain-specific subclass.
- **Exception classes with services**: Injecting repositories or loggers into exception constructors.
- **Exception as DTO**: Passing large data objects through exception context.
- **Exception class in wrong category**: `UserNotFoundException` extending `InfrastructureException`.
- **Deep inheritance beyond 3 levels**: `ApiException` → `OperationalException` → `UserException` → `UserNotFoundException`.

## Examples

```php
abstract class ApiException extends \RuntimeException
{
    public function __construct(
        protected readonly string $errorCode,
        protected readonly int $statusCode,
        string $message,
        protected readonly array $context = [],
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, $statusCode, $previous);
    }

    abstract public function getCategory(): ErrorCategory;
}

class UserNotFoundException extends OperationalException
{
    public function __construct(int $userId)
    {
        parent::__construct(
            errorCode: ErrorCodes::USER_NOT_FOUND,
            statusCode: 404,
            message: 'The requested user was not found.',
            context: ['resource_type' => 'User'],
        );
    }
}
```

## Related Topics

- Error Type Taxonomy (determines the base exception class)
- Domain-Specific Error Codes (each class maps to a code)
- Exception-to-Code Mapping (how exceptions map to response codes)
- Global Exception Handler Config (where exceptions are caught)
- Sensitive Data Leak Prevention (context must be safe to log)

## AI Agent Notes

- Every new error condition requires a new exception class, not a reused generic one.
- Exception class names must be self-documenting — the name tells what happened.
- Never add business logic (logging, DB queries) to exception classes.
- Always mark exception context data as `readonly`.
- When adding a new exception class, simultaneously add its handler mapping and test coverage.
- Use static factory methods for varying exception contexts: `UserNotFound::forId($id)`.

## Verification

- [ ] Base hierarchy: ApiException → {Operational, Programmer, Infrastructure} → domain classes
- [ ] All properties are `readonly` or the class is `readonly`
- [ ] No business logic exists in any exception class (no logging, DB, notifications)
- [ ] Each domain exception has a unique error code from the registry
- [ ] Exception classes are in the `app/Domains/{Domain}/Exceptions/` directory
- [ ] All exception classes are registered in the handler
- [ ] CI/PHPStan enforces registration requirement
- [ ] Context is limited to 5 fields max, no sensitive data
