# ECC Anti-Patterns — HMAC Signature for API Request Signing

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 01-foundations |
| **Knowledge Unit** | HMAC Signature for API Request Signing |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Signing Selected Fields Instead of Full Request Body
2. Loose Comparison (`==`/`===`) for Signature Verification
3. Missing Timestamp in Signature (No Replay Protection)
4. Key Rotation Without Grace Period for In-Flight Requests
5. Ad-Hoc Signing Logic Duplicated Across Endpoints

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Security

---

## Anti-Pattern 1: Signing Selected Fields Instead of Full Request Body

### Category
Security

### Description
Concatenating a subset of request fields for HMAC computation instead of signing the complete canonical body. Attackers can modify unsigned fields without detection.

### Why It Happens
Developers think "these are the important fields" and assume signing them is sufficient. They want to avoid encoding the entire body.

### Warning Signs
- `$signature = hash_hmac('sha256', "{$amount}.{$currency}", $secret)`
- Selected fields extracted from body for signing
- No canonical body representation used

### Why It Is Harmful
An attacker intercepting the request can modify unsigned fields (quantity, description, metadata) while the signature remains valid. The integrity guarantee is completely broken.

### Real-World Consequences
Payment amount is verified, but the quantity field is unsigned. Attacker changes quantity from 1 to 1000, the full amount is charged, HMAC passes verification.

### Preferred Alternative
Sign the complete canonical request body using a deterministic encoding (e.g., `json_encode($body, JSON_UNESCAPED_SLASHES)`).

### Refactoring Strategy
1. Identify all HMAC signing implementations
2. Replace field concatenation with full body signing
3. Use canonical encoding to ensure byte-for-byte match
4. Update verification side to use the same canonical form
5. Deploy both sides simultaneously

### Detection Checklist
- [ ] Signature computed from selected fields, not full body
- [ ] Body fields exist that are not included in signature
- [ ] No canonical body encoding used

### Related Rules
Sign Full Request Body, Not Selected Fields (05-rules.md)

### Related Skills
Sign and Verify API Requests with HMAC Signatures (06-skills.md)

### Related Decision Trees
HMAC Signing Implementation Strategy (07-decision-trees.md)

---

## Anti-Pattern 2: Loose Comparison (`==`/`===`) for Signature Verification

### Category
Security

### Description
Using `==` or `===` for HMAC signature comparison instead of `hash_equals()`. This leaks timing information enabling side-channel attacks.

### Why It Happens
Developers default to PHP's standard comparison operators without considering timing attacks. Most developers are unaware of `hash_equals()`.

### Warning Signs
- `if ($computed === $provided)` in verification code
- No use of `hash_equals()` anywhere in the codebase
- Signature verification completes measurably faster for first-byte mismatches

### Why It Harmful
An attacker can brute-force the HMAC signature character-by-character by measuring response times. Given enough samples, the entire signature can be recovered without knowing the secret key.

### Real-World Consequences
Attacker recovers 32-byte HMAC signature through 32 × 256 = 8192 timed requests. Compromises the entire authentication scheme. Regulatory/compliance failure (PCI DSS, SOC2).

### Preferred Alternative
Always use `hash_equals($computed, $provided)` for constant-time comparison.

### Refactoring Strategy
1. Find all signature comparison sites
2. Replace `===` with `hash_equals()`
3. Add static analysis rule to forbid direct comparison of signatures
4. Verify comparison time is constant regardless of input

### Detection Checklist
- [ ] `===` used for signature comparison
- [ ] No `hash_equals()` in verification code
- [ ] Signature verification not constant-time

### Related Rules
Always Use hash_equals() for Comparison (05-rules.md)

### Related Skills
Sign and Verify API Requests with HMAC Signatures (06-skills.md)

### Related Decision Trees
HMAC Signing Implementation Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: Missing Timestamp in Signature (No Replay Protection)

### Category
Security

### Description
Computing HMAC without including a timestamp. Captured signed requests can be replayed at any future time, causing duplicate operations.

### Why It Happens
Developers focus on authenticity (who sent it) and forget about freshness (when it was sent). The signing implementation starts simple and never adds replay protection.

### Warning Signs
- No timestamp field in the signed payload
- No `X-Timestamp` or similar header in request
- Same signature works hours after original request

### Why It Is Harmful
An attacker who intercepts a signed request (e.g., a payment capture) can replay it hours or days later, causing duplicate charges without needing the secret key.

