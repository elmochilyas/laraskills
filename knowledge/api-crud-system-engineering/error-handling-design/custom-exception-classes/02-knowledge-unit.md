# Custom Exception Classes

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
A hierarchy of domain-specific exception classes that encode the error type, HTTP status, error code, and context in the class itself. This eliminates conditional logic in the exception handler — the class **_is_** the error specification — and ensures that throwing the right exception automatically produces the right response.

## Core Concepts
- **Base Hierarchy**: `ApiException` → {`OperationalException`, `ProgrammerException`, `InfrastructureException`} → domain-specific classes.
- **Self-Contained**: Each exception carries its own `$statusCode`, `$errorCode`, `$message`, and `$context`.
- **Type-Safe Context**: `$context` is a typed array or DTO validated in the constructor.
- **No Business Logic**: Exceptions only carry data — they do not log, notify, or render.
- **Extends SplException**: All base classes extend `\RuntimeException` or `\LogicException`.

## Mental Models
Think of custom exceptions as labelled containers. A `UserNotFoundException` is a labelled box that already says "USER_NOT_FOUND" and status 404 on the outside. The handler just reads the label and puts it in the envelope — no decision-making needed.

## Internal Mechanics
1. Application code detects an error condition.
2. It constructs and throws the appropriate domain exception with context.
3. The global handler catches it and calls `toEnvelope()` or reads public properties.
4. The response is built deterministically from the exception's data.

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
            context: ['user_id' => $userId, 'resource_type' => 'User'],
        );
    }
}
```

## Patterns
- **One Class Per Error Code**: Every error code (KU-03) gets exactly one exception class.
- **Immutable After Construction**: All properties are `readonly` — context cannot be mutated after throw.
- **Static Factory Methods**: For exceptions with varying detail: `UserNotFound::forId($id)`.
- **Domain Subdirectory**: All domain exceptions live in `app/Domains/{Domain}/Exceptions/`.
- **Base Exception Trait**: A `HasErrorEnvelope` trait added to the base class provides `toEnvelope()`.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Depth of hierarchy | 3 levels (base → category → domain) | Separates concerns without excessive depth |
| Context type | Array (typed and validated) | Simpler than DTOs for error data |
| Property visibility | Public readonly | Allows handler to read without getters |
| Constructor vs factory | Both | Constructor for mandatory fields; factories for convenience |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Context typing | Array (flexible) | DTO (type-safe) | Array — exceptions are not hot path; simplicity wins |
| Class granularity | One per error code (large number of classes) | Grouped by domain (fewer classes) | One per code — each class is a single responsibility |
| Inheritance vs composition | Abstract base classes | Trait-based | Both — base classes for hierarchy; traits for shared behaviour |

## Performance Considerations
- Exception construction is rare (not on hot path).
- The `readonly` properties reduce memory overhead slightly.
- Stack trace generation on `throw` is the dominant cost (not class design).

## Production Considerations
- Do not inject services into exceptions (they are serialised and logged — services would cause serialisation errors).
- Ensure all exception classes are `@final` or marked final — they should not be extended.
- Add `@property-read` PHPDoc for context keys for IDE autocompletion.
- Register all custom exceptions in the handler's mapping table.

## Common Mistakes
- Throwing `\Exception` or `\RuntimeException` directly (defeats the purpose of custom classes).
- Adding business logic to exception classes (logging, mailing, DB queries).
- Mutating exception context after construction (makes error handling unpredictable).
- Throwing exceptions with sensitive data in `$context` (will be logged — see KU-16).
- Making exception classes too generic (`DuplicateException` without specifying what is duplicated).

## Failure Modes
- **Exception Class Explosion**: Too many exception classes become unmanageable. Mitigation: review catalog quarterly; merge if no distinct handling.
- **Context Overload**: Exception carries too much context (heavy serialisation memory). Mitigation: limit context to 5 fields max.
- **Constructor Breaking Change**: Adding a required parameter breaks existing throw sites. Mitigation: use named arguments for backward compatibility.
- **Forgotten Registration**: New exception class not registered in handler. Mitigation: PHPStan rule requires all `ApiException` subclasses to be registered.

## Ecosystem Usage
- **Laravel**: `AuthenticationException`, `AuthorizationException`, `ModelNotFoundException` — built-in custom exceptions.
- **Spatie**: `Permission\Exceptions\UnauthorizedException` — third-party custom exception.
- **Sentry**: `Sentry\Monolog\Handler` captures custom exception properties as tags.
- **PHP FIG**: PSR-3 logging pairs with exception context.

## Related Knowledge Units
### Prerequisites
- KU-01 Error Type Taxonomy (determines the base class)
- KU-03 Domain-Specific Error Codes (each class maps to a code)

### Related Topics
- KU-14 Global Exception Handler Config (how exceptions are caught and rendered)

### Advanced Follow-up Topics
- PHP 8 attributes for error metadata on exception classes (Phase 4).

## Research Notes
### Source Analysis
Pattern follows Domain-Driven Design's "domain exceptions" pattern. Evans's DDD book describes exceptions as part of the Ubiquitous Language. Laravel's own exception classes follow the same pattern (`ModelNotFoundException`, `AuthenticationException`).

### Key Insight
**The exception class hierarchy IS the error taxonomy (KU-01) made concrete.** The hierarchy should be visible and understandable at a glance in the IDE. If you have to open a file to know what category an error belongs to, the hierarchy is too deep.

### Version-Specific Notes
- PHP 8.1+ `readonly` properties on exceptions work well with constructor promotion.
- PHP 8.2+ `readonly` classes allow marking the entire exception as immutable.
- Laravel 10+ `$exception->context()` method on `ReportableException` — a Laravel-native pattern for exception context.
