# Knowledge Unit: Log Viewer and Debugging Patterns

## Metadata
- **Subdomain:** Developer Tooling & Debugging
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** developer-tooling-debugging/log-viewer-debugging-patterns
- **Maturity:** Mature
- **Related Technologies:** Laravel Logging, Log Viewer, Monolog, PHP, Debugging

## Executive Summary

Log viewer and debugging patterns encompass reading, filtering, and analyzing Laravel application logs to diagnose issues. Laravel's logging system (built on Monolog) writes to configured channels (local files, Slack, syslog, CloudWatch, etc.) with severity levels (debug, info, notice, warning, error, critical, alert, emergency). Common patterns include: structured logging (JSON for machine parsing), contextual logging (additional data arrays), channel-specific logging (separate files per subsystem), log filtering (environment-based verbosity), and aggregation (centralized log management). Log viewer packages (like `opcodes/log-viewer`) provide web-based UI for browsing, filtering, and searching logs. Effective debugging combines logging with other tools: Telescope for request details, Debugbar for real-time data, and log files for historical analysis.

## Core Concepts

- **Log Channels:** Named destinations for log output: `single` (single file), `daily` (daily rotation), `stack` (channel aggregation), `slack`, `syslog`, `errorlog`, `monolog` (custom handlers)
- **Log Levels:** PSR-3 severity levels: DEBUG (detailed debug info), INFO (normal events), NOTICE (normal but significant), WARNING (potential issues), ERROR (runtime errors), CRITICAL (critical conditions), ALERT (immediate action), EMERGENCY (system unusable)
- **Structured Logging:** JSON-formatted log entries with structured data, enabling machine parsing, log aggregation, and querying
- **Context Arrays:** Extra data attached to log entries: `Log::error('Payment failed', ['order_id' => 123, 'amount' => 50.00])`
- **Log Rotation:** Automatic log file management (daily rotation, size-based rotation, retention policies)
- **Log Viewer:** Web UI for browsing and filtering application logs without SSH access to the server
- **Telescope Log Watcher:** Captures log entries in Telescope's dashboard alongside other debugging data

## Mental Models

- **Logs as Application Black Box:** Like an airplane's flight data recorder—logs capture what the application did and in what state, enabling post-incident analysis
- **Log Levels as Severity Spectrum:** Each log level represents a severity threshold; configure which levels get recorded per environment (DEBUG in development, ERROR in production)
- **Structured Logs as Queryable Data:** JSON logs are like database records—they can be queried, filtered, aggregated, and visualized in log management systems

## Internal Mechanics

1. **Log Channel Resolution:** `config/logging.php` defines channels; each channel specifies a driver (single, daily, stack, slack, etc.) and driver-specific configuration (path, level, retention)
2. **Monolog Handler Registration:** Each Laravel log channel creates a Monolog handler (StreamHandler, RotatingFileHandler, SlackHandler) that processes log entries
3. **Log Entry Processing:** Monolog formats the entry (LineFormatter by default, JsonFormatter for structured) and writes to the configured handler
4. **Channel Aggregation (Stack):** The `stack` driver combines multiple channels; entries are written to all aggregated channels simultaneously
5. **Log Viewer Reading:** Log viewer packages read log files from disk, parse entries (by date, level, context), and display in a web UI with filtering

## Patterns

- **Structured Logging Pattern:** Use `'channels' => ['single' => ['driver' => 'single', 'tap' => [App\Logging\CustomizeFormatter::class], 'formatter' => Monolog\Formatter\JsonFormatter::class]]` for JSON logs
- **Context-Enriched Logging Pattern:** Always include context: `Log::error('Order failed', ['order' => $order->id, 'reason' => $exception->getMessage()])` instead of `Log::error('Order failed')`
- **Environment-Based Channel Pattern:** Use different channels per environment: stack in production (daily file + Slack errors), single in local, daily in staging
- **Channel Separation Pattern:** Use separate channels for different subsystems: `log-channel: payments`, `log-channel: auth`, `log-channel: api` for focused debugging
- **Log Viewer Pattern:** Install a log viewer package in development/staging for GUI-based log browsing; secure with authentication in non-local environments
- **Telescope + Log Pattern:** Use Telescope's LogWatcher for request-scoped log browsing; use file logs for cross-request historical analysis
- **Triage Levels Pattern:** Use ERROR for production incidents that need investigation, WARNING for unusual but non-critical events, INFO for tracking business operations, DEBUG for development troubleshooting

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Log format | Line vs JSON vs custom | JSON for production (machine-parseable); Line for development (human-readable) |
| Channel setup | Single vs Daily vs Stack | Stack in production (daily files + error notifications); Daily in staging; Single in local |
| Retention | Days vs size vs unlimited | 30 days (production); 7 days (staging); unlimited (local) |
| Log viewer | opcodes/log-viewer vs custom vs external (Papertrail, Logtail) | opcodes/log-viewer for local/self-hosted; Logtail/Papertrail for production aggregation |
| Error notification | Slack vs email vs PagerDuty | Slack for WARNING+; PagerDuty for CRITICAL+ |