### Real-World Consequences
Customer's credit card is charged 50 times because an attacker replayed a single captured payment request. Refund processing costs and customer trust damage.

### Preferred Alternative
Include a Unix timestamp in the signed payload. Validate the timestamp is within a tolerance window (default ±300s). Optionally add a nonce for additional protection.

### Refactoring Strategy
1. Add timestamp to signing payload computation
2. Send timestamp in request header separate from signature
3. Implement server-side tolerance window validation
4. Optionally implement nonce tracking for within-window replay
5. Ensure clock synchronization (NTP) between services

### Detection Checklist
- [ ] No timestamp in signed payload
- [ ] No timestamp tolerance validation on receiver side
- [ ] Replayed signed requests succeed after hours

### Related Rules
Include Timestamp in Signature for Replay Protection (05-rules.md)

### Related Skills
Sign and Verify API Requests with HMAC Signatures (06-skills.md)

### Related Decision Trees
Replay Prevention Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Key Rotation Without Grace Period for In-Flight Requests

### Category
Security | Reliability

### Description
Rotating the HMAC secret key without a transition period. All in-flight requests signed with the old key immediately fail verification.

### Why It Happens
Security policies mandate key rotation. The team implements a single-key model and switches the secret at a specific time without considering requests already in transit.

### Warning Signs
- 401/403 error spike immediately after key rotation
- No key ID prefix in signature header
- Single secret in config with no versioning support

### Why It Is Harmful
Requests that started before rotation but arrive after it fail verification. In a distributed system, this window can be seconds to minutes. The integration effectively breaks during the transition.

### Real-World Consequences
Key rotation at 14:00 causes a 5-minute outage as all queued webhook deliveries fail verification. The integration team stops rotating keys, increasing breach risk.

### Preferred Alternative
Use key ID prefix in the signature header. Keep old key for verification during a 24h grace overlap period.

### Refactoring Strategy
1. Add key versioning to the secret storage (v1, v2, etc.)
2. Include `kid` (key ID) in the signature header
3. On verification side, select key by `kid`, fall back to previous version
4. Sign new requests with the latest key
5. After overlap period (24h), remove old key

### Detection Checklist
- [ ] Single key without versioning
- [ ] No key ID in signature header
- [ ] Key rotation causes verification failures
- [ ] No grace period for key deactivation

### Related Rules
Support Key Rotation with Key ID Prefix (05-rules.md)

### Related Skills
Sign and Verify API Requests with HMAC Signatures (06-skills.md)

### Related Decision Trees
Key Rotation Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: Ad-Hoc Signing Logic Duplicated Across Endpoints

### Category
Code Organization | Security

### Description
Implementing HMAC signing/verification inline in multiple controllers or services instead of a centralized service. Creates inconsistent implementations with varying security coverage.

### Why It Happens
Each team member implements signing independently for their endpoint. No shared library or service exists. Code review misses inconsistencies.

### Warning Signs
- `hash_hmac()` calls in multiple files with different parameter orders
- Some endpoints include timestamp, others don't
- Different header formats across endpoints (`X-Signature`, `Authorization: HMAC`)

### Why It Is Harmful
Some endpoints have weaker security than others. An attacker targets the least-secure endpoint (e.g., missing timestamp verification, missing hash_equals). Inconsistent implementations are hard to audit.

### Real-World Consequences
Security audit finds that 3 of 8 webhook endpoints don't verify timestamps. Attackers replay those 3 endpoints while the other 5 are secure. The weakest link is exploited.

### Preferred Alternative
Create a centralized `HmacSigner` service class with consistent algorithm, header format, and security checks.

### Refactoring Strategy
1. Create a dedicated `HmacSigner` or `SignatureService` class
2. Implement both `sign()` and `verify()` with all security measures
3. Create middleware that applies verification to all incoming endpoints
4. Remove duplicated inline implementations
5. Add integration tests for the centralized service

### Detection Checklist
- [ ] `hash_hmac()` calls in multiple files
- [ ] Inconsistent signature implementations across endpoints
- [ ] Some endpoints missing timestamp or hash_equals
- [ ] No centralized signing service

### Related Rules
Centralize Signing in a Dedicated Service (05-rules.md)

### Related Skills
Sign and Verify API Requests with HMAC Signatures (06-skills.md)

### Related Decision Trees
HMAC Signing Implementation Strategy (07-decision-trees.md)
