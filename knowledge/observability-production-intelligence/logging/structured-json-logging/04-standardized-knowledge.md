# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 01-logging
**Knowledge Unit:** structured-json-logging
**Difficulty:** Intermediate
**Category:** Log Formatting
**Last Updated:** 2026-06-03

# Overview

Structured JSON logging is the baseline expectation for modern production observability. Laravel's Monolog outputs plain text by default via `LineFormatter`. Switching to `JsonFormatter` transforms log entries into machine-parseable JSON objects with consistent field names, enabling correlation with traces and metrics, automated ingestion by log aggregators (ELK, Loki, Datadog), and queryable field-level search.

Without structured logging, every log analysis workflow requires custom parsing — grok patterns for ELK, regex extraction for Datadog, or manual string splitting for grep. With structured JSON, every field is immediately queryable: `log_level:error AND user_id:42 AND request_time > 1000`.

Engineers should care because structured logging is the foundation that makes all higher-level observability (correlation, analysis, alerting) practical. It is the single highest-ROI observability investment for any Laravel application.

# Core Concepts

**LineFormatter:** Monolog's default formatter. Produces human-readable text: `[2024-01-01 12:00:00] production.INFO: User logged in {"user_id":42}`. Adequate for development, problematic for production ingestion.

**JsonFormatter:** Encodes each log entry as a JSON object: `{"message":"User logged in","context":{"user_id":42},"level_name":"INFO","datetime":"2024-01-01T12:00:00Z"}`. Each field is independently queryable.

**LogstashFormatter:** Extends JSON formatting with Logstash-compatible schema: `@timestamp`, `@version`, `message`, `tags`, `type`. Required when using Logstash as the log ingestion pipeline.

**Field Consistency:** Once a field naming convention is established (snake_case vs camelCase, flattened vs nested), changing it breaks aggregator queries and dashboards. Document and enforce the convention.

**Context Data Depth:** JSON context arrays can be deeply nested. `JsonFormatter` has `$maxNormalizeDepth` and `$maxNormalizeItemCount` settings to prevent serialization of overly complex objects.

# When To Use

- **Every production Laravel application** aggregating logs into a centralized platform
- **Multi-service architectures** where logs from different services must be queried uniformly
- **Compliance environments** requiring searchable, queryable audit logs
- **Teams building custom dashboards or alerts** based on log field values

# When NOT To Use

- **Local development only** — LineFormatter's readability is superior
- **Human-only log viewers** without aggregator — but even this is rare
- **Applications already using OTLP log export** — the protocol handles structuring natively

# Best Practices

**Use JsonFormatter on all production channels.** There is no valid reason to use LineFormatter in production. JSON enables automatic parsing, field-level queries, and schema evolution.

**Configure `$appendNewline = true`.** Without this, JSON entries are concatenated without delimiters, making file-based ingestion ambiguous.

**Set `$maxNormalizeDepth` and `$maxNormalizeItemCount`.** Default values may allow serialization of enormous context objects. Set reasonable limits (depth: 5, items: 100) to prevent oversized entries.

**Establish a field naming convention.** Choose snake_case (Laravel convention) or camelCase and document it. Inconsistent naming forces aggregator queries to use OR conditions.

**Include `@timestamp` in ISO 8601 format.** Log aggregators index on timestamps. ISO 8601 with timezone offset is the most portable format.

# Architecture Guidelines

Channel-level format decision:
- Production: `JsonFormatter` with ISO 8601 datetime
- Staging: `JsonFormatter` (match production pattern)
- Local: `LineFormatter` (human-readable)

Format configuration belongs at the channel level, not globally. Each channel may have different format requirements depending on destination.

The formatter is the last stage of the Monolog pipeline — enrichment (processors) and redaction must happen before formatting. Once formatted to JSON, modifying individual fields is impossible.

# Performance Considerations

