# Domain-Specific Error Codes

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-domain-specific-error-codes |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Design Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Every error returned by the API carries a unique, human-readable, machine-parseable error code that identifies the exact problem — not just the HTTP status. Error codes enable automated handling on the client side, precise documentation, and operational filtering without message parsing.

## Core Concepts

- **Code Format**: `DOMAIN_SPECIFIC_ERROR` (e.g., `USER_NOT_FOUND`, `ORDER_ALREADY_REFUNDED`).
- **Uniqueness**: Every code is unique across the entire system; no two errors share a code.
- **Backward Compatibility**: Once published, error codes are never removed or repurposed — only deprecated.
- **Client Actionability**: A client can switch on the code to show specific UI, trigger retry, or surface remediation.
- **Human Readable**: PascalCase with underscores; readable without a lookup table.
- **Constant Registry**: All codes defined as constants on an `ErrorCodes` enum or final class.

## When To Use

- For any API consumed by programmatic clients (mobile apps, scripts, third-party integrations)
- When clients need to show user-facing error messages in their own language/format
- When building automated retry or error recovery logic on the client side
- For APIs with domain-specific business logic errors beyond standard HTTP semantics
- When error tracking/dashboarding needs code-level aggregation

## When NOT To Use

- For internal-only APIs where message parsing is acceptable
- When the API surface is tiny (one or two endpoints) and error types are minimal
- During early prototyping before error design is established
- When using a standard that already defines its own error codes (JSON:API, RFC 9457)

## Best Practices (WHY)

- **Use descriptive strings over numeric codes**: Self-documenting, no lookup table required.
- **Use domain prefix for groupability**: `USER_*`, `ORDER_*`, `PAYMENT_*` — filterable in dashboards.
- **Keep codes specific but not excessive**: Aim for 20–50 total codes per API version; 1.5x the number of custom exception classes.
- **Never change a code's meaning after release**: Once published, the code-to-meaning mapping is immutable.
- **Maintain a central registry**: Single source of truth with CI-enforced uniqueness.
- **Deprecate codes, never remove**: Keep the constant with `@deprecated` tag; point to replacement.
- **Document every code in the API reference**: Include example scenarios for each code.

## Architecture Guidelines

- Each custom exception class defines a `getErrorCode(): string` method returning the code constant.
- The global exception handler calls `getErrorCode()` and places it in the envelope.
- A central `ErrorCodes` class (or backed enum) enumerates all codes as constants.
- CI enforces no duplicate values in the registry.
- Use code prefix by domain: `USER_*`, `ORDER_*`, `PAYMENT_*`.
- Keep the exception class name and error code one-to-one: `UserNotFoundError` → `USER_NOT_FOUND`.

## Performance Considerations

- String comparison for code matching is trivial — no performance concern.
- Enumeration/all-codes listing is a documentation-time concern, not runtime.
- The registry file is autoloaded once and cached by OPcache.
- Code resolution adds no measurable overhead to error response generation.

## Security Considerations

- Error codes themselves are safe to expose — they are identifiers, not data.
- Never include dynamic values (user IDs, emails) inside the error code string.
- Do not use error codes to infer internal system structure (e.g., `DB_CONNECTION_FAILED` reveals database type).
- Ensure codes do not leak business logic details (e.g., `ORDER_MINIMUM_NOT_MET` reveals pricing strategy).
- Document publicly which codes are exposed vs internal-only.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Reusing codes across scenarios | Same code for validation and auth errors | Lazy categorization | Clients can't differentiate error types | One code per distinct error scenario |
| Overly specific codes | `USER_PASSWORD_HASH_MISMATCH_INTERNAL` | Too much detail in code name | Clients can't act on it; code reveals internals | Keep codes at the actionability level |
| Changing code meaning | Repurposing `NOT_FOUND` from user to order | Code shortage | Existing client branching breaks | Deprecate old code; create new one |
| Missing registry entries | Code thrown but not in error catalog | No central tracking | Documentation is incomplete; duplicates possible | CI rule: every thrown code must be in registry |
| Numeric codes | Error code `42` means nothing to developers | Legacy system migration | Requires lookup table; not self-documenting | Use descriptive strings |

## Anti-Patterns

- **Single code for all errors**: `API_ERROR` for everything — no client branching possible.
- **Codes embedded in messages**: Clients parsing message strings to determine error type.
- **Dynamic code generation**: `ERROR_ . strtoupper($field)` — unpredictable, not documentable.
- **Frame-shifting codes**: Same code shifts meaning between API versions.
- **Codes as translated strings**: `USUARIO_NO_ENCONTRADO` — codes must be locale-independent.

## Examples

```php
final class ErrorCodes
{
    public const USER_NOT_FOUND = 'USER_NOT_FOUND';
    public const USER_AUTH_INVALID_TOKEN = 'USER_AUTH_INVALID_TOKEN';
    public const ORDER_NOT_FOUND = 'ORDER_NOT_FOUND';
    public const ORDER_ALREADY_REFUNDED = 'ORDER_ALREADY_REFUNDED';
    public const PAYMENT_DECLINED = 'PAYMENT_DECLINED';
    public const VALIDATION_ERROR = 'VALIDATION_ERROR';
    public const SYSTEM_INTERNAL_ERROR = 'SYSTEM_INTERNAL_ERROR';
}

class UserNotFoundError extends OperationalException
{
    public function getErrorCode(): string
    {
        return ErrorCodes::USER_NOT_FOUND;
    }
}
```

## Related Topics

- Error Code Namespace Design (hierarchical code organization)
- Exception-to-Code Mapping (connecting exceptions to codes)
- Custom Exception Classes (each class maps to one code)
- Standardized Error Envelope (the `code` field inside the envelope)
- Error Response Testing (asserting error codes in tests)

## AI Agent Notes

- Every new custom exception class must define a unique error code from the registry.
- Never hardcode error code strings directly in controllers or services — always use the registry constant.
- When generating code that throws a new error, first check the registry for an existing appropriate code.
- If no existing code fits, generate a new one following `DOMAIN_VERB_OBJECT` format and add it to the registry.

## Verification

- [ ] All error codes are defined as constants in the central `ErrorCodes` registry
- [ ] Every custom exception class implements `getErrorCode()` returning a registry constant
- [ ] No two exception classes return the same error code
- [ ] CI enforces that all thrown error codes exist in the registry
- [ ] Error code reference documentation is auto-generated from the registry
- [ ] Total code count is between 20 and 50 per API version
- [ ] No code has been repurposed or removed — only deprecated
