# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Profiling & Observability
**Knowledge Unit:** Blackfire Installation and Triggered Profiling â€” Probe, Agent, CI Assertions
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Use triggered profiling for production**: Send `X-Blackfire-Profile: true` only for specific requests. Zero overhead for non-profiled traffic. Never enable always-on profiling.
- [ ] **Canary profiling pattern**: Inject `X-Blackfire-Profile: true` header on 0.1% of traffic at the load balancer level. Continuous profiling with negligible fleet-wide overhead.
- [ ] **Always ensure agent is running**: `php -m | grep blackfire` confirms the probe. `systemctl status blackfire-agent` confirms the agent. Without the agent, profiles are collected but never sent.
- [ ] **Enforce performance budgets in CI**: Use Blackfire assertions to fail builds when wall time, I/O time, or CPU time exceed thresholds. Catch regressions before deployment.
- [ ] **Compare profiles in the dashboard**: Blackfire's comparison view shows before/after optimization side-by-side with color-coded improvements and regressions.
- [ ] Blackfire probe installed and enabled (`php -m | grep blackfire`)
- [ ] Blackfire agent running (`systemctl status blackfire-agent`)
- [ ] Triggered profiling working: `curl -H "X-Blackfire-Profile: true"` generates a profile visible in dashboard
- [ ] CI assertions configured for critical endpoints/commands
- [ ] CI pipeline passes with performance budgets met
- [ ] Blackfire probe and agent installed on all target environments
- [ ] Triggered profiling works â€” zero overhead on non-profiled requests
- [ ] CI pipeline enforces performance budgets with automated assertions
- [ ] Canary profiling provides continuous production baseline (optional)
- [ ] Before/after comparison validates optimization impact
- [ ] Credentials stored securely in environment variables
- [ ] Probe installed and verified (`php -m | grep blackfire`)
- [ ] Agent running (`systemctl status blackfire-agent`)
- [ ] Triggered profiling working â€” profile generated via HTTP header
- [ ] CI pipeline fails when performance budget is exceeded

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Sampling vs Instrumentation**: Sampling profilers (Xdebug, Tideways, eBPF) have low overhead (1-3%) and are safe for production but provide statistical approximation. Instrumented profilers (Blackfire, Xdebug trace mode) provide exact measurements but have 10-30% overhead Ã¢â‚¬â€ development/staging only.
- [ ] **Production vs Staging profiling**: Profile in production for authentic results but with sampling only. Use heavier instrumentation in staging with production-like traffic. The production profile is the ground truth Ã¢â‚¬â€ always validate staging findings against production.
- [ ] **Data pipeline**: PHP process (probe) â†’ Unix socket â†’ agent (daemon) â†’ HTTPS â†’ Blackfire cloud â†’ dashboard/API
- [ ] **Probe-agent communication**: Via Unix socket (`/var/run/blackfire/agent.sock`). No network ports needed between PHP and agent. Agent makes outbound HTTPS to Blackfire cloud.
- [ ] **CI integration**: `blackfire run` wraps a CLI command (PHP script, test suite). Profiles the wrapped execution, applies assertions, exits with non-zero code on assertion failure.
- [ ] **On-premise storage**: Blackfire Enterprise supports storing profiles on your own infrastructure instead of Blackfire cloud. Same architecture, different backend endpoint.
- [ ] Document and follow through on architectural decision: Blackfire adoption for profiling
- [ ] Ensure architecture aligns with core concept: **Probe installation**: `apt install blackfire-php` or `pecl install blackfire`. Blackfire PHP extension. Requires restarting PHP-FPM. Minimal overhead (~2% in sampling mode).
- [ ] Ensure architecture aligns with core concept: **Agent**: Local daemon (`blackfire-agent`) that caches profiles and forwards to Blackfire cloud. Can be configured for on-premise storage (Blackfire Enterprise).
- [ ] Ensure architecture aligns with core concept: **Triggered profiling**: Send `X-Blackfire-Profile: true` header with a request. Agent captures a full profile of that specific request. No profiling on other requests â€” zero overhead for non-profiled traffic.
- [ ] Ensure architecture aligns with core concept: **Assertions (CI)**: `blackfire run --assert="main.wall_time < 200ms" --assert="main.io_time < 50ms" php script.php`. Build fails if assertions fail. Enforce performance budgets in CI pipelines.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Use triggered profiling for production**: Send `X-Blackfire-Profile: true` only for specific requests. Zero overhead for non-profiled traffic. Never enable always-on profiling.
- [ ] **Canary profiling pattern**: Inject `X-Blackfire-Profile: true` header on 0.1% of traffic at the load balancer level. Continuous profiling with negligible fleet-wide overhead.
- [ ] **Always ensure agent is running**: `php -m | grep blackfire` confirms the probe. `systemctl status blackfire-agent` confirms the agent. Without the agent, profiles are collected but never sent.
- [ ] **Enforce performance budgets in CI**: Use Blackfire assertions to fail builds when wall time, I/O time, or CPU time exceed thresholds. Catch regressions before deployment.
- [ ] **Compare profiles in the dashboard**: Blackfire's comparison view shows before/after optimization side-by-side with color-coded improvements and regressions.

# Performance Checklist (from 04/06)
- [ ] Sampling mode overhead: 2-5% â€” production-safe for triggered profiling
- [ ] Instrumentation mode overhead: 10-25% â€” staging only
- [ ] Agent resource usage: ~50 MB RAM, minimal CPU
- [ ] Profile upload: ~50-200KB per profile, sent asynchronously by agent
- [ ] Zero overhead for non-profiled requests (triggered mode only)
- [ ] CI profiling overhead: adds to test suite runtime â€” account for 2-5x time increase
- [ ] Xdebug (sampling)
- [ ] Blackfire
- [ ] Tideways
- [ ] eBPF

