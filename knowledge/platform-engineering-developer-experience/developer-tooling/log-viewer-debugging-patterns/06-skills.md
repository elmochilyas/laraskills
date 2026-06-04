# Skill: Debug with Log Viewer Patterns

## Purpose
Configure structured logging, context arrays, channel separation, and log viewer tools for effective production debugging, post-incident analysis, and centralized log management.

## When To Use
- Post-incident analysis reviewing historical application behavior
- Production debugging where Debugbar/Telescope aren't available
- Aggregated log management across multiple servers
- Compliance logging with retention policies

## When NOT To Use
- Real-time request debugging (Debugbar/Telescope are faster)
- When the issue is reproducible locally (use Debugbar)
- Extremely high-throughput logging without aggregation service

## Prerequisites
- Laravel application with Monolog-based logging configured
- Log channel configuration (`config/logging.php`)
- Log viewer package (optional, e.g., `opcodes/log-viewer`)

## Inputs
- `config/logging.php` — log channel and handler configuration
- Application code with `Log::` calls
- Log files stored in `storage/logs/`

## Workflow

1. **Configure Structured Logging:** Set `LOG_CHANNEL=stack` with JSON formatter for machine-parseable logs. This enables centralized aggregation services (ELK, Datadog, etc.) to parse log entries.

2. **Use Context Arrays:** Always include context data in log entries: `Log::error('Payment failed', ['order_id' => 123, 'amount' => 50.00])`. Context makes logs actionable and searchable.

3. **Set Up Log Channels:** Separate channels for application, queue, HTTP client, and security events. Configure each with appropriate handlers and formatters in `config/logging.php`.

4. **Configure Environment-Based Verbosity:** Set `LOG_LEVEL=debug` in development, `info` in staging, `warning` in production. Adjust per-channel levels for granular control.

5. **Set Up Log Rotation:** Use the `daily` channel with retention policy to prevent disk exhaustion. Configure retention duration based on compliance requirements.

6. **Install Log Viewer (Optional):** Install `opcodes/log-viewer` for web UI log browsing without SSH access. Secure the route with authentication.

7. **Implement Alerting:** Forward ERROR and CRITICAL logs to alerting channels (Slack via `slack` log channel, PagerDuty, email) for proactive incident detection.

## Validation Checklist

- [ ] Logs are structured (JSON) for machine parsing
- [ ] Context arrays included in all error/critical log entries
- [ ] Separate log channels for different subsystems
- [ ] Log rotation configured with retention policy
- [ ] Environment-based log levels set appropriately
- [ ] Log viewer (if installed) shows formatted log entries

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Log rotation not configured | Disk fills up with log files |
| Missing context data | Log entries not actionable; difficult to correlate |
| Too verbose in production | Performance impact; storage fills faster |
| Sensitive data in logs | PII or secrets logged in context arrays |

## Decision Points

- **Logging vs Debugbar:** Logs for post-incident analysis and production debugging; Debugbar for real-time development
- **Log viewer vs SSH:** Use log viewer package for web UI access without server access
- **Channel separation:** Single channel for simple apps; multiple channels for complex multi-service apps

## Performance/Security Considerations

- **Log volume:** High-throughput logging impacts I/O and storage; set appropriate levels
- **Sensitive data:** Never log passwords, tokens, PII in context arrays
- **Log aggregation:** Forward to centralized service for long-term retention and search
- **Compliance:** Configure retention policies meeting regulatory requirements

## Related Rules

- LOG-RULE-001: Use structured logging
- LOG-RULE-002: Use context arrays
- LOG-RULE-003: Configure log rotation
- LOG-RULE-004: Environment-based verbosity
- LOG-RULE-005: Use log channels

## Related Skills

- Install and Configure Laravel Debugbar
- Configure Laravel Telescope for Debugging
- Set Up Mailpit for Email Previews

## Success Criteria

- Logs are structured, searchable, and actionable with context data
- Log rotation prevents disk exhaustion
- Log levels are appropriate per environment
- Team can quickly find relevant log entries during incident response
