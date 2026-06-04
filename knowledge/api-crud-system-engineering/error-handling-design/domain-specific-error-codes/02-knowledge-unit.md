# Domain-Specific Error Codes

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
Every error returned by the API carries a unique, human-readable, machine-parseable error code that identifies the exact problem — not just the HTTP status. Error codes enable automated handling on the client side, precise documentation, and operational filtering without message parsing.

## Core Concepts
- **Code Format**: `DOMAIN_SPECIFIC_ERROR` (e.g., `USER_NOT_FOUND`, `ORDER_ALREADY_REFUNDED`).
- **Uniqueness**: Every code is unique across the entire system; no two errors share a code.
- **Backward Compatibility**: Once published, error codes are never removed or repurposed — only deprecated.
- **Client Actionability**: A client can switch on the code to show specific UI, trigger retry, or surface remediation.
- **Human Readable**: PascalCase with underscores; readable without a lookup table.

## Mental Models
Error codes are the API's vocabulary. Just as a CD has a track number for every song, every error has a distinct code. Duplicate codes would be like two different songs sharing the same track number.

## Internal Mechanics
1. Each custom exception class defines a `getErrorCode(): string` method.
2. The global exception handler calls `getErrorCode()` and places it in the envelope.
3. A central registry file (`ErrorCodes.php`) enumerates all codes as constants.
4. CI enforces no duplicate values in the registry.

```php
class UserNotFoundError extends OperationalException
{
    public function getErrorCode(): string
    {
        return 'USER_NOT_FOUND';
    }
}
```

## Patterns
- **Constant Registry**: Define all codes as class constants on an `ErrorCodes` enum or final class.
- **Code Prefix by Domain**: e.g., `USER_*`, `ORDER_*`, `PAYMENT_*` for groupability.
- **Code as Exception Class Suffix**: `extends UserNotFoundError` — the class name and code match one-to-one.
- **Deprecation Tag**: When a code is retired, keep the constant but tag it `@deprecated` and map it to a replacement.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| String vs numeric | Descriptive strings | Self-documenting, no lookup required |
| Prefix convention | `DOMAIN_PROBLEM` | Groups by module in dashboards |
| Registry location | Dedicated class | Single source of truth; easy CI checks |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Generic vs specific | `NOT_FOUND` for all | `USER_NOT_FOUND`, `ORDER_NOT_FOUND` | Specific — enables client branching |
| Enum vs constant class | PHP enum | Final class with constants | Enum limits extendability for external packages |
| Prefix granularity | By domain only | By domain + subdomain (e.g., `USER_AUTH_*`) | By domain only — keeps total code count manageable |

## Performance Considerations
- String comparison for matching is trivial.
- Enumeration of all codes is a documentation-time concern, not runtime.
- The registry file is autoloaded once, cached by OPcache.

## Production Considerations
- Include the error code in logs, traces, and metrics.
- Build a public-facing error code reference page from the registry.
- Set up monitoring alerts on unexpected error codes (codes not in registry).
- Version the code list in API docs (v1 codes, v2 codes).

## Common Mistakes
- Reusing the same code for different scenarios (e.g., `INVALID_INPUT` for both validation and auth).
- Making codes too specific (`USER_PASSWORD_HASH_MISMATCH_INTERNAL`) — client can't act on it.
- Changing a code's meaning after release — breaks existing clients.
- Forgetting to add new codes to the registry.

## Failure Modes
- **Code Collision**: Two different errors accidentally use the same code. Mitigation: CI fails on duplicate constant values.
- **Orphaned Code**: A code is defined but never thrown. Mitigation: static analysis detects unused constants.
- **Over-Specific Code**: Too many codes overwhelm client developers. Mitigation: review code catalog quarterly; merge where no client branching exists.

## Ecosystem Usage
- **Stripe**: `card_declined`, `expired_card`, `processing_error` — strings.
- **Twilio**: `21211` (numeric) + `description`.
- **Laravel**: `ValidationException` uses symbolic codes internally.
- **OpenAPI**: Codes are documented per endpoint in the `responses` section under `example`.

## Related Knowledge Units
### Prerequisites
- KU-02 Standardized Error Envelope (code lives in envelope)

### Related Topics
- KU-04 Error Code Namespace Design
- KU-05 Exception-to-Code Mapping

### Advanced Follow-up Topics
- Error code governance — RFC process for adding new codes (Phase 4).

## Research Notes
### Source Analysis
Pattern follows Stripe API's string-based error codes. Google APIs use numeric codes but also expose a human-readable `reason` field. String codes are preferred for self-documenting APIs.

### Key Insight
The number of error codes should be roughly 1.5x the number of custom exception classes. Too few codes = vague; too many = unmanageable. Aim for 20–50 total codes per API version.

### Version-Specific Notes
- PHP 8.1+ `enum` with `string` backed values works well for code registry.
- Laravel 10+ can validate error codes in tests via `assertJsonFragment(['code' => 'USER_NOT_FOUND'])`.
