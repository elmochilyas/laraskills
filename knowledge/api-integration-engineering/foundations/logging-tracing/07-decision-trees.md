# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 01-foundations
**Knowledge Unit:** logging-tracing
**Generated:** 2026-06-03

---

# Decision Inventory

1. Observability Tool Selection
2. Production Logging Strategy
3. Sensitive Data Redaction Approach

---

# Architecture-Level Decision Trees

---

## Observability Tool Selection

---

## Decision Context

Choosing between Telescope, structured logging, or both for API integration observability.

---

## Decision Criteria

* performance
* architectural
* maintainability

---

## Decision Tree

Is the environment local or staging?
↓
LOCAL → Use Telescope with full data capture (best debugging DX)
STAGING → Use Telescope with full capture for QA verification
PRODUCTION → Use structured logging + sampled Telescope
  ↓
  Need real-time request inspection in production?
  ↓
  YES → Enable Telescope with sampling (10-25%) + filtering
  NO → Structured logging only; lower overhead
  ↓
  Need distributed tracing across services?
  ↓
  YES → Add correlation IDs to structured logs + Telescope tags
  NO → Basic structured logging (duration, status, service name)

---

## Rationale

Telescope excels at interactive debugging; structured logging is production-ready for aggregation. Both together provide development ease and production reliability.

---

## Recommended Default

**Default:** Telescope in dev/staging; structured logging in production
**Reason:** Best of both worlds — ease of debugging + production safety

---

## Risks Of Wrong Choice

Full Telescope in production causes storage overflow. No Telescope in dev slows debugging. No structured logging in production blinds ops teams during incidents.

---

## Related Rules

Enable Telescope in local/staging; structured logs in production

---

## Related Skills

Implement API Integration Observability

---

## Production Logging Strategy

---

## Decision Context

Configuring production log capture for API calls without overwhelming storage.

---

## Decision Criteria

* performance
* security
* maintainability

---

## Decision Tree

Is request volume >1000 requests/minute?
↓
YES → Implement sampling (10-25%) for full detail capture
  ↓
  Also need aggregate metrics?
  ↓
  YES → Log truncated entries always + full detail on sampling
  NO → Sampled full detail only
NO → Full capture is feasible with moderate storage
  ↓
  Need per-service log channels?
  ↓
  YES → Separate log channel per integration service
  NO → Single integration log channel with service name field
  ↓
  Implement automatic log pruning?
  ↓
  YES → 30-day retention for structured logs
  NO → Unbounded growth; implement cleanup immediately

---

## Rationale

Sampling balances debugging capability against storage costs. Separate channels enable focused monitoring per service. Pruning prevents unbounded storage growth.

---

## Recommended Default

**Default:** 25% sampling with 30-day retention, all-in-one channel
**Reason:** Good debugging coverage with manageable storage

---

## Risks Of Wrong Choice

No sampling at high volume causes disk/monitoring cost explosion. No pruning leads to eventual storage exhaustion.

---

## Related Rules

Implement sampling in production, Configure log pruning

---

## Related Skills

Implement API Integration Observability

---

## Sensitive Data Redaction Approach

---

## Decision Context

Preventing credentials, tokens, and PII from appearing in logs.

---

## Decision Criteria

* security
* compliance

---

## Decision Tree

Do API calls include Authorization headers?
↓
YES → Redact Authorization header value before logging
  ↓
  Do responses include PII (email, SSN, phone)?
  ↓
  YES → Redact PII patterns from response body logging
  NO → Header-only redaction is sufficient
NO → Do requests include API keys or tokens in body?
  ↓
  YES → Redact known key fields (api_key, secret, token, password)
  NO → Check for custom sensitive fields
  ↓
  Implement redaction middleware in logging pipeline?
  ↓
  YES → Redacted consistently across all integrations
  NO → Ad-hoc redaction risks missing some paths

---

## Rationale

Centralized redaction middleware ensures consistent application across all integrations. Pattern-based redaction catches common sensitive fields; custom rules handle API-specific secrets.

---

## Recommended Default

**Default:** Middleware that redacts Authorization headers + known sensitive fields
**Reason:** Broad coverage with minimal configuration; catches most leakage

---

## Risks Of Wrong Choice

Unredacted logs expose API keys and PII, violating compliance and creating security incidents. Over-redaction removes useful debugging data.

---

## Related Rules

Redact sensitive data before logging

---

## Related Skills

Implement API Integration Observability
