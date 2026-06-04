# ECC Anti-Patterns — Token Expiration & Rotation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | Token Expiration & Rotation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Expiration Enforcement (Assuming Sanctum Checks expires_at)
2. Rotation Without Revoking the Old Token
3. Same TTL for All Token Types Regardless of Ability Sensitivity
4. Token Refresh Endpoint Without Rate Limiting
5. No Grace Period During Token Rotation

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries

---

## Anti-Pattern 1: No Expiration Enforcement (Assuming Sanctum Checks expires_at)

### Category
Security

### Description
Setting `expires_at` on Sanctum tokens but not implementing custom middleware to enforce it, because Sanctum's database schema includes the column but the default guard never validates it.

### Why It Happens
The column exists in the migration, the parameter exists in `createToken()`, and developers reasonably assume Sanctum handles expiration. The behavior is not obvious without reading Sanctum's source code.

### Warning Signs
- `expires_at` set on token creation but no middleware checks it
- Tokens with past `expires_at` values still authenticate
- No `CheckTokenExpiration` middleware registered
- Documentation assumes Sanctum enforces expiration natively

### Why It Is Harmful
Tokens with expired `expires_at` values remain valid indefinitely. A token set to expire in 24 hours works for years. The entire expiration feature is decorative — it provides no security benefit.

### Real-World Consequences
A mobile app token is issued with `expires_at = now()->addDays(30)`. The token is hardcoded in the app. Three years later, the token still authenticates because no middleware checks `expires_at`. An attacker who extracted the token retains permanent access.

### Preferred Alternative
Implement custom middleware that checks `$request->user()->currentAccessToken()->expires_at` on every request and rejects expired tokens.

### Refactoring Strategy
1. Create `CheckTokenExpiration` middleware
2. Check `$token->expires_at && $token->expires_at->isPast()` — reject
3. Add 30-second clock skew tolerance
4. Register middleware after `auth:sanctum` in the API group
5. Delete expired tokens on detection

### Detection Checklist
- [ ] Check for expiration checking middleware in API group
- [ ] Test with a token past its `expires_at` — should get 401
- [ ] Verify `currentAccessToken()->expires_at` is inspected

### Related Rules
- Implement Custom Expiration Middleware for Sanctum (05-rules.md)

### Related Skills
- Implement Token Expiration and Rotation (06-skills.md)

### Related Decision Trees
- Token TTL by Ability Sensitivity (07-decision-trees.md)

---

## Anti-Pattern 2: Rotation Without Revoking the Old Token

### Category
Security

### Description
Issuing a new token during rotation without revoking (deleting) the old token, leaving both tokens valid and doubling the exposure window.

### Why It Happens
The rotation code creates a new token and returns it, but forgets to delete the old token. The developer may also intend to keep the old token as a "backup."

### Warning Signs
- Rotation endpoint creates new token but does not call `$oldToken->delete()`
- Users accumulate multiple valid tokens over time
- Old token remains valid after rotation
- Token count per user increases with each rotation

### Why It Is Harmful
An attacker who compromised the original token retains access after rotation. The new token also becomes a target. The rotation event, which should be a security improvement, does nothing to address the original breach.

### Real-World Consequences
A user's token is compromised. They rotate it. The new token works, but the old token is still valid because it wasn't deleted. The attacker continues using the old token indefinitely. The user believes the rotation fixed the problem.

### Preferred Alternative
Revoke the old token immediately when issuing the rotated token: `$oldToken->delete()`.

### Refactoring Strategy
1. Review rotation endpoint code
2. Add `$oldToken->delete()` or `$user->currentAccessToken()->delete()` after creating the new token
3. Use `DB::transaction()` for atomicity
4. Consider 5-minute grace period with scheduled revocation for high-traffic APIs
5. Test that old token is invalid after rotation

### Detection Checklist
- [ ] Check rotation endpoint for `->delete()` call
- [ ] Verify old token is rejected after rotation
- [ ] Test concurrent rotation requests

### Related Rules
- Always Revoke Old Token During Rotation (05-rules.md)

### Related Skills
- Implement Token Expiration and Rotation (06-skills.md)

### Related Decision Trees
- Grace Period During Token Rotation (07-decision-trees.md)

---

## Anti-Pattern 3: Same TTL for All Token Types Regardless of Ability Sensitivity

### Category
Security

### Description
Applying a uniform expiration time (e.g., 90 days) to all token types regardless of the sensitivity of their abilities, making admin tokens as long-lived as read-only tokens.

### Why It Happens
A single `expires_at` value is set at token creation for simplicity. The TTL is not tuned per ability scope.

### Warning Signs
- All tokens have the same `expires_at` regardless of abilities
- Admin/super-user tokens last as long as read-only tokens
- No TTL configuration per ability or role
- Token TTL not mentioned in ability documentation

### Why It Is Harmful
A compromised admin token provides unlimited access for 90 days, while the damage potential is exponentially higher than a read-only token. The TTL should be inversely proportional to the sensitivity of the abilities.