# Security Checklist (from 04/06 - only if relevant)
- [ ] Blackfire credentials (client ID/secret) must be stored securely â€” never hardcode in version control
- [ ] Probe-agent communication via local Unix socket â€” no network exposure
- [ ] Agent-to-cloud communication uses HTTPS â€” ensure firewall allows outbound to Blackfire API
- [ ] Profile data contains function names, file paths, and SQL queries â€” restrict dashboard access
- [ ] On-premise agent configuration requires secure storage of the agent token
- [ ] CI assertion configurations are safe to commit (they define performance budgets, not secrets)

# Reliability Checklist (from 04/05/06)
- [ ] **Observer effect**: Profiling overhead alters application behavior. Symptom: Production profiling with heavy tools shows different performance profile than normal. Mitigation: Use low-overhead (<3%) profilers for production. Accept statistical approximation.
- [ ] **Profiling bias**: Timing signals in sampling profilers correlate with application intervals. Symptom: Under- or over-representation of certain code paths. Mitigation: Use random sampling intervals, vary sampling frequency.
- [ ] **Flame graph misinterpretation**: Wide bottom frames misidentified as bottlenecks. Symptom: Optimizing the wrong function. Mitigation: Always check whether width is self-time or inclusive. Wide bottom frame with many children = potentially architectural.
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Testing Checklist (from 04/06)
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
- [ ] Blackfire probe and agent installed on all target environments
- [ ] Triggered profiling works â€” zero overhead on non-profiled requests
- [ ] CI pipeline enforces performance budgets with automated assertions
- [ ] Canary profiling provides continuous production baseline (optional)
- [ ] Before/after comparison validates optimization impact
- [ ] Credentials stored securely in environment variables
- [ ] Probe installed and verified (`php -m | grep blackfire`)
- [ ] Agent running (`systemctl status blackfire-agent`)
- [ ] Triggered profiling working â€” profile generated via HTTP header
- [ ] CI pipeline fails when performance budget is exceeded
- [ ] Canary profiling configured at load balancer (optional)
- [ ] Credentials stored in environment variables, not version control

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Use triggered profiling for production**: Send `X-Blackfire-Profile: true` only for specific requests. Zero overhead for non-profiled traffic. Never enable always-on profiling.
- [ ] **Canary profiling pattern**: Inject `X-Blackfire-Profile: true` header on 0.1% of traffic at the load balancer level. Continuous profiling with negligible fleet-wide overhead.
- [ ] **Always ensure agent is running**: `php -m | grep blackfire` confirms the probe. `systemctl status blackfire-agent` confirms the agent. Without the agent, profiles are collected but never sent.
- [ ] **Enforce performance budgets in CI**: Use Blackfire assertions to fail builds when wall time, I/O time, or CPU time exceed thresholds. Catch regressions before deployment.
- [ ] **Compare profiles in the dashboard**: Blackfire's comparison view shows before/after optimization side-by-side with color-coded improvements and regressions.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Blackfire probe without agent
- [ ] Avoid: Always-on profiling in production
- [ ] Avoid: Ignoring CI assertions
- [ ] Avoid: Storing credentials in code
- [ ] Avoid anti-pattern: **Blackfire without assertions**: Using Blackfire only for manual profiling in production but not enforcing performance budgets in CI. The CI integration is where long-term value comes from.
- [ ] Avoid anti-pattern: **Comparing profiles from different modes**: Sampling vs instrumentation mode produce different metrics. Always use the same mode for before/after comparisons.
- [ ] Avoid anti-pattern: **Profiling without a baseline**: Without a reference profile (before optimization), you can't measure improvement. Always profile before making changes.
- [ ] Avoid anti-pattern: **Over-asserting in CI**: Too many assertions or overly tight thresholds cause noisy failures. Start with 2-3 critical assertions and relax as needed.
- [ ] Guard against anti-pattern: Production Profiling Without Overhead Control
- [ ] Guard against anti-pattern: Firefighting Without Flame Graphs
- [ ] Guard against anti-pattern: Observability Without Traces
- [ ] Guard against anti-pattern: Dashboards Without Actionable Alerts
- [ ] Guard against anti-pattern: Ignoring Memory Profiling (CPU-Only Focus)
- [ ] Sampling rate <= 10%

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
**Core Concepts:** **Probe installation**: `apt install blackfire-php` or `pecl install blackfire`. Blackfire PHP extension. Requires restarting PHP-FPM. Minimal overhead (~2% in sampling mode)., **Agent**: Local daemon (`blackfire-agent`) that caches profiles and forwards to Blackfire cloud. Can be configured for on-premise storage (Blackfire Enterprise)., **Triggered profiling**: Send `X-Blackfire-Profile: true` header with a request. Agent captures a full profile of that specific request. No profiling on other requests â€” zero overhead for non-profiled traffic., **Assertions (CI)**: `blackfire run --assert="main.wall_time < 200ms" --assert="main.io_time < 50ms" php script.php`. Build fails if assertions fail. Enforce performance budgets in CI pipelines.
**Skills:** Tideways Setup â€” Continuous Monitoring, SPX Self-Hosted Profiling, eBPF PHP Profiling, Production Guardrails and Profiling Cost, CI Integration and Baseline Comparison
**Decision Trees:** Blackfire adoption for profiling
**Anti-Patterns:** Production Profiling Without Overhead Control, Firefighting Without Flame Graphs, Observability Without Traces, Dashboards Without Actionable Alerts, Ignoring Memory Profiling (CPU-Only Focus)
**Related Topics:** Tideways Setup â€” Continuous Monitoring, SPX Self-Hosted Profiling, eBPF PHP Profiling, Production Guardrails and Profiling Cost, CI/CD Performance Regression Detection

