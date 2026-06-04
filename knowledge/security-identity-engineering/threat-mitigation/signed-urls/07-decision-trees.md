# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** Signed URLs and Signed Routes
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Permanent vs Temporary Signed URL | URL expiration strategy | security, use-case |
| 2 | Single-Use vs Multi-Use Signed URL | Replay protection strategy | security |
| 3 | Validation Location | Middleware vs manual controller validation | architectural |

---

# Architecture-Level Decision Trees

---

## Permanent vs Temporary Signed URL

---

## Decision Context

Whether to use `URL::signedRoute()` (permanent, no expiry) or `URL::temporarySignedRoute()` (with expiration timestamp).

---

## Decision Criteria

* security
* use-case

---

## Decision Tree

Does the URL grant access to a time-sensitive action?
↓
YES → Temporary signed URL (password reset, email verification, file download)
NO → Is the action reversible or low-sensitivity?
    YES → Permanent signed URL may be acceptable (unsubscribe link, account settings link)
    NO → Temporary signed URL (better safe than sorry)

What is the consequence if the URL is intercepted?
↓
High (account takeover, data access) → Temporary, short expiry (15-60 min)
Medium (unsubscribe, moderate action) → Temporary, moderate expiry (24 hours)
Low (public share link) → Permanent or very long expiry (30 days)

Is there a business need for the link to never expire?
↓
YES → Permanent signed URL (documented security trade-off)
NO → Temporary signed URL with appropriate expiry

Does the user need to act immediately (not "when they get around to it")?
↓
YES → Temporary, short expiry (15-30 min)
NO → Longer expiry or permanent

---

## Rationale

Permanent signed URLs never expire — useful for unsubscribe links and persistent share links where the link should work indefinitely. However, any intercepted permanent URL can be used forever. Temporary signed URLs include an `expires` parameter that is part of the HMAC signature — tampering with it invalidates the URL. Most time-sensitive actions (password reset, email verification) should use temporary URLs.

---

## Recommended Default

**Default:** Temporary signed URLs for all time-sensitive actions (password reset, email verification, file download); permanent signed URLs only for low-sensitivity long-lived actions (unsubscribe)
**Reason:** Temporary URLs limit the window of opportunity for intercepted links. The standard expiry of 60 minutes balances user convenience with security for most actions. Unsubscribe links are a legitimate exception — users may want to unsubscribe months later.

---

## Risks Of Wrong Choice

- Permanent URL for password reset: link can be intercepted and used indefinitely
- Too-short expiry (5 min): user may not complete action in time (frustration)
- Too-long expiry (30 days): wide interception window
- No expiry at all: link valid forever, even after action is completed

---

## Related Rules

- Use Signed URLs for All Public Temporary Access (05-rules.md)
- Set the Shortest Practical Expiration for Temporary Signed URLs (05-rules.md)

---

## Related Skills

- Generate and Verify Signed URLs for Tamper-Proof Links (06-skills.md)

---

## Single-Use vs Multi-Use Signed URL

---

## Decision Context

Whether to allow a signed URL to be used once (then invalidated) or multiple times until expiration.

---

## Decision Criteria

* security

---

## Decision Tree

Is the action idempotent (completing it multiple times has no additional effect)?
↓
YES → Multi-use (check if action already completed, redirect if so)
NO → Single-use with server-side tracking (mark URL as consumed)

What is the action?
↓
Email verification → Multi-use (check `email_verified_at`, reject if already verified)
Password reset → Single-use (track consumed tokens in database)
File download → Multi-use (allow repeated downloads until expiry)
Unsubscribe → Multi-use (check `unsubscribed_at`, reject if already unsubscribed)

Is the signed URL sent via email?
↓
YES → Single-use recommended (email forwarding may expose to unintended recipients)
NO → Multi-use may be acceptable

What is the consequence of replay?
↓
High (account changes, data exposure) → Single-use mandatory
Low (file download, public info) → Multi-use acceptable

---

## Rationale

Signed URLs can be replayed until expiration unless server-side consumption tracking is implemented. For actions where one-time use is important (password reset, email verification), the application should track used URLs in a database or cache. For idempotent actions, checking the current state (is email already verified?) provides effective replay protection without explicit tracking.

---

## Recommended Default

**Default:** Multi-use with idempotency check (verify action state on each request); single-use only for actions where state tracking is insufficient (password reset tokens)
**Reason:** Idempotency checks are simpler and more reliable than explicit consumption tracking. If the action is already done, reject the replay naturally. Password resets need explicit single-use tracking because the action changes state and the token itself is the security control.

---

## Risks Of Wrong Choice

- Single-use without tracking: URL usable multiple times (no replay protection)
- No idempotency check: email verification link can be clicked 1000 times
- Consumed token not invalidated: password reset link works after password changed
- Too aggressive single-use: user clicks link twice, second click shows error (poor UX)

---

## Related Rules

- Invalidate Signed URLs After Single Use When Appropriate (05-rules.md)
- Log Signed URL Access for Audit (05-rules.md)

---

## Related Skills

- Generate and Verify Signed URLs for Tamper-Proof Links (06-skills.md)

---

## Validation Location

---

## Decision Context

Whether to validate signed URLs via `signed` middleware or manual `$request->hasValidSignature()` in the controller.

---

## Decision Criteria

* architectural

---

## Decision Tree

Is the signed URL route simple (no additional parameter manipulation)?
↓
YES → `signed` middleware (cleanest, automatic 403 on failure)
NO → Manual validation in controller (more control over error handling)

Do you need to ignore certain query parameters (UTM, analytics)?
↓
YES → Manual `$request->hasValidSignatureWhileIgnoring(['utm_source', ...])` required
NO → `signed` middleware works without ignoring

Do you need custom error handling beyond HTTP 403?
↓
YES → Manual validation in controller (custom response, redirect to friendly error page)
NO → `signed` middleware (default 403 is acceptable)

Is there pre-validation logic needed before checking the signature?
↓
YES → Manual validation (check signature after other checks)
NO → `signed` middleware (runs before controller)

Are there multiple routes sharing the same validation logic?
↓
YES → Custom middleware extending `ValidateSignature` (DRY approach)
NO → `signed` middleware or manual per-route

---

## Rationale

The `signed` middleware is the simplest approach — it validates the HMAC and returns 403 on failure. Manual validation with `$request->hasValidSignature()` provides more control: custom error responses, parameter ignoring, and pre-validation logic. Use middleware for simple routes, manual validation when you need flexibility.

---

## Recommended Default

**Default:** `signed` middleware for most signed URL routes; manual `$request->hasValidSignatureWhileIgnoring()` when analytics parameters need to be ignored
**Reason:** The middleware is clean, standard, and provides automatic protection. Manual validation is only needed when you must ignore analytics parameters (common for email links) or provide custom error handling.

---

## Risks Of Wrong Choice

- No validation at all: anyone can access the route without a signature
- `signed` middleware when analytics parameters present: URLs invalidated by UTM tags
- Manual validation in every controller: code duplication across controllers
- Overriding signature validation: incorrectly implemented custom validation may be bypassed

---

## Related Rules

- Validate Signed URLs in the Controller or Middleware (05-rules.md)
- Use `hasValidSignatureWhileIgnoring()` for Non-Essential Parameters (05-rules.md)

---

## Related Skills

- Generate and Verify Signed URLs for Tamper-Proof Links (06-skills.md)
