# Skill: Configure Monolog Architecture and Channels for Laravel

## Purpose
Design and configure Monolog channels, handlers, formatters, and processors for Laravel applications, building a production-grade logging pipeline that routes messages by severity, destination, and structure.

## When To Use
- Initial Laravel project setup requiring production logging
- Adding new logging destinations (file, Slack, syslog, aggregator)
- Replacing default LineFormatter with structured JSON
- Implementing channel-based log routing by severity

## When NOT To Use
- Development-only environments (LineFormatter is acceptable)
- Applications using OTLP log export exclusively (no file-based channels)

## Prerequisites
- Understanding of PSR-3 log levels (debug through emergency)
- Familiarity with `config/logging.php` structure
- Access to destination endpoints (webhook URLs, syslog servers)

## Inputs
- Required log destinations per environment
- Severity routing rules (which levels go where)
- Output format requirements (JSON, plain text, Logstash)
- Enrichment needs (correlation IDs, environment, version)

## Workflow
1. **Map logging destinations**: Identify all required outputs — JSON file, notification channel, syslog, external aggregator. Name each as a leaf channel.
2. **Configure handlers per channel**: Choose Monolog Handler class per destination. For files: `StreamHandler` or `RotatingFileHandler`. For Slack: `SlackHandler`. For syslog: `SyslogHandler`.
3. **Set formatters**: Configure `JsonFormatter::class` for machine-parseable channels. Keep `LineFormatter` for local development. Use `formatter_with` for constructor arguments.
4. **Register processors**: Add enrichment processors — trace ID injection, environment tagging, PII redaction. Order matters: processors run in declaration order.
5. **Build stack driver**: Create a `stack` channel composing leaf channels. Configure level thresholds per channel to route severity appropriately.
6. **Configure tap customization**: If needed, implement a `tap` class for channel-wide configuration that applies to all channels in a stack.
7. **Test end-to-end**: Write integration tests that verify log entries reach each destination with correct format and content.

## Validation Checklist
- [ ] Leaf channels defined for each destination
- [ ] Formatter explicitly configured on every channel
- [ ] Stack driver composes leaf channels (no nesting)
- [ ] Level thresholds set on notification channels
- [ ] Processors register before formatters
- [ ] Environment variables used for secrets (webhook URLs, tokens)
- [ ] Channel names follow dot notation convention
- [ ] Integration tests confirm log routing

## Common Failures
- **No formatter on handler:** Monolog defaults to LineFormatter. Production channels silently emit unparseable text.
- **Stack-in-stack:** Referencing a stack within another stack duplicates every log entry.
- **Missing level on notification channel:** All log levels reach Slack, causing alert fatigue.
- **Wrong processor order:** Adding fields in a custom formatter instead of a processor makes enrichment non-standard.

## Decision Points
- **Single vs daily vs syslog handler:** Single for development; daily for production without log shipping; syslog for centralized logging.
- **Line vs Json formatter:** Line for human readability (dev); Json for machine parsing (prod).
- **Stack vs multiple channels directly:** Stack when you need fan-out to multiple destinations from one log call.

## Performance Considerations
- File handlers: ~10-50μs per write (fastest option)
- Network handlers: 50-500ms per call (use Slack only for warning+)
- JsonFormatter: ~2x CPU cost vs LineFormatter
- Processor pipeline: adds 5-50μs per processor
- BufferHandler: batches writes, reducing I/O by 10-100x

## Security Considerations
- Set log file permissions to 640, owned by web server user
- Store webhook URLs in environment variables, never in config
- Notification channels must use severity thresholds to avoid leaking internal state
- Custom formatters must escape output to prevent log injection attacks

## Related Skills
- Structured JSON Logging
- PII Redaction & Log Sampling
- Log Context & Correlation

## Success Criteria
- Log entries reach all configured destinations with correct format
- Severity routing works as designed (debug→file, error→Slack)
- Each channel has an explicit formatter producing expected output
- Stack channel routes to all leaf channels without duplication
- Processors enrich all entries consistently
