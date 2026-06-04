# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 01-logging
**Knowledge Unit:** pii-redaction-sampling
**Difficulty:** Advanced
**Category:** Log Security & Cost Management
**Last Updated:** 2026-06-03

# Overview

High-traffic Laravel applications generate enormous log volumes, creating two core production problems: sensitive data (PII, tokens, passwords, credit card numbers) may leak into logs, and storage/ingestion costs scale linearly with volume. PII redaction removes or masks sensitive fields before persistence. Log sampling reduces volume by keeping only a representative subset of non-error entries.

PII redaction is a compliance necessity under GDPR, CCPA, PCI-DSS, and HIPAA. Log sampling is an economic necessity — at scale, storing every debug-level log entry is prohibitively expensive. Both must be implemented in the Monolog processor pipeline, before the log entry is formatted and written.

Engineers should care because a single unredacted PII in logs can trigger regulatory fines, and unrestrained log volumes can consume terabytes of storage per month. Both are silent problems — logs look normal, but the damage accumulates invisibly.

# Core Concepts

**PII (Personally Identifiable Information):** Any data that can identify an individual — name, email, phone number, government ID, IP address, credit card number, device fingerprint, location data. Regulatory definitions vary by jurisdiction; the safest approach is to treat all user-supplied data as potentially PII.

**Log Redaction:** The process of detecting and masking sensitive data before the log entry is persisted. Redaction operates on the log record's `message`, `context`, and `extra` fields. Common approaches: field name matching (redact any field named `password`), regex pattern matching (detect credit card numbers), and structured field allowlisting (only keep known-safe fields).

**Log Sampling:** The practice of recording only a subset of log entries to control volume and cost. Sampling strategies include head-based (decide at log creation time), tail-based (buffer entries, decide later), and dynamic (adjust rate based on traffic patterns).

**Head-Based Sampling:** A deterministic decision made at log creation time — for example, "record every 10th request." Simple, low memory overhead, but may miss important events in the unsampled portion.

**Tail-Based Sampling:** Buffers log entries and makes sampling decisions after seeing the complete trace or request. More accurate (can keep all traces containing errors) but requires memory for buffering.

**GDPR/CCPA Compliance:** Regulations require that personal data not be retained longer than necessary, be processed lawfully, and be protected from unauthorized access. Log redaction is a technical control supporting these requirements.

# When To Use

- **All production applications** processing user data need PII redaction
- **High-traffic applications** (>1000 req/s or >10GB logs/day) need log sampling
- **Regulated environments** (finance, healthcare, EU user base) require PII redaction by law
- **Multi-tenant SaaS platforms** must redact cross-tenant data from logs

# When NOT To Use

- **Development/staging environments** with synthetic data — redaction and sampling obscure debugging
- **Applications with zero user-supplied data** — internal tooling processing only system metrics
- **Very low-traffic applications** (<1000 entries/day) — sampling saves negligible cost

# Best Practices

**Redact before sampling.** Apply PII redaction first, then sampling. If you sample first, unredacted PII may be stored in the sampled batch.

**Use field name allowlisting over blocklisting.** An allowlist approach ("only keep these fields") is safer than blocklisting ("remove these fields") because it doesn't require knowing all possible sensitive field names.

**Processors for redaction, not formatters.** Redaction is enrichment/transformation — it belongs in the Monolog processor pipeline, not in formatters. Formatters should only handle serialization.

**Never sample error-level entries.** Errors and criticals must always be recorded regardless of sampling rate. Sampling should only apply to debug, info, and notice levels.

**Set sampling rates via environment variables.** Sampling rates change with traffic patterns and budget. Store in `.env` with sensible defaults, not hardcoded in config.

# Architecture Guidelines

Redaction pipeline order:
1. Raw log record created by Laravel's logger
2. Enrichment processors (trace ID, correlation ID)
3. **Redaction processor** — masks PII fields
4. Sampling processor — drops non-error entries based on rate
5. Formatter — serializes to JSON/text
6. Handler — writes to destination

The redaction processor must have access to the complete record (`message`, `context`, `extra`) to catch PII in any field. Configure redaction patterns in a dedicated config file, not hardcoded in the processor class.

# Performance Considerations

