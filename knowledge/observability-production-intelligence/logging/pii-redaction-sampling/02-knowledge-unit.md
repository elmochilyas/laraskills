# PII Redaction & Log Sampling

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 01-logging
- **Knowledge Unit:** pii-redaction-sampling
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

High-traffic Laravel applications face two core logging problems: sensitive data (PII, tokens, passwords) may leak into logs, creating compliance liability under GDPR/CCPA/PCI-DSS, and storage costs scale linearly with volume. PII redaction masks sensitive fields before persistence; log sampling reduces volume by keeping only a representative subset of non-error entries. Both must execute in the Monolog processor pipeline before formatting.

---

## Core Concepts

- **PII (Personally Identifiable Information):** Any data identifying an individual — name, email, phone, IP, credit card, government ID, location data
- **Log Redaction:** Detecting and masking sensitive data in `message`, `context`, and `extra` fields before persistence via field name allowlisting, regex pattern matching, or structured field allowlisting
- **Head-Based Sampling:** Deterministic decision at log creation time (e.g., record every 10th entry) — O(1) cost, may miss important events in unsampled portion
- **Tail-Based Sampling:** Buffer entries and decide after seeing the complete trace — more accurate but requires memory for buffering
- **GDPR/CCPA Compliance:** Regulations requiring personal data not be retained longer than necessary, processed lawfully, and protected from unauthorized access

---

## Mental Models

- **Filter-First Model:** Redaction is the water filter (removes contaminants before they enter the pipes); sampling is the flow regulator (controls how much water passes through)
- **Safety Net Model:** Redaction is the primary safety net; sampling is the cost-control valve. Never sample before redacting — unredacted PII may be stored in the sampled batch
- **Allowlist vs Blocklist:** Allowlist ("only keep these fields") is a smaller target than blocklist ("remove these fields") — the blocklist approach requires knowing every possible sensitive field name

---

## Internal Mechanics

Redaction and sampling operate in the Monolog processor pipeline in a specific order: raw log record created → enrichment processors (trace ID, correlation ID) → redaction processor (masks PII fields) → sampling processor (drops non-error entries based on rate) → formatter (serializes) → handler (writes). The redaction processor must access the complete record to catch PII in any field. Sampling must never apply to error-level entries.

---

## Patterns

- **Field Name Allowlisting:** Define a list of known-safe fields and redact everything else. Benefit: safer than blocklisting, does not require knowing all sensitive field names. Tradeoff: may accidentally redact useful debugging fields if allowlist is too narrow.
- **Regex Pattern Redaction:** Use patterns to detect credit card numbers, email addresses, and phone numbers in free-text fields. Benefit: catches PII in unstructured message fields. Tradeoff: regex cost (50-200μs per entry); risk of false positives.
- **Environment-Configurable Sampling Rate:** Set sampling rate via environment variable with sensible defaults. Benefit: adjusts to traffic patterns without code changes. Tradeoff: requires operational awareness to tune correctly.

---

## Architectural Decisions

**Redact before sampling.** If you sample first, unredacted PII may persist in the sampled batch. Redaction must be the last processor before sampling.

**Processors for redaction, not formatters.** Redaction is enrichment/transformation — it belongs in the Monolog processor pipeline. Formatters should only handle serialization.

**Never sample error-level entries.** Errors and criticals must always be recorded regardless of sampling rate. Sampling should only apply to debug, info, and notice levels.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Redaction prevents regulatory fines | Complex regex patterns add 50-200μs per entry | Benchmark against typical log volume |
| Sampling reduces storage cost by 90% | May miss important events in unsampled portion | Always exclude error entries from sampling |
| Field allowlisting is safer than blocklisting | May accidentally hide useful debug data | Review allowlist regularly with team |

---

## Performance Considerations

Complex regex patterns (credit card Luhn checks) can take 50-200μs per entry. Head-based sampling is O(1) — a single random number comparison. Tail-based sampling requires buffering, increasing memory proportional to concurrent trace count. Batch redaction processes arrays once rather than each element individually. Tail-based sampling with a 60-second window for 1000 concurrent traces requires ~50MB buffer.

---

## Production Considerations

Exception messages may include user input — redaction must cover `message` plus context. Ensure redaction applies to all production channels, not select ones. Redaction reduces compliance risk but does not eliminate retention requirements — define automated deletion policies. Test redaction rules against production-like data before deployment. Redaction rule updates should be deployable without application restart.

---

## Common Mistakes

**Redacting after storage** — implementing redaction in the log viewer rather than before persistence. By the time data reaches the viewer, it has already been stored. Any storage compromise exposes it.

**Sampling error logs** — accidentally applying sampling to error-severity entries due to misconfigured threshold. Always exclude error and critical levels from sampling.

**Incomplete PII coverage** — blocklisting only obvious field names while missing credit card numbers in `message` fields or IP addresses in `extra` arrays.

**Overly aggressive redaction** — redacting so broadly that logs become useless. Balance coverage with utility: hash stable identifiers instead of removing them.

---

## Failure Modes

**Redaction bypass via channel switching:** Redaction processor configured on main channels but not on custom channels. Detection: PII appears in audit logs. Mitigation: apply redaction processor globally via `tap`.

**Sampling misconfiguration under load:** Sampling rate that works at normal traffic becomes too aggressive during spikes, dropping important entries. Detection: missing logs during incident. Mitigation: use dynamic sampling based on volume.

**Regex false negatives:** Credit card pattern misses new card formats or formatted numbers. Detection: PII in stored logs. Mitigation: combine regex with field name matching; test against production data.

---

## Ecosystem Usage

Monolog processors are the standard mechanism for implementing both redaction and sampling in Laravel. The `spatie/laravel-pii-redactor` package provides pre-built redaction processors. OpenTelemetry PHP SDK provides OTel sampling configuration for traces, complementary to log sampling.

---

## Related Knowledge Units

### Prerequisites
- Monolog Architecture & Configuration (processor pipeline)

### Related Topics
- Span Sampling Strategies (distributed trace sampling)
- Structured JSON Logging (field-level redaction)

### Advanced Follow-up Topics
- OpenTelemetry PHP SDK (OTel sampling configuration)
- Data Engineering & Analytics — log retention and archival

---

## Research Notes

PII redaction must happen in the Monolog processor pipeline before the formatter. Sampling must never apply to error/emergency level entries. Use field name allowlisting over blocklisting for better coverage. Sampling rate should be environment-configurable, not hardcoded. Credit card numbers require Luhn-checking regex to avoid false positives. Test redaction rules against production-like data before deployment.