## Tradeoffs

- **Structured vs Line Logging:** JSON logs are machine-parseable and queryable but harder to read in raw form. Line logs are human-readable but require parsing for machine processing. Use JSON in production (log aggregation systems parse it), line in development.
- **Detailed vs Minimal Logging:** Detailed logging captures enough context to debug issues but adds disk usage and I/O overhead. Minimal logging saves resources but may lack context for debugging. Compromise: detailed in development, contextual (with context arrays) in production.
- **File vs Aggregated Logs:** File logs are simple (no external service needed) but require server access to read. Aggregated logs (Logtail, Papertrail, DataDog) are accessible from anywhere but add cost and complexity.

## Performance Considerations

- **Log I/O Overhead:** Each log write is a filesystem operation. In high-throughput applications (100+ req/s), excessive logging (every query, every API call) creates significant disk I/O.
- **Log Level Filtering:** Log entries at ignored levels are filtered before any formatting/writing. The filtering check is fast (<1µs). The formatting and writing happens only for active levels.
- **Channel Aggregation Cost:** Using `stack` with 3 channels means each log entry is processed 3 times (once per channel). This multiplies I/O overhead.
- **Context Serialization:** Complex context arrays (with nested objects, large arrays) are serialized for each log entry. Large context objects add formatting overhead.

## Production Considerations

- **Log Level Tuning:** Set production log level to `warning` or `error` to avoid filling disks with debug/info messages. Use `info` for a short period during issue investigation.
- **Log Rotation:** Configure log rotation (daily or size-based) with retention policy. Without rotation, log files grow indefinitely and can fill disk partitions.
- **Centralized Aggregation:** Consider a log aggregation service (Logtail, Papertrail, DataDog, Splunk) for production. Aggregated logs enable cross-server search, alerting, and visualization.
- **Sensitive Data in Logs:** Never log passwords, API tokens, credit card numbers, or PII. Use context scrubbing: `Log::info('Payment processed', ['amount' => $amount, 'last_four' => substr($card, -4)])`
- **Disk Space Monitoring:** Monitor disk usage on partitions where logs are stored. Set up alerts when log storage exceeds 80% capacity.

## Common Mistakes

- **Not rotating logs:** Using `single` channel in production without log rotation; the log file grows to gigabytes and becomes unreadable and slow to write to
- **Insufficient context:** Logging `Log::error('Something went wrong')` without context data; the entry provides no information for debugging
- **Over-logging in production:** Logging every database query, view render, or API call in production; creates performance overhead and fills disks
- **Logging sensitive data:** Including passwords, credit cards, or personal data in log context; creates compliance violations and security risks
- **Not using log levels correctly:** Using `Log::error()` for informational messages or `Log::info()` for critical failures; the log level loses its meaning

## Failure Modes

- **Disk Full from Logs:** Log files fill the disk partition, causing application errors or system crashes. Mitigate: configure log rotation; set disk alerts; use centralized logging.
- **Log Write Contention:** Multiple processes writing to the same log file simultaneously cause contention. Mitigate: use daily channel (separate file per day) or per-process log files.
- **Log Format Change Breaking Parsing:** Changing log format from line to JSON breaks existing log parsing pipelines and log viewers. Mitigate: change log format between deployments, not during; archive old logs in original format.
- **Log Aggregation Backpressure:** The log aggregation client blocks the application when the aggregation service is unavailable. Mitigate: use async log dispatching; configure timeouts.

## Ecosystem Usage

- **opcodes/log-viewer:** The most popular open-source log viewer package (by opcodes) providing a beautiful web UI for Laravel log browsing
- **Laravel Telescope:** Telescope's LogWatcher captures log entries alongside request data for request-scoped debugging
- **Logtail (Betterstack):** Popular log aggregation service with native Laravel integration via Monolog handler
- **Papertrail (SolarWinds):** Cloud-based log management with real-time tailing and search
- **Laravel Cloud:** Laravel Cloud provides built-in log aggregation for deployed applications
- **Sentry/Bugsnag:** Error tracking services that capture exceptions and provide additional debugging context

## Related Knowledge Units

- laravel-telescope
- laravel-debugbar
- mailpit-email-previews
- xdebug-integration-sail

## Research Notes

- Monolog v3.x (used by Laravel 10+) improved performance with lazy formatting and optimized handlers
- Laravel's `daily` log channel creates one file per day (laravel-2024-01-15.log) with default 30-day retention
- The `tap` feature in Laravel logging allows customizing Monolog handlers after creation (e.g., adding custom processors for extra context)
- PSR-3 log levels are followed by Laravel; the interface-compliant logger allows easy integration with any PSR-3 compatible log service
