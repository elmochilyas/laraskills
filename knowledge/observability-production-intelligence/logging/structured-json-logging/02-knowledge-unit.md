# Structured JSON Logging

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 01-logging
- **Knowledge Unit:** structured-json-logging
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Structured JSON logging transforms log entries into machine-parseable JSON objects with consistent field names, enabling automated ingestion by log aggregators (ELK, Loki, Datadog) and field-level search. It is the single highest-ROI observability investment — without it, every log analysis workflow requires custom parsing and regex extraction.

---

## Core Concepts

- **LineFormatter:** Monolog's default — produces human-readable text like `[2024-01-01 12:00:00] production.INFO: User logged in {"user_id":42}`
- **JsonFormatter:** Encodes each entry as a JSON object with independently queryable fields
- **LogstashFormatter:** Extends JSON with Logstash-compatible schema (`@timestamp`, `@version`, `type`) for ELK pipelines
- **Field Consistency:** Once a naming convention is established (snake_case vs camelCase), changing it breaks aggregator queries and dashboards
- **Context Data Depth:** `JsonFormatter` has `$maxNormalizeDepth` and `$maxNormalizeItemCount` to prevent serialization of overly complex objects

---

## Mental Models

- **Foundation Model:** Structured logging is the foundation layer — all higher observability (correlation, analysis, alerting) builds on it
- **Schema-on-Write Model:** With LineFormatter, schema is determined at read time (grok patterns, regex). With JSON, schema is determined at write time — every field is immediately queryable
- **Envelope Model:** Processors add content to the envelope, formatter seals it — once formatted to JSON, individual fields cannot be modified

---

## Internal Mechanics

The formatter is the last stage of the Monolog pipeline. Processors enrich the record, then the formatter serializes it to JSON. `JsonFormatter` encodes the record including message, context, level, datetime, and extra fields. The `$appendNewline` setting adds a newline after each JSON object for file-based ingestion. Without it, entries are concatenated without delimiters.

---

## Patterns

- **Environment-Specific Formatting:** Production uses `JsonFormatter`, staging mirrors production, local uses `LineFormatter`. Benefit: consistent production data, human-readable development. Tradeoff: different formats mean potential surprises when moving between environments.
- **Custom JSON Formatter with Standard Fields:** Extend `JsonFormatter` to add `@timestamp` (ISO 8601), `environment`, and `service` fields. Benefit: consistent fields across all entries. Tradeoff: custom formatter must be maintained.
- **Channel-Level Format Configuration:** Each channel independently specifies its formatter. Benefit: different destinations get appropriate formats. Tradeoff: more configuration surface area.

---

## Architectural Decisions

**Use JsonFormatter on all production channels.** There is no valid reason to use LineFormatter in production. JSON enables automatic parsing, field-level queries, and schema evolution.

**Set `$maxNormalizeDepth` and `$maxNormalizeItemCount`.** Default values may allow serialization of enormous context objects. Set reasonable limits (depth: 5, items: 100) to prevent oversized entries.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Every field is immediately queryable in aggregator | ~2x CPU cost vs LineFormatter | Benchmark at 1000+ entries/sec |
| JSON enables automatic parsing without grok patterns | JSON entries 2-5x larger than text | Account for storage budget |
| Consistent field naming enables cross-service dashboards | Naming convention must be documented and enforced | Inconsistent naming breaks aggregator queries |

---

## Performance Considerations

JSON encoding adds ~2x CPU cost compared to LineFormatter. Large context arrays increase encoding time and entry size. Gzip compression achieves 10-20x size reduction for file-based JSON logs. JSON entries are 2-5x larger than equivalent LineFormatter text — account in storage budget.

---

## Production Considerations

If user-controlled data appears in log fields without escaping, it can break JSON parsing — Laravel's `JsonFormatter` handles encoding correctly, but custom formatters must escape properly. JSON field names reveal application internals — review for information leakage. JSON logs sent to aggregators must use TLS. Define retention policies regardless of format.

---

## Common Mistakes

**No formatter declaration** — omitting `formatter` in channel config defaults to `LineFormatter`, sending unparseable text to production aggregators.

**Inconsistent datetime format** — mixing `Y-m-d\TH:i:s\Z` and `Y-m-d H:i:s` breaks aggregator timestamp parsing, causing entries to appear in wrong time windows.

**Mixing field naming conventions** — CamelCase in one controller, snake_case in another. Queries must check both conventions.

**No depth limits** — logging a full Eloquent model with relationships produces a JSON object with hundreds of levels.

**LineFormatter in production with aggregator** — the most common mistake: production channel uses default format, aggregator cannot parse entries.

---

## Failure Modes

**JSON parsing failure:** If a log entry contains invalid JSON (unescaped control characters, encoding issues), the entire batch may be rejected. Detection: missing log entries in aggregator. Mitigation: use `JsonFormatter` which handles encoding correctly; avoid custom serialization.

**Schema drift:** Over time, field names and types change inconsistently across the codebase. Detection: aggregator queries return incomplete results. Mitigation: enforce naming conventions via linting; use schema-on-read tools when needed.

**Oversized log entries:** A single entry exceeding aggregator limits (typically 1MB) is dropped. Detection: missing entries containing large context. Mitigation: set `maxNormalizeDepth` and `maxNormalizeItemCount`.

---

## Ecosystem Usage

Laravel's Monolog integration supports `JsonFormatter` via the `formatter` config key. ELK, Loki, Datadog, and Grafana all natively ingest JSON logs. The `formatter_with` config key passes constructor arguments to formatters for customization.

---

## Related Knowledge Units

### Prerequisites
- Monolog Architecture & Configuration (channel-level format decisions)

### Related Topics
- Log Context & Correlation (correlation ID injection into JSON)
- PII Redaction & Log Sampling (sanitizing JSON context fields)

### Advanced Follow-up Topics
- OpenTelemetry PHP SDK (OTLP log export as structured alternative)
- Grafana Dashboard Design (visualizing structured log data)

---

## Research Notes

Always set `formatter` explicitly on every production channel. Default Monolog formatter is `LineFormatter` — unsuitable for production. ISO 8601 datetime format for maximum aggregator compatibility. Set `$maxNormalizeDepth` to 5 to prevent model serialization explosion. Field naming convention must be documented and consistent project-wide. JSON formatted logs are 2-5x larger than text — account in storage budget. Gzip file-based JSON logs for 10-20x size reduction.
