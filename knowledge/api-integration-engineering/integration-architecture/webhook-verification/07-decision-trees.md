# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 06-integration-architecture
**Knowledge Unit:** webhook-verification
**Generated:** 2026-06-03

---

# Decision Inventory

1. Verification Event Recording Strategy
2. Security Monitoring from Verification Events
3. Forensic Analysis Strategy

---

# Architecture-Level Decision Trees

---

## Verification Event Recording Strategy

---

## Decision Context

Choosing whether to record verification outcomes as domain events.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Is the webhook security-critical (payment, account change)?
↓
YES → Record all verification outcomes as immutable domain events
  ↓
  Record before or after storing the webhook payload?
  ↓
  BEFORE → Fail-fast on invalid signatures; reject before storage
  AFTER → Storage happens even for invalid signatures (audit)
NO → Is logging sufficient for verification tracking?
  ↓
  YES → Standard logging of verification outcomes; no event sourcing
  NO → Event recording needed for compliance or forensics
  ↓
  Store verification metadata (provider, signature version, timestamp)?
  ↓
  YES → Include verification metadata for forensic analysis
  NO → Binary pass/fail event only

---

## Rationale

Verification events as immutable records provide an audit trail of every security decision. Recording before storage enables fail-fast on invalid signatures. Metadata enables forensic analysis.

---

## Recommended Default

**Default:** Record verification events for all security-critical webhooks; standard logging for others
**Reason:** Audit trail where needed; simplicity where not

---

## Risks Of Wrong Choice

No verification events make attack detection and forensics impossible. Recording after storage may store invalid payloads. No metadata prevents root cause analysis of verification failures.

---

## Related Rules
Record Verification Event BEFORE Storing Webhook Payload

---

## Related Skills

Build Custom Signature Validators for Incoming Webhooks

---

## Security Monitoring from Verification Events

---

## Decision Context

Using verification events for security incident detection.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Are verification failure events being monitored for patterns?
↓
YES → Build projector for verification failure rate per provider
  ↓
  Alert on sudden increase in verification failures?
  ↓
  YES → Alert on >5x normal failure rate (possible attack in progress)
  NO → Monitor passively; no alerting
NO → Are verification failures triggered by known causes (key rotation)?
  ↓
  YES → Track known vs unknown failure causes separately
  NO → All failures treated equally; harder to identify attacks
  ↓
  Need SIEM integration for verification events?
  ↓
  YES → Forward verification events to SIEM for correlation
  NO → Verification events stay in application event store only

---

## Rationale

Verification failure patterns indicate either provider configuration issues (key rotation) or attack attempts (signature forgery). Differentiating known vs unknown causes enables accurate alerting.

---

## Recommended Default

**Default:** Projector for verification failure rate; alert on >5x normal rate
**Reason:** Detects attacks and misconfiguration; reduces false positives

---

## Risks Of Wrong Choice

No monitoring allows attack attempts to go undetected. Alerting on every failure generates noise during legitimate key rotation. No provider-specific tracking misses provider-specific attacks.

---

## Related Rules
Include Verification Metadata: Signature Version, Timestamp Tolerance, Provider

---

## Related Skills

Build Custom Signature Validators for Incoming Webhooks

---

## Forensic Analysis Strategy

---

## Decision Context

Using recorded verification events for post-incident forensics.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Need to investigate past verification failures?
↓
YES → Query verification events by time range, provider, outcome
  ↓
  Need to correlate with webhook payload events?
  ↓
  YES → Join verification events with webhook receipt events by correlation ID
  NO → Independent query without payload context
NO → Is real-time verification status sufficient?
  ↓
  YES → Current-state dashboard only; no historical queries
  NO → Event store enables temporal queries
  ↓
  Retention period for verification events?
  ↓
  YES → 90-day retention for security incident investigation
  NO → 30-day retention is minimum for forensic capability

---

## Rationale

Verification events stored in an event store enable temporal queries for forensic analysis. Correlation with webhook payload events provides full context for incident investigation.

---

## Recommended Default

**Default:** 90-day verification event retention with provider/projector query support
**Reason:** Industry standard forensic retention; enables temporal analysis

---

## Risks Of Wrong Choice

Too-short retention prevents investigation of incidents discovered late. No correlation capability forces manual matching of verification and payload events. No temporal query support requires log scraping for analysis.

---

## Related Rules
Never Store Secrets or Full Signature Values in Verification Events

---

## Related Skills

Build Custom Signature Validators for Incoming Webhooks
