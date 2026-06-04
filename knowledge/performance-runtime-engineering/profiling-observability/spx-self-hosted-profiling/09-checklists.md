# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Profiling & Observability
**Knowledge Unit:** SPX Self-Hosted Profiling — Private Environments, Modern Web UI
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always set `spx.http_key`**: Without it, anyone can trigger profiling by adding `SPX_PROFILE=1` to any URL, degrading performance. Use a strong random key.
- [ ] **Restrict SPX UI access**: Bind SPX to localhost or internal network. Use firewall rules (e.g., `allow 127.0.0.1 only`). Never expose SPX UI to the public internet.
- [ ] **Manage data retention**: Profiles are ~10-50KB each. At 1000 profiles/day = ~10-50MB/day. Configure cleanup cron jobs or set `spx.data_dir` to a temp directory with rotation.
- [ ] **Disable SPX in production unless actively debugging**: Remove the extension or set `spx.http_enabled=0` in production. Only enable during targeted investigation windows.
- [ ] SPX extension installed (`php -m | grep spx`)
- [ ] `spx.http_key` configured with a strong random value
- [ ] SPX UI access restricted to localhost or internal network via firewall
- [ ] SPX disabled in production configuration (`spx.http_enabled=0`)
- [ ] Profile data directory created with restricted permissions (0700)
- [ ] SPX installed and secured with strong HTTP key
- [ ] UI restricted to localhost only
- [ ] On-demand profiling works with zero overhead on non-profiled requests
- [ ] Profiles interpreted via call tree, flame graph, and flat profile
- [ ] Data retention policy prevents disk accumulation
- [ ] HTTP key configured with strong random value
- [ ] Web UI restricted to localhost (firewall rule)
- [ ] SPX disabled in production (`spx.http_enabled=0`)
- [ ] Profile data directory with restricted permissions (0700)
- [ ] Data retention configured (cron cleanup)
- [ ] Triggered profiling works â€” profile generated and viewable in UI

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Sampling vs Instrumentation**: Sampling profilers (Xdebug, Tideways, eBPF) have low overhead (1-3%) and are safe for production but provide statistical approximation. Instrumented profilers (Blackfire, Xdebug trace mode) provide exact measurements but have 10-30% overhead â€” development/staging only.
- [ ] **Production vs Staging profiling**: Profile in production for authentic results but with sampling only. Use heavier instrumentation in staging with production-like traffic. The production profile is the ground truth â€” always validate staging findings against production.
- [ ] **No daemon required**: SPX runs entirely within the PHP process. Profile data is written directly to disk by the extension â€” no separate daemon or outbound connections.
- [ ] **Request-scoped profiling**: SPX profiles only the request that includes the trigger parameter. No background sampling. This makes it ideal for targeted investigations.
- [ ] **File-based storage**: Profiles are stored in `spx.data_dir`. Ensure this directory has sufficient disk space and is on a fast filesystem (not network-mounted in most cases).
- [ ] **Web UI served by application**: The SPX UI endpoint is served by the application's PHP process â€” ensure the application can handle UI requests without interference.
- [ ] Document and follow through on architectural decision: SPX adoption as free profiling alternative
- [ ] Ensure architecture aligns with core concept: **Installation**: `pecl install spx` or compile from source. PHP extension `spx.so`. Configure via `php.ini`: `spx.http_enabled=1`, `spx.http_key=secret-key`, `spx.data_dir=/tmp/spx`.
- [ ] Ensure architecture aligns with core concept: **Triggering**: Add `?SPX_KEY=secret-key&SPX_PROFILE=1` to any URL, or use HTTP header `X-SPX-Profile: 1`. Profile collected for that request only â€” on-demand, not continuous.
- [ ] Ensure architecture aligns with core concept: **Web UI**: Navigate to `http://app/SPX?SPX_KEY=secret-key`. Dashboard shows: call tree (inclusive/exclusive time), flame graph, flat profile, memory timeline, and request metadata.
- [ ] Ensure architecture aligns with core concept: **Data storage**: Profiles stored as flat files in `spx.data_dir`. Configurable retention. No external service or cloud dependency needed.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always set `spx.http_key`**: Without it, anyone can trigger profiling by adding `SPX_PROFILE=1` to any URL, degrading performance. Use a strong random key.
- [ ] **Restrict SPX UI access**: Bind SPX to localhost or internal network. Use firewall rules (e.g., `allow 127.0.0.1 only`). Never expose SPX UI to the public internet.
- [ ] **Manage data retention**: Profiles are ~10-50KB each. At 1000 profiles/day = ~10-50MB/day. Configure cleanup cron jobs or set `spx.data_dir` to a temp directory with rotation.
- [ ] **Disable SPX in production unless actively debugging**: Remove the extension or set `spx.http_enabled=0` in production. Only enable during targeted investigation windows.

# Performance Checklist (from 04/06)
- [ ] Overhead when profiling: <5% (instrumentation-based, not sampling)
- [ ] Overhead when not profiling: 0% â€” no active extension overhead on non-profiled requests
- [ ] Disk usage: ~10-50KB per profile. At 1000 profiles/day = ~10-50MB/day
- [ ] Profile generation time: adds 50-200ms to request depending on complexity
- [ ] Memory: SPX stores call tree in memory during request, freed after request completes
- [ ] Xdebug (sampling)
- [ ] Blackfire
- [ ] Tideways
- [ ] eBPF