- **Redaction regex cost:** Complex regex patterns (credit card Luhn checks) can take 50-200μs per entry. Benchmark against typical log volume.
- **Sampling decision cost:** Head-based sampling is O(1) — a single random number comparison. Tail-based sampling requires buffering and increases memory usage proportional to concurrent trace count.
- **Batch redaction:** For array context fields with many elements, process the array once rather than each element individually.
- **Sampling memory budget:** Tail-based sampling with a 60-second window for 1000 concurrent traces at 10 spans each requires ~50MB buffer. Size accordingly.

# Security Considerations

- **PII in error messages:** Exception messages may include user input (validation errors, SQL exceptions with bound parameters). Redaction must cover `$record['message']` as well as context.
- **Timing side channels:** Some redaction implementations vary in execution time based on whether PII is present. This theoretically leaks information. In practice, the risk is negligible for log redaction.
- **Log storage retention:** Redaction reduces compliance risk but does not eliminate retention requirements. Define automated deletion policies for log storage.
- **Redaction bypass:** Ensure redaction cannot be bypassed by changing log levels or channels. The redaction processor should apply to all production channels.

# Common Mistakes

**Redacting after storage.** Implementing redaction in the log viewer or aggregator query rather than before persistence. The sensitive data has already been stored — any compromise of storage exposes it.

**Sampling error logs.** Accidentally applying sampling rules to error-severity entries due to a misconfigured threshold. Always exclude error and critical levels from sampling.

**Incomplete PII coverage.** Blocklisting only obvious field names (`password`, `secret`) while missing credit card numbers in `message` fields or IP addresses in `extra` arrays.

**Overly aggressive redaction.** Redacting so broadly that logs become useless for debugging — every field is `[REDACTED]`. Balance coverage with utility: hash stable identifiers instead of removing them.

# Anti-Patterns

**Post-persistence redaction:** Attempting to redact PII from logs after they have been written to disk or sent to the aggregator. Once persisted, data must be considered potentially exposed.

**Global sampling rate ignoring traffic patterns:** Using a fixed 10% sampling rate regardless of time of day or traffic volume. During peak hours this may still be too many entries; during off-peak it omits useful data.

**No redaction in development:** Developers disable redaction locally for convenience, then push code that produces unredacted logs. Redaction should be enabled by default in all environments with an explicit override.

**Redaction as post-process:** Running redaction as a batch job on stored log files rather than in the Monolog pipeline. This creates a window where unredacted data exists on disk.

# Examples

**Monolog redaction processor:**
```php
class PiiRedactionProcessor
{
    protected array $patterns;

    public function __construct()
    {
        $this->patterns = config('logging.redaction.patterns');
    }

    public function __invoke(array $record): array
    {
        foreach ($this->patterns as $field => $replacement) {
            if (isset($record['context'][$field])) {
                $record['context'][$field] = $replacement;
            }
        }
        $record['message'] = preg_replace(
            config('logging.redaction.regex_patterns'),
            '[REDACTED]',
            $record['message']
        );
        return $record;
    }
}
```

**Head-based sampling processor:**
```php
class SamplingProcessor
{
    public function __construct(
        protected float $rate = 0.1,
        protected array $excludeLevels = ['error', 'critical', 'emergency']
    ) {}

    public function __invoke(array $record): array
    {
        if (in_array($record['level_name'], $this->excludeLevels)) {
            return $record;
        }
        if (mt_rand() / mt_getrandmax() > $this->rate) {
            $record['level'] = \Monolog\Level::Debug;
        }
        return $record;
    }
}
```

# Related Topics

**Prerequisites:**
- Monolog Architecture & Channel Configuration (processor pipeline)

**Closely Related Topics:**
- Span Sampling Strategies (distributed trace sampling)
- Structured JSON Logging (field-level redaction)

**Advanced Follow-Up Topics:**
- OpenTelemetry PHP SDK (OTel sampling configuration)
- Data Engineering & Analytics — log retention and archival

**Cross-Domain Connections:**
- Governance & Compliance Engineering — GDPR/CCPA technical controls

# AI Agent Notes

- PII redaction must happen in the Monolog processor pipeline, before the formatter
- Sampling must never apply to error/emergency level entries
- Use field name allowlisting over blocklisting for better coverage
- Sampling rate should be environment-configurable, not hardcoded
- Credit card numbers require Luhn-checking regex to avoid false positives
- Test redaction rules against production-like data before deployment
- Redaction rule updates should be deployable without application restart
