# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 01-logging
**Knowledge Unit:** monolog-architecture-configuration
**Difficulty:** Intermediate
**Category:** Logging Infrastructure
**Last Updated:** 2026-06-03

# Overview

Laravel's logging system is a thin configuration layer over Monolog, the de facto PHP logging library. Each "channel" in `config/logging.php` maps to a Monolog handler (where the log goes), formatter (how it looks), and optional processors (what enrichment happens). The `stack` driver allows fan-out to multiple channels, enabling different routing for different severity levels or destinations.

Understanding this pipeline is essential because every production observability decision — structured JSON, PII redaction, correlation ID injection, log sampling — is implemented by configuring handlers, formatters, and processors within this architecture. Misconfiguration at this layer silently degrades all downstream observability.

Engineers should care because the `config/logging.php` file is the control plane for production logging. Mistakes here mean logs are lost, formatted incorrectly, or leak sensitive data — often without any visible error.

# Core Concepts

**PSR-3 LoggerInterface:** Laravel's `Log` facade implements `Psr\Log\LoggerInterface`, providing `emergency()`, `alert()`, `critical()`, `error()`, `warning()`, `notice()`, `info()`, and `debug()` methods. Every handler, formatter, and processor operates on a PSR-3 log record.

**Channel:** A named logging destination defined in `config/logging.php`. Each channel has a `driver` (handler type), optional `handler` (custom Monolog handler), `formatter`, and `processors`. Common channels: `stack`, `single`, `daily`, `slack`, `syslog`, `errorlog`, `null`, `papertrail`.

**Handler:** Determines where the log entry is written. Monolog provides 40+ handlers: `StreamHandler` (file), `RotatingFileHandler` (daily rotation), `SyslogHandler`, `SlackHandler`, `TelegramBotHandler`, `RedisHandler`, etc.

**Formatter:** Transforms the log record into the output format. `LineFormatter` (default) produces plain text. `JsonFormatter` produces structured JSON. `LogstashFormatter` produces Logstash-compatible JSON. `HtmlFormatter` produces HTML table output.

**Processor:** A callable that receives the log record and returns an enriched version. Processors run before formatters. Common processors: `IntrospectionProcessor` (adds class/method), `WebProcessor` (adds server data), `PsrLogMessageProcessor` (interpolates placeholders).

**Stack Driver:** A meta-driver that wraps multiple named channels. Every log call is sent to all channels in the stack. The stack can use different levels for different channels (e.g., debug to file, warning to Slack).

**Tap:** Laravel-specific configuration that allows injecting custom logic into the Monolog instance after it's configured. Useful for adding processors to all channels in a stack.

# When To Use

- **Every production Laravel application** needs properly configured channels, handlers, and formatters
- **Multi-environment deployments** need different channel configurations per environment
- **Compliance requirements** demand separate audit log channels with append-only storage
- **High-traffic applications** benefit from channel-level sampling and async handlers

# When NOT To Use

- **Direct Monolog usage** bypassing Laravel's configuration layer — always use `config/logging.php` for consistency
- **Over-nesting stack drivers** — stacks within stacks create unpredictable behavior
- **Single-file development servers** do not need complex channel configuration

# Best Practices

**Use the stack driver for production.** A common pattern: `stack` with a JSON file channel and a Slack/Sentry channel for errors. Route debug/info to file, warning+ to notification channels.

**Configure formatters explicitly.** Never rely on Monolog defaults. Always set the formatter class on every handler — `LineFormatter` for local development, `JsonFormatter` for production.

**Keep processors before formatters.** Processors enrich the record; formatters serialize it. The pipeline order matters. Laravel ensures this ordering when processors are registered via config.

**Name channels by purpose.** Use dot-notation: `production.json`, `audit.access`, `notifications.slack`. This aids aggregator querying and maintainability.

**Set level thresholds per channel.** Use the `level` config option to control which severity reaches each handler. Debug logs to file, error+ to notification channels.

# Architecture Guidelines

The handler-processor-formatter pipeline flows:
1. Log call arrives → PSR-3 record created
2. Processors execute in order → enrich/modify the record
3. Handler receives processed record → writes to destination
4. Formatter serializes the record before handler writes

Channel configuration structure:
```php
'production' => [
    'driver' => 'stack',
    'channels' => ['json_file', 'slack_errors'],
],
'json_file' => [
    'driver' => 'daily',
    'path' => storage_path('logs/laravel.json'),
    'level' => 'debug',
    'formatter' => JsonFormatter::class,
    'processors' => [App\Logging\Processors\TraceIdProcessor::class],
],
'slack_errors' => [
    'driver' => 'slack',
    'url' => env('LOG_SLACK_WEBHOOK_URL'),
    'level' => 'error',
],
```

