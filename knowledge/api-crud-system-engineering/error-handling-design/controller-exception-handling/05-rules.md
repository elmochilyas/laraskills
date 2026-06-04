# Rules: Controller Exception Handling

## Rule: Catch Specific Exception Classes Only
- **Condition:** When writing try-catch blocks in controllers
- **Action:** Catch specific exception classes (e.g., `ModelNotFoundException`, `InsufficientInventoryException`). Never catch generic `\Exception` or `\Throwable` in controllers.
- **Consequence:** Preserves error type information; programming errors are visible to the global handler.
- **Enforcement:** PHPStan flags generic exception catches in controller classes.

## Rule: Log Caught Exceptions With Context
- **Condition:** When catching an exception in a controller
- **Action:** Log the exception with context: user ID, request ID, action name, and the exception message. Use `report()` or structured logging.
- **Consequence:** Debugging information is available without leaking to consumers.
- **Enforcement:** Review ensures every catch block includes logging or reporting.

## Rule: Map Domain Exceptions To Appropriate HTTP Responses
- **Condition:** When catching domain-specific exceptions
- **Action:** Map each exception type to the appropriate HTTP status code and error envelope. Use a mapper or the exception's `render()` method.
- **Consequence:** Consumers receive consistent, semantic error responses.
- **Enforcement:** Integration tests verify exception-to-HTTP mapping per domain exception.

## Rule: Re-throw Unrecoverable Exceptions
- **Condition:** When the controller cannot recover from an exception
- **Action:** Re-throw the exception for the global exception handler to process. Do not attempt to handle connection failures, filesystem errors, or runtime exceptions.
- **Consequence:** Unrecoverable errors are properly logged and handled by the global handler.
- **Enforcement:** Code review identifies exceptions that should be re-thrown vs handled.

## Rule: Never Swallow Exceptions Silently
- **Condition:** In all controller code
- **Action:** Every catch block must either log/report the exception, or re-throw it. Empty catch blocks are forbidden.
- **Consequence:** No production error goes unnoticed.
- **Enforcement:** Linter enforces non-empty catch blocks with logging or re-throw.

## Rule: Return Error Envelope For Caught Exceptions
- **Condition:** When handling a caught exception in a controller
- **Action:** Return the standardized error envelope format with code, message, and optionally details. Never return raw exception messages.
- **Consequence:** Error response format is consistent across all code paths.
- **Enforcement:** Integration tests verify error envelope format for caught exceptions.
