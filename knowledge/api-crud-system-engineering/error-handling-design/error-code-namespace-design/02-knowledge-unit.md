# Error Code Namespace Design

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
Error codes are organised into hierarchical namespaces that mirror the application's bounded contexts and modules, preventing naming collisions across domains while making error codes discoverable and groupable by domain at a glance.

## Core Concepts
- **Namespace Structure**: `DOMAIN.SUBDOMAIN_ERROR` (e.g., `USER.AUTH_INVALID_TOKEN`, `ORDER.STATUS_TRANSITION_INVALID`).
- **Top-Level Domain**: Maps to Laravel module/namespace (e.g., `User`, `Order`, `Payment`).
- **Subdomain/Verb**: The specific operation or component (e.g., `Auth`, `Validation`, `State`).
- **Collision Prevention**: Two teams working on different domains cannot create conflicting codes because the domain prefix is mandatory.
- **Registry Granularity**: A single global registry that uses dot or underscore delimiters.

## Mental Models
Think of error code namespaces like filesystem directories: `USER/AUTH/INVALID_TOKEN` is unique, discoverable, and clearly signals its domain. No file in `/users` accidentally collides with a file in `/orders`.

## Internal Mechanics
1. Each Laravel module (`app/Domains/User/`, `app/Domains/Order/`) defines its own error codes within its namespace.
2. A global `ErrorCodes` registry reads all domain error code classes and merges them.
3. The namespace prefix is enforced by a PHPStan or CI rule: code must start with the domain name in uppercase.
4. Dot-delimited codes (`USER.AUTH_INVALID_TOKEN`) are stored as constants with the full path.

```php
final class ErrorCodes
{
    // User Domain
    public const USER_NOT_FOUND              = 'USER.NOT_FOUND';
    public const USER_AUTH_INVALID_TOKEN     = 'USER.AUTH_INVALID_TOKEN';
    public const USER_AUTH_EXPIRED_TOKEN     = 'USER.AUTH_EXPIRED_TOKEN';

    // Order Domain
    public const ORDER_NOT_FOUND             = 'ORDER.NOT_FOUND';
    public const ORDER_STATUS_INVALID        = 'ORDER.STATUS_TRANSITION_INVALID';

    // Payment Domain
    public const PAYMENT_DECLINED            = 'PAYMENT.DECLINED';
    public const PAYMENT_INSUFFICIENT_FUNDS  = 'PAYMENT.INSUFFICIENT_FUNDS';
}
```

## Patterns
- **Domain Module Registry**: Each domain has a `Domain\X\ErrorCodes` class with its own codes.
- **Aggregator Registry**: A global `App\Support\ErrorCodes` collects all domain codes via `@see` imports or manual merge.
- **Dot Notation**: `DOMAIN.VERB_OBJECT` — a dot separates domain from error; underscore separates words within the error.
- **Namespace Validation CI Script**: Parses all error codes and fails if any code does not match `^[A-Z]+\.[A-Z_]+$`.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Delimiter | Dot (`.`) | Familiar from config/key notation; readable in logs |
| Domain prefix | Mandatory | Prevents collisions without central coordination |
| Depth | At most 2 levels (domain.verb_object) | Deeper namespaces become unwieldy |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Delimiter | Dot | Underscore double (`USER__NOT_FOUND`) | Dot — clearer domain boundary |
| Registry | Single flat file | Per-domain files | Per-domain files — scales with team size |
| Depth | 2 levels max | Variable depth | 2 levels max — keeps codes short |

## Performance Considerations
- String length is bounded (≤ 60 chars for any code).
- OPcache caches the registry.
- No runtime namespace resolution — codes are literal strings.

## Production Considerations
- Validate error codes at deployment time via a health check that iterates the registry.
- Include namespace in metrics tags so you can graph errors by domain.
- Deprecated codes keep their namespace — moving a code to a new namespace breaks backward compatibility.

## Common Mistakes
- Omitting the domain prefix on "obviously unique" codes — future collisions are inevitable.
- Changing a code's namespace after publishing — clients depending on `USER.AUTH.*` break if it moves to `AUTH.USER.*`.
- Using inconsistent casing (`User.notFound` vs `USER.NOT_FOUND`).
- Two domains defining the same sub-error name (e.g., `USER.NOT_FOUND` and `ORDER.NOT_FOUND` is fine; this is by design).

## Failure Modes
- **Namespace Collision**: Two domains merged together somehow create overlap. Mitigation: CI checks for duplicate full-code strings.
- **Namespace Drift**: A domain renamed but error codes not updated. Mitigation: automated refactoring when a module is renamed.
- **Orphaned Namespace**: A domain removed but codes remain in registry. Mitigation: static analysis on code usage.

## Ecosystem Usage
- **Stripe**: No explicit namespace — flat codes (`card_declined`). (Their API is monolithic.)
- **Google Cloud**: Domain-qualified codes (`google.ads.errors.RangeError`).
- **AWS**: Service-specific error codes with prefix (`ValidationError`, `AccessDeniedException`).

## Related Knowledge Units
### Prerequisites
- KU-03 Domain-Specific Error Codes (codes must exist before they can be namespaced)

### Related Topics
- Laravel module/bounded context design (domain folder structure)

### Advanced Follow-up Topics
- Cross-domain error codes (shared infrastructure codes without a single domain owner).

## Research Notes
### Source Analysis
Google APIs use `google.rpc.Status` with domain-scoped error spaces. AWS error codes are prefixed by service. The dot-namespace pattern is borrowed from PHP config files and .env naming conventions.

### Key Insight
Namespaces are structural, not semantic. They exist solely for collision prevention and groupability. The client never needs to parse the namespace — they use the full code string as an opaque identifier.

### Version-Specific Notes
- Laravel modules (nwidart/laravel-modules) map naturally as top-level domains.
- PHP 8.1+ enums cannot have dots in case names — use constant classes instead.
