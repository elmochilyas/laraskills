# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 07-observability
**Knowledge Unit:** telescope-debugging
**Generated:** 2026-06-03

---

# Decision Inventory

1. Telescope Configuration Strategy (Environment-Specific Capture)
2. Data Capture Scope and Redaction Strategy
3. Storage and Retention Policy

---

# Architecture-Level Decision Trees

---

## Telescope Configuration Strategy

---

## Decision Context

Choosing how to configure Telescope for HTTP client debugging across different environments.

---

## Decision Criteria

* environment
* traffic volume
* sensitivity
* debugging needs

---

## Decision Tree

Is this a local or staging environment?
↓
YES → Enable full data capture for all HTTP client calls
  ↓
  Is sensitive data (API keys, tokens) present in requests?
  ↓
  YES → Add redaction filter for specified headers before writing
  NO → Full capture without redaction — review dashboard periodically
NO → Production environment?
  ↓
  YES → Is the application high-traffic (>100 req/s)?
    ↓
    YES → Enable HTTP watcher with sampling (10-25%) via Telescope filter
    NO → Enable HTTP watcher with moderate sampling (25-50%) via filter
  ↓
  Use filter to exclude health check endpoints and known noise
  ↓
  Can Telescope be toggled on-demand for incident debugging?
  ↓
  YES → Keep TELESCOPE_ENABLED=false by default, enable via filter callback
  NO → Run with sampling enabled; disable only during performance incidents
NO → Use Telescope with default config and monitor entry volume

---

## Rationale

Full capture in dev/staging enables rapid debugging. Production sampling balances visibility with storage and performance. On-demand enablement provides full capture during incidents without permanent overhead.

---

## Recommended Default

**Default:** Local = full capture, Staging = full capture with redaction, Production = 10% sampling with health check filtering
**Reason:** Maximizes debugging utility while preventing storage overflow and sensitive data exposure

---

## Risks Of Wrong Choice

Full capture in production causes database bloat and slow dashboard queries. No production capture leaves teams blind to integration failures in live environments. No redaction exposes credentials in Telescope entries.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Telescope alternatives)
* 07-observability: integration-metrics (metrics vs debugging)

---

---

## Data Capture Scope and Redaction Strategy

---

## Decision Context

Determining which request/response data to capture and what to redact for security.

---

## Decision Criteria

* security
* debugging utility
* compliance
* storage efficiency

---

## Decision Tree

Does the integration send sensitive data (Authorization, API keys, PII)?
↓
YES → Implement Telescope filter to redact sensitive headers from entries
  ↓
  Do you need request body for debugging?
  ↓
  YES → Redact specific fields within body (e.g., `password`, `cc_number`)
  NO → Exclude body entirely; capture only headers, URL, status, timing
NO → Capture full request/response data (headers, body, status, timing)
  ↓
  Compliance requirement (PCI DSS, SOC 2, GDPR)?
  ↓
  YES → Never capture raw response bodies; log only metadata + error codes
  NO → Full capture acceptable with 24-48h retention limit
↓
Response body capture method?
↓
Body > 1MB → Truncate to first 1000 chars or exclude entirely
Body < 1MB → Store full response body for debugging
↓
Tag entries with service name for filtering?
↓
YES → Add custom tags: Telescope::tag(['stripe', 'payment:123'])
NO → Rely on automatic URL-based tagging only

---

## Rationale

Redaction prevents credential leakage while preserving debugging context. Truncating large bodies prevents storage bloat. Tagging enables per-service filtering in the Telescope dashboard.

---

## Recommended Default

**Default:** Capture headers + status + timing; redact Authorization header; store full body for <1MB responses
**Reason:** Balances debugging depth with security and storage efficiency

---

## Risks Of Wrong Choice

No redaction exposes credentials in database. Full body capture for large responses consumes storage rapidly. No tagging makes dashboard filtering impractical for multi-service apps.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Pulse for production metrics)
* 03-webhooks: incoming/webhook-receiving (payload capture)

---

---

## Storage and Retention Policy

---

## Decision Context

Configuring how long Telescope entries are retained and how pruning is managed.

---

## Decision Criteria

* storage capacity
* debugging window
* compliance
* performance

---

## Decision Tree

Is the application high-traffic (>1000 entries/hour)?
↓
YES → Enable automatic pruning with 24-hour retention
  ↓
  Does debugging require longer retention?
  ↓
  YES → Export entries to log storage (S3, CloudWatch) before pruning
  NO → Prune daily with 24h window sufficient for debugging
NO → Enable automatic pruning with 48-hour retention
  ↓
  Storage backend performance?
  ↓
  MySQL/MariaDB → Add indexes on `telescope_entries.type` and `created_at`
  PostgreSQL → Native JSON indexing for tag-based queries
  Redis → Use for temporary batch storage before DB write
↓
  Pruning schedule?
  ↓
  High-volume → Run pruning every hour via scheduler
  Low-volume → Run pruning daily via scheduler
↓
  Monitor pruning health?
  ↓
  YES → Track telescope_entries table size and prune duration
  NO → Risk unbounded growth if pruning fails silently

---

## Rationale

24-48h retention covers the typical debugging window. Automatic pruning prevents unbounded storage growth. Exporting to long-term storage preserves forensic data without impacting Telescope performance.

---

## Recommended Default

**Default:** 24h retention for production, 48h for staging, automatic daily pruning at midnight
**Reason:** Sufficient for incident debugging; prevents storage bloat; single daily prune minimizes load

---

## Risks Of Wrong Choice

No pruning causes infinite storage growth and slow dashboard queries. Too-short retention loses debugging context for intermittent issues. Pruning during peak hours adds load spikes.

---

## Related Rules/Skills

* ku-aie-005: Package Landscape (Pulse for production monitoring)
* 07-observability: integration-metrics (long-term metrics vs Telescope logs)