- **JSON encoding overhead:** ~2x CPU cost compared to LineFormatter. For applications writing 1000+ log entries/second, benchmark the impact.
- **Context serialization:** Large context arrays (100+ fields, deeply nested) increase encoding time and entry size. Keep context compact.
- **Gzip for transport:** For file-based JSON logs, gzip compression achieves 10-20x size reduction. Configure log shippers to compress.
- **Ingestion rate:** JSON entries are 2-5x larger than equivalent LineFormatter text. Account for this in log storage budget.

# Security Considerations

- **JSON field injection:** If user-controlled data appears in log entry fields without escaping, it can break JSON parsing. Laravel's `JsonFormatter` handles encoding correctly, but custom formatters must escape properly.
- **Schema exposure:** JSON field names reveal application internals (column names, internal identifiers). Review field naming for information leakage.
- **Log retention:** JSON logs are more storage-efficient than text due to compression, but retention policies must be defined regardless of format.
- **Transport encryption:** JSON logs sent to aggregators must use TLS. Unencrypted JSON exposes all structured data in transit.

# Common Mistakes

**No formatter declaration.** Omitting `formatter` in channel config defaults to `LineFormatter`. Production aggregators receive unparseable text.

**Inconsistent datetime format.** Some entries use `Y-m-d\TH:i:s\Z`, others use `Y-m-d H:i:s`. Aggregator timestamp parsing breaks, causing entries to appear in wrong time windows.

**Mixing field naming conventions.** Context added via CamelCase in one controller and snake_case in another. Queries must check both conventions.

**No depth limits.** Logging a full Eloquent model with relationships into context produces a JSON object with hundreds of levels. `$maxNormalizeDepth` prevents this.

**LineFormatter in production with aggregator.** The most common mistake — production channel uses the default format, aggregator cannot parse entries, and observability is blind.

# Anti-Patterns

**Custom formatter doing processor work:** Adding, removing, or transforming fields inside a custom formatter. Formatters should serialize only — enrichment belongs in processors.

**Dynamic field names:** Constructing JSON field names from user input or runtime values. This makes aggregator queries impossible and can lead to fields named with special characters.

**Non-JSON-serializable types:** Logging resources (file handles, DB connections), closures, or objects without `__toString()` directly into context. Convert to string representation first.

**No newline delimiter:** Configuring JSON without `appendNewline` produces a single concatenated JSON blob that no aggregator can parse.

# Examples

**Production channel with JsonFormatter:**
```php
'json' => [
    'driver' => 'daily',
    'path' => storage_path('logs/laravel.json'),
    'level' => 'debug',
    'formatter' => Monolog\Formatter\JsonFormatter::class,
    'formatter_with' => [
        'appendNewline' => true,
        'maxNormalizeDepth' => 5,
        'maxNormalizeItemCount' => 100,
    ],
],
```

**Custom JSON formatter with consistent fields:**
```php
class AppJsonFormatter extends \Monolog\Formatter\JsonFormatter
{
    public function format(array $record): string
    {
        $record['@timestamp'] = $record['datetime']->format('c');
        $record['environment'] = app()->environment();
        return parent::format($record);
    }
}
```

# Related Topics

**Prerequisites:**
- Monolog Architecture & Channel Configuration (channel-level format decisions)

**Closely Related Topics:**
- Log Context & Correlation (correlation ID injection into JSON)
- PII Redaction & Log Sampling (sanitizing JSON context fields)

**Advanced Follow-Up Topics:**
- OpenTelemetry PHP SDK (OTLP log export as structured alternative to JSON files)
- Grafana Dashboard Design (visualizing structured log data)

**Cross-Domain Connections:**
- DevOps & Infrastructure — log shipper configuration for JSON ingestion

# AI Agent Notes

- Always set `formatter` explicitly on every production channel
- Default Monolog formatter is `LineFormatter` — unsuitable for production
- ISO 8601 datetime format for maximum aggregator compatibility
- Set `$maxNormalizeDepth` to 5 to prevent model serialization explosion
- Field naming convention must be documented and consistent project-wide
- JSON formatted logs are 2-5x larger than text — account in storage budget
- Gzip file-based JSON logs for 10-20x size reduction
