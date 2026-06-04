# Metadata
Domain: API Integration Engineering
Subdomain: Webhook Systems (Incoming)
Knowledge Unit: Custom Signature Validator Implementation for Non-Standard Webhooks
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
The Spatie laravel-webhook-client's `DefaultSignatureValidator` implements standard HMAC-SHA256 with raw body verification. However, many webhook providers use non-standard signature schemes: different signing algorithms (Stripe's timestamped format), multi-field concatenation (GitHub's HMAC hex), custom header names, or enveloped payload structures (Adyen, Braintree). Custom `SignatureValidator` implementations adapt the package to each provider's unique signing mechanism while maintaining the same pipeline benefits.

## Core Concepts
- **SignatureValidator Interface**: Single method `isValid(Request $request, WebhookConfig $config): bool`
- **Raw Body Requirement**: Most signature computations require the raw, unmodified request body
- **Provider-Specific Formats**: Each provider may use different headers, signing mechanisms, and payload inclusion rules
- **Timing-Safe Comparison**: All validators must use `hash_equals()` or constant-time comparison
- **Multi-Header Signatures**: Some providers split signature data across multiple headers
- **WebhookConfig Access**: Validators receive the full config, enabling per-provider customization

## Mental Models
- **Adapter Pattern**: Each custom validator adapts the provider's unique signature format to the package's verification pipeline
- **Pluggable Security**: Validators are drop-in replacements; swap by changing the config class name
- **Verification Chain**: Some providers require multiple verification steps (signature + timestamp + nonce)

## Internal Mechanics
- The validator receives the full `Request` object (access raw body via `$request->getContent()`)
- `WebhookConfig` provides `signingSecret` for retrieving the configured secret
- The validator returns `bool`; `false` triggers `InvalidWebhookSignatureEvent` and 500 response
- Stripe's format: extract timestamp from `t=`, signature from `v1=`, recompute `$timestamp.$payload` with HMAC
- GitHub's format: verify `X-Hub-Signature-256` header value `sha256=$computed` using `hash_hmac('sha256', $rawBody, $secret)`
- Standard Webhooks: sign `$msgId.$timestamp.$payload` and compare against `webhook-signature` header

## Patterns
- **Provider-Specific Validator Class**: One validator class per provider implementing `SignatureValidator`
- **Config-Driven Switching**: Switch validators via the `signature_validator` config key per webhook config
- **Composite Validator**: Chain multiple verification steps (signature + timestamp + nonce) in a single validator
- **Multi-Secret Validator**: Try multiple secrets in sequence for key rotation periods
- **Logging Validator**: Wrap the real validator to log verification attempts for debugging

## Architectural Decisions
- Implement validators as standalone classes, not closures, for testability and configuration
- Extract signature extraction logic into separate methods for clarity and testing
- Use PHP's `hash_equals()` exclusively; never use `===` for signature comparison
- Return `false` on any verification failure; never throw exceptions from validators
- Unit test validators with known-good test vectors from provider documentation

## Tradeoffs
- Custom validators are more code but handle every provider correctly; using defaults fails with non-standard providers
- Provider-specific validators require maintenance when providers change their signature format
- Strict verification (rejecting slightly malformed signatures) is more secure but causes more false positives
- Relaxed verification (tolerating variances) reduces false positives but weakens security

## Performance Considerations
- Validator execution is typically sub-millisecond; the bottleneck is raw body I/O
- Multi-secret validation doubles verification time per additional secret
- Composite validators (signature + timestamp + nonce) add negligible overhead
- Logging inside validators adds I/O latency; use sampled logging in production

## Production Considerations
- Test validators against real provider webhook payloads (use webhook history to capture samples)
- Monitor invalid signature rates per validator to detect provider-side changes or misconfiguration
- Log verification failures with minimal detail (no payload) but enough context to debug
- Rotate provider secrets and update validators in coordination with the provider
- Implement a fallback validator that always returns false for operational emergencies

## Common Mistakes
- Verifying against re-encoded JSON instead of raw body (whitespace, key ordering differences)
- Not handling edge cases: empty body, missing signature header, multiple signatures in one header
- Using `===` instead of `hash_equals()` for comparison (timing side-channel)
- Hardcoding provider-specific signing logic into the `ProcessWebhookJob` instead of the validator
- Not testing with real provider payloads (example payloads often differ from production format)

## Failure Modes
- Provider changes signature format; all webhooks fail until validator is updated
- Body transformation (load balancer compression, whitespace stripping) causes verification failure
- PHP `hash_hmac()` behavior differs from provider's implementation (output encoding)
- Clock skew outside tolerance window causes timestamp-locked signature failures
- Multi-secret validator ordering: wrong order may match an old secret and use stale credentials

## Ecosystem Usage
- Stripe custom validator: parse `Stripe-Signature` header, verify `t=timestamp,v1=signature` format
- GitHub custom validator: extract `sha256=` prefix from `X-Hub-Signature-256` header
- Slack custom validator: version-prefixed signatures (`v0=`) with signing secret
- Standard Webhooks validator: `webhook-id`, `webhook-timestamp`, `webhook-signature` headers
- Adyen: HMAC-SHA256 with additional fields concatenated in specific order
- Braintree: custom base64-encoded payload verification

## Related Knowledge Units
- K003: HMAC-SHA256 Webhook Signature Generation and Verification (foundational algorithm)
- K011: Spatie laravel-webhook-client Configuration (hosts the custom validator)
- K022: Replay Attack Prevention (often combined with custom validators)
- K035: Standard Webhooks Specification (defines canonical verification approach)

## Research Notes
- Stripe's signature format differs significantly from HMAC-SHA256 raw body: timestamp prefix with key rotation support
- GitHub uses `sha256=` prefix on `X-Hub-Signature-256`; the colon-based header format differs from Standard Webhooks
- Standard Webhooks specification provides reference implementations in PHP for verification
- Custom validators are the recommended approach for handling non-standard providers per Spatie documentation
- The `DefaultSignatureValidator` source code at Spatie's GitHub shows the simple HMAC computation reference
