# Anti-Patterns — Error Code Namespace Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Error Code Namespace Design |
| Difficulty | Advanced |
| Category | Design Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| No Namespace at All | High | Medium | Code review: flat code list with no domain prefix |
| Dynamic Namespaces | High | Low | Code review: codes generated from class names at runtime |
| Namespace by HTTP Method | Medium | Low | Code review: `GET.USER_NOT_FOUND` naming pattern |
| Customer-Specific Namespaces | High | Low | Code review: `ACME_CORP.USER_NOT_FOUND` per tenant |
| Version in Namespace | Medium | Medium | Code review: `V1.USER_NOT_FOUND`, `V2.USER_NOT_FOUND` |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Omitting Domain Prefix | `NOT_FOUND` instead of `USER.NOT_FOUND` | Future collision inevitable |
| Changing Namespace Post-Release | Moving `USER.AUTH.*` to `AUTH.USER.*` | Breaks existing client branching |
| Inconsistent Casing | `User.notFound` vs `USER.NOT_FOUND` | Harder to search and validate |
| Using 3+ Levels | `USER.AUTH.TOKEN.INVALID` | Codes become unwieldy |

---

## Anti-Pattern Details

### AP-ECN-01: No Namespace at All

**Description**: Error codes are flat strings with no domain prefix or hierarchical structure. `NOT_FOUND`, `INVALID`, `FORBIDDEN`, `ERROR` — codes that will inevitably collide as the system grows. Two teams working on different domains cannot create codes without risking collisions. Error tracking cannot group by domain.

**Root Cause**: The system starts small with a handful of codes. No one anticipates that the codebase will grow to 50+ codes across multiple domains.

**Impact**:
- Collisions: two domains cannot both define `NOT_FOUND` without conflict
- Error tracking aggregation mixes User, Order, and Payment errors under one code
- Developers must use prefixes manually, leading to inconsistency: `user_not_found`, `order_not_found`, `usr_not_found`
- No groupability by domain in dashboards

**Detection**:
- Code review: error codes like `NOT_FOUND`, `FORBIDDEN`, `ERROR` without domain prefix
- Code review: duplicate meaning codes with different naming conventions (`usr404`, `user_not_found`, `UserNotFound`)
- Error tracking: cannot filter by domain because there's no consistent prefix

**Solution**:
- Adopt a `DOMAIN.VERB_OBJECT` format for all error codes
- Mandate the domain prefix in the code style guide
- Enforce with CI: all error codes must match `^[A-Z]+\.[A-Z_]+$`
- Provide domain-specific registry files or sections

**Example**:
```php
// BEFORE: No namespace
final class ErrorCodes
{
    public const NOT_FOUND = 'NOT_FOUND';          // ❌ which domain?
    public const FORBIDDEN = 'FORBIDDEN';          // ❌ which domain?
    public const INVALID = 'INVALID';              // ❌ which domain?
}

// AFTER: Namespaced by domain
final class ErrorCodes
{
    public const USER_NOT_FOUND = 'USER.NOT_FOUND';
    public const ORDER_NOT_FOUND = 'ORDER.NOT_FOUND';
    public const USER_AUTH_FORBIDDEN = 'USER.AUTH_FORBIDDEN';
    public const ORDER_STATUS_INVALID = 'ORDER.STATUS_INVALID';
}
```

---

### AP-ECN-02: Namespace by HTTP Method

**Description**: Error codes are organized by HTTP method instead of by domain. `GET.USER_NOT_FOUND`, `POST.USER_CREATE_FAILED`, `PUT.USER_UPDATE_FAILED`. The namespace reflects how the error was triggered (GET, POST, PUT) rather than what domain the error belongs to. Changes to routing (GET → POST) change the error code.

**Root Cause**: The developer thinks about errors in terms of endpoints rather than domains. "This error happens on the POST endpoint."

**Impact**:
- Error codes change when HTTP methods change (breaking change for clients)
- Same domain error (user not found) gets different codes depending on which HTTP method was used
- Codes cannot be grouped by domain for monitoring
- REST purists object (HTTP method is transport, not domain)

**Detection**:
- Code review: error code prefix is an HTTP verb (`GET.`, `POST.`, `PUT.`, `DELETE.`)
- Code review: same logical error has different codes for GET vs POST variants
- Bug reports: "Error code changed when we switched from POST to PUT for this endpoint"

**Solution**:
- Namespace by business domain, not HTTP method
- The same logical error should have the same code regardless of which HTTP method triggered it
- Use `USER.NOT_FOUND` whether the user was requested via GET, POST, or PUT

**Example**:
```php
// BEFORE: Namespace by HTTP method
final class ErrorCodes
{
    public const GET_USER_NOT_FOUND = 'GET.USER_NOT_FOUND';   // ❌
    public const POST_USER_NOT_FOUND = 'POST.USER_NOT_FOUND'; // ❌
    public const PUT_USER_NOT_FOUND = 'PUT.USER_NOT_FOUND';   // ❌
}

// AFTER: Namespace by domain
final class ErrorCodes
{
    public const USER_NOT_FOUND = 'USER.NOT_FOUND'; ✅
}
```

---

### AP-ECN-03: Version in Namespace

**Description**: Error codes include the API version in the namespace: `V1.USER_NOT_FOUND`, `V2.USER_NOT_FOUND`. Each API version duplicates the entire error code catalog with a different version prefix. When a version is deprecated, all its error codes must be deprecated too. The namespace provides no value because the same logical error has different codes in different versions.

**Root Cause**: The developer treats versioning as a namespace concern. They think "v1 has its own errors, v2 has its own errors."

**Impact**:
- Error code catalog is duplicated per version (3× codes for 3 versions)
- Deprecating an API version requires deprecating all its codes
- Migrating from v1 to v2 requires clients to update all error code references
- Error tracking cannot easily aggregate errors across versions

**Detection**:
- Code review: error codes start with `V1.`, `V2.`, `V3.`
- Code review: same logical error has `V1.USER_NOT_FOUND` and `V2.USER_NOT_FOUND`
- Documentation: error code reference organized by API version, not by domain

**Solution**:
- Error codes are version-independent — the same code works across all API versions
- Versioning is a routing concern, not an error code concern
- If a code's meaning changes between versions, deprecate the old code and create a new one without a version prefix
- Use the domain as the namespace, never the API version

**Example**:
```php
// BEFORE: Version in namespace
final class ErrorCodes
{
    public const V1_USER_NOT_FOUND = 'V1.USER.NOT_FOUND';
    public const V2_USER_NOT_FOUND = 'V2.USER.NOT_FOUND';
    public const V1_ORDER_NOT_FOUND = 'V1.ORDER.NOT_FOUND';
    public const V2_ORDER_NOT_FOUND = 'V2.ORDER.NOT_FOUND';
}

// AFTER: Version-independent codes
final class ErrorCodes
{
    public const USER_NOT_FOUND = 'USER.NOT_FOUND';
    public const ORDER_NOT_FOUND = 'ORDER.NOT_FOUND';
    // Same codes for all API versions
}
```
