# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Webhook Distribution
**Knowledge Unit:** spatie-webhook-client
**Generated:** 2026-06-03

---

# Decision Inventory

* Spatie Webhook Client vs Custom Webhook Processing

---

# Architecture-Level Decision Trees

---

## Spatie Webhook Client vs Custom Webhook Processing

---

### Decision Context

Whether to use the Spatie webhook client package or build custom incoming webhook processing.

---

### Decision Criteria

* Webhook processing complexity
* Signature verification requirements
* Error handling requirements

---

### Decision Tree

Need signature verification for incoming webhooks?
YES → Use Spatie webhook client — built-in signature validation
NO → Need structured retry and error handling?
    YES → Use Spatie webhook client — provides retry infrastructure
NO → Simple webhook processing (plain HTTP endpoint)?
    YES → Custom implementation — just a route + controller
NO → Default?
    YES → Use Spatie webhook client for structured webhook handling

---

### Rationale

The Spatie webhook client provides signature verification, structured error handling, and retry logic for incoming webhooks. For simple webhooks, a custom route + controller may be sufficient.

---

### Recommended Default

**Default:** Use Spatie webhook client when processing webhooks that require signature verification and structured error handling
**Reason:** Signature verification is critical for webhook security. The package provides this out of the box with proper error handling.

---

### Risks Of Wrong Choice

- Custom without signature: accepting unsigned webhooks — security risk
- Spatie for trivial webhook: unnecessary dependency
- No signature verification: replay attacker can resend valid requests

---

### Related Rules

- implement-webhook-replay-attack-prevention

---

### Related Skills

- Configure Webhook Client
- Configure Webhook Replay Attack Prevention
