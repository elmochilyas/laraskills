# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Profiling & Observability
**Knowledge Unit:** Tideways Setup â€” Extension, Daemon, API Key, Sample Rate, Tracepoint Configuration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Use endpoint-level sampling**: Sample high-traffic endpoints at lower rates (5%), low-traffic endpoints at higher rates (50%). Balances data quality with overhead. Configure via Tideways dashboard rules.
- [ ] **Set 10-20% sample rate for production**: Provides statistically valid data with <3% overhead. Only enable 100% sampling during targeted debugging windows.
- [ ] **Avoid excessive tracepoints**: Each additional tracepoint increases overhead. Instrument only the SQL queries and HTTP calls relevant to your investigation.
- [ ] **Pair with slow logs**: Tideways identifies slow requests â€” correlate with PHP-FPM slow log for deeper analysis of individual slow requests.
- [ ] **Store profiles for 30+ days**: Correlate with deploy events to identify performance regressions over time.
- [ ] Tideways PHP extension installed and enabled (`php -m | grep tideways`)
- [ ] Daemon running and connected to Tideways cloud (`tideways-daemon --status`)
- [ ] Sample rate configured at 10-20% for production environments
- [ ] Endpoint-level sampling rules configured in Tideways dashboard
- [ ] API key stored securely (environment variable, not hardcoded)
- [ ] Tideways extension and daemon installed on all target hosts
- [ ] 10-20% sample rate with <3% overhead in production
- [ ] Endpoint-level sampling balances data quality across traffic volumes
- [ ] Tracepoints instrument only relevant SQL/HTTP calls
- [ ] API key stored securely in environment variables
- [ ] Performance regressions detected via deploy-event correlation
- [ ] Tideways extension installed (`php -m | grep tideways`)
- [ ] Daemon running and connected to Tideways cloud
- [ ] Sample rate configured at 10-20% for production
- [ ] Endpoint-level sampling rules configured

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Sampling vs Instrumentation**: Sampling profilers (Xdebug, Tideways, eBPF) have low overhead (1-3%) and are safe for production but provide statistical approximation. Instrumented profilers (Blackfire, Xdebug trace mode) provide exact measurements but have 10-30% overhead Ã¢â‚¬â€ development/staging only.
- [ ] **Production vs Staging profiling**: Profile in production for authentic results but with sampling only. Use heavier instrumentation in staging with production-like traffic. The production profile is the ground truth Ã¢â‚¬â€ always validate staging findings against production.
- [ ] **Data pipeline**: PHP extension â†’ local daemon (batch, compress) â†’ Tideways cloud API â†’ dashboard query
- [ ] **Daemon isolation**: Daemon runs as a separate process. PHP-FPM workers never connect to Tideways cloud directly â€” only the daemon makes outbound connections. This improves security and reduces PHP process overhead.
- [ ] **Multi-host aggregation**: Multiple application servers each run a local daemon. Tideways cloud aggregates metrics across all hosts.
- [ ] **Container support**: Daemon can run as a sidecar container in Kubernetes. Ensure daemon and PHP containers share a network namespace.
- [ ] Document and follow through on architectural decision: Tideways adoption for continuous profiling
- [ ] Ensure architecture aligns with core concept: **Extension**: `tideways-php` extension. Enables `tideways_xhprof()` function and automatic request monitoring. Minimal overhead in sampling mode (<3%).
- [ ] Ensure architecture aligns with core concept: **Daemon**: `tideways-daemon` receives traces from all PHP processes on the host, batches them, and sends to Tideways API. Runs locally â€” no outbound connections from PHP processes.
- [ ] Ensure architecture aligns with core concept: **Sample rate**: `TIDEWAYS_SAMPLE_RATE=20` (percent of requests profiled). Higher sampling gives better data but higher overhead. 10-20% is standard for production; 50-100% for staging.
- [ ] Ensure architecture aligns with core concept: **Tracepoint configuration**: Define which SQL queries, HTTP requests, and function calls to instrument via `TIDEWAYS_TRACEPOINTS` environment variable. Excessive tracepoints increase overhead.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Use endpoint-level sampling**: Sample high-traffic endpoints at lower rates (5%), low-traffic endpoints at higher rates (50%). Balances data quality with overhead. Configure via Tideways dashboard rules.
- [ ] **Set 10-20% sample rate for production**: Provides statistically valid data with <3% overhead. Only enable 100% sampling during targeted debugging windows.
- [ ] **Avoid excessive tracepoints**: Each additional tracepoint increases overhead. Instrument only the SQL queries and HTTP calls relevant to your investigation.
- [ ] **Pair with slow logs**: Tideways identifies slow requests â€” correlate with PHP-FPM slow log for deeper analysis of individual slow requests.
- [ ] **Store profiles for 30+ days**: Correlate with deploy events to identify performance regressions over time.

# Performance Checklist (from 04/06)
- [ ] Sampling overhead: <3% at 10-20% sample rate in production
- [ ] Daemon resource usage: ~50 MB RAM, minimal CPU
- [ ] Extension overhead when not sampling: <1% (fast-path check on each request)
- [ ] 100% sampling adds 5-15% overhead â€” use only during targeted debugging windows
- [ ] Excessive tracepoints can increase overhead to 5-10%
- [ ] Xdebug (sampling)
- [ ] Blackfire
- [ ] Tideways
- [ ] eBPF

