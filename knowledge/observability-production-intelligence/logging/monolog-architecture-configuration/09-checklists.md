# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 01-logging
**Knowledge Unit:** monolog-architecture-configuration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] PSR-3 LoggerInterface understood as abstraction layer
- [ ] Channel configuration per logging destination decided
- [ ] Handler-processor-formatter pipeline designed for each channel
- [ ] Stack driver configured for fan-out to multiple channels
- [ ] Tap feature evaluated for channel-wide enrichment
- [ ] Production channel routing by severity verified

---

# Architecture Checklist

- [ ] Channels mapped to distinct destinations (file, syslog, slack, stderr)
- [ ] Handler selected per channel (StreamHandler, SyslogHandler, SlackHandler)
- [ ] Formatter configured per channel (LineFormatter vs JsonFormatter)
- [ ] Processors ordered correctly: enrichment before formatting
- [ ] Stack driver layered with fallback channel for critical errors
- [ ] Custom channel configuration isolated in `config/logging.php`

---

# Implementation Checklist

- [ ] Channel defined in `config/logging.php` with driver, handler, formatter
- [ ] Stack driver configured with named channels and tap processors
- [ ] Monolog handler formatter class set explicitly (e.g., `JsonFormatter::class`)
- [ ] Custom formatter created in `App\Logging\Formatters` if needed
- [ ] Channel-specific processor registered via channel config `processors` key
- [ ] Tap class implemented for channel-wide metadata injection

---

# Performance Checklist

- [ ] Handler selection evaluated for I/O overhead (file vs syslog vs network)
- [ ] Formatter execution cost benchmarked for each log call
- [ ] Stack channel fan-out verified to not block request on slow handler
- [ ] Async handler considered for high-volume channels (e.g., `syslog` UDP)
- [ ] Channel level thresholds configured to skip debug logs in production
- [ ] Buffer handler evaluated for batch log writing

---

# Security Checklist

- [ ] Channel-level log filesystem permissions restricted (640, owner-only)
- [ ] Slack handler webhook URL stored in config, not hardcoded
- [ ] Syslog channel identity configured without leaking app name
- [ ] Handler `$level` set to minimum `warning` for external notification channels
- [ ] Exception message escaping verified in custom formatters
- [ ] Stack channel does not expose internal error details to public handlers

---

# Reliability Checklist

- [ ] Stack channel failure on one handler does not lose log to other handlers
- [ ] Fallback channel configured if primary storage (e.g., syslog) unreachable
- [ ] Handler timeout configured for network-based channels (Slack, Syslog)
- [ ] Log entry truncation defined for handler max message size
- [ ] Channel rotation policy configured (daily, size-based) for file handlers
- [ ] Lost handler connection retry logic implemented for critical channels

---

# Testing Checklist

- [ ] Unit test: custom handler writes log to expected destination
- [ ] Unit test: custom formatter produces expected output format
- [ ] Unit test: processor enriches record with expected fields
- [ ] Integration test: stack channel delivers to all configured handlers
- [ ] Integration test: channel level filtering suppresses below-threshold entries
- [ ] Failure test: unreachable handler handled gracefully

---

# Maintainability Checklist

- [ ] Channel naming convention documented: `{subdomain}.{purpose}`
- [ ] Custom handlers placed in `App\Logging\Handlers` namespace
- [ ] Custom formatters placed in `App\Logging\Formatters` namespace
- [ ] Channel configuration documented in project logging ADR
- [ ] Stack channel composition reviewed and version-controlled
- [ ] Tap class logic kept single-purpose and unit-testable

---

# Anti-Pattern Prevention Checklist

- [ ] Channel names not reused across different logging destinations
- [ ] Formatter not used as a processor (formatting-only, no enrichment)
- [ ] Handler not configured without an explicit formatter
- [ ] Stack driver not nested inside another stack
- [ ] Handler `$level` not set lower than channel `$level`
- [ ] Monolog not used directly, only through Laravel Log facade

---

# Production Readiness Checklist

- [ ] Log channel file rotation configured and tested
- [ ] Slack/notification channels rate-limited to avoid spamming
- [ ] Stack channel handler failures monitored with alert
- [ ] Channel config reviewed before each deployment
- [ ] JSON format enabled for production channels consumed by aggregators
- [ ] Log sampling considered for high-volume channels

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: channels, handlers, formatters, processors, stack driver correctly layered
- [ ] Security requirements satisfied: file permissions restricted, webhook URLs not hardcoded, level thresholds set
- [ ] Performance requirements satisfied: I/O overhead assessed, async handlers considered, level thresholds tuned
- [ ] Testing requirements satisfied: unit, integration, failure tests for pipeline components
- [ ] Anti-pattern checks passed: no formatter-as-processor, no nested stack, no direct Monolog usage
- [ ] Production readiness verified: rotation tested, channel monitoring active, sampling evaluated

---

# Related References

- Structured JSON Logging (log format decisions)
- Log Context & Correlation (enrichment via Context facade)
- PII Redaction & Log Sampling (production hygiene)
- OpenTelemetry PHP SDK (OTel log export pipeline)
