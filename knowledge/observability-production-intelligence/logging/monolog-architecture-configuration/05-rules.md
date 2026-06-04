# Rules: Monolog Architecture & Channel Configuration

## Rule MAC-01: Explicitly configure formatters on all production channels
**Condition:** For every channel in `config/logging.php` that operates in a production environment.
**Action:** Set the `formatter` key to `Monolog\Formatter\JsonFormatter::class` or another explicit formatter. Never rely on Monolog defaults.
**Consequence:** Machine-parseable logs with consistent format. No silent fallback to `LineFormatter`.
**Violation:** Log aggregators may fail to parse entries, or format may change unexpectedly on Monolog version upgrades.

## Rule MAC-02: Use stack driver for production multi-channel routing
**Condition:** When logs must reach multiple destinations (file + notification) in production.
**Action:** Configure a `stack` channel that references named leaf channels. Do not nest stacks.
**Consequence:** Single log call fans out to all destinations without application-level coordination.
**Exception:** Very simple deployments (single server, no aggregator) may use a single channel.

## Rule MAC-03: Set severity level thresholds on notification channels
**Condition:** When a channel sends logs to external notification systems (Slack, Telegram, email).
**Action:** Set `level` to `warning` or higher — never allow debug/info messages to trigger notifications.
**Consequence:** Prevents alert fatigue and notification channel spam.
**Violation:** Slack channels flooded with debug-level noise, leading to ignored critical alerts.

## Rule MAC-04: Order processors enrichment-before-formatting
**Condition:** When configuring custom processors on a channel.
**Action:** Ensure processors (which modify the record) are registered before formatters (which serialize). Laravel's config key ordering handles this correctly; manual handler configuration must respect it.
**Consequence:** Processors enrich the record, then the formatter serializes the complete enriched record.

## Rule MAC-05: Use environment variables for sensitive channel configuration
**Condition:** When configuring channels with webhook URLs, API tokens, or other secrets.
**Action:** Reference via `env('VARIABLE_NAME')` in `config/logging.php`. Never hardcode secrets.
**Consequence:** Secrets managed via environment, not committed to version control.

## Rule MAC-06: Name channels with dot notation by purpose
**Condition:** When defining new channels.
**Action:** Use format `{environment}.{purpose}` or `{subdomain}.{destination}`. Examples: `production.json`, `audit.access`, `notifications.critical`.
**Consequence:** Self-documenting channel names that sort logically in config and aggregator queries.

## Rule MAC-07: Never nest stack drivers
**Condition:** When configuring a stack channel.
**Action:** Reference only leaf channels (single-handler channels) in the `channels` array. Do not reference other stack channels.
**Consequence:** Predictable fan-out behavior without duplicate log entries.
**Violation:** Stack-in-stack leads to exponential log duplication and unpredictable routing.

## Rule MAC-08: Register custom processors in `App\Logging\Processors` namespace
**Condition:** When creating custom Monolog processors.
**Action:** Place processor classes in `App\Logging\Processors\` with a single responsibility per processor.
**Consequence:** Discoverable, testable, maintainable processor classes.

## Rule MAC-09: Benchmark handler I/O cost for high-throughput channels
**Condition:** When a channel handles >1000 log entries per second.
**Action:** Benchmark handler write time. Consider using `BufferHandler` for batching, or async handlers for network destinations.
**Consequence:** Prevents logging from becoming a performance bottleneck.

## Rule MAC-10: Use custom formatters in `App\Logging\Formatters` namespace
**Condition:** When the built-in formatters (JsonFormatter, LineFormatter) do not meet requirements.
**Action:** Create a custom formatter extending `Monolog\Formatter\FormatterInterface`. Place in `App\Logging\Formatters\`.
**Consequence:** Custom serialization logic is isolated, testable, and consistent across channels.
