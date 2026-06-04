# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 03-webhooks
**Knowledge Unit:** spatie-webhook-client
**Generated:** 2026-06-03

---

# Decision Inventory

1. Profile Class Strategy (Per-Provider vs Generic)
2. Signature Verification Strategy (Built-in vs Custom)
3. Queue Processing Strategy (Async vs Sync)
4. Webhook Model Cleanup Strategy

---

# Architecture-Level Decision Trees

---

## Profile Class Strategy

---

## Decision Context

Choosing between per-provider profile classes and a generic shared profile.

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

Does the application receive webhooks from multiple providers?
↓
YES → Use one profile class per external provider
  ↓
  Do providers differ in event naming conventions?
  ↓
  YES → Per-provider profiles with provider-specific event filtering
  NO → Per-provider profiles still recommended for future-proofing
NO → Is the single provider well-supported by Spatie defaults?
  ↓
  YES → Single profile class with basic shouldProcess filtering
  NO → Custom profile class with provider-specific acceptance logic
  ↓
  Need to filter events by type before processing?
  ↓
  YES → Implement shouldProcess() to accept only relevant event types
  NO → Accept all events; filter in processing job instead

---

## Rationale

Per-provider profiles isolate provider-specific event filtering and configuration. A single profile for all providers forces identical acceptance logic, making per-provider customization impossible.

---

## Recommended Default

**Default:** One profile class per provider in Webhooks/Profiles/ namespace
**Reason:** Clean separation; per-provider event filtering; extensible for new providers

---

## Risks Of Wrong Choice

Shared profile for all providers processes irrelevant events from some providers. No filtering causes unnecessary job dispatch and potential processing errors from unhandled event types.

---

## Related Rules

Define One Profile Class Per External Provider

---

## Related Skills

Receive Incoming Webhooks with Spatie Laravel Webhook Client

---

## Signature Verification Strategy

---

## Decision Context

Choosing between Spatie's built-in signature verification and a custom validator.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Does the provider use standard HMAC-SHA256 signature in a header?
↓
YES → Use Spatie's default SignatureValidator with hash_equals()
  ↓
  Does the provider use a custom header name for the signature?
  ↓
  YES → Configure header name in webhook config; built-in validator still works
  NO → Default header config is sufficient
NO → Does the provider use a non-standard signing algorithm?
  ↓
  YES → Implement custom SignatureValidator implementing SignatureValidator interface
  NO → Does the provider use payload hashing or basic auth instead?
    ↓
    YES → Custom validator with provider-specific verification logic
    NO → Implement custom authentication (API key, IP whitelist)
  ↓
  Need timing-safe comparison in custom validator?
  ↓
  YES → Always use hash_equals() for string comparison; never == or ===
  NO → Timing-safe comparison is mandatory for security; always use it

---

## Rationale

Built-in validator handles standard HMAC providers with zero custom code. Custom validators handle non-standard schemes while maintaining the Spatie processing pipeline.

---

## Recommended Default

**Default:** Built-in SignatureValidator with hash_equals() for HMAC-SHA256 providers
**Reason:** Zero custom code, battle-tested, timing-safe comparison built in

---

## Risks Of Wrong Choice

Using default validator for non-standard providers silently accepts invalid signatures. Custom validator without hash_equals() is vulnerable to timing attacks.

---

## Related Rules

Store Signing Secrets in Environment Configuration, Not Code

---

## Related Skills

Receive Incoming Webhooks with Spatie Laravel Webhook Client

---

## Queue Processing Strategy

---

## Decision Context

Choosing between queue-based and synchronous webhook processing.

---

## Decision Criteria

* performance
* reliability

---

## Decision Tree

Is the webhook processor doing non-trivial work (>100ms)?
↓
YES → Configure queue connection in webhook config for async processing
  ↓
  Does the provider have a tight response timeout?
  ↓
  YES → Queue-first processing is mandatory; respond 200 immediately
  NO → Queue-first still recommended; protects against future slowdowns
NO → Is the processing a simple idempotent update (<10ms)?
  ↓
  YES → Synchronous processing is acceptable; respond after processing
  NO → Queue processing is safer; protects against unexpected latencies
  ↓
  Multiple providers with different processing loads?
  ↓
  YES → Separate queue per provider or per processing tier
  NO → Single webhook queue is sufficient

---

## Rationale

Queue processing decouples webhook receipt from business logic, preventing provider timeouts. Even fast processing benefits from queue isolation to absorb load spikes.

---

## Recommended Default

**Default:** Queue connection configured in webhook-client.php for async processing
**Reason:** Decouples receipt from processing; prevents provider timeouts; enables retry

---

## Risks Of Wrong Choice

Synchronous processing ties HTTP response time to processing duration, risking provider timeouts and retries. No queue prevents retry on transient processing failures.

---

## Related Rules

Use Provider-Specific Signing Secrets

---

## Related Skills

Receive Incoming Webhooks with Spatie Laravel Webhook Client

---

## Webhook Model Cleanup Strategy

---

## Decision Context

Managing webhook_calls table growth from stored incoming webhook payloads.

---

## Decision Criteria

* maintainability
* performance

---

## Decision Tree

Does the application have audit or compliance retention requirements?
↓
YES → Retain webhook data for 90 days; archive before delete
  ↓
  Are payload volumes high (>10000 webhooks/day)?
  ↓
  YES → Archive to cold storage (S3, Glacier) before daily delete
  NO → Direct delete after retention period is sufficient
NO → Is debugging/tracing the primary storage purpose?
  ↓
  YES -> Set delete_after_days to 30; schedule daily cleanup
  NO → No retention needed; delete after successful processing
  ↓
  Need to query stored webhooks for reprocessing?
  ↓
  YES -> Keep 7 days minimum; index by provider and created_at
  NO -> Minimal retention; delete on completion

---

## Rationale

Retention period balances debugging utility against table bloat. Archiving before delete preserves audit trail without degrading query performance.

---

## Recommended Default

**Default:** 30-day retention with scheduled daily cleanup
**Reason:** Adequate debugging window; bounded table size prevents query degradation

---

## Risks Of Wrong Choice

No cleanup causes unbounded table growth, slow inserts, and degraded query performance. Too-short retention prevents debugging when issues surface days later.

---

## Related Rules

Define One Profile Class Per External Provider

---

## Related Skills

Receive Incoming Webhooks with Spatie Laravel Webhook Client
