# Anti-Patterns — Verification Signatures

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit | Verification Signatures |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Re-Encoded Body Verification
2. Equality Operator Timing Leak
3. Monolithic Signature Validator
4. Single-Secret Stagnation
5. Verbose Verification Failure Leakage

---

## 1. Re-Encoded Body Verification

### Category
Security

### Description
Verifying a webhook signature against re-encoded JSON (`json_encode($request->all())`) instead of the raw request body (`$request->getContent()`), causing false verification failures due to whitespace and key-ordering differences.

### Why It Happens
Developers naturally access request data through Laravel's `$request->all()` or `$request->input()` methods, which parse the JSON body into an array. When computing the expected signature, they re-encode the array back to JSON, unaware that PHP's `json_encode` may reorder keys, change whitespace, or escape characters differently from the original body. The difference is invisible in debugging because the re-encoded JSON often looks identical.

### Warning Signs
- Signature verification intermittently fails for the same provider
- Failures correlate with payload fields containing special characters or nested objects
- Debug logs show `hash_hmac` computation using `json_encode($request->all())`
- Failures occur more frequently with providers that use strict key ordering

### Why Harmful
Legitimate webhook requests are rejected as invalid, causing event loss and provider retries. The failure is difficult to diagnose because the re-encoded JSON string often looks identical to the raw body when inspected visually. The verification logic appears correct during testing but fails unpredictably in production.

### Consequences
- Legitimate webhooks rejected due to signature mismatch
- Provider retry queues fill with unprocessable events
- Debugging time wasted comparing JSON strings that look identical
- Trust in signature verification eroded; developers may disable it

### Alternative
Always use `$request->getContent()` to read the raw request body for signature computation. This preserves the exact byte sequence the provider signed, guaranteeing a match.

### Refactoring Strategy
1. Replace `json_encode($request->all())` with `$request->getContent()` in all signature verification code
2. Move raw body reading to the earliest point in the request lifecycle (before any other body access)
3. Cache the raw body if multiple verifications are needed
4. Remove any JSON pretty-print or re-encoding before signature computation
5. Verify the fix by comparing `hash_hmac('sha256', $request->getContent(), $secret)` against the provider's test signatures

### Detection Checklist
- [ ] Signature verification uses `$request->getContent()` not `json_encode($request->all())`
- [ ] Raw body read before any other request body access
- [ ] No JSON re-encoding anywhere in signature verification pipeline
- [ ] Provider test signatures verify successfully

### Related Rules
Always Verify Against Raw Request Body

### Related Skills
Verify Incoming Webhook Signatures Using Provider Standards

### Related Decision Trees
Raw Body Access Strategy

---

## 2. Equality Operator Timing Leak

### Category
Security

### Description
Using `===` or `==` for signature comparison instead of `hash_equals()`, creating a timing side-channel that allows attackers to brute-force the signature byte-by-byte.

### Why It Happens
`===` is the natural comparison operator in PHP and works correctly for string comparison in all other contexts. Developers are often unaware of timing side-channel attacks or consider them theoretical. The performance difference is negligible, and `hash_equals()` is a less familiar function.

### Warning Signs
- Signature comparison uses `===` or `==` in verification code
- Code review comments flag the comparison as a security concern
- Response time from the webhook endpoint correlates with how many prefix bytes match

### Why Harmful
PHP's `===` compares strings byte-by-byte and short-circuits on the first differing byte. An attacker can measure the response time for different signature values and determine when a prefix byte matches, iteratively discovering the correct signature. With enough requests (thousands to millions depending on network conditions), the entire valid signature can be reconstructed, bypassing authentication.

### Consequences
- Attacker can forge valid webhook requests by brute-forcing the signature
- All webhook events become untrusted — any request with a guessed signature is accepted
- Complete compromise of webhook authenticity guarantees
- Regulatory and compliance implications for financial or health data webhooks

### Alternative
Always use `hash_equals($expected, $provided)` for signature comparisons. This function performs constant-time comparison regardless of how many bytes match, preventing timing side-channel attacks.

### Refactoring Strategy
1. Replace all `===` or `==` signature comparisons with `hash_equals()`
2. Verify arguments are strings before passing to `hash_equals()` (type safety)
3. Ensure `hash_equals()` wraps both `$expected` and `$provided` in the same type context
4. Review all other security-sensitive comparisons in the codebase for similar issues
5. Add static analysis rules to flag non-constant-time comparisons in security contexts

### Detection Checklist
- [ ] All signature comparisons use `hash_equals()`
- [ ] No `===` or `==` used for security-critical string comparison
- [ ] Arguments to `hash_equals()` are guaranteed to be strings
- [ ] Static analysis rules flag non-constant-time security comparisons

### Related Rules
Use hash_equals() Exclusively for Comparison

### Related Skills
Verify Incoming Webhook Signatures Using Provider Standards

### Related Decision Trees
Signature Verification Strategy (Standard vs Custom)

---

## 3. Monolithic Signature Validator

### Category
Code Organization

### Description
Implementing a single `SignatureValidator` class that attempts to handle all provider-specific signature formats with conditional logic, instead of creating separate validators per provider.

### Why It Happens
A single validator class scales well during initial development when only one or two providers exist. As more providers are added, the conditional logic grows organically. Refactoring into separate classes requires changing the architecture, which is deprioritized in favor of feature delivery.

### Warning Signs
- Single `SignatureValidator` class with provider-specific conditional branches
- Switch statements or if-else chains checking provider name or header prefix
- Adding a new provider requires modifying the existing validator
- Provider-specific edge cases are handled with configuration flags