### Real-World Consequences
An admin token with `users:delete`, `billing:write` abilities has a 90-day TTL — same as a read-only token. The admin token is compromised. The attacker has 90 days of full admin access. With read-only TTL of 90 days, the admin TTL should have been 24 hours.

### Preferred Alternative
Set shorter TTLs for sensitive abilities: admin tokens (1-24 hours), write tokens (7-30 days), read tokens (30-90 days).

### Refactoring Strategy
1. Create TTL configuration per ability or ability category
2. Set `expires_at` based on the most sensitive ability in the token
3. Implement custom expiration middleware if not already present
4. Document TTL per token type in API reference
5. Rotate existing tokens with inappropriate TTLs

### Detection Checklist
- [ ] Check TTL assignment logic — is it uniform?
- [ ] Verify admin tokens have shorter TTL than read-only tokens
- [ ] Test that tokens expire at the expected time

### Related Rules
- Set Shorter TTL for Sensitive Abilities (05-rules.md)

### Related Skills
- Implement Token Expiration and Rotation (06-skills.md)

### Related Decision Trees
- Token TTL by Ability Sensitivity — Short vs Long (07-decision-trees.md)

---

## Anti-Pattern 4: Token Refresh Endpoint Without Rate Limiting

### Category
Security

### Description
Providing a token rotation/refresh endpoint without applying strict rate limiting, allowing an attacker with one valid token to generate unlimited new tokens.

### Why It Happens
The refresh endpoint is treated like any other authenticated endpoint. The risk of unlimited token generation from a single valid token is overlooked.

### Warning Signs
- `POST /auth/refresh` has no throttle middleware
- No rate limiter defined for token refresh
- A single valid token can generate unlimited refresh requests
- Token generation audit shows bursts from the same user/token

### Why It Is Harmful
An attacker with one valid token can hammer the refresh endpoint, generating thousands of valid tokens. This amplifies the breach — one compromised token becomes thousands. Revocation becomes impractical.

### Real-World Consequences
An attacker compromises a single token via a phishing attack. They write a script that calls the refresh endpoint 10,000 times in one minute, creating 10,000 valid tokens. The original token is revoked, but the attacker has 10,000 backups. Cleaning up all tokens requires database-level intervention.

### Preferred Alternative
Apply strict rate limiting to the token refresh endpoint (e.g., 10 requests per hour per user).

### Refactoring Strategy
1. Create a named rate limiter for token refresh: `RateLimiter::for('token-refresh', fn(...) => Limit::perHour(10))`
2. Apply `throttle:token-refresh` middleware to the refresh route
3. Log all refresh attempts for audit
4. Alert on sustained refresh activity

### Detection Checklist
- [ ] Check refresh route for throttle middleware
- [ ] Verify rate limiter exists for token refresh
- [ ] Test that refresh rate limit is enforced

### Related Rules
- Rate Limit the Token Refresh Endpoint (05-rules.md)

### Related Skills
- Implement Token Expiration and Rotation (06-skills.md)

### Related Decision Trees
- (Security considerations in token lifecycle)

---

## Anti-Pattern 5: No Grace Period During Token Rotation

### Category
Reliability

### Description
Immediately revoking the old token before the client receives the new token during rotation, causing race conditions where in-flight requests fail because the old token is already invalid.

### Why It Happens
The rotation code deletes the old token first, then creates the new one. The client may have concurrent requests using the old token that fail during the brief window.

### Warning Signs
- Rotation code deletes old token before or immediately after creating new one
- Users report occasional 401 errors during token rotation
- Race condition failures in distributed systems during rotation
- No `expires_at` update on old token — immediate deletion

### Why It Is Harmful
If a client has multiple in-flight requests during rotation, some use the now-deleted old token and fail with 401. The client must retry those requests, potentially causing duplicate operations.

### Real-World Consequences
A mobile app sends 5 concurrent requests. One request triggers a token rotation (due to expiry). The rotation deletes the old token. The other 4 in-flight requests fail with 401 because they carried the now-deleted old token. The app shows a transient error state.

### Preferred Alternative
Use a short grace period (5 minutes) where the old token remains valid during handover. Set `expires_at` on the old token to `now()->addMinutes(5)` instead of deleting it immediately.

### Refactoring Strategy
1. Change rotation endpoint to set `expires_at` on old token instead of deleting
2. Schedule revocation after the grace period
3. Ensure expiration middleware accepts both tokens during grace period
4. Document the grace period behavior for client developers
5. Test concurrent requests during rotation window

### Detection Checklist
- [ ] Check rotation endpoint for immediate deletion
- [ ] Verify grace period logic exists
- [ ] Test concurrent requests during rotation

### Related Rules
- Implement Grace Period for Token Handover (05-rules.md)

### Related Skills
- Implement Token Expiration and Rotation (06-skills.md)

### Related Decision Trees
- Grace Period During Token Rotation (07-decision-trees.md)

---
