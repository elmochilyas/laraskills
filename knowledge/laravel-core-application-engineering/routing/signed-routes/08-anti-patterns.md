# Anti-Patterns â€” Signed Routes
## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing |
| Knowledge Unit | Signed Routes |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Signed URLs Without Expiration | High | Medium | Signed routes have no expiration, valid indefinitely |
| Using Signed Routes for Authentication | High | Medium | Signed routes used as primary auth mechanism instead of proper auth |
| Exposing Sensitive Data Via Signed URLs | High | Medium | Signed URLs for accessing private data without additional authorization |
| No Signature Validation Error Handling | Medium | Medium | Invalid signature returns generic 403 without useful error message |
| Temporary URLs That Never Expire | High | High | Temporary signed URLs created without ttl, valid forever |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Signed Route Expiration Policy | No standard for how long signed routes remain valid | Some valid forever, others expire too quickly |
| Overuse of Signed Routes for Non-Email Flows | Signed routes used where session-based auth would suffice | Unnecessary complexity, security concerns |

## Anti-Pattern Details

### AP-SR-01: Signed URLs Without Expiration
**Description**: Signed URLs created without expiration time, remaining valid indefinitely.
**Root Cause**: Developer uses URL::signedRoute() instead of URL::temporarySignedRoute().
**Impact**: Leaked signed URLs can be used forever. Security risk.
**Detection**: URL::signedRoute() used for time-sensitive operations (email links, password reset).
**Solution**: Use URL::temporarySignedRoute() with an appropriate expiration time.

### AP-SR-02: Using Signed Routes for Authentication
**Description**: Signed routes used to authenticate users instead of proper authentication mechanisms.
**Root Cause**: Developer uses signed URLs as a shortcut for auth.
**Impact**: No proper auth. Signature can't be revoked per user. No session management.
**Detection**: Application relies on signed URL validity for user identification.
**Solution**: Use proper authentication. Signed routes are for verification, not auth.

### AP-SR-03: Exposing Sensitive Data Via Signed URLs
**Description**: Signed URLs grant access to private or sensitive data without additional authorization checks.
**Root Cause**: Assuming signed URL validity is sufficient authorization.
**Impact**: Anyone with a valid (leaked, forwarded) signed URL can access sensitive data.
**Detection**: Signed URL routes access private user data without additional authorization.
**Solution**: Always add authorization checks on signed URL routes beyond signature validation.

### AP-SR-04: No Signature Validation Error Handling
**Description**: Invalid or expired signed URLs return generic 403 errors without useful messages.
**Root Cause**: Default Laravel InvalidSignatureException handling returns 403.
**Impact**: Users can't tell why access was denied (invalid vs expired vs tampered).
**Detection**: Invalid signed URL returns generic 403 with no explanation.
**Solution**: Customize InvalidSignatureException handler to return specific error messages.
