# ECC Anti-Patterns — API Key Pattern

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | API Key Pattern |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Plain-Text Key Storage in Database
2. Insufficient Entropy in Key Generation
3. URL Parameter Key Transmission
4. Zero-Day Key Rotation Without Grace Period
5. Same Key Across All Environments

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries

---

## Anti-Pattern 1: Plain-Text Key Storage in Database

### Category
Security

### Description
Storing API keys as plain text in the `api_keys` table instead of hashing them with SHA-256. A single database breach compromises every active key simultaneously.

### Why It Happens
Developers treat API keys like passwords and assume database access is sufficiently restricted. Hashing is seen as unnecessary overhead during prototyping or when "nobody else has DB access."

### Warning Signs
- Database dump files contain readable API keys
- Admin panels list full keys instead of masked previews
- Backup restore exposes key values in plain text
- No hashing logic exists in the key creation code path

### Why It Is Harmful
A database compromise becomes a full credential exposure event. Every integrated service must rotate keys simultaneously, causing mass disruption. Compliance audits (SOC 2, PCI DSS) flag plain-text credential storage as a critical finding.

### Real-World Consequences
Attackers with SQL injection or backup access extract all active keys, gain unauthorized API access to every service, and operate undetected since keys appear legitimate.

### Preferred Alternative
Hash with SHA-256 before storage. Store only `prefix` and `key_hash` columns. Display the plain-text key exactly once at creation, then forget it.

### Refactoring Strategy
1. Add `key_hash` column to `api_keys` table
2. Write a migration/command to hash existing keys (invalidate all and force rotation)
3. Update `ApiKey::create()` to hash before insert
4. Update middleware to hash incoming key before lookup
5. Remove any `key` or `plaintext_key` columns after migration

### Detection Checklist
- [ ] Search codebase for `ApiKey::create(` to check if plain text is stored
- [ ] Inspect `api_keys` table migration for `key_hash` column
- [ ] Verify middleware does not send plain-text keys in DB queries

### Related Rules
- Hash With SHA-256, Never Store Plain Text (05-rules.md)

### Related Skills
- Implement API Key Pattern (06-skills.md)

### Related Decision Trees
- SHA-256 vs bcrypt for Key Hashing (07-decision-trees.md)

---

## Anti-Pattern 2: Insufficient Entropy in Key Generation

### Category
Security

### Description
Generating API keys with fewer than 256 bits of entropy using weak sources like `Str::random(16)`, `uniqid()`, or `rand()`, making keys feasible to brute-force.

### Why It Happens
Developers underestimate brute-force capabilities, copy old code that uses shorter keys, or prioritize "human-readable" short keys over security.

### Warning Signs
- Key length is fewer than 64 characters
- Key generation uses `uniqid()`, `time()`, or `rand()` instead of `random_bytes()`
- Keys are 16 characters or shorter
- No entropy/length requirement in code review checklist

### Why It Is Harmful
128-bit keys can be brute-forced at scale by attackers with DB read access to hashed keys. Offline cracking of low-entropy hashes becomes computationally feasible with GPU clusters.

### Real-World Consequences
An attacker with read-only database access extracts hashed keys, cracks them offline, and authenticates as legitimate services. The breach is invisible since authentication succeeds.

### Preferred Alternative
Generate with `Str::random(64)` or `bin2hex(random_bytes(32))` to guarantee minimum 256-bit entropy.

### Refactoring Strategy
1. Update key generation to use `Str::random(64)` throughout the codebase
2. Invalidate all existing keys with insufficient entropy
3. Add automated linting rule against `Str::random(n)` where `n < 64`
4. Document minimum key length in API onboarding documentation

### Detection Checklist
- [ ] Search for `Str::random(` calls — verify minimum length of 64
- [ ] Search for `random_bytes(` calls — verify minimum 32 bytes
- [ ] Search for `uniqid` usage in credential generation

### Related Rules
- Generate With 256-Bit Entropy Minimum (05-rules.md)

### Related Skills
- Implement API Key Pattern (06-skills.md)

### Related Decision Trees
- SHA-256 vs bcrypt for Key Hashing (07-decision-trees.md)

---

## Anti-Pattern 3: URL Parameter Key Transmission

### Category
Security

### Description
Accepting API keys via URL query parameters (`?api_key=sk_live_abc123`) instead of the `Authorization` header, exposing keys in server logs, proxy logs, browser history, and `Referer` headers.

### Why It Happens
URL parameters are simpler for developers to test in browsers and curl. Some legacy clients cannot set custom headers, so the API accommodates them via URL parameters.

### Warning Signs
- Documentation shows `?api_key=` in example requests
- Server access logs contain full API keys
- Proxy/CDN logs reveal keys in request URLs
- `$request->query('api_key')` appears in middleware

