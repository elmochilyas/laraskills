# Standardized Knowledge: SPX Self-Hosted Profiling — Private Environments, Modern Web UI

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Profiling & Observability |
| Knowledge Unit | SPX Self-Hosted Profiling — Private Environments, Modern Web UI |
| Difficulty | Intermediate |
| Lifecycle | Configure, Diagnose |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

SPX (Simple Profiling eXtension) is a self-hosted, open-source PHP profiler with a modern web UI. It collects timing and memory metrics with low overhead (<5%), stores them locally as flat files, and provides a browser-based dashboard for exploring profiles. Ideal for private/internal environments where sending data to external cloud services is restricted.

## Core Concepts

- **Installation**: `pecl install spx` or compile from source. PHP extension `spx.so`. Configure via `php.ini`: `spx.http_enabled=1`, `spx.http_key=secret-key`, `spx.data_dir=/tmp/spx`.
- **Triggering**: Add `?SPX_KEY=secret-key&SPX_PROFILE=1` to any URL, or use HTTP header `X-SPX-Profile: 1`. Profile collected for that request only — on-demand, not continuous.
- **Web UI**: Navigate to `http://app/SPX?SPX_KEY=secret-key`. Dashboard shows: call tree (inclusive/exclusive time), flame graph, flat profile, memory timeline, and request metadata.
- **Data storage**: Profiles stored as flat files in `spx.data_dir`. Configurable retention. No external service or cloud dependency needed.

## When To Use

- Air-gapped or private networks where cloud profilers are blocked
- Development and staging environments for quick ad-hoc profiling
- Teams that need a free, open-source profiling solution
- Debugging specific slow requests without continuous monitoring overhead
- Environments where data sovereignty requires on-premises tooling

## When NOT To Use

- Production environments requiring continuous profiling — use Tideways or Blackfire instead
- Teams that need persistent APM metrics and dashboards — SPX is on-demand only
- Environments without web UI access (CLI-only setups) — use Xdebug instead
- When profiling overhead must be zero when not in use — SPX has 0% overhead when not profiling, so this is acceptable

## Best Practices

- **Always set `spx.http_key`**: Without it, anyone can trigger profiling by adding `SPX_PROFILE=1` to any URL, degrading performance. Use a strong random key.
- **Restrict SPX UI access**: Bind SPX to localhost or internal network. Use firewall rules (e.g., `allow 127.0.0.1 only`). Never expose SPX UI to the public internet.
- **Manage data retention**: Profiles are ~10-50KB each. At 1000 profiles/day = ~10-50MB/day. Configure cleanup cron jobs or set `spx.data_dir` to a temp directory with rotation.
- **Disable SPX in production unless actively debugging**: Remove the extension or set `spx.http_enabled=0` in production. Only enable during targeted investigation windows.

## Architecture Guidelines

- **No daemon required**: SPX runs entirely within the PHP process. Profile data is written directly to disk by the extension — no separate daemon or outbound connections.
- **Request-scoped profiling**: SPX profiles only the request that includes the trigger parameter. No background sampling. This makes it ideal for targeted investigations.
- **File-based storage**: Profiles are stored in `spx.data_dir`. Ensure this directory has sufficient disk space and is on a fast filesystem (not network-mounted in most cases).
- **Web UI served by application**: The SPX UI endpoint is served by the application's PHP process — ensure the application can handle UI requests without interference.

## Performance Considerations

- Overhead when profiling: <5% (instrumentation-based, not sampling)
- Overhead when not profiling: 0% — no active extension overhead on non-profiled requests
- Disk usage: ~10-50KB per profile. At 1000 profiles/day = ~10-50MB/day
- Profile generation time: adds 50-200ms to request depending on complexity
- Memory: SPX stores call tree in memory during request, freed after request completes

## Security

