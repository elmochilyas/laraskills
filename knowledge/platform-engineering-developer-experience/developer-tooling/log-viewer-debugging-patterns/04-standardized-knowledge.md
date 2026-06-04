# 04-Standardized Knowledge: Log Viewer and Debugging Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | developer-tooling-debugging |
| **Knowledge Unit** | log-viewer-debugging-patterns |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-telescope, laravel-debugbar, mailpit-email-previews |
| **Framework/Language** | Laravel Logging, Monolog, PHP |

## Overview

Log viewer and debugging patterns cover reading, filtering, and analyzing Laravel logs to diagnose issues. Laravel's logging (Monolog-based) writes to configured channels with PSR-3 severity levels. Common patterns: structured logging (JSON), contextual logging (extra data arrays), channel-specific logging, log filtering (environment-based verbosity), and aggregation (centralized management). Log viewer packages provide web UI for browsing logs without server SSH.

## Core Concepts

- **Log Channels**: named destinations: `single` (file), `daily` (rotation), `stack` (aggregation), `slack`, `syslog`, `errorlog`
- **Log Levels**: PSR-3: DEBUG, INFO, NOTICE, WARNING, ERROR, CRITICAL, ALERT, EMERGENCY
- **Structured Logging**: JSON-formatted entries for machine parsing and aggregation
- **Context Arrays**: extra data: `Log::error('Payment failed', ['order_id' => 123, 'amount' => 50.00])`
- **Log Rotation**: daily or size-based file management with retention policy
- **Log Viewer**: web UI for browsing/filtering logs without SSH (e.g., `opcodes/log-viewer`)

## When to Use

- Post-incident analysis reviewing historical application behavior
- Production debugging where Debugbar/Telescope aren't available
- Aggregated log management across multiple servers
- Compliance logging with retention policies

## When NOT to Use

- Real-time request debugging (Debugbar/Telescope are faster)
- When the issue is reproducible locally (use Debugbar)
- Extremely high-throughput logging without aggregation service

## Best Practices (WHY)

- **Always include context**: `Log::error('Order failed', ['order' => $order->id])` — context-less logs are useless
- **Use structured JSON in production**: enables log aggregation, querying, and visualization
- **Set production level to `warning`**: prevents debug/info noise from filling disks
- **Configure log rotation**: daily rotation with 30-day retention prevents disk exhaustion
- **Separate channels by subsystem**: `payments`, `auth`, `api` channels for focused debugging
- **Never log sensitive data**: passwords, tokens, credit cards, PII require scrubbing

## Architecture Guidelines

- `config/logging.php` defines channels per environment
- Use `stack` channel in production combining daily files + error notifications
- Structured (JSON) in production for machine parsing; line format in development
- Use `tap` feature for custom Monolog handler customization
- Centralized aggregation via Logtail, Papertrail, or DataDog for production

## Performance Considerations

- Each log write = filesystem operation; excessive logging creates significant disk I/O
- Level filtering: ignored levels filtered before formatting (<1µs check)
- Stack channel with 3 channels = 3x I/O per log entry
- Complex context arrays add formatting overhead

## Security Considerations

- Never log passwords, API tokens, credit card numbers, PII
- Use context scrubbing: `substr($card, -4)` for last 4 digits
- Log aggregation services handle sensitive data; ensure SOC2/compliance
- Set appropriate log file permissions (rw-r-----)

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| No log rotation | Single file grows to gigabytes | Unreadable, slow writes | Use `daily` channel |
| No context | `Log::error('Something went wrong')` without data | Useless log entry | Always include context arrays |
| Over-logging in production | Every query logged | Performance hit, disk fill | Set level to `warning` |
| Logging sensitive data | Passwords, PII in context | Compliance violations | Scrub data before logging |
| Wrong level usage | ERROR for info, INFO for failures | Level meaning lost | Use levels correctly |

## Anti-Patterns

- **Logging as debugging**: relying only on logs when interactive debugging tools are available
- **Same format everywhere**: using line format in production prevents machine parsing

## Examples

```php
// config/logging.php - production stack
'channels' => [
    'stack' => [
        'driver' => 'stack',
        'channels' => ['daily', 'slack'],
    ],
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'level' => env('LOG_LEVEL', 'warning'),
        'days' => 30,
    ],
],
```

## Related Topics

- laravel-telescope — request-scoped log capture
- laravel-debugbar — real-time debugging
- mailpit-email-previews — email testing in development

## AI Agent Notes

- Include `opcodes/log-viewer` when scaffolding projects for easy log browsing
- Always add context arrays to error log calls in generated code

## Verification

- [ ] Log rotation configured (daily channel)
- [ ] Production log level set to `warning`
- [ ] Context arrays used in all error log calls
- [ ] Sensitive data scrubbed before logging
- [ ] Chat notifications configured for ERROR+
- [ ] Log aggregation service integrated if needed
