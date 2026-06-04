# Standardized Knowledge: Tideways Setup — Extension, Daemon, API Key, Sample Rate, Tracepoint Configuration

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Profiling & Observability |
| Knowledge Unit | Tideways Setup — Extension, Daemon, API Key, Sample Rate, Tracepoint Configuration |
| Difficulty | Intermediate |
| Lifecycle | Configure, Monitor |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Tideways is a continuous APM and profiling solution. It samples a percentage of requests (default 10-20%), captures full call graphs and SQL queries for sampled requests, and aggregates metrics (p50/p95/p99, error rates, slowest endpoints) for all requests. Architecture: PHP extension → local daemon → Tideways cloud → API/dashboard.

## Core Concepts

- **Extension**: `tideways-php` extension. Enables `tideways_xhprof()` function and automatic request monitoring. Minimal overhead in sampling mode (<3%).
- **Daemon**: `tideways-daemon` receives traces from all PHP processes on the host, batches them, and sends to Tideways API. Runs locally — no outbound connections from PHP processes.
- **Sample rate**: `TIDEWAYS_SAMPLE_RATE=20` (percent of requests profiled). Higher sampling gives better data but higher overhead. 10-20% is standard for production; 50-100% for staging.
- **Tracepoint configuration**: Define which SQL queries, HTTP requests, and function calls to instrument via `TIDEWAYS_TRACEPOINTS` environment variable. Excessive tracepoints increase overhead.

## When To Use

- Continuous production profiling with minimal overhead
- Monitoring endpoint-level performance trends over time
- Identifying slow SQL queries and external HTTP calls in context of full request traces
- Teams that need APM + profiling in a single SaaS solution
- Alert-driven profiling: trigger flame graph capture when latency crosses threshold

## When NOT To Use

- Budget-constrained teams (Tideways is a paid subscription)
- Environments where outbound HTTP to Tideways cloud is blocked (air-gapped networks)
- Teams that need per-request instrumentation rather than statistical sampling
- When profiling overhead must be zero — use eBPF instead

## Best Practices

- **Use endpoint-level sampling**: Sample high-traffic endpoints at lower rates (5%), low-traffic endpoints at higher rates (50%). Balances data quality with overhead. Configure via Tideways dashboard rules.
- **Set 10-20% sample rate for production**: Provides statistically valid data with <3% overhead. Only enable 100% sampling during targeted debugging windows.
- **Avoid excessive tracepoints**: Each additional tracepoint increases overhead. Instrument only the SQL queries and HTTP calls relevant to your investigation.
- **Pair with slow logs**: Tideways identifies slow requests — correlate with PHP-FPM slow log for deeper analysis of individual slow requests.
- **Store profiles for 30+ days**: Correlate with deploy events to identify performance regressions over time.

## Architecture Guidelines

- **Data pipeline**: PHP extension → local daemon (batch, compress) → Tideways cloud API → dashboard query
- **Daemon isolation**: Daemon runs as a separate process. PHP-FPM workers never connect to Tideways cloud directly — only the daemon makes outbound connections. This improves security and reduces PHP process overhead.
- **Multi-host aggregation**: Multiple application servers each run a local daemon. Tideways cloud aggregates metrics across all hosts.
- **Container support**: Daemon can run as a sidecar container in Kubernetes. Ensure daemon and PHP containers share a network namespace.

## Performance Considerations

- Sampling overhead: <3% at 10-20% sample rate in production
- Daemon resource usage: ~50 MB RAM, minimal CPU
- Extension overhead when not sampling: <1% (fast-path check on each request)
- 100% sampling adds 5-15% overhead — use only during targeted debugging windows
- Excessive tracepoints can increase overhead to 5-10%

## Security

- API key must be stored securely — never hardcode in application code or version control
- Use environment variables or secrets manager (`.env` file, Vault, Kubernetes secrets)
- Tideways cloud connection uses HTTPS — ensure firewall allows outbound traffic to Tideways API endpoints
- Daemon does not expose any network ports — communication is unidirectional from daemon to Tideways cloud
- Restrict dashboard access to authorized team members — profiles may expose sensitive code paths and data

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| 100% sampling in production | Wanting complete data | 5-15% overhead at all times | Use 10-20% sampling; enable 100% only during targeted investigations |
| Hardcoding API key | Convenience during setup | Credential exposure in version control | Use environment variables or secrets manager |
| Running without daemon | Skipping architecture docs | PHP processes make outbound HTTP calls, increasing latency and load | Always install and configure daemon on each host |
| Over-instrumenting tracepoints | Assuming more data is better | 5-10% overhead from tracepoint callbacks | Instrument only relevant SQL queries and HTTP calls |

## Anti-Patterns

- **Set-and-forget configuration**: Tideways configuration should be reviewed quarterly. As application traffic patterns change, sample rate and tracepoint configuration may need adjustment.
- **Monitoring without action**: Collecting Tideways data without a regular review cadence wastes the subscription cost. Schedule weekly performance review meetings.
- **Single sample rate for all endpoints**: High-traffic and low-traffic endpoints have different sampling needs. Use endpoint-level sampling rules.

## Examples

```bash
# Install Tideways extension (Ubuntu/Debian)
apt-get install tideways-php

# Configure PHP extension
echo "extension=tideways.so" > /etc/php/8.2/mods-available/tideways.ini
phpenmod tideways

# Start daemon
tideways-daemon --api-key=YOUR_API_KEY --host=default

# Docker Compose setup
services:
  app:
    environment:
      TIDEWAYS_SAMPLE_RATE: "20"
      TIDEWAYS_TRACEPOINTS: "sql,http"
  tideways-daemon:
    image: tideways/daemon
    environment:
      TIDEWAYS_API_KEY: "${TIDEWAYS_API_KEY}"
```

## Related Topics

- Blackfire Installation and Triggered Profiling
- SPX Self-Hosted Profiling
- Flame Graph Generation and Interpretation
- APM Integration Patterns
- Production Guardrails and Profiling Cost

## AI Agent Notes

- Tideways is production-safe at 10-20% sampling (<3% overhead)
- Daemon architecture isolates outbound traffic from PHP processes
- Endpoint-level sampling is underutilized but highly effective for balancing data quality vs overhead
- Correlate Tideways metrics with deploy events for performance regression detection
- Always check whether slow endpoints are database-bound (SQL tracepoints) or application-bound (call graphs)

## Verification

- [ ] Tideways PHP extension installed and enabled (`php -m | grep tideways`)
- [ ] Daemon running and connected to Tideways cloud (`tideways-daemon --status`)
- [ ] Sample rate configured at 10-20% for production environments
- [ ] Endpoint-level sampling rules configured in Tideways dashboard
- [ ] API key stored securely (environment variable, not hardcoded)
- [ ] Tracepoints configured for relevant SQL queries and HTTP calls only
- [ ] p50/p95/p99 metrics visible in Tideways dashboard for all critical endpoints
- [ ] Slowest endpoints identified and correlated with PHP-FPM slow log
- [ ] Profiling overhead measured and confirmed <3%
- [ ] Dashboard access restricted to authorized team members
