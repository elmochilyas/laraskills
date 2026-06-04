# Standardized Knowledge: Blackfire Installation and Triggered Profiling — Probe, Agent, CI Assertions

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Profiling & Observability |
| Knowledge Unit | Blackfire Installation and Triggered Profiling — Probe, Agent, CI Assertions |
| Difficulty | Intermediate |
| Lifecycle | Configure, Diagnose, Test |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Blackfire provides low-overhead production profiling (2-5% overhead in sampling mode). Architecture: Probe (PHP extension collecting data), Agent (local daemon aggregating and forwarding), CLI/API (trigger profiling, retrieve results). Supports triggered profiling (profile on demand via HTTP header), automated testing (assertions on wall time, I/O time, CPU time in CI), and continuous performance regression detection.

## Core Concepts

- **Probe installation**: `apt install blackfire-php` or `pecl install blackfire`. Blackfire PHP extension. Requires restarting PHP-FPM. Minimal overhead (~2% in sampling mode).
- **Agent**: Local daemon (`blackfire-agent`) that caches profiles and forwards to Blackfire cloud. Can be configured for on-premise storage (Blackfire Enterprise).
- **Triggered profiling**: Send `X-Blackfire-Profile: true` header with a request. Agent captures a full profile of that specific request. No profiling on other requests — zero overhead for non-profiled traffic.
- **Assertions (CI)**: `blackfire run --assert="main.wall_time < 200ms" --assert="main.io_time < 50ms" php script.php`. Build fails if assertions fail. Enforce performance budgets in CI pipelines.

## When To Use

- Production profiling with low overhead (2-5% in sampling mode)
- On-demand profiling of specific requests via HTTP header injection
- CI/CD pipelines enforcing performance budgets with assertions
- Teams needing rich profile comparison (before/after optimization views)
- Canary profiling: profile 1 in 1000 requests via load balancer header injection

## When NOT To Use

- Budget-constrained teams (Blackfire is a paid subscription — free tier has limitations)
- Air-gapped environments without Blackfire Enterprise (requires cloud connectivity)
- Teams needing continuous always-on profiling (use Tideways for continuous; Blackfire is trigger-based)
- When the probe cannot be installed (some restricted hosting environments — use eBPF instead)

## Best Practices

- **Use triggered profiling for production**: Send `X-Blackfire-Profile: true` only for specific requests. Zero overhead for non-profiled traffic. Never enable always-on profiling.
- **Canary profiling pattern**: Inject `X-Blackfire-Profile: true` header on 0.1% of traffic at the load balancer level. Continuous profiling with negligible fleet-wide overhead.
- **Always ensure agent is running**: `php -m | grep blackfire` confirms the probe. `systemctl status blackfire-agent` confirms the agent. Without the agent, profiles are collected but never sent.
- **Enforce performance budgets in CI**: Use Blackfire assertions to fail builds when wall time, I/O time, or CPU time exceed thresholds. Catch regressions before deployment.
- **Compare profiles in the dashboard**: Blackfire's comparison view shows before/after optimization side-by-side with color-coded improvements and regressions.

## Architecture Guidelines

- **Data pipeline**: PHP process (probe) → Unix socket → agent (daemon) → HTTPS → Blackfire cloud → dashboard/API
- **Probe-agent communication**: Via Unix socket (`/var/run/blackfire/agent.sock`). No network ports needed between PHP and agent. Agent makes outbound HTTPS to Blackfire cloud.
- **CI integration**: `blackfire run` wraps a CLI command (PHP script, test suite). Profiles the wrapped execution, applies assertions, exits with non-zero code on assertion failure.
- **On-premise storage**: Blackfire Enterprise supports storing profiles on your own infrastructure instead of Blackfire cloud. Same architecture, different backend endpoint.

## Performance Considerations

- Sampling mode overhead: 2-5% — production-safe for triggered profiling
- Instrumentation mode overhead: 10-25% — staging only
- Agent resource usage: ~50 MB RAM, minimal CPU
- Profile upload: ~50-200KB per profile, sent asynchronously by agent
- Zero overhead for non-profiled requests (triggered mode only)
- CI profiling overhead: adds to test suite runtime — account for 2-5x time increase

## Security

