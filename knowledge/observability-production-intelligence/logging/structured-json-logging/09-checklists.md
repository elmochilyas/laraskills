# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 01-logging
**Knowledge Unit:** structured-json-logging
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] JsonFormatter configured on production log channels
- [ ] Consistent field names defined across all log entries
- [ ] LineFormatter replaced or supplemented for machine-readability
- [ ] Log aggregation destination confirmed (ELK, Loki, Datadog)
- [ ] Field consistency reviewed for traces and metrics correlation
- [ ] Logstash format evaluated for Elasticsearch compatibility

---

# Architecture Checklist

- [ ] Channel-level format decision documented: JSON for production, line for local
- [ ] JsonFormatter configured with `$appendNewline = true`
- [ ] Field naming convention established (snake_case vs camelCase)
- [ ] Exception trace formatting configured for JSON output
- [ ] LogstashFormatter considered for Logstash pipeline ingestion
- [ ] Context data flattened or nested decision made and documented

---

# Implementation Checklist

- [ ] `config/logging.php` updated to use `JsonFormatter::class` on production channels
- [ ] `JsonFormatter::__construct($batchMode, $appendNewline)` parameters set correctly
- [ ] Custom formatter created in `App\Logging\Formatters\AppJsonFormatter` if extra fields needed
- [ ] Channel-specific formatter overrides applied for external destinations
- [ ] Log entry `datetime` field formatted to ISO 8601
- [ ] `LineFormatter` retained for local development channels only

---

# Performance Checklist

- [ ] JSON encoding performance benchmarked vs plain text per log call
- [ ] Large payload serialization truncation configured
- [ ] JsonFormatter `$maxNormalizeDepth` and `$maxNormalizeItemCount` reviewed
- [ ] JSON encoding overhead measured in request-response lifecycle
- [ ] Log aggregation pipeline ingestion rate confirmed adequate
- [ ] Gzip compression evaluated for file-based JSON log transport

---

# Security Checklist

- [ ] JSON log fields audited for PII before production deployment
- [ ] Exception stack traces reviewed for leaked secrets in JSON output
- [ ] Log aggregation transport encrypted (TLS for HTTP, syslog over TLS)
- [ ] JSON log retention policy configured in aggregator
- [ ] Structured log access restricted to authorized team members
- [ ] Field `message` does not contain formatted sensitive data

---

# Reliability Checklist

- [ ] JsonFormatter handles malformed UTF-8 characters without breaking
- [ ] Log aggregation network failure does not block application
- [ ] Log rotation configured when writing JSON to files
- [ ] JSON schema validation considered for aggregator ingestion
- [ ] Log shipping buffer configured for batch retries on failure
- [ ] Structured log parsing test done with aggregator configuration

---

# Testing Checklist

- [ ] Unit test: custom formatter produces valid JSON with expected schema
- [ ] Unit test: all expected fields present in formatted output
- [ ] Integration test: log aggregator receives and parses JSON correctly
- [ ] Integration test: channel-specific format overrides work as configured
- [ ] Performance test: JSON log throughput measured against plain text baseline
- [ ] Failure test: malformed log data serialization handling verified

---

# Maintainability Checklist

- [ ] Field naming convention documented in project logging ADR
- [ ] Formatter logic separated from handler and processor concerns
- [ ] Custom formatter unit tests updated when schema changes
- [ ] Log aggregation dashboard queries documented for new fields
- [ ] Channel format configuration version-controlled with comments
- [ ] JSON schema published for downstream consumers

---

# Anti-Pattern Prevention Checklist

- [ ] No `LineFormatter` used on production channels
- [ ] No HTML/special characters unescaped in JSON output
- [ ] No dynamic field names generated from user input
- [ ] No deeply nested context objects without depth limit
- [ ] No non-JSON-serializable types logged without explicit conversion
- [ ] No sensitive data in plain text before JSON encoding

---

# Production Readiness Checklist

- [ ] JSON log format verified in staging aggregator before production
- [ ] Log volume and storage cost projected based on JSON per-entry size
- [ ] Log aggregation dashboard created for JSON field search
- [ ] JSON schema change deployed with backward compatibility window
- [ ] Log shipping resilience tested (network partition, aggregator restart)
- [ ] Structured log retention tested with automated cleanup

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: JsonFormatter configured per channel, field convention established, format vs context nesting decision made
- [ ] Security requirements satisfied: PII audit passed, transport encryption, log access restricted
- [ ] Performance requirements satisfied: encoding overhead measured, depth limits set, ingestion rate confirmed
- [ ] Testing requirements satisfied: JSON validity verified, aggregator integration tested, throughput benchmarked
- [ ] Anti-pattern checks passed: no LineFormatter in production, no user-driven field names, no unserializable types
- [ ] Production readiness verified: staging validation passed, cost projected, backward compatibility planned

---

# Related References

- Monolog Architecture & Channel Configuration (channel-level format decisions)
- Log Context & Correlation (correlation ID injection into JSON)
- PII Redaction & Log Sampling (sanitizing JSON context fields)
- OpenTelemetry PHP SDK (OTLP log export as structured alternative to JSON files)
- Laravel Pulse (aggregated metrics, complementary to structured logs)