- **Always set `spx.http_key`**: Without it, attackers can trigger on-demand profiling on any request, causing performance degradation and exposing application internals (function names, file paths, call stacks).
- **Restrict SPX UI to localhost**: Configure web server to block external access to the SPX endpoint (e.g., Nginx `allow 127.0.0.1; deny all;`).
- **Disable in production by default**: SPX should only be enabled during active debugging sessions. Never leave `spx.http_enabled=1` in production configuration.
- **Profile files contain sensitive data**: Function names, file paths, arguments, and memory usage patterns are written to flat files. Ensure `spx.data_dir` has restricted permissions (0700).
- **Never commit `spx.http_key`**: Store in environment variables or secrets manager, not in version control.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| SPX exposed without HTTP key | Skipping security configuration during setup | Anyone can trigger profiling, degrading performance and exposing internals | Always set `spx.http_key` with a strong random value |
| Leaving SPX enabled in production | Convenience for quick debugging | Continuous profiling overhead on all requests; security exposure | Disable SPX in production; enable only during targeted investigation |
| Unlimited profile retention | No data management strategy | Disk full from accumulated profiles (~10-50MB/day) | Set up cron-based cleanup or configure `spx.data_dir` with rotation |
| Profiling every request | Overuse of SPX_PROFILE parameter | Performance impact on all profiled requests | Use SPX on-demand only for specific slow requests |

## Anti-Patterns

- **Continuous profiling with SPX**: SPX is designed for on-demand profiling. Using it continuously wastes disk space and adds unnecessary overhead. Use Tideways or Blackfire for continuous profiling.
- **Publicly accessible SPX UI**: The SPX web UI exposes detailed profiling data including function names and call stacks. Never expose it without authentication and IP restriction.
- **Profiling production without a hypothesis**: SPX generates detailed per-request profiles. Without a specific question, you'll have data but no insight. Always profile with a target endpoint and expected bottleneck in mind.

## Examples

```bash
# Install SPX via PECL
pecl install spx

# php.ini configuration
extension=spx.so
spx.http_enabled=1
spx.http_key=my-secret-key
spx.data_dir=/tmp/spx

# Trigger profiling via URL parameter
curl "http://app/api/reports?SPX_KEY=my-secret-key&SPX_PROFILE=1"

# Trigger profiling via HTTP header
curl -H "X-SPX-Profile: 1" "http://app/api/reports?SPX_KEY=my-secret-key"

# View SPX web UI
# Navigate to http://app/SPX?SPX_KEY=my-secret-key

# Nginx block external SPX access
location /SPX {
    allow 127.0.0.1;
    deny all;
}

# Clean up old profiles (cron daily)
find /tmp/spx -type f -mtime +30 -delete
```

## Related Topics

- Tideways Setup — Continuous Monitoring
- Blackfire Installation and Triggered Profiling
- Xdebug Profiling Setup and Analysis
- Flame Graph Generation and Interpretation
- Production Guardrails and Profiling Cost

## AI Agent Notes

- SPX is the best choice for air-gapped environments — zero external dependencies
- 0% overhead when not profiling makes it safe to keep installed but disabled
- Always verify `spx.http_key` security before enabling in any non-local environment
- SPX is request-scoped — each profile is a single request, not aggregated across requests
- For continuous production profiling, recommend Tideways or Blackfire instead

## Verification

- [ ] SPX extension installed (`php -m | grep spx`)
- [ ] `spx.http_key` configured with a strong random value
- [ ] SPX UI access restricted to localhost or internal network via firewall
- [ ] SPX disabled in production configuration (`spx.http_enabled=0`)
- [ ] Profile data directory created with restricted permissions (0700)
- [ ] Data retention policy configured (cron or rotation)
- [ ] SPX_PROFILE parameter successfully triggers a profile
- [ ] Web UI accessible and displaying call tree, flame graph, flat profile
- [ ] Profiles cleaned up after verification to avoid disk accumulation
- [ ] No SPX keys committed to version control