- Blackfire credentials (client ID/secret) must be stored securely — never hardcode in version control
- Probe-agent communication via local Unix socket — no network exposure
- Agent-to-cloud communication uses HTTPS — ensure firewall allows outbound to Blackfire API
- Profile data contains function names, file paths, and SQL queries — restrict dashboard access
- On-premise agent configuration requires secure storage of the agent token
- CI assertion configurations are safe to commit (they define performance budgets, not secrets)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Blackfire probe without agent | Skipping agent installation | Profiles collected by probe but never sent to dashboard | Always install and verify agent: `systemctl status blackfire-agent` |
| Always-on profiling in production | No triggered mode configuration | 2-5% overhead on every request, not just investigated ones | Use triggered profiling via HTTP header for production |
| Ignoring CI assertions | Treating Blackfire as profiling-only | Missing performance regression detection in CI | Add assertions for wall_time, io_time, cpu_time in CI pipeline |
| Storing credentials in code | Quick setup during development | Credential exposure in version control | Use environment variables for Blackfire credentials |

## Anti-Patterns

- **Blackfire without assertions**: Using Blackfire only for manual profiling in production but not enforcing performance budgets in CI. The CI integration is where long-term value comes from.
- **Comparing profiles from different modes**: Sampling vs instrumentation mode produce different metrics. Always use the same mode for before/after comparisons.
- **Profiling without a baseline**: Without a reference profile (before optimization), you can't measure improvement. Always profile before making changes.
- **Over-asserting in CI**: Too many assertions or overly tight thresholds cause noisy failures. Start with 2-3 critical assertions and relax as needed.

## Examples

```bash
# Install Blackfire probe and agent (Ubuntu/Debian)
apt-get install blackfire-php blackfire-agent

# Verify installation
php -m | grep blackfire
systemctl status blackfire-agent

# Trigger profiling via HTTP header
curl -H "X-Blackfire-Profile: true" http://app/slow-endpoint

# CLI profiling with assertions
blackfire run \
  --assert="main.wall_time < 200ms" \
  --assert="main.io_time < 50ms" \
  --assert="main.cpu_time < 150ms" \
  php artisan your:command

# Canary profiling via Nginx header injection
location / {
    if ($request_uri ~* "^/api/checkout") {
        set $blackfire "true";
    }
    proxy_set_header X-Blackfire-Profile $blackfire;
    proxy_pass http://backend;
}

# Docker Compose setup
services:
  app:
    environment:
      BLACKFIRE_CLIENT_ID: "${BLACKFIRE_CLIENT_ID}"
      BLACKFIRE_CLIENT_TOKEN: "${BLACKFIRE_CLIENT_TOKEN}"
  blackfire:
    image: blackfire/agent
    environment:
      BLACKFIRE_SERVER_ID: "${BLACKFIRE_SERVER_ID}"
      BLACKFIRE_SERVER_TOKEN: "${BLACKFIRE_SERVER_TOKEN}"
```

## Related Topics

- Tideways Setup — Continuous Monitoring
- SPX Self-Hosted Profiling
- eBPF PHP Profiling
- Production Guardrails and Profiling Cost
- CI/CD Performance Regression Detection

## AI Agent Notes

- Blackfire is production-safe at 2-5% overhead in triggered mode — use `X-Blackfire-Profile` header, not always-on
- CI assertions are Blackfire's killer feature — enforce performance budgets in CI pipelines
- Agent must be running and reachable — verify with `systemctl status blackfire-agent`
- Canary profiling: inject header on 0.1% of traffic at load balancer for continuous feedback
- Before/after comparison in Blackfire dashboard is the clearest way to validate optimization impact
- Credentials go in environment variables, never in code or config files

## Verification

- [ ] Blackfire probe installed and enabled (`php -m | grep blackfire`)
- [ ] Blackfire agent running (`systemctl status blackfire-agent`)
- [ ] Triggered profiling working: `curl -H "X-Blackfire-Profile: true"` generates a profile visible in dashboard
- [ ] CI assertions configured for critical endpoints/commands
- [ ] CI pipeline passes with performance budgets met
- [ ] Canary profiling configured at load balancer level (optional)
- [ ] Blackfire credentials stored in environment variables, not in version control
- [ ] Profile comparison verified: before/after optimization views in dashboard
- [ ] Team trained on triggered profiling workflow (header injection, not always-on)
- [ ] Blackfire Enterprise configured if on-premise storage required
