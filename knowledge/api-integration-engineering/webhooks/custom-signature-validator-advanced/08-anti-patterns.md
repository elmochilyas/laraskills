# Anti-Patterns — Custom Signature Validator Implementation for Non-Standard Webhooks

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit | Custom Signature Validator Implementation for Non-Standard Webhooks |
| Version | 1.0 |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. Universal Signature Validator
2. Timing-Vulnerable Comparison
3. Re-Encoded Body Signing
4. Validator Exception Throwing
5. Untested Validator Logic

---

## 1. Universal Signature Validator

### Category
Code Organization

### Description
Building a single `SignatureValidator` class that attempts to handle all provider-specific signature formats through conditional logic rather than creating dedicated validators per provider.

### Why It Happens
A single validator starts naturally when the first provider uses standard HMAC. When a second provider with a different format is added, an if-else branch is added to the existing validator. This pattern continues, and the validator accumulates provider-specific logic. Refactoring into separate classes is postponed as the complexity grows incrementally.

### Warning Signs
- Validator contains switch statements or if-else chains checking provider name
- Adding a new provider requires modifying the existing validator
- Provider-specific parsing logic mixed with shared verification
- Tests for one provider affect test setup for others

### Why Harmful
Each provider has unique signature semantics (Stripe's timestamp-prefixed format, GitHub's `sha256=` prefix, Slack's versioned signatures). A single validator with conditional branches creates tight coupling — a bug in Stripe's parsing path may affect GitHub's verification through shared state or control flow. Test coverage becomes complex because all provider paths must be exercised.

### Consequences
- Bug in one provider's verification affects other providers
- Validator complexity grows linearly with provider count
- Adding providers requires modifying and retesting shared code
- Security audit scope expands across all providers for any change

### Alternative
Create one `SignatureValidator` class per provider, each implementing the `SignatureValidator` interface independently.

### Refactoring Strategy
1. Identify each provider's verification logic in the monolithic validator
2. Extract each branch into a dedicated validator class
3. Wire validators per provider in webhook configuration
4. Remove conditionals from the old monolithic class
5. Write isolated unit tests for each validator using provider test vectors

### Detection Checklist
- [ ] Dedicated validator class per non-standard provider
- [ ] No provider-specific conditionals in shared validator code
- [ ] Adding a new provider requires new validator class only
- [ ] Each validator tested independently with provider test vectors

### Related Rules
Implement One Validator Class Per Provider

### Related Skills
Build Custom Signature Validators for Incoming Webhooks

### Related Decision Trees
Validator Implementation Strategy (Per-Provider vs Generic)

---

## 2. Timing-Vulnerable Comparison

### Category
Security

### Description
Using `===` or `==` instead of `hash_equals()` for signature comparison in custom validators, creating a timing side-channel that leaks verification information.

### Why It Happens
The `===` operator is the natural PHP comparison. Developers are often unaware of timing side-channel attacks or consider them theoretical. The performance difference between `===` and `hash_equals()` is negligible, but `===` is more familiar and doesn't require remembering a special function.

### Warning Signs
- Validator compares signatures with `===` or `==`
- `hash_equals()` is not used anywhere in custom validators
- Code review doesn't flag timing-safe comparison
- Response time from webhook endpoint correlates with signature prefix match

### Why Harmful
PHP's `===` short-circuits on the first non-matching byte. An attacker can send requests with varying signature values and measure response times to determine when a prefix byte matches. This iterative process reconstructs the valid signature, allowing the attacker to forge authenticated webhook requests.

### Consequences
- Attacker can forge valid webhook signatures
- Complete compromise of webhook authenticity
- All events become potentially forged
- Regulatory and compliance implications

### Alternative
Always use `hash_equals($expected, $provided)` for signature comparisons in custom validators.

### Refactoring Strategy
1. Replace all `===` and `==` signature comparisons with `hash_equals()`
2. Ensure type safety by casting both arguments to strings before comparison
3. Review all newly created or modified validators for `hash_equals()` usage
4. Add static analysis rules to enforce `hash_equals()` in security contexts
5. Document that `hash_equals()` is mandatory in all validator code

### Detection Checklist
- [ ] All validators use `hash_equals()` for signature comparison
- [ ] No `===` or `==` in security-sensitive comparison code
- [ ] Static analysis enforces `hash_equals()` usage
- [ ] Response time does not correlate with signature byte matches

### Related Rules
Use hash_equals() Exclusively

### Related Skills
Build Custom Signature Validators for Incoming Webhooks

### Related Decision Trees
Signature Comparison Strategy (hash_equals vs ===)

---

## 3. Re-Encoded Body Signing

### Category
Security

### Description
Computing expected signatures against re-encoded JSON (`json_encode($request->all())`) instead of the raw request body, causing signature mismatches due to whitespace and key-ordering differences.

### Why It Happens
Laravel's request methods (`$request->all()`, `$request->input()`) parse JSON into arrays, which is the most natural way to access request data. Re-encoding the array back to JSON for signature computation seems functionally equivalent to the original body. The subtle differences in JSON encoding (whitespace, key order, escaping) are invisible during testing.

### Warning Signs
- Validator uses `json_encode($request->all())` or similar for signature computation
- Signature verification passes in tests but fails in production
- Failures correlate with payloads containing special characters or nested objects
- Debugging shows the re-encoded JSON differs from the raw body

### Why Harmful
The provider signed the raw byte sequence. Any transformation before signature computation produces a different byte sequence, causing the computed signature to differ from the expected one. Legitimate webhooks are rejected as invalid, causing event loss and provider retries.

### Consequences
- Legitimate webhooks rejected due to signature mismatch
- Provider retry queues fill with unprocessable events
- Debugging time wasted comparing visually identical strings
- Trust in signature verification eroded

### Alternative
Always use `$request->getContent()` to access the raw request body for signature computation in custom validators.

### Refactoring Strategy
1. Replace `json_encode($request->all())` with `$request->getContent()` in all validators
2. Move raw body reading to the earliest point in the validation pipeline
3. Remove any JSON transformation before signature computation
4. Test with known-good provider payloads to verify fix
5. Add static analysis to prevent JSON re-encoding in signature contexts

### Detection Checklist
- [ ] Validators use `$request->getContent()` for signature computation
- [ ] No JSON re-encoding before signature computation
- [ ] Raw body read before any other request body access
- [ ] Provider test signatures verify successfully

### Related Rules
Access Raw Body via $request->getContent()

### Related Skills
Build Custom Signature Validators for Incoming Webhooks

### Related Decision Trees
Validator Implementation Strategy (Per-Provider vs Generic)

---

## 4. Validator Exception Throwing

### Category
Reliability

### Description
Throwing exceptions from custom `SignatureValidator` implementations on verification failure instead of returning `false`, breaking the Spatie pipeline and causing unhandled errors.

### Why It Happens
Developers treat validation failures as exceptional conditions and throw exceptions naturally. The Spatie `SignatureValidator` interface specifies returning `bool`, but developers don't check the interface contract. Exceptions seem more informative because they can carry error details.

### Warning Signs
- Validator throws `InvalidSignatureException`, `CryptException`, or similar
- Webhook endpoint returns 500 instead of 403 on signature failure
- Error logs show unhandled exceptions from validators
- Spatie's `ProcessWebhookJob` fails with validator-sourced exceptions

### Why Harmful
The Spatie pipeline expects `true` or `false` from validators. An exception bypasses the pipeline's error handling, potentially leaving webhook processing in an inconsistent state. The 500 response may trigger provider retries, while a proper `false` return should result in a 403 or similar that stops retry. The exception handling in the pipeline is not designed for validator exceptions.

### Consequences
- Webhook endpoint returns 500 instead of appropriate failure code
- Providers may retry on 500, compounding the issue
- Pipeline error handling bypassed
- Debugging confusion — exception originating from unexpected code path

### Alternative
Return `false` on verification failure from validators. Log failure details server-side for debugging.

### Refactoring Strategy
1. Replace all `throw` statements in validators with `return false`
2. Move error logging to the validator using framework logging
3. Ensure the validator's `isValid()` method signature matches the interface exactly
4. Test that invalid signatures return 403/401, not 500
5. Add monitoring for validator `false` return rates

### Detection Checklist
- [ ] Validators return `false` on verification failure, never throw
- [ ] Invalid signatures return 403/401, not 500
- [ ] Interface contract matches `isValid(): bool`
- [ ] Error logging server-side, not in HTTP response

### Related Rules
Implement One Validator Class Per Provider

### Related Skills
Build Custom Signature Validators for Incoming Webhooks

### Related Decision Trees
Validator Implementation Strategy (Per-Provider vs Generic)

---

## 5. Untested Validator Logic

### Category
Testing

### Description
Deploying custom signature validators without testing against real provider payloads or official test vectors, leading to production failures from unhandled edge cases.

### Why It Happens
Provider documentation for signature verification is often incomplete or hard to find. Developers implement validators based on general understanding of HMAC rather than the provider's specific scheme. Unit tests use hand-crafted fixtures that match the developer's interpretation, not the provider's actual behavior. Edge cases (empty body, missing headers, multiple signatures) are not covered.

### Warning Signs
- Validator has no unit tests or tests use hand-crafted fixtures
- No provider test vectors in the test suite
- Validator passes tests but fails with real provider payloads
- Edge cases (empty body, absent header) not tested

### Why Harmful
Signature verification is the sole security gate for webhook authenticity. A validator that fails on real provider payloads silently rejects all webhook events. A validator that passes invalid signatures (false positive) accepts forged webhooks. Either failure mode is catastrophic and undetected until production impact.

### Consequences
- Production signature verification failures on legitimate webhooks
- Silent event loss until detected
- (Worse) forged webhooks accepted due to incorrect verification logic
- Emergency fixes required during production incidents

### Alternative
Test validators with provider-published test vectors, real captured payloads, and comprehensive edge case coverage.

### Refactoring Strategy
1. Collect provider test vectors from official documentation
2. Capture real provider payloads from staging for test fixtures
3. Write unit tests covering: valid signatures, invalid signatures, empty body, absent header, malformed signatures, expired timestamps
4. Test with provider's official SDK test fixtures where available
5. Add integration tests that simulate provider webhook delivery

### Detection Checklist
- [ ] Unit tests use provider official test vectors
- [ ] Edge cases covered: empty body, absent header, malformed signatures
- [ ] Tests cover both valid and invalid scenarios
- [ ] Validator tested against real provider payloads before production deployment

### Related Rules
Test with Provider's Official Test Vectors

### Related Skills
Build Custom Signature Validators for Incoming Webhooks

### Related Decision Trees
Composite Validation Strategy (Signature + Timestamp + Nonce)