### Why Harmful
Each provider has unique signature semantics (Stripe's timestamp-prefixed format, GitHub's `sha256=` header, Paddle's combined signature). A monolithic validator cannot correctly handle all variations without becoming increasingly complex and error-prone. A bug in one provider's verification logic can affect other providers through shared code paths.

### Consequences
- Provider-specific signature bugs affect other providers via shared code
- New provider integration velocity slows as validator complexity grows
- Testing requires exercising all provider paths even for a single-provider change
- Security audit scope expands to the entire validator for any provider change

### Alternative
Create one `SignatureValidator` class per provider that implements the `SignatureValidator` interface, encapsulating each provider's signing semantics independently.

### Refactoring Strategy
1. Define the `SignatureValidator` interface with `isValid(Request $request, WebhookConfig $config): bool`
2. Extract each provider's verification logic into a dedicated class
3. Register the appropriate validator per provider in `config/webhook-client.php`
4. Remove all provider-specific conditionals from the old monolithic class
5. Write isolated tests per validator class

### Detection Checklist
- [ ] Dedicated `SignatureValidator` class per provider
- [ ] No provider-specific conditionals in validator code
- [ ] New provider validator can be added without modifying existing validators
- [ ] Each validator tested independently

### Related Rules
Implement Provider-Specific Validator Classes

### Related Skills
Verify Incoming Webhook Signatures Using Provider Standards

### Related Decision Trees
Signature Verification Strategy (Standard vs Custom)

---

## 4. Single-Secret Stagnation

### Category
Maintainability

### Description
Using a single signing secret indefinitely without supporting multi-secret rotation, making key rotation impossible without causing verification failures.

### Why It Happens
Signature verification is implemented with a single secret from the provider's dashboard. Key rotation is perceived as a future concern or unnecessary complexity. The verification code reads one secret from config and verifies against it. When rotation becomes necessary, the team discovers that changing the secret breaks all active webhook deliveries.

### Warning Signs
- Webhook signature config uses a single secret string
- No signature version prefix parsing in verification code
- Key rotation policy exists but has never been tested
- Team avoids rotating keys due to fear of breaking integrations

### Why Harmful
Secrets that are never rotated have increasing exposure risk over time. When a secret is compromised (leaked in logs, exposed in a repository, or through a security incident), there is no safe rotation mechanism. Changing the secret immediately breaks webhook verification until all providers are updated, creating a window of event loss or an impossible choice between security and availability.

### Consequences
- Secrets remain unchanged for years, accumulating exposure risk
- Emergency rotation causes integration downtime
- Compromised secrets cannot be replaced without breaking delivery
- Compliance failures for regulations requiring periodic key rotation

### Alternative
Parse signature version prefixes from the provider's header and verify against the corresponding secret. Support at least two simultaneous secrets for zero-downtime rotation.

### Refactoring Strategy
1. Identify the signature header format and version prefix scheme
2. Modify verification to parse version prefixes (e.g., `v1=`, `v2=`)
3. Store multiple secrets in config: `secret_v1`, `secret_v2`
4. Verify against the secret matching the signature version
5. Implement rotation procedure: add new secret, wait for propagation, remove old secret
6. Test rotation in staging before production

### Detection Checklist
- [ ] Multiple secrets supported in configuration
- [ ] Signature version prefixes parsed and matched to corresponding secrets
- [ ] Rotation procedure documented and tested
- [ ] Secrets rotated at least annually or after any exposure

### Related Rules
Support Multiple Signature Versions for Key Rotation

### Related Skills
Verify Incoming Webhook Signatures Using Provider Standards

### Related Decision Trees
Multi-Secret Rotation Strategy

---

## 5. Verbose Verification Failure Leakage

### Category
Security

### Description
Returning detailed error messages from signature verification that reveal why verification failed (timestamp expired, signature mismatch, unknown version), giving attackers information to refine their approach.

### Why It Happens
Detailed error messages help during development and debugging. Developers add specific error responses for different failure modes (invalid signature, expired timestamp, unknown version) to make troubleshooting easier. These detailed messages are left in production code without considering the information they leak to attackers.

### Warning Signs
- Webhook endpoint returns different error messages for different verification failures
- Error messages mention signature format, timestamp, or version details
- Error response structure reveals which verification step failed
- Debug logging is enabled in production webhook endpoints

### Why Harmful
Each distinct error message tells the attacker which part of the verification failed. If the response distinguishes "timestamp expired" from "signature mismatch," the attacker knows they are close on the timestamp but wrong on the signature. This reduces the search space for brute-force attacks and helps attackers craft requests that pass partial verification.

### Consequences
- Attackers can determine which verification component failed
- Reduced search space for brute-forcing signatures or timestamps
- Information leakage that violates security best practices
- Increased risk of successful forgery attacks

### Alternative
Return a generic error response (403 or 500) for all verification failures, without specifying the failure reason. Log detailed failure information server-side for debugging.

### Refactoring Strategy
1. Replace all specific error responses with a single generic response
2. Move detailed error logging to server-side logs with appropriate log levels
3. Ensure the generic error is consistent regardless of failure type
4. Verify that the generic error response doesn't leak any verification details
5. Document that detailed webhook debugging requires server log access

### Detection Checklist
- [ ] All verification failures return the same generic error response
- [ ] No failure details in HTTP response body
- [ ] Detailed failure information logged server-side only
- [ ] Debug mode disabled in production webhook endpoints

### Related Rules
Return Generic Errors on Invalid Signatures

### Related Skills
Verify Incoming Webhook Signatures Using Provider Standards

### Related Decision Trees
Signature Verification Strategy (Standard vs Custom)
