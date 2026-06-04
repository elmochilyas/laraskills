# ECC Anti-Patterns — Signed Request Pattern

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Authentication & Authorization |
| **Knowledge Unit** | Signed Request Pattern |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Non-Constant-Time Signature Comparison
2. Missing Components in the Canonical String
3. No Nonce Deduplication (Replay Attacks within Timestamp Window)
4. Signature Validation in Controller Instead of Middleware
5. Signed Requests for Browser-Based Clients

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries

---

## Anti-Pattern 1: Non-Constant-Time Signature Comparison

### Category
Security

### Description
Comparing computed HMAC signatures using `==` or `===` instead of `hash_equals()`, creating a timing side-channel that allows attackers to forge valid signatures byte-by-byte.

### Why It Happens
`==` is the natural comparison operator in PHP. Developers are unaware of timing attacks or have never heard of `hash_equals()`.

### Warning Signs
- `hash_hmac('sha256', $payload, $secret) === $signature` in code
- No use of `hash_equals()` in signature validation
- Custom comparison logic that loops through bytes

### Why It Is Harmful
Non-constant-time comparison allows attackers to determine the correct signature by measuring response time differences. Each correct byte causes the comparison to run slightly longer. After 256 requests (for a 32-byte SHA-256 signature), the attacker can forge a valid signature.

### Real-World Consequences
An attacker sends 256 requests with progressively correct signatures. Each response time reveals one byte of the correct signature. After ~256 requests, the attacker forges a valid signature and sends unauthorized webhook events or authenticated requests.

### Preferred Alternative
Always use `hash_equals($computed, $signature)` for constant-time comparison.

### Refactoring Strategy
1. Replace all signature comparisons with `hash_equals()`
2. Verify constant-time comparison in tests
3. Add code review rule: "All HMAC comparisons must use hash_equals()"

### Detection Checklist
- [ ] Search for `hash_hmac` and check comparison operator
- [ ] Search for signature comparison with `===`
- [ ] Verify `hash_equals()` is used for all HMAC comparisons

### Related Rules
- Always Use hash_equals() for Signature Comparison (05-rules.md)

### Related Skills
- (Signed request implementation patterns)

### Related Decision Trees
- (Cryptographic primitive decisions)

---

## Anti-Pattern 2: Missing Components in the Canonical String

### Category
Security

### Description
Omitting the HTTP method, URI, body hash, timestamp, or nonce from the canonical string used to compute the HMAC signature, weakening integrity guarantees.

### Why It Happens
A minimal implementation only signs the request body. Developers don't consider that an attacker could change the HTTP method (GET→DELETE) or replay the request.

### Warning Signs
- Canonical string includes only `$request->getContent()`
- HTTP method not included in signature computation
- URI path not included — request can be replayed on a different endpoint
- No timestamp in canonical string — no expiration
- No nonce — replay protection absent

### Why It Is Harmful
Missing method allows GET→DELETE tampering. Missing URI allows replaying the same signed body on a different endpoint. Missing timestamp removes expiration. Missing nonce removes per-request uniqueness.

### Real-World Consequences
An attacker intercepts a signed GET request to `/api/posts`. The signature only covers the body (empty). The attacker replays the signature on a DELETE request to `/api/posts/1`. The server validates the signature (body still matches) and executes the delete.

### Preferred Alternative
Include method, URI, body hash, timestamp, and nonce in the canonical string: `implode("\n", [$method, $uri, hash('sha256', $body), $timestamp, $nonce])`.

### Refactoring Strategy
1. Define the canonical string format with all 5 components
2. Update signature generation on the sender side
3. Update signature verification on the receiver side
4. Canonicalize body (sorted JSON keys, standard whitespace)
5. Test with various HTTP methods and bodies

### Detection Checklist
- [ ] Check canonical string composition in sender code
- [ ] Check canonical string parsing in receiver code
- [ ] Verify all 5 components are included

### Related Rules
- Include Method, URI, Body Hash, Timestamp, and Nonce in Signature (05-rules.md)

### Related Skills
- (Signed request implementation patterns)

### Related Decision Trees
- (Cryptographic design decisions)

---

## Anti-Pattern 3: No Nonce Deduplication (Replay Attacks within Timestamp Window)

### Category
Security

### Description
Validating the timestamp but not implementing nonce deduplication, allowing an attacker to replay a captured signed request within the timestamp window.

### Why It Happens
Timestamp validation seems sufficient — any request outside the 5-minute window is rejected. The remaining risk within the window is considered acceptable.

### Warning Signs
- No nonce parameter in signed requests
- No nonce storage or deduplication logic
- Timestamp-only validation with no stateful replay protection
- Same signed request can be replayed multiple times within the window

### Why It Is Harmful
An attacker who intercepts a signed request can replay it any number of times within the timestamp window (e.g., 5 minutes). For non-idempotent operations (payment, transfer), this causes duplicate processing.

### Real-World Consequences
An attacker intercepts a signed POST request to `/api/transfer-funds`. The timestamp is valid for 5 minutes. The attacker replays the same request 10 times within the window. The server processes 10 fund transfers before the first nonce check could have caught them.

### Preferred Alternative
Store nonces in Redis with SET NX and TTL equal to the timestamp window. Reject duplicate nonces.

### Refactoring Strategy
1. Generate a unique nonce for each signed request
2. Include nonce in the canonical string
3. On receiver, store nonce in Redis with `SET nonce:{value} true EX 300 NX`
4. Reject if SET NX returns false (nonce already used)
5. Handle Redis failures gracefully (fail closed or log)

### Detection Checklist
- [ ] Check for nonce generation in sender code
- [ ] Check for nonce deduplication in receiver code
- [ ] Verify Redis SET NX is used for deduplication

### Related Rules
- Implement Nonce Deduplication with Redis TTL (05-rules.md)

### Related Skills
- (Signed request implementation patterns)

### Related Decision Trees
- (Replay protection decisions)

---

## Anti-Pattern 4: Signature Validation in Controller Instead of Middleware

### Category
Architecture

### Description
Running HMAC signature validation inside the controller method instead of in middleware, allowing expensive processing and side effects to execute before validation fails.

### Why It Happens
The simplest approach is to validate the signature at the top of the controller method. Developers don't separate cross-cutting concerns from business logic.

### Warning Signs
- `$this->validateSignature($request)` as the first line in controller methods
- Signature validation logic duplicated across multiple controllers
- Wasteful database queries or API calls before signature rejection
- No dedicated middleware for signature validation

### Why It Is Harmful
Requests with invalid signatures trigger controller-side effects (database writes, external API calls, file operations) before the signature check fails. This wastes resources and can cause data corruption from partially validated requests.

### Real-World Consequences
A webhook handler validates the signature inside the controller. Before the signature check, an `Order::create()` call runs as part of middleware. The signature is invalid, but the order was already created. The
 controller returns 401, but the order persists.

### Preferred Alternative
Implement signature validation as middleware that runs before the controller.

### Refactoring Strategy
1. Extract signature validation into a dedicated middleware class
2. Register middleware on webhook/integration routes
3. Remove validation from controller methods
4. Test that invalid signatures are rejected before controller execution

### Detection Checklist
- [ ] Search for signature validation logic in controller methods
- [ ] Check for dedicated middleware class for HMAC validation
- [ ] Verify middleware is registered on the route, not the controller

### Related Rules
- Run Signature Validation Before Controller Logic (05-rules.md)

### Related Skills
- (Middleware architecture patterns)

### Related Decision Trees
- (Middleware placement decisions)

---

## Anti-Pattern 5: Signed Requests for Browser-Based Clients

### Category
Security

### Description
Implementing HMAC-signed request patterns for browser-based clients where the shared secret must be embedded in JavaScript, making it trivially extractable via XSS or devtools inspection.

### Why It Happens
Developers want the integrity guarantees of signed requests and apply the pattern everywhere including browser clients, not realizing secrets in JavaScript are not secret.

### Warning Signs
- HMAC secret embedded in client-side JavaScript bundle
- `computeSignature(secret, payload)` function in browser code
- Secret exposed in browser's devtools Sources panel
- Mobile app binary contains the shared secret

### Why It Is Harmful
The shared secret is the foundation of HMAC security. Browsers cannot store secrets securely — any value in JavaScript is accessible via XSS, browser extensions, or devtools. Once extracted, the attacker can forge valid signatures for any request.

### Real-World Consequences
An XSS vulnerability in the SPA allows an attacker to read `window.secretKey`. The attacker now has the HMAC shared secret and can sign arbitrary requests, including fund transfers. All requests appear legitimate to the server.

### Preferred Alternative
Use Sanctum token auth for browser clients. Signed requests are for server-to-server communication only.

### Refactoring Strategy
1. Identify all browser-based signed request implementations
2. Replace with Sanctum token auth for browser clients
3. Keep signed requests only for server-to-server, webhook verification
4. Rotate the compromised shared secret after migration

### Detection Checklist
- [ ] Search for HMAC secret in frontend code
- [ ] Verify signed requests are only used for server-to-server communication
- [ ] Check browser bundles for embedded secrets

### Related Rules
- Never Use Signed Requests for Browser-Based Clients (05-rules.md)

### Related Skills
- (Authentication pattern selection)

### Related Decision Trees
- (Auth mechanism selection decisions)

---
