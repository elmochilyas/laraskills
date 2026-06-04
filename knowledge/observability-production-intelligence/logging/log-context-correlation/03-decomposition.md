# Decomposition: Log Context & Correlation

## Topic Overview
Correlating log entries with requests, users, and traces is essential for debugging production issues. Laravel 11+ introduced the `Context` facade for request-scoped metadata that is automatically appended to every log entry. Combined with Monolog processors for trace ID injection and PSR-3 context arrays, teams can build a correlation chain from user action → HTTP request → trace → log entry → database query.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
logging-structured-logging/log-context-correlation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Log Context & Correlation
- **Purpose:** Correlating log entries with requests, users, and traces is essential for debugging production issues. Laravel 11+ introduced the `Context` facade for request-scoped metadata that is automatically appended to every log entry. Combined with Monolog processors for trace ID injection and PSR-3 context arrays, teams can build a correlation chain from user action → HTTP request → trace → log entry → database query.
- **Difficulty:** Intermediate
- **Dependencies:
  - Monolog Architecture & Channel Configuration (processor pipeline)
  - Structured JSON Logging (context fields in JSON output)
  - OpenTelemetry PHP SDK (trace context propagation)
  - Sentry Laravel Integration (Sentry scope bridging)
  - W3C Trace Context Propagation (traceparent/span_id across service boundaries)

## Dependency Graph
**Depends on:**
  - Monolog Architecture & Channel Configuration (processor pipeline)
  - Structured JSON Logging (context fields in JSON output)
  - OpenTelemetry PHP SDK (trace context propagation)
  - Sentry Laravel Integration (Sentry scope bridging)
  - W3C Trace Context Propagation (traceparent/span_id across service boundaries)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Context facade
  - PSR-3 context array
  - Monolog processors
  - Trace ID injection
  - Correlation ID
  - Log grouping

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