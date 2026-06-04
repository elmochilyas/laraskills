# Monolog Architecture & Configuration

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 01-logging
- **Knowledge Unit:** monolog-architecture-configuration
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel's logging system is a configuration layer over Monolog, mapping channels to handlers (where logs go), formatters (how they look), and processors (enrichment). The `config/logging.php` file is the control plane for production logging — mistakes here silently degrade all downstream observability, lose data, or leak sensitive information.

---

## Core Concepts

- **PSR-3 LoggerInterface:** Laravel's `Log` facade implements the standard, providing `emergency()` through `debug()` methods
- **Channel:** A named logging destination defined in `config/logging.php` with driver, handler, formatter, and processors
- **Handler:** Determines destination — `StreamHandler` (file), `RotatingFileHandler` (daily rotation), `SlackHandler`, `SyslogHandler`, and 40+ others
- **Formatter:** Transforms the log record into output format — `LineFormatter` (plain text), `JsonFormatter` (structured JSON), `LogstashFormatter`
- **Processor:** A callable that enriches the log record before formatting — `IntrospectionProcessor`, `WebProcessor`, custom processors
- **Stack Driver:** A meta-driver that fans out to multiple named channels, enabling different routing per severity

---

## Mental Models

- **Pipeline Model:** Log call → Processors (enrich) → Handler (route) → Formatter (serialize). Each stage transforms the record in sequence
- **Plumbing Model:** Channels are pipes, handlers are faucets, formatters are nozzles — configure each piece independently for the desired output
- **Stack as Switchboard:** The stack driver is a switchboard that routes each log call to multiple destinations simultaneously

---

## Internal Mechanics

When `Log::info()` is called, Laravel creates a PSR-3 record. Processors execute in declared order, enriching the record. The handler receives the processed record and passes it to the formatter for serialization before writing to the destination. The `tap` configuration allows injecting custom logic into the Monolog instance after configuration, useful for adding processors to all channels in a stack.

---

## Patterns

- **Production Stack with JSON + Slack:** Stack driver with a JSON file channel (all levels) and a Slack/Sentry channel (error+). Benefit: comprehensive file logs + real-time notification for critical issues. Tradeoff: each log call fans out to all channels, multiplying cost.
- **Channel Isolation by Purpose:** Separate channels for audit logs (append-only, different retention), application logs (standard), and performance logs (high-frequency, sampled). Benefit: independent configuration of retention, formatting, and access. Tradeoff: more channels to maintain.
- **Custom Processor via Tap:** Use the `tap` config key to register a class that customizes all channels in a stack. Benefit: single extension point for cross-cutting concerns like trace ID injection. Tradeoff: tap logic applies to all channels, cannot target selectively.

---

## Architectural Decisions

**Use stack driver for production.** The stack pattern with a JSON file channel and a notification channel for errors provides comprehensive logging with real-time alerting.

**Configure formatters explicitly on every channel.** Never rely on Monolog defaults — `LineFormatter` is unsuitable for production. Always set `formatter` in channel config.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Stack driver enables multiple destinations per log call | Each log call dispatches to all child channels | With 3 channels, cost is 3x; benchmark at scale |
| Explicit formatter config guarantees parseable output | Slight configuration overhead per channel | Production channel without formatter silently produces text |
| Processors inject ambient context without call-site changes | Each processor adds 5-50μs per log call | Keep processors stateless; avoid I/O |

---

## Performance Considerations

File handlers are fastest — no network I/O. Network handlers (Slack, Telegram) add HTTP latency; use async or queue logging. `LineFormatter` is ~2x faster than `JsonFormatter`. Each processor adds 5-50μs per call. Stack fan-out multiplies cost by channel count. `BufferHandler` batches records before flushing for high-throughput scenarios.

---

## Production Considerations

Set file permissions to 640, owned by web server user. Store webhook URLs in environment variables, never hardcoded. Isolate sensitive data channels (audit logs) with different access controls. Ensure error-level channels do not leak PII through stack traces. Notification channels must use minimal content.

---

## Common Mistakes

**Missing formatter configuration** — defaults to `LineFormatter` in production, producing non-machine-parseable logs. Always explicitly set `JsonFormatter` for production channels.

**Processor ordering errors** — formatting before enrichment means the formatter serializes an unenriched record. Processors run before formatters when declared correctly.

**Stack-in-stack nesting** — referencing another stack channel leads to duplicate log entries and unpredictable fan-out. Stacks should only reference leaf channels.

**Not setting handler level** — without explicit `level`, debug messages flood notification channels. Always set `level` on notification channels.

---

## Failure Modes

**Channel name collision:** Two channels with the same name silently overwrites the first. Detection: "missing" logs that route to wrong destination. Mitigation: use unique dot-notation names (e.g., `production.json`).

**Formatter misconfiguration:** Production channel using `LineFormatter` sends unparseable text to aggregator. Detection: aggregator shows garbled entries. Mitigation: always set `formatter` explicitly on every production channel.

**Processor exception:** A processor throws an exception during enrichment, breaking the log pipeline. Detection: missing log entries. Mitigation: wrap processor logic in try-catch; log processor failures to a fallback channel.

---

## Ecosystem Usage

Laravel's `config/logging.php` is the central configuration point. The `stack` driver enables multi-channel fan-out. Community packages like `sentry/sentry-laravel` and `spatie/laravel-login-notifier` register custom channels and handlers. OpenTelemetry PHP SDK provides OTLP log export as an alternative to file-based logging.

---

## Related Knowledge Units

### Prerequisites
- PSR-3 LoggerInterface specification

### Related Topics
- Structured JSON Logging (JsonFormatter configuration)
- Log Context & Correlation (processor enrichment)
- PII Redaction & Log Sampling (processor hygiene)

### Advanced Follow-up Topics
- OpenTelemetry PHP SDK (OTLP log export alternative)
- OTLP Exporter & Collector Configuration (collector-based log pipeline)

---

## Research Notes

Always explicitly set `formatter` on every channel — never rely on Monolog defaults. The `stack` driver is the production standard; use it with named leaf channels. Processors run in declaration order; enrichment must happen before formatting. Use `formatter_with` config key to pass constructor arguments. The `tap` configuration is the correct extension point for channel-wide customization.
