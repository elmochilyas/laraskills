# ECC Anti-Patterns — Sanctum Token Auth

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | Sanctum Token Auth |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Logging or Storing the Plain-Text Token
2. Creating Tokens Without Abilities
3. No Per-User Token Limit Enforcement
4. Assuming Sanctum Enforces expires_at Natively
5. Not Scheduling sanctum:prune-expired Cleanup

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries

---

## Anti-Pattern 1: Logging or Storing the Plain-Text Token

### Category
Security

### Description
Logging the `plainTextToken` from `createToken()` or storing it alongside the hashed value, exposing the credential in log aggregation systems and database dumps.

### Why It Happens
Developers log responses for debugging, or store the plain-text token in a `tokens` column for "convenience" of re-displaying it later. The security implications are underestimated.

### Warning Signs
- `Log::info('Token created', ['token' => $token->plainTextToken])`
- `ApiToken::create(['token' => $plaintext])` alongside Sanctum's storage
- Token values visible in log aggregation tools (ELK, Splunk, Papertrail)
- Re-displaying tokens in admin panel or API responses

### Why It Is Harmful
The plain-text token is the credential. Logging it exposes it to every engineer and system with log access. Database dumps containing plain-text tokens compromise every issued credential.

### Real-World Consequences
A developer adds `Log::debug('Response', $response->json())` for debugging. The token creation response includes `plainTextToken`. The log stream ships to ELK where 50 engineers have read access. A disgruntled engineer extracts all tokens and accesses user accounts.

### Preferred Alternative
Display the plain-text token exactly once in the creation response. Never store, log, or re-display it.

### Refactoring Strategy
1. Remove all log statements containing `plainTextToken`
2. Add log scrubbing for response logging middleware
3. Remove any `token` column from API token tables (Sanctum already hashes)
4. Review existing logs for leaked tokens and rotate affected credentials

### Detection Checklist
- [ ] Search for `plainTextToken` in codebase
- [ ] Search for `->log(` or `Log::` near token creation
- [ ] Search for token storage in custom tables

### Related Rules
- Display Plain-Text Token Exactly Once at Creation (05-rules.md)
- Log Scrubbing for Authorization Headers (05-rules.md)

### Related Skills
- (Sanctum token auth implementation)

### Related Decision Trees
- (Token lifecycle decisions)

---

## Anti-Pattern 2: Creating Tokens Without Abilities

### Category
Design

### Description
Calling `createToken('name')` without passing an abilities array, resulting in tokens that authenticate the user but return `false` for every `tokenCan()` call.

### Why It Happens
The second parameter of `createToken()` is optional. Developers omit it and later wonder why all authorized endpoints return 403.

### Warning Signs
- `$user->createToken('mobile')` with no abilities argument
- All `tokenCan()` calls return false on authenticated requests
- 403 errors on every protected endpoint after successful authentication
- Empty `abilities` column in `personal_access_tokens` table

### Why It Is Harmful
Tokens authenticate successfully but cannot perform any action. Every authorized endpoint returns 403. Debugging is confusing because authentication succeeds (the user is resolved) but all operations are denied.

### Real-World Consequences
A mobile app user logs in successfully, receives a token, and stores it. Every API call returns 403. The developer spends hours debugging policies and middleware before noticing the missing abilities parameter.

### Preferred Alternative
Always pass at least one ability: `$user->createToken('mobile', [Abilities::POST_READ])`.

### Refactoring Strategy
1. Review all `createToken()` calls for the abilities parameter
2. Add appropriate abilities based on token purpose
3. Write tests verifying token abilities
4. Document ability requirements in API reference

### Detection Checklist
- [ ] Search for `createToken` without abilities parameter
- [ ] Verify all tokens have at least one ability assigned
- [ ] Test token creation response contains expected abilities

### Related Rules
- Always Assign at Least One Ability on Token Creation (05-rules.md)

### Related Skills
- Design Token Abilities (06-skills.md)

### Related Decision Trees
- (Ability granularity decisions)

---

## Anti-Pattern 3: No Per-User Token Limit Enforcement

### Category
Security

### Description
Not enforcing a maximum number of active tokens per user, allowing unbounded token creation that leads to token sprawl, credential stuffing, and impractical revocation scenarios.

### Why It Happens
The default Sanctum implementation has no token limit. Developers don't anticipate users creating hundreds of tokens or attackers exploiting unlimited creation.

### Warning Signs
- Users with 50+ active tokens
- No check of `$user->tokens()->count()` before creating new tokens
- Token revocation UI lists hundreds of tokens
- Database table growing rapidly with per-user token bloat

### Why It Is Harmful
Unlimited token creation enables credential stuffing — one leaked credential creates thousands of tokens. Revoking all tokens during a breach takes longer with more tokens. Database bloat slows queries.