### Why It Is Harmful
URLs are logged at every infrastructure layer (web server, CDN, load balancer, analytics). API keys in URLs persist indefinitely in log storage and are transmitted in `Referer` headers to third-party domains.

### Real-World Consequences
Keys appear in server access logs shipped to log aggregation services, leaked via `Referer` headers when users click links to external sites, and cached by shared proxy servers.

### Preferred Alternative
Accept keys exclusively through `Authorization: Bearer` or `X-API-Key` headers. Reject requests with keys in URL parameters.

### Refactoring Strategy
1. Update middleware to extract from `$request->bearerToken()` or `$request->header('X-API-Key')` only
2. Add early rejection for requests containing `api_key` query parameter
3. Update API documentation to use header-only examples
4. Notify existing clients of the breaking change with migration timeline
5. Purge old log files containing keys after migration

### Detection Checklist
- [ ] Search for `$request->query('api_key')` or `request('api_key')`
- [ ] Check middleware for URL parameter extraction
- [ ] Review API documentation for URL-key examples

### Related Rules
- Transmit in Header Only, Never URL (05-rules.md)

### Related Skills
- Implement API Key Pattern (06-skills.md)

### Related Decision Trees
- Header vs URL Parameter for Key Transmission (07-decision-trees.md)

---

## Anti-Pattern 4: Zero-Day Key Rotation Without Grace Period

### Category
Reliability

### Description
Immediately deleting or revoking the old API key when a rotation is performed, forcing all clients to update instantly or face service disruption.

### Why It Happens
The security-first mindset assumes immediate revocation is always correct. Developers don't account for asynchronous client update cycles or cached credentials.

### Warning Signs
- Key rotation endpoint calls `$oldKey->delete()` before returning the new key
- No `expires_at` or grace period logic in rotation code
- Support tickets spike after every key rotation
- CI/CD pipelines fail after key rotation

### Why It Is Harmful
Clients cache credentials, run on deploy cycles, or have offline intervals. Instant revocation breaks all of them simultaneously, causing production outages proportional to the number of integrated services.

### Real-World Consequences
A routine key rotation triggers cascading failures across all consuming services. Incident response must manually restore old keys or coordinate mass client updates under pressure.

### Preferred Alternative
Implement overlapping key versions with a grace period (7-30 days). Set `expires_at` on the old key to `now + grace_period` instead of deleting it.

### Refactoring Strategy
1. Change rotation endpoint to set `expires_at` on old key rather than deleting
2. Implement `expires_at` check in authentication middleware
3. Set grace period to 7 days minimum (30 days for external integrations)
4. Document the grace period in rotation API response
5. Add monitoring to track clients still using old keys during grace period

### Detection Checklist
- [ ] Review rotation endpoint for hard deletes instead of soft expiry
- [ ] Verify `expires_at` column exists and is checked in middleware
- [ ] Check for grace period configuration constants or environment variables

### Related Rules
- Support Concurrent Key Versions During Rotation (05-rules.md)

### Related Skills
- Implement API Key Pattern (06-skills.md)

### Related Decision Trees
- (None directly, but derives from skills workflow Step 7-8)

---

## Anti-Pattern 5: Same Key Across All Environments

### Category
Security

### Description
Using identical API keys across development, staging, and production environments so that a key created for staging can authenticate against production infrastructure.

### Why It Happens
Developers use the same database seed or environment variable template across all environments. Environment scoping is not considered during initial implementation.

### Warning Signs
- Same API key in `.env`, `.env.staging`, and `.env.production`
- No `environment` column on the `api_keys` table
- Authentication middleware does not validate `APP_ENV`
- Staging database dump loaded into production — keys still work

### Why It Is Harmful
A compromised staging key grants immediate production access. Staging environments typically have weaker security controls, making them an easier attack vector. Cross-environment access violates compliance requirements.

### Real-World Consequences
A staging breach through compromised CI credentials escalates to a production breach because the same API keys authenticate both environments. The blast radius doubles.

### Preferred Alternative
Scope each API key to a specific environment. Validate `environment` against `config('app.env')` during every authentication. Use environment-specific prefixes (`sk_dev_`, `sk_staging_`, `sk_live_`).

### Refactoring Strategy
1. Add `environment` column to `api_keys` table
2. Backfill existing keys with their environment
3. Update middleware to filter by `config('app.env')`
4. Regenerate all cross-environment keys into scoped replacements
5. Add CI check that prevents key reuse across environment configs

### Detection Checklist
- [ ] Check for `environment` column in `api_keys` migration
- [ ] Verify middleware includes environment filter in query
- [ ] Review deployment scripts for key sharing across environments
- [ ] Inspect `.env` files for identical key values

### Related Rules
- Scope Keys by Environment (05-rules.md)

### Related Skills
- Implement API Key Pattern (06-skills.md)

### Related Decision Trees
- (Environment scoping is embedded in the dedicated table decision tree)

---
