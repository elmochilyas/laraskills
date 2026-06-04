# Phase 5: Rules — Error Code Namespace Design

## Rule: Always Use Domain-Prefixed Namespace Format with Dot Delimiter
---
## Category
Code Organization | Maintainability
---
## Rule
Always format error codes as `DOMAIN.VERB_OBJECT` using a dot to separate the domain from the error name (e.g., `USER.AUTH_INVALID_TOKEN`); never use a flat format without domain prefix.
---
## Reason
The dot delimiter mirrors Laravel config notation and is familiar to PHP developers. Domain prefix prevents collisions across teams and bounded contexts without central coordination.
---
## Bad Example
```php
const NOT_FOUND = 'NOT_FOUND';
const AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN';
// Which domain? Collision guaranteed as system grows
```
---
## Good Example
```php
const USER_NOT_FOUND = 'USER.NOT_FOUND';
const USER_AUTH_INVALID_TOKEN = 'USER.AUTH_INVALID_TOKEN';
const ORDER_NOT_FOUND = 'ORDER.NOT_FOUND';
```
---
## Exceptions
System-wide infrastructure errors use `SYSTEM` domain (e.g., `SYSTEM.INTERNAL_ERROR`, `SYSTEM.DATABASE_ERROR`).
---
## Consequences Of Violation
Inevitable code collisions as the system grows; cannot filter dashboards by domain; teams must coordinate code names globally.

---

## Rule: Limit Namespace Depth to Exactly Two Levels
---
## Category
Design | Maintainability
---
## Rule
Always limit error code namespaces to exactly two levels: `DOMAIN.VERB_OBJECT`. Never use three or more levels.
---
## Reason
Deeper namespaces (`USER.AUTH.TOKEN.INVALID`) become unwieldy in logs, hard to remember, and impossible to display in dashboards. Two levels provide enough structure without over-engineering.
---
## Bad Example
```php
const USER_AUTH_TOKEN_INVALID = 'USER.AUTH.TOKEN.INVALID';
// Three levels — hard to remember, type, or display
```
---
## Good Example
```php
const USER_AUTH_TOKEN_INVALID = 'USER.AUTH_INVALID_TOKEN';
// Two levels — clear, concise, dashboard-friendly
```
---
## Exceptions
No common exceptions — if you need three levels, the code name is too specific or your domain boundaries are misaligned.
---
## Consequences Of Violation
Unwieldy error codes that are hard to remember and type; dashboard columns truncate; developers create inconsistent depths across domains.

---

## Rule: Enforce Namespace Format with CI Regex Validation
---
## Category
Reliability | Testing
---
## Rule
Always enforce error code format with a CI regex rule matching `^[A-Z]+\.[A-Z_]+$`; never allow codes that deviate from this pattern.
---
## Reason
Automated format validation prevents inconsistent casing (e.g., `User.notFound`), missing domain prefixes, and format drift that makes codes harder to search and validate.
---
## Bad Example
```php
// Mixed case — harder to grep; passes no regex
const User_Not_Found = 'User.not_Found';
```
---
## Good Example
```php
// All uppercase with dot and underscore — matches ^[A-Z]+\.[A-Z_]+$
const USER_NOT_FOUND = 'USER.NOT_FOUND';
```
---
## Exceptions
Legacy error codes that predate the regex rule; document exceptions and migrate during major version bump.
---
## Consequences Of Violation
Inconsistent code formats across domains; grep searches miss codes due to case differences; documentation generation fails on malformed codes.

---

## Rule: Never Change an Error Code's Namespace After Release
---
## Category
Reliability
---
## Rule
Once an error code is published with a given namespace, never move it to a different namespace — only deprecate the old code and create a new one.
---
## Reason
Clients branch on the full error code string including namespace; changing a namespace silently breaks all existing client branching logic.
---
## Bad Example
```php
// v1: released as USER.AUTH_INVALID_TOKEN
// v2: moved to AUTH.INVALID_TOKEN
// All existing client code branching on USER.AUTH_INVALID_TOKEN breaks
```
---
## Good Example
```php
/** @deprecated Use USER.AUTH_TOKEN_INVALID instead */
const USER_AUTH_INVALID_TOKEN = 'USER.AUTH_INVALID_TOKEN';
const USER_AUTH_TOKEN_INVALID = 'USER.AUTH_TOKEN_INVALID';
```
---
## Exceptions
During internal refactoring before the first public release; once consumers exist, the namespace is frozen.
---
## Consequences Of Violation
Silent client breakage in production; client branching logic returns wrong fallback; trust erosion with API consumers.

---