### Real-World Consequences
A user's password is compromised. Before revocation, the attacker creates 10,000 tokens. The revocation command deletes all 10,000 rows. The `personal_access_tokens` table has 10,000 rows that survived only briefly but contributed to write amplification.

### Preferred Alternative
Enforce a per-user token limit (e.g., 10 tokens). Return an error when the limit is reached.

### Refactoring Strategy
1. Add token count check before `createToken()`: `if ($user->tokens()->count() >= 10) { abort(400, 'Token limit reached'); }`
2. Implement configurable limits per user type
3. Add token management UI for users to revoke old tokens
4. Schedule `sanctum:prune-expired` for cleanup

### Detection Checklist
- [ ] Check for token limit logic in token creation endpoint
- [ ] Verify `tokens()->count()` check exists
- [ ] Test creating tokens beyond the limit

### Related Rules
- Enforce Per-User Token Limits (05-rules.md)

### Related Skills
- (Token lifecycle management)

### Related Decision Trees
- (Token lifecycle decisions)

---

## Anti-Pattern 4: Assuming Sanctum Enforces expires_at Natively

### Category
Security

### Description
Setting `expires_at` on Sanctum tokens but not implementing custom middleware to check it, assuming Sanctum enforces expiration — it does not.

### Why It Happens
The database schema includes `expires_at`, the `createToken()` method accepts it, and developers reasonably assume Sanctum handles expiration. The Sanctum documentation warning is easily missed.

### Warning Signs
- Tokens with past `expires_at` values still authenticate successfully
- No custom middleware checking `currentAccessToken()->expires_at`
- Token expiration enabled but no middleware registered
- `expires_at` set at creation but never validated at request time

### Why It Is Harmful
Expiration dates are stored but never enforced. A token set to expire in 1 day remains valid for years. The security benefit of expiration is completely nullified.

### Real-World Consequences
A token created with `expires_at = now()->addDays(30)` is hardcoded in a mobile app. Three years later, the token still authenticates. An attacker who extracted the token three years ago still has access.

### Preferred Alternative
Implement custom middleware that checks `$token->expires_at` on every request and rejects expired tokens.

### Refactoring Strategy
1. Create `CheckTokenExpiration` middleware
2. Check `$request->user()->currentAccessToken()->expires_at->isPast()`
3. Register middleware after `auth:sanctum`
4. Add 30-second clock skew tolerance for multi-server deployments
5. Delete expired tokens on detection

### Detection Checklist
- [ ] Check for expiration checking middleware
- [ ] Test a token past its `expires_at` — should be rejected
- [ ] Verify middleware is registered in API group

### Related Rules
- Implement Custom Expiration Checking Middleware (05-rules.md)

### Related Skills
- Implement Token Expiration and Rotation (06-skills.md)

### Related Decision Trees
- Token TTL by Ability Sensitivity (07-decision-trees.md)

---

## Anti-Pattern 5: Not Scheduling sanctum:prune-expired Cleanup

### Category
Maintainability

### Description
Not scheduling the `sanctum:prune-expired` Artisan command, allowing expired and revoked tokens to accumulate indefinitely in the `personal_access_tokens` table.

### Why It Happens
The prune command exists but requires explicit scheduling. It's easy to overlook during deployment setup.

### Warning Signs
- `personal_access_tokens` table has millions of rows
- Expired tokens constitute >90% of the table
- Queries on `personal_access_tokens` are slow
- Backup sizes are larger than necessary
- No `sanctum:prune-expired` entry in console schedule

### Why It Is Harmful
Expired tokens accumulate without bound, degrading query performance on every authenticated request. Table scans take longer. Backups grow. Storage costs increase.

### Real-World Consequences
After 2 years of operation, `personal_access_tokens` has 5 million rows, 4.8 million of which are expired. Sanctum's token lookup query slows from 2ms to 200ms. Every API request is slower due to a forgotten scheduled command.

### Preferred Alternative
Schedule `sanctum:prune-expired --hours=24` to run daily via Laravel's console scheduler.

### Refactoring Strategy
1. Add `Schedule::command('sanctum:prune-expired --hours=24')->daily()` to console kernel
2. Run the command manually for the initial cleanup
3. Monitor table size post-cleanup
4. Set up alerting for table growth

### Detection Checklist
- [ ] Check console schedule for `sanctum:prune-expired`
- [ ] Check `personal_access_tokens` row count vs active token count
- [ ] Run the command and verify row reduction

### Related Rules
- Schedule sanctum:prune-expired for Regular Cleanup (05-rules.md)

### Related Skills
- (Database maintenance patterns)

### Related Decision Trees
- (Token lifecycle management)

---
