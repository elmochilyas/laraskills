# Metadata

**Domain:** API Integration Engineering
**Subdomain:** webhook-systems-incoming
**Knowledge Unit:** Spatie laravel-webhook-client Configuration and Customization
**Generated:** 2026-06-03

---

# Decision Inventory

1. Provider Configuration Strategy (Single vs Per-Provider Config)
2. Processing Job Organization (Generic vs Per-Provider Jobs)
3. Processing Model (Synchronous vs Queue-First)

---

# Architecture-Level Decision Trees

---

## Provider Configuration Strategy

---

## Decision Context

Choosing between a single WebhookConfig entry for all providers or separate entries per provider.

---

## Decision Criteria

* maintainability
* security

---

## Decision Tree

Does the application receive webhooks from multiple external providers?
↓
YES → Create one WebhookConfig entry per provider in config/webhook-client.php
  ↓
  Do providers use different signing algorithms?
  ↓
  YES → Separate configs are mandatory; each needs its own SignatureValidator
  NO → Separate configs still required for different signing secrets and header names
NO → Single provider with one signing scheme?
  ↓
  YES → Single WebhookConfig entry is sufficient
    ↓
    Do you anticipate adding more providers in the future?
    ↓
    YES → Still use per-provider config from the start; easy to extend
    NO → Single config is acceptable; refactor later if needed
  NO → Single provider but with multiple environments (test/prod)?
    ↓
    YES → Use separate configs per environment context
    NO → Single config with environment-switched secrets

---

## Rationale

Each provider has unique signing secrets, header names, and validation requirements. Per-provider configs isolate configuration errors and enable independent customization of profiles, validators, and jobs.

---

## Recommended Default

**Default:** One WebhookConfig entry per provider in `config/webhook-client.php`
**Reason:** Isolates per-provider configuration; enables independent customization; limits blast radius of config errors

---

## Risks Of Wrong Choice

Shared config forces all providers through the same pipeline. A signing secret leak or misconfiguration affects all providers simultaneously. Cannot customize validation or processing per provider.

---

## Related Rules

Define One WebhookConfig Entry Per Provider

---

## Related Skills

Use Spatie Webhook Client for Structured Incoming Webhooks

---

## Processing Job Organization

---

## Decision Context

Choosing between a single ProcessWebhookJob for all providers or dedicated jobs per provider.

---

## Decision Criteria

* maintainability
* testability

---

## Decision Tree

Do different providers send different event structures?
↓
YES → Create a dedicated ProcessWebhookJob class per provider
  ↓
  Do providers require different retry/backoff settings?
  ↓
  YES → Per-provider jobs enable custom retry config per job class
  NO → Per-provider jobs still beneficial for isolated business logic
NO → Single provider with one event type?
  ↓
  YES → Single ProcessWebhookJob is acceptable
  NO → Multiple event types from same provider?
    ↓
    YES → Single job with event type dispatch is fine; avoid switch on provider name
    NO → Simple single-event webhook; no job complexity
  ↓
  Will more providers be added over time?
  ↓
  YES → Start with per-provider job pattern; add new jobs as providers grow
  NO → Single job is fine for stable single-provider setup

---

## Rationale

Per-provider jobs isolate business logic, prevent cross-provider coupling, and are independently testable. A single job class with switch statements violates Open/Closed principle and becomes unmaintainable as providers grow.

---

## Recommended Default

**Default:** One ProcessWebhookJob class per provider
**Reason:** Isolated business logic; independent testing; no cross-provider coupling; easy to add new providers

---

## Risks Of Wrong Choice

Generic job with provider switch statements grows unbounded with each new provider. Tests become complex. A bug in one provider's handler can break all providers.

---

## Related Rules

Create a Unique ProcessWebhookJob Per Provider

---

## Related Skills

Use Spatie Webhook Client for Structured Incoming Webhooks

---

## Processing Model

---

## Decision Context

Choosing between synchronous processing in the controller and queue-based processing via ProcessWebhookJob.

---

## Decision Criteria

* reliability
* performance

---

## Decision Tree

Does the webhook processing involve database writes, API calls, or external services?
↓
YES → Use queue-first processing; return 200 immediately after validation
  ↓
  Does the provider have a tight response timeout?
  ↓
  YES → Queue processing is mandatory; synchronous risks provider timeout and retry
  NO → Queue still preferred; protects against processing latency spikes
NO → Is the processing trivially fast (<50ms) and side-effect free?
  ↓
  YES → Synchronous processing in controller is technically possible
    ↓
    Can idempotency be guaranteed if provider retries?
    ↓
    YES → Consider sync for simplicity; queue still recommended for safety
    NO → Queue processing enables idempotency check before each attempt
  NO → Processing has side effects or variable latency?
    ↓
    YES → Always queue; never process synchronously
    NO → Queue-first as default; exceptions only for read-only operations
  ↓
  Need to track processing status per webhook call?
  ↓
  YES → Queue model with WebhookCall status tracking enables full audit
  NO → Queue still provides delivery guarantees and retry

---

## Rationale

Queue-first architecture decouples webhook receipt from business logic processing. The controller returns 200 immediately, preventing provider timeouts and enabling the queue to manage retries and processing guarantees.

---

## Recommended Default

**Default:** Process all webhooks via queue-first pattern; return 200 after signature validation
**Reason:** Prevents provider timeouts; enables async processing; provides retry guarantees

---

## Risks Of Wrong Choice

Synchronous processing blocks the HTTP response, risking provider timeout and unnecessary retries. Long-running sync processing can exhaust PHP-FPM or worker processes.

---

## Related Rules

Create a Unique ProcessWebhookJob Per Provider

---

## Related Skills

Use Spatie Webhook Client for Structured Incoming Webhooks
