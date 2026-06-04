# Skill: Implement Structured JSON Logging for Laravel

## Purpose
Configure structured JSON logging for Laravel applications using Monolog's JSON formatters, enabling machine-parseable logs that integrate with log aggregators and observability pipelines.

## When To Use
- Production Laravel applications using any log aggregator (ELK, Loki, Datadog, Splunk)
- Multi-service architectures requiring consistent log format across services
- Teams building dashboards or alerts based on log field values

## When NOT To Use
- Local development only (LineFormatter is adequate)
- Applications using OTLP log export exclusively

## Prerequisites
- Laravel application with Monolog configured (default)
- Access to `config/logging.php` for channel configuration
- Log aggregator (ELK, Loki, Datadog) or file-based JSON log consumer

## Inputs
- List of production log channels requiring structured output
- Field naming convention decision (snake_case vs camelCase)
- Context depth limits based on data being logged
- Aggregator-specific requirements (Logstash format, timestamp format)

## Workflow
1. **Review existing channels**: Open `config/logging.php`. Identify all production channels. Check if `formatter` is explicitly set.
2. **Configure JsonFormatter**: Add `'formatter' => \Monolog\Formatter\JsonFormatter::class` to each production channel. Set `formatter_with` parameters: `appendNewline => true`, `maxNormalizeDepth => 5`, `maxNormalizeItemCount => 100`.
3. **Set datetime format**: In service provider or channel config, ensure datetime output is ISO 8601. Use `DateTimeImmutable::format('c')` or configure via formatter options.
4. **Document field convention**: Create a project ADR specifying the field naming convention (snake_case). Reference it in all code reviews.
5. **Configure aggregator**: Update log shipper (Filebeat, Fluentd, Vector) configuration to parse newline-delimited JSON. Verify field mapping.
6. **Test end-to-end**: Generate test log entries. Verify JSON output is valid. Confirm aggregator indexes all fields. Search by multiple field combinations.
7. **Update development channels**: Keep `LineFormatter` for local. Set environment-based channel selection in `.env`.

## Validation Checklist
- [ ] All production channels use `JsonFormatter` explicitly
- [ ] `appendNewline=true` on all JSON channels
- [ ] `maxNormalizeDepth <= 5` and `maxNormalizeItemCount <= 100`
- [ ] Datetime format is ISO 8601 with timezone
- [ ] Field naming convention documented and enforced
- [ ] No LineFormatter in any production channel
- [ ] Log aggregator correctly indexes all JSON fields
- [ ] Search by nested field works in aggregator
- [ ] JSON entry size within expected range
- [ ] No unserializable types in log context

## Common Failures
- **Missing formatter declaration:** Channel uses default LineFormatter. Fix: always set formatter explicitly.
- **Inconsistent datetime:** Some entries use Y-m-d, others ISO 8601. Fix: centralize datetime formatting.
- **No depth limit:** Eloquent model serialization creates 50-level-deep JSON entries. Fix: set `$maxNormalizeDepth`.
- **No newline delimiter:** Aggregator sees one giant JSON blob. Fix: set `appendNewline=true`.

## Decision Points
- **JsonFormatter vs LogstashFormatter:** JsonFormatter for general use; LogstashFormatter only when Logstash is in the ingestion pipeline.
- **Flattened vs nested context:** Flattened context (`user_id`, `order_id`) is simpler to query; nested (`user.id`, `order.id`) avoids field name collisions.
- **snake_case vs camelCase:** snake_case for Laravel convention consistency; camelCase for JavaScript-heavy teams.

## Performance Considerations
- JsonFormatter: ~2x CPU vs LineFormatter
- Large context: 100+ fields adds 200-500μs encoding time
- Entry size: JSON is 2-5x larger than text line
- Gzip: reduces file-based JSON storage by 10-20x

## Security Considerations
- JSON field names reveal internal schema — review for information leakage
- Exception stack traces in JSON contain class names and file paths — redact sensitive paths
- Log aggregator access controls apply to all field-level queries — restrict as needed
- TLS required for transport to aggregator

## Related Skills
- Monolog Architecture & Channel Configuration
- Log Context & Correlation
- PII Redaction & Log Sampling

## Success Criteria
- All production logs emitted as valid JSON
- Log aggregator indexes all fields without custom parsing
- Field naming convention is consistent across the entire codebase
- JSON encoding overhead measured and within acceptable range
- No unserializable types cause encoding failures
