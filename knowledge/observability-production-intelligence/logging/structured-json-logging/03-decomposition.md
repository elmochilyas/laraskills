# Decomposition: Structured JSON Logging

## Topic Overview
Structured JSON logging is the baseline expectation for modern production observability pipelines. Laravel's Monolog outputs plain text by default via `LineFormatter`. Switching to `JsonFormatter` transforms log entries into machine-parseable JSON objects with consistent field names, enabling correlation with traces and metrics, automated ingestion by log aggregators (ELK, Loki, Datadog), and queryable field-level search.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
logging-structured-logging/structured-json-logging/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Structured JSON Logging
- **Purpose:** Structured JSON logging is the baseline expectation for modern production observability pipelines. Laravel's Monolog outputs plain text by default via `LineFormatter`. Switching to `JsonFormatter` transforms log entries into machine-parseable JSON objects with consistent field names, enabling correlation with traces and metrics, automated ingestion by log aggregators (ELK, Loki, Datadog), and queryable field-level search.
- **Difficulty:** Intermediate
- **Dependencies:
  - Monolog Architecture & Channel Configuration (channel-level format decisions)
  - Log Context & Correlation (correlation ID injection into JSON)
  - PII Redaction & Log Sampling (sanitizing JSON context fields)
  - OpenTelemetry PHP SDK (OTLP log export as structured alternative to JSON files)
  - Laravel Pulse (aggregated metrics, complementary to structured logs)

## Dependency Graph
**Depends on:**
  - Monolog Architecture & Channel Configuration (channel-level format decisions)
  - Log Context & Correlation (correlation ID injection into JSON)
  - PII Redaction & Log Sampling (sanitizing JSON context fields)
  - OpenTelemetry PHP SDK (OTLP log export as structured alternative to JSON files)
  - Laravel Pulse (aggregated metrics, complementary to structured logs)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Structured logging
  - JsonFormatter
  - Field consistency
  - Log aggregation
  - Logstash format
  - LineFormatter limitations

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization