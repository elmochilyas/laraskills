# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 01-logging
**Knowledge Unit:** pii-redaction-sampling
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] PII redaction processor implemented and registered in Monolog pipeline
- [ ] Log sampling strategy selected (head-based vs tail-based vs dynamic)
- [ ] GDPR and CCPA compliance requirements reviewed for log retention
- [ ] Sensitive fields identified: passwords, tokens, PII, credit cards, emails
- [ ] Sampling rate configured per channel severity level
- [ ] Redaction rules tested with production-like log data

---

# Architecture Checklist

- [ ] Redaction processor placed before formatter in Monolog pipeline
- [ ] Sampling applied after redaction to avoid sampling unredacted data
- [ ] Channel-specific redaction rules (stricter for external channels)
- [ ] Dynamic sampling based on traffic pattern and error rate decided
- [ ] Tail-based sampling evaluated for distributed tracing cost control
- [ ] PII detection pattern strategy (regex vs field name allowlist vs blocklist)

---

# Implementation Checklist

- [ ] Custom Monolog processor for redaction created in `App\Logging\Processors`
- [ ] Redaction pattern configuration stored in `config/logging.php` or dedicated config
- [ ] Masking strategy decided per field type (hash, truncate, replace with `[REDACTED]`)
- [ ] Sampling rate configured in `config/logging.php` with env override
- [ ] Head-based sampler implemented for OTel trace sampling
- [ ] Log sampling excluded for error and critical severity levels

---

# Performance Checklist

- [ ] Redaction regex execution time benchmarked against typical log volume
- [ ] Processor overhead measured per-log-entry in microseconds
- [ ] Sampling rate tuned to stay within storage and ingestion budget
- [ ] Tail-based sampling memory buffer sized for peak concurrent traces
- [ ] Dynamic sampling decision latency assessed for high-throughput endpoints
- [ ] Batch redaction considered for array-type context fields

---

# Security Checklist

- [ ] PII patterns reviewed and updated quarterly for new data types
- [ ] Credit card numbers masked via Luhn-checking pattern
- [ ] Password fields caught by contextual key-name matching (password, secret, token)
- [ ] Redaction verified to not expose masked values through error messages
- [ ] Log storage retention policy defined with automated deletion
- [ ] Access control on log files and aggregation service strictly enforced

---

# Reliability Checklist

- [ ] Redaction processor failure does not block log entry writing
- [ ] Sampling logic does not drop error logs regardless of sampling rate
- [ ] Tail sampling buffer overflow strategy defined (drop oldest vs reject new)
- [ ] Redaction rule updates deployable without application downtime
- [ ] Sampling rate change propagates without restarting workers
- [ ] Log ingestion quota exceeded handling defined

---

# Testing Checklist

- [ ] Unit test: redaction processor masks known PII patterns correctly
- [ ] Unit test: redaction processor skips non-sensitive fields
- [ ] Unit test: sampler respects configured rate and severity exclusions
- [ ] Integration test: end-to-end log pipeline redacts before JSON output
- [ ] Performance test: redaction overhead within 1ms per log entry
- [ ] Security test: PII patterns verified against production sample data

---

# Maintainability Checklist

- [ ] Redaction rules documented in project security ADR
- [ ] Sampling strategy decision recorded with rationale and cost estimates
- [ ] PII patterns stored in config rather than hardcoded in processor
- [ ] Sampling rate environment variables documented in `.env.example`
- [ ] Redaction processor unit tests updated when new patterns added
- [ ] Log volume budget tracked and reviewed monthly

---

# Anti-Pattern Prevention Checklist

- [ ] Redaction not applied after log writing (must be before persistence)
- [ ] Sampling not applied to error-level logs
- [ ] Sampling not configured as fixed rate without considering traffic patterns
- [ ] PII not logged even in masked form when not necessary
- [ ] Tail-based sampling not used without sufficient buffer memory
- [ ] Dynamic sampling not used without monitoring its effect on coverage

---

# Production Readiness Checklist

- [ ] Redaction tested against live traffic in staging with real-looking PII
- [ ] Log storage ingestion budget calculated and allocated
- [ ] Sampling rate validated to produce representative trace data
- [ ] Log retention automated with S3 lifecycle or equivalent policy
- [ ] PII breach notification procedure documented
- [ ] Redaction bypass mechanism restricted to debug builds only

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: redaction processor in pipeline, sampling strategy chosen, channel-specific rules
- [ ] Security requirements satisfied: PII patterns identified, masking implemented, retention enforced, access controlled
- [ ] Performance requirements satisfied: redaction overhead measured, sampling budget tuned, buffer sized
- [ ] Testing requirements satisfied: PII patterns verified, sampler tested, pipeline integration passed
- [ ] Anti-pattern checks passed: no post-persistence redaction, errors never sampled, PII minimized
- [ ] Production readiness verified: staging validation done, cost budget set, breach procedure documented

---

# Related References

- Monolog Architecture & Channel Configuration (processor pipeline for redaction)
- Structured JSON Logging (field-level redaction in JSON output)
- Log Context & Correlation (PII risks in automatic context injection)
- OpenTelemetry PHP SDK (OTel sampling configuration)
- Span Sampling Strategies (distributed trace sampling, closely related)
