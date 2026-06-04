# Anti-Patterns: Controller Exception Handling

## Giant Try-Catch
**Description:** Wrapping the entire controller method body in a single try-catch that catches `\Throwable`.
**Why it happens:** Developers want a safety net that catches everything.
**Consequences:** Programming errors are masked; every error becomes a generic 500; debugging requires log spelunking.
**Better approach:** Try-catch only the specific operations that can throw domain exceptions. Let the global handler manage unexpected errors.

## Silent Swallowing
**Description:** Empty catch block that catches an exception and does nothing — not logging, not reporting, not re-throwing.
**Why it happens:** Developers temporarily silence errors during development and forget to implement handling.
**Consequences:** Production errors disappear without trace; debugging impossible.
**Better approach:** Every catch block must log, report, or re-throw. Use linter rules to enforce non-empty catch blocks.

## Error Format Inconsistency
**Description:** Each controller returns a different error format for the same exception type.
**Why it happens:** No standardized error envelope; each developer formats errors differently.
**Consequences:** Consumers must parse multiple error formats; client-side error handling is fragile.
**Better approach:** Centralize error response construction. Use a responder class or rely on exception `render()` methods.

## Over-Catching
**Description:** Catching exceptions that Laravel's global handler already manages perfectly — ModelNotFoundException, AuthorizationException, NotFoundHttpException.
**Why it happens:** Developers think they need to handle every possible exception.
**Consequences:** Duplicated error handling logic; inconsistent responses for the same error type across controllers.
**Better approach:** Let the global handler manage framework exceptions. Only catch domain-specific exceptions at the controller level.

## Sensitive Data Leak In Catch
**Description:** Returning exception messages directly in the response, exposing database queries, file paths, or API keys.
**Why it happens:** Using `$e->getMessage()` directly in the error response without sanitization.
**Consequences:** Security vulnerability; internal system details exposed to consumers.
**Better approach:** Map exceptions to consumer-safe messages. Log the full details server-side.
