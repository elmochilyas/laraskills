# Decision Trees: Infrastructure Monitoring Tools

## Tool Selection

**Budget:**
- $0 → Pulse + Telescope (dev) + Laravel log files
- Low budget → Nightwatch ($10/server) + Sentry Free
- Full budget → Datadog or New Relic APM

**Forge user?**
- Yes → Nightwatch is native integration
- No → Sentry or Datadog

## Logging Strategy

**Scale:**
- Single server → File logging with log rotation
- Multi-server → Centralized logging (Papertrail, Logstash, CloudWatch)
- Distributed → OpenTelemetry for trace correlation