# Performance Considerations

- **File handlers are fastest** — no network I/O, no serialization overhead beyond formatting
- **Network handlers add latency** — SlackHandler makes HTTP calls. Use async handlers or queue logging for network destinations
- **Formatter impact:** `LineFormatter` is ~2x faster than `JsonFormatter`. For high-throughput logging, benchmark your formatter choice
- **Processor cost:** Each processor adds 5-50μs per log call. Keep processors stateless and avoid I/O
- **Stack fan-out:** Each log call to a stack dispatches to all child channels. With 3 channels, cost is 3x
- **Buffer handler:** Monolog's `BufferHandler` batches log records before flushing — useful for reducing I/O in high-throughput scenarios

# Security Considerations

- **File permissions:** Log files should be 640, owned by the web server user, not world-readable
- **Webhook URLs:** Slack handler URLs stored in `config/logging.php` must reference environment variables, never hardcoded
- **Channel isolation:** Separate sensitive data channels (audit logs) from general application logs with different access controls
- **Exception details:** Ensure error-level channels do not leak PII through exception stack traces
- **External channels:** Notification channels (Slack, Telegram, email) must use minimal content — avoid exposing internal topology or credentials

# Common Mistakes

**Missing formatter configuration.** Defaulting to `LineFormatter` in production produces non-machine-parseable logs. Always explicitly configure `JsonFormatter` or `LogstashFormatter` for production channels.

**Processor ordering errors.** Registering processors in the wrong order — formatting before enrichment — means the formatter serializes an unenriched record. Laravel's config key `processors` runs enrichment before formatting, but custom handler configuration may not.

**Stack-in-stack nesting.** Creating a stack that references another stack channel leads to duplicate log entries and unpredictable fan-out. Stacks should only reference leaf channels.

**Not setting handler level.** Without explicit `level`, all messages reach the handler. This floods Slack channels with debug-level noise. Always set `level` on notification channels.

**Reusing channel names.** Defining two channels with the same name silently overwrites the first. This can cause "missing" logs that are actually being routed to the wrong destination.

# Anti-Patterns

**Formatter as processor:** Using a formatter to modify record data (e.g., adding fields in a custom formatter). Formatters serialize; processors enrich. Mixing concerns makes the pipeline unpredictable.

**Direct Monolog instantiation:** Creating Monolog handlers directly with `new Logger()` bypasses Laravel's configuration system, making logging invisible to the framework and non-portable across environments.

**No formatter on handlers:** Leaving formatter unset means Monolog's default (usually `LineFormatter`) is used, which may not be what the channel expects. Production channels should always specify a formatter.

**Bare handler without channel:** Registering a handler in `config/logging.php` without wrapping it in a named channel name makes it harder to reference in stacks and impossible to configure independently.

# Examples

**Production stack with JSON and Slack:**
```php
'channels' => [
    'production' => [
        'driver' => 'stack',
        'channels' => ['json', 'slack-critical'],
    ],
    'json' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.json'),
        'level' => 'debug',
        'formatter' => Monolog\Formatter\JsonFormatter::class,
        'formatter_with' => ['appendNewline' => true],
    ],
    'slack-critical' => [
        'driver' => 'slack',
        'url' => env('LOG_SLACK_WEBHOOK'),
        'level' => 'critical',
    ],
],
```

**Custom processor via Tap:**
```php
'tap' => [App\Logging\CustomizeChannels::class],
```

# Related Topics

**Prerequisites:**
- PSR-3 LoggerInterface specification

**Closely Related Topics:**
- Structured JSON Logging (JsonFormatter configuration)
- Log Context & Correlation (processor enrichment)
- PII Redaction & Log Sampling (processor hygiene)

**Advanced Follow-Up Topics:**
- OpenTelemetry PHP SDK (OTLP log export alternative to file-based logging)
- OTLP Exporter & Collector Configuration (collector-based log pipeline)

**Cross-Domain Connections:**
- DevOps & Infrastructure — log file rotation and retention policies

# AI Agent Notes

- Always explicitly set `formatter` on every channel — never rely on Monolog defaults
- The `stack` driver is the production standard; use it with named leaf channels
- Processors run in declaration order; enrichment must happen before formatting
- Use `formatter_with` config key to pass constructor arguments to formatters
- The `tap` configuration is the correct extension point for channel-wide customization
- Laravel's `config/logging.php` supports environment variable references via `env()` — use them for all sensitive values