## Rule: Use Per-Domain Registry Files with a Global Aggregator
---
## Category
Code Organization | Scalability
---
## Rule
Always define error codes in per-domain registry files (e.g., `app/Domains/User/ErrorCodes.php`) and aggregate them through a global `ErrorCodes` class; never put all codes in a single flat file for large systems.
---
## Reason
Per-domain registries let teams own their error codes independently. A global aggregator still provides a single import point and enables CI validation of uniqueness across all domains.
---
## Bad Example
```php
// Single file with 200 codes — merge conflicts on every PR
class ErrorCodes {
    const USER_NOT_FOUND = 'USER.NOT_FOUND';
    const USER_AUTH_INVALID_TOKEN = 'USER.AUTH_INVALID_TOKEN';
    const ORDER_NOT_FOUND = 'ORDER.NOT_FOUND';
    // ... 197 more
}
```
---
## Good Example
```php
// app/Domains/User/ErrorCodes.php
class UserErrorCodes {
    const NOT_FOUND = 'USER.NOT_FOUND';
    const AUTH_INVALID_TOKEN = 'USER.AUTH_INVALID_TOKEN';
}
// Global aggregator:
final class ErrorCodes {
    public const USER_NOT_FOUND = UserErrorCodes::NOT_FOUND;
    public const USER_AUTH_INVALID_TOKEN = UserErrorCodes::AUTH_INVALID_TOKEN;
    // Auto-aggregated from all domain registries
}
```
---
## Exceptions
Single-domain applications with fewer than 30 codes; a single registry file is acceptable.
---
## Consequences Of Violation
Merge conflicts in the single registry file; team bottlenecks on error code additions; domain ownership blur.

---

## Rule: Never Use Underscore as the Domain Separator
---
## Category
Design | Code Organization
---
## Rule
Always use dot as the domain separator (`USER.NOT_FOUND`), never underscore as the domain separator (`USER_NOT_FOUND`).
---
## Reason
Dot visibly separates the domain from the error verb, making the namespace boundary clear at a glance. Underscore within the domain aligns with PHP constant naming conventions.
---
## Bad Example
```php
const USER_NOT_FOUND = 'USER_NOT_FOUND'; // No namespace boundary visible
```
---
## Good Example
```php
const USER_NOT_FOUND = 'USER.NOT_FOUND'; // Domain boundary clear
```
---
## Exceptions
Backward compatibility with existing clients that already parse underscore-separated codes; migrate during major version.
---
## Consequences Of Violation
No visible namespace boundary; harder for developers to identify the domain from the code; inconsistent with config/key notation pattern.

---

## Rule: Validate Namespace Prefix Matches the Domain Directory Name
---
## Category
Code Organization | Maintainability
---
## Rule
Always ensure the error code namespace prefix matches the domain directory name (e.g., `USER.*` codes live in `app/Domains/User/`); never use a namespace prefix that has no corresponding domain directory.
---
## Reason
Matching prefixes and directories makes error codes navigable — developers can find the throwing code by following the namespace prefix to the domain directory.
---
## Bad Example
```php
// Code says AUTH, but there's no app/Domains/Auth/ directory
const AUTH_TOKEN_EXPIRED = 'AUTH.TOKEN_EXPIRED';
// Code lives in app/Domains/User/Exceptions/ — mismatch
```
---
## Good Example
```php
// app/Domains/User/ErrorCodes.php
const USER_AUTH_TOKEN_EXPIRED = 'USER.AUTH_TOKEN_EXPIRED';
// app/Domains/User/Exceptions/UserAuthTokenExpiredException.php
```
---
## Exceptions
Cross-domain shared codes use the `SYSTEM.` or `SHARED.` prefix with corresponding `app/Domains/System/` directory.
---
## Consequences Of Violation
Developers cannot locate the source domain from the error code; namespace drift as teams refactor domains.

---

## Rule: Never Include API Version in the Namespace
---
## Category
Architecture | Maintainability
---
## Rule
Always keep API versioning out of error code namespaces (never `V1.USER_NOT_FOUND`); versioning belongs in the route, not in the error contract.
---
## Reason
Versioning the error code means clients must update their error handling code with every API version bump, even when the error meaning hasn't changed.
---
## Bad Example
```php
const V1_USER_NOT_FOUND = 'V1.USER.NOT_FOUND';
const V2_USER_NOT_FOUND = 'V2.USER.NOT_FOUND';
// Same error, different codes — multiplies client branching
```
---
## Good Example
```php
const USER_NOT_FOUND = 'USER.NOT_FOUND';
// Same code across all API versions — stable contract
```
---
## Exceptions
Breaking changes to error meaning that require a new code; the old code stays with its original name, the new code gets a new name.
---
## Consequences Of Violation
Error code documentation must be regenerated per version; client code must branch on both version and code; unnecessary coupling between API version and error semantics.

---

## Rule: Never Include HTTP Method or Transport Details in the Namespace
---
## Category
Architecture | Design
---
## Rule
Always keep error code namespaces domain-oriented; never include HTTP method (`GET`, `POST`), transport protocol, or endpoint path in the namespace.
---
## Reason
HTTP method is a transport detail, not a domain concept. Including it creates duplicate codes for the same domain error (e.g., `GET.USER_NOT_FOUND` and `POST.USER_NOT_FOUND`).
---
## Bad Example
```php
const GET_USER_NOT_FOUND = 'GET.USER.NOT_FOUND';
const POST_USER_NOT_FOUND = 'POST.USER.NOT_FOUND';
// Same domain error, duplicated by transport
```
---
## Good Example
```php
const USER_NOT_FOUND = 'USER.NOT_FOUND';
// Same code regardless of HTTP method — correct
```
---
## Exceptions
No common exceptions — transport details never belong in error codes.
---
## Consequences Of Violation
Code count inflates unnecessarily; impossible to group all "not found" errors across methods; client branching logic becomes coupled to HTTP method.