# Security Checklist (from 04/06 - only if relevant)
- [ ] API key must be stored securely â€” never hardcode in application code or version control
- [ ] Use environment variables or secrets manager (`.env` file, Vault, Kubernetes secrets)
- [ ] Tideways cloud connection uses HTTPS â€” ensure firewall allows outbound traffic to Tideways API endpoints
- [ ] Daemon does not expose any network ports â€” communication is unidirectional from daemon to Tideways cloud
- [ ] Restrict dashboard access to authorized team members â€” profiles may expose sensitive code paths and data

# Reliability Checklist (from 04/05/06)
- [ ] **Observer effect**: Profiling overhead alters application behavior. Symptom: Production profiling with heavy tools shows different performance profile than normal. Mitigation: Use low-overhead (<3%) profilers for production. Accept statistical approximation.
- [ ] **Profiling bias**: Timing signals in sampling profilers correlate with application intervals. Symptom: Under- or over-representation of certain code paths. Mitigation: Use random sampling intervals, vary sampling frequency.
- [ ] **Flame graph misinterpretation**: Wide bottom frames misidentified as bottlenecks. Symptom: Optimizing the wrong function. Mitigation: Always check whether width is self-time or inclusive. Wide bottom frame with many children = potentially architectural.
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Testing Checklist (from 04/06)
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
- [ ] Tideways extension and daemon installed on all target hosts
- [ ] 10-20% sample rate with <3% overhead in production
- [ ] Endpoint-level sampling balances data quality across traffic volumes
- [ ] Tracepoints instrument only relevant SQL/HTTP calls
- [ ] API key stored securely in environment variables
- [ ] Performance regressions detected via deploy-event correlation
- [ ] Tideways extension installed (`php -m | grep tideways`)
- [ ] Daemon running and connected to Tideways cloud
- [ ] Sample rate configured at 10-20% for production
- [ ] Endpoint-level sampling rules configured
- [ ] Tracepoints set to relevant types only
- [ ] API key in environment variable, not hardcoded
- [ ] p50/p95/p99 metrics visible for critical endpoints
- [ ] Deploy events tagged for regression correlation
- [ ] Profiling overhead <3%

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Use endpoint-level sampling**: Sample high-traffic endpoints at lower rates (5%), low-traffic endpoints at higher rates (50%). Balances data quality with overhead. Configure via Tideways dashboard rules.
- [ ] **Set 10-20% sample rate for production**: Provides statistically valid data with <3% overhead. Only enable 100% sampling during targeted debugging windows.
- [ ] **Avoid excessive tracepoints**: Each additional tracepoint increases overhead. Instrument only the SQL queries and HTTP calls relevant to your investigation.
- [ ] **Pair with slow logs**: Tideways identifies slow requests â€” correlate with PHP-FPM slow log for deeper analysis of individual slow requests.
- [ ] **Store profiles for 30+ days**: Correlate with deploy events to identify performance regressions over time.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: 100% sampling in production
- [ ] Avoid: Hardcoding API key
- [ ] Avoid: Running without daemon
- [ ] Avoid: Over-instrumenting tracepoints
- [ ] Avoid anti-pattern: **Set-and-forget configuration**: Tideways configuration should be reviewed quarterly. As application traffic patterns change, sample rate and tracepoint configuration may need adjustment.
- [ ] Avoid anti-pattern: **Monitoring without action**: Collecting Tideways data without a regular review cadence wastes the subscription cost. Schedule weekly performance review meetings.
- [ ] Avoid anti-pattern: **Single sample rate for all endpoints**: High-traffic and low-traffic endpoints have different sampling needs. Use endpoint-level sampling rules.
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
**Core Concepts:** **Extension**: `tideways-php` extension. Enables `tideways_xhprof()` function and automatic request monitoring. Minimal overhead in sampling mode (<3%)., **Daemon**: `tideways-daemon` receives traces from all PHP processes on the host, batches them, and sends to Tideways API. Runs locally â€” no outbound connections from PHP processes., **Sample rate**: `TIDEWAYS_SAMPLE_RATE=20` (percent of requests profiled). Higher sampling gives better data but higher overhead. 10-20% is standard for production; 50-100% for staging., **Tracepoint configuration**: Define which SQL queries, HTTP requests, and function calls to instrument via `TIDEWAYS_TRACEPOINTS` environment variable. Excessive tracepoints increase overhead.
**Skills:** Blackfire Installation and Triggered Profiling, SPX Self-Hosted Profiling, Flame Graph Generation and Interpretation, Production Guardrails and Profiling Cost
**Decision Trees:** Tideways adoption for continuous profiling
**Anti-Patterns:** Production Profiling Without Overhead Control, Firefighting Without Flame Graphs, Observability Without Traces, Dashboards Without Actionable Alerts, Ignoring Memory Profiling (CPU-Only Focus)
**Related Topics:** Blackfire Installation and Triggered Profiling, SPX Self-Hosted Profiling, Flame Graph Generation and Interpretation, APM Integration Patterns, Production Guardrails and Profiling Cost

