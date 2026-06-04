# Phase 5: Rules — Domain-Specific Error Codes

## Rule: Use Descriptive String Error Codes, Never Numeric
---
## Category
Design | Maintainability
---
## Rule
Always use descriptive PascalCase-with-underscore strings for error codes (e.g., `USER_NOT_FOUND`); never use numeric codes (e.g., 42, 1001).
---
## Reason
String codes are self-documenting — developers and clients understand the error without a lookup table. Numeric codes require documentation cross-referencing and break if the numbering scheme changes.
---
## Bad Example
```php
const ERROR_42 = 42; // What does 42 mean?
const ERROR_1001 = 1001;
```
---
## Good Example
```php
const USER_NOT_FOUND = 'USER_NOT_FOUND';
const ORDER_ALREADY_REFUNDED = 'ORDER_ALREADY_REFUNDED';
```
---
## Exceptions
When integrating with a legacy system that already uses a numeric error code standard that clients depend on.
---
## Consequences Of Violation
Developers must consult documentation to understand error codes; client branching is error-prone; code is less maintainable.

---

## Rule: Define All Error Codes in a Central Registry
---
## Category
Code Organization | Maintainability
---
## Rule
Always define all error codes as constants in a single central `ErrorCodes` class or backed enum; never hardcode code strings inline at throw sites.
---
## Reason
A central registry prevents duplicates, enables CI validation, provides a single source of truth for documentation generation, and makes code review of new error codes trivial.
---
## Bad Example
```php
// Hardcoded at throw site — untracked, may duplicate
throw new UserNotFoundException('USER_NOT_FOUND', 404);
// Different file:
throw new OrderNotFoundException('USER_NOT_FOUND', 404); // Oops — same code!
```
---
## Good Example
```php
final class ErrorCodes
{
    public const USER_NOT_FOUND = 'USER_NOT_FOUND';
    public const ORDER_NOT_FOUND = 'ORDER_NOT_FOUND';
}
class UserNotFoundException extends OperationalException
{
    public function __construct()
    {
        parent::__construct(errorCode: ErrorCodes::USER_NOT_FOUND, ...);
    }
}
```
---
## Exceptions
Per-domain registry files are preferred for large applications (see Error Code Namespace Design); the principle of central uniqueness still applies.
---
## Consequences Of Violation
Duplicate error codes; impossible to enforce uniqueness; documentation generation cannot be automated; code review misses collisions.

---

## Rule: Never Change an Error Code's Meaning After Release
---
## Category
Reliability | Maintainability
---
## Rule
Once an error code is published in a release, never change its meaning, remove it, or repurpose it — only deprecate it with a `@deprecated` tag pointing to the replacement.
---
## Reason
Clients branch on error codes; changing a code's meaning silently breaks client logic in production without any deploy-time warning.
---
## Bad Example
```php
// In v1: USER_NOT_FOUND meant "user not found"
// In v2, repurposed to mean "user account deactivated"
const USER_NOT_FOUND = 'USER_NOT_FOUND'; // Now has different meaning!
```
---
## Good Example
```php
// v1 code kept and deprecated
/** @deprecated Use USER_NOT_FOUND_OR_INACTIVE instead */
public const USER_NOT_FOUND = 'USER_NOT_FOUND';
// New code for v2
public const USER_NOT_FOUND_OR_INACTIVE = 'USER_NOT_FOUND_OR_INACTIVE';
```
---
## Exceptions
No common exceptions — error code immutability is a hard contract.
---
## Consequences Of Violation
Silent client breakage; production outages when client branching logic behaves incorrectly; trust erosion with API consumers.

---

## Rule: Use Domain Prefix for Automatic Groupability
---
## Category
Code Organization | Maintainability
---
## Rule
Always prefix every error code with its domain name (e.g., `USER_*`, `ORDER_*`, `PAYMENT_*`); never use domain-agnostic codes.
---
## Reason
Domain prefixes make codes groupable in dashboards, searchable in logs, and prevent cross-domain collisions without central coordination.
---
## Bad Example
```php
const NOT_FOUND = 'NOT_FOUND'; // Which domain? User? Order? Payment?
const DUPLICATE = 'DUPLICATE';
```
---
## Good Example
```php
const USER_NOT_FOUND = 'USER_NOT_FOUND';
const ORDER_NOT_FOUND = 'ORDER_NOT_FOUND';
const PAYMENT_DUPLICATE = 'PAYMENT_DUPLICATE';
```
---
## Exceptions
System-level codes (`SYSTEM_INTERNAL_ERROR`, `SYSTEM_RATE_LIMITED`) use `SYSTEM_*` prefix as their domain.
---
## Consequences Of Violation
Dashboards cannot filter by domain; cross-domain name collisions; developers must read exception context to determine error origin.

---

