# Validation Error Format & Return Messages — Anti-Patterns

## Inconsistent Error Formats Across Endpoints
**Description:** Different endpoints returning different error structures — some field-keyed, some flat, some with nested structures.
**Why it happens:** Each developer implements `failedValidation()` independently without a shared base class.
**Consequences:** Clients cannot implement generic error handling; each endpoint requires custom parsing logic.
**Better approach:** Use a base FormRequest class that all requests extend. Override `failedValidation()` in one place only.

## Revealing Validation Rules in Error Messages
**Description:** Using default Laravel messages that include rule parameters: "The email must be a valid email address" (fine) or "The password must match the regex /^(?=.*[A-Z])..." (dangerous).
**Why it happens:** Developers don't customize validation messages; rule parameters leak through defaults.
**Consequences:** Attackers learn exact validation rules, enabling targeted attacks.
**Better approach:** Customize all validation messages to be generic: "The password format is invalid."

## Returning Stack Traces in Error Responses
**Description:** Debug mode enabled in production, causing validation exceptions to include stack traces in the response.
**Why it happens:** `APP_DEBUG=true` in production environment; exception handler not customized.
**Consequences:** Internal application paths, file structures, and line numbers exposed to clients.
**Better approach:** Always set `APP_DEBUG=false` in production. Customize exception handler to return safe error responses.

## Mixing Validation Errors with Business Errors
**Description:** Returning validation errors (422) and business logic errors (400, 409) in different formats.
**Why it happens:** Validation errors use Laravel's default structure; business errors use a custom format defined elsewhere.
**Consequences:** Clients must handle two different error formats for the same application.
**Better approach:** Standardize error format across all error types — validation, business logic, and system errors.

## Returning All Errors for Sensitive Endpoints
**Description:** Returning full validation error details for authentication endpoints (login, password reset).
**Why it happens:** Developers apply the same error format across all endpoints without considering sensitivity.
**Consequences:** Attackers learn which fields exist, which formats are required, and can enumerate valid values.
**Better approach:** Use first-error-only mode for authentication, registration, and password reset endpoints.