# Security Checklist (from 04/06 - only if relevant)
- [ ] **Always set `spx.http_key`**: Without it, attackers can trigger on-demand profiling on any request, causing performance degradation and exposing application internals (function names, file paths, call stacks).
- [ ] **Restrict SPX UI to localhost**: Configure web server to block external access to the SPX endpoint (e.g., Nginx `allow 127.0.0.1; deny all;`).
- [ ] **Disable in production by default**: SPX should only be enabled during active debugging sessions. Never leave `spx.http_enabled=1` in production configuration.
- [ ] **Profile files contain sensitive data**: Function names, file paths, arguments, and memory usage patterns are written to flat files. Ensure `spx.data_dir` has restricted permissions (0700).
- [ ] **Never commit `spx.http_key`**: Store in environment variables or secrets manager, not in version control.

# Reliability Checklist (from 04/05/06)
- [ ] **Observer effect**: Profiling overhead alters application behavior. Symptom: Production profiling with heavy tools shows different performance profile than normal. Mitigation: Use low-overhead (<3%) profilers for production. Accept statistical approximation.
- [ ] **Profiling bias**: Timing signals in sampling profilers correlate with application intervals. Symptom: Under- or over-representation of certain code paths. Mitigation: Use random sampling intervals, vary sampling frequency.
- [ ] **Flame graph misinterpretation**: Wide bottom frames misidentified as bottlenecks. Symptom: Optimizing the wrong function. Mitigation: Always check whether width is self-time or inclusive. Wide bottom frame with many children = potentially architectural.
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Testing Checklist (from 04/06)
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
- [ ] SPX installed and secured with strong HTTP key
- [ ] UI restricted to localhost only
- [ ] On-demand profiling works with zero overhead on non-profiled requests
- [ ] Profiles interpreted via call tree, flame graph, and flat profile
- [ ] Data retention policy prevents disk accumulation
- [ ] HTTP key configured with strong random value
- [ ] Web UI restricted to localhost (firewall rule)
- [ ] SPX disabled in production (`spx.http_enabled=0`)
- [ ] Profile data directory with restricted permissions (0700)
- [ ] Data retention configured (cron cleanup)
- [ ] Triggered profiling works â€” profile generated and viewable in UI

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always set `spx.http_key`**: Without it, anyone can trigger profiling by adding `SPX_PROFILE=1` to any URL, degrading performance. Use a strong random key.
- [ ] **Restrict SPX UI access**: Bind SPX to localhost or internal network. Use firewall rules (e.g., `allow 127.0.0.1 only`). Never expose SPX UI to the public internet.
- [ ] **Manage data retention**: Profiles are ~10-50KB each. At 1000 profiles/day = ~10-50MB/day. Configure cleanup cron jobs or set `spx.data_dir` to a temp directory with rotation.
- [ ] **Disable SPX in production unless actively debugging**: Remove the extension or set `spx.http_enabled=0` in production. Only enable during targeted investigation windows.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: SPX exposed without HTTP key
- [ ] Avoid: Leaving SPX enabled in production
- [ ] Avoid: Unlimited profile retention
- [ ] Avoid: Profiling every request
- [ ] Avoid anti-pattern: **Continuous profiling with SPX**: SPX is designed for on-demand profiling. Using it continuously wastes disk space and adds unnecessary overhead. Use Tideways or Blackfire for continuous profiling.
- [ ] Avoid anti-pattern: **Publicly accessible SPX UI**: The SPX web UI exposes detailed profiling data including function names and call stacks. Never expose it without authentication and IP restriction.
- [ ] Avoid anti-pattern: **Profiling production without a hypothesis**: SPX generates detailed per-request profiles. Without a specific question, you'll have data but no insight. Always profile with a target endpoint and expected bottleneck in mind.
- [ ] Guard against anti-pattern: Production Profiling Without Overhead Control
- [ ] Guard against anti-pattern: Firefighting Without Flame Graphs
- [ ] Guard against anti-pattern: Observability Without Traces
- [ ] Guard against anti-pattern: Dashboards Without Actionable Alerts
- [ ] Guard against anti-pattern: Ignoring Memory Profiling (CPU-Only Focus)
- [ ] Sampling rate <= 10%
- [ ] Profiler CPU < 3%

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Installation**: `pecl install spx` or compile from source. PHP extension `spx.so`. Configure via `php.ini`: `spx.http_enabled=1`, `spx.http_key=secret-key`, `spx.data_dir=/tmp/spx`., **Triggering**: Add `?SPX_KEY=secret-key&SPX_PROFILE=1` to any URL, or use HTTP header `X-SPX-Profile: 1`. Profile collected for that request only â€” on-demand, not continuous., **Web UI**: Navigate to `http://app/SPX?SPX_KEY=secret-key`. Dashboard shows: call tree (inclusive/exclusive time), flame graph, flat profile, memory timeline, and request metadata., **Data storage**: Profiles stored as flat files in `spx.data_dir`. Configurable retention. No external service or cloud dependency needed.
**Skills:** Tideways Setup â€” Continuous Monitoring, Blackfire Installation and Triggered Profiling, Xdebug Profiling Setup and Analysis, Flame Graph Generation and Interpretation
**Decision Trees:** SPX adoption as free profiling alternative
**Anti-Patterns:** Production Profiling Without Overhead Control, Firefighting Without Flame Graphs, Observability Without Traces, Dashboards Without Actionable Alerts, Ignoring Memory Profiling (CPU-Only Focus)
**Related Topics:** Tideways Setup â€” Continuous Monitoring, Blackfire Installation and Triggered Profiling, Xdebug Profiling Setup and Analysis, Flame Graph Generation and Interpretation, Production Guardrails and Profiling Cost