## Rule: Keep Error Code Count Between 20 and 50 Per API Version
---
## Category
Maintainability | Design
---
## Rule
Always maintain between 20 and 50 error codes per API version; consolidate overly specific codes and split overly generic ones to stay within this range.
---
## Reason
Fewer than 20 codes means errors are too generic (clients can't differentiate); more than 50 means codes are too specific (maintenance burden, documentation overhead).
---
## Bad Example
```php
// Too few — clients can't branch:
const ERROR = 'ERROR';
// Too many — unmaintainable:
const USER_AUTH_TOKEN_EXPIRED_ON_TUESDAY = 'USER_AUTH_TOKEN_EXPIRED_ON_TUESDAY';
```
---
## Good Example
```php
// ~30 codes — specific enough to act on, few enough to maintain
const USER_NOT_FOUND = 'USER_NOT_FOUND';
const USER_AUTH_INVALID_TOKEN = 'USER_AUTH_INVALID_TOKEN';
const USER_AUTH_EXPIRED_TOKEN = 'USER_AUTH_EXPIRED_TOKEN';
const ORDER_ALREADY_REFUNDED = 'ORDER_ALREADY_REFUNDED';
// ... 25 more
```
---
## Exceptions
Large domain-driven applications with many bounded contexts may require up to 100 codes; review quarterly for consolidation opportunities.
---
## Consequences Of Violation
Too few codes: clients must parse message strings to differentiate errors. Too many codes: documentation is incomplete, developers can't find appropriate codes.

---

## Rule: Never Include Dynamic Values Inside Error Code Strings
---
## Category
Security | Reliability
---
## Rule
Always keep error code strings static — never embed user IDs, resource IDs, emails, or any dynamic runtime value inside the error code constant.
---
## Reason
Dynamic values in codes make them unpredictable, non-documentable, and impossible to group in dashboards. They may also leak sensitive identifiers.
---
## Bad Example
```php
// Dynamic value embedded in code — can't document or group
const USER_NOT_FOUND = 'USER_NOT_FOUND';
throw new Exception('USER_NOT_FOUND_' . $userId);
```
---
## Good Example
```php
const USER_NOT_FOUND = 'USER_NOT_FOUND';
throw new UserNotFoundException($userId);
// Code is static; user_id is in context, not in the code
```
---
## Exceptions
No common exceptions — error codes must always be static string constants.
---
## Consequences Of Violation
Dashboard filters cannot group error occurrences; documentation generation is impossible; potential information disclosure via code strings.

---

## Rule: Enforce One-to-One Exception Class to Error Code Mapping
---
## Category
Code Organization | Testing
---
## Rule
Always maintain a strict one-to-one relationship between exception classes and error codes — one exception class returns exactly one error code, and no two exception classes return the same code.
---
## Reason
One-to-one mapping makes the error code derivable from the exception class alone — the handler can resolve the code without inspecting exception internals.
---
## Bad Example
```php
// Two exception classes sharing the same code
class UserNotFound extends OperationalException {
    public function getErrorCode(): string { return 'NOT_FOUND'; }
}
class OrderNotFound extends OperationalException {
    public function getErrorCode(): string { return 'NOT_FOUND'; } // Same!
}
```
---
## Good Example
```php
class UserNotFoundException extends OperationalException {
    public function getErrorCode(): string { return ErrorCodes::USER_NOT_FOUND; }
}
class OrderNotFoundException extends OperationalException {
    public function getErrorCode(): string { return ErrorCodes::ORDER_NOT_FOUND; }
}
```
---
## Exceptions
A deprecated code mapped to multiple exception classes during a migration period; document clearly and remove in the next major version.
---
## Consequences Of Violation
Impossible to determine error source from code alone; handler must inspect exception type and context; monitoring aggregation conflates distinct error scenarios.

---

## Rule: Document Every Error Code in the API Reference
---
## Category
Maintainability | Testing
---
## Rule
Always keep the API reference documentation for every error code in sync with the central registry; auto-generate documentation from the `ErrorCodes` class where possible.
---
## Reason
Undocumented error codes are unusable by client developers — they don't know the code exists, what triggers it, or how to handle it.
---
## Bad Example
```php
// Code exists in registry but is not documented
const USER_AUTH_TOKEN_EXPIRED = 'USER_AUTH_TOKEN_EXPIRED';
// No reference entry — clients can't prepare for it
```
---
## Good Example
```php
const USER_AUTH_TOKEN_EXPIRED = 'USER_AUTH_TOKEN_EXPIRED';
// Auto-generated API reference entry:
// - Code: USER.AUTH_TOKEN_EXPIRED
// - Status: 401
// - Meaning: The provided authentication token has expired
// - Client action: Silently refresh the token
```
---
## Exceptions
Internal-only error codes that should never reach external clients (e.g., `SYSTEM_INTERNAL_ERROR` detail codes).
---
## Consequences Of Violation
Client developers discover error codes at runtime; increased support burden; poor developer experience for API consumers.
