# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Profiling & Observability
**Knowledge Unit:** Production Guardrails â€” SLO-Driven Profiling Activation, Canary Pool Isolation, Feature-Flag Gating
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Allocate a profiling cost budget**: Reserve 2% of total CPU budget for profiling. At 5% fleet-wide overhead, reduce sample rate or canary percentage. Monitor profiling overhead as a dashboard metric.
- [ ] **Never enable profiling during an active incident on all hosts**: If the system is already CPU-bound, adding profiling overhead (5-10% in high-frequency mode) can cause complete collapse. Always activate profiling on canary hosts first.
- [ ] **Use canary pools for continuous profiling**: Run low-overhead profiling (Tideways/SPX at 10% sample rate) on canary hosts only. This provides representative data without fleet-wide overhead.
- [ ] **Automate SLO-driven activation**: Configure alert manager to trigger profiling activation when SLO burn rate exceeds 2x. Deactivate when SLO is restored. This ensures profiling is available when most needed.
- [ ] **Exclude health checks and monitoring paths**: Health check, metrics, and probe endpoints should never be profiled. Configure profiling tools with path exclusion lists.
- [ ] SLO-driven profiling automation configured (alert â†’ profiling activation â†’ deactivation)
- [ ] Canary pool hosts identified and tagged for profiling (1-5% of fleet)
- [ ] Feature-flag gating implemented for endpoint/user-segment profiling
- [ ] Health check endpoints excluded from profiling configuration
- [ ] Profiling overhead budget defined (2% of CPU) and monitored as a dashboard metric
- [ ] Profiling overhead â‰¤2% of CPU at all times
- [ ] SLO-driven activation automates profiling during incidents
- [ ] Canary pool limits blast radius to 1-5% of traffic
- [ ] Health check endpoints excluded from profiling
- [ ] Incident runbook tested and documented
- [ ] No profiling-related cascading failures
- [ ] Profiling cost budget defined (2% CPU) and monitored
- [ ] Canary pool hosts tagged and configured for profiling
- [ ] SLO-driven activation automation configured (alert â†’ profiling â†’ deactivation)
- [ ] Feature-flag gating implemented for endpoint/user profiling

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Sampling vs Instrumentation**: Sampling profilers (Xdebug, Tideways, eBPF) have low overhead (1-3%) and are safe for production but provide statistical approximation. Instrumented profilers (Blackfire, Xdebug trace mode) provide exact measurements but have 10-30% overhead Ã¢â‚¬â€ development/staging only.
- [ ] **Production vs Staging profiling**: Profile in production for authentic results but with sampling only. Use heavier instrumentation in staging with production-like traffic. The production profile is the ground truth Ã¢â‚¬â€ always validate staging findings against production.
- [ ] **SLO-driven pipeline**: SLO monitoring â†’ burn rate alert â†’ profiling activation API â†’ PHP-FPM reload with profiling enabled â†’ profile collection â†’ stop profiling â†’ PHP-FPM reload without profiling
- [ ] **Canary pool architecture**: Load balancer â†’ production pool (95% traffic, no profiling) + canary pool (5% traffic, profiling enabled). Canary pool mirrors production configuration (same code, same infrastructure).
- [ ] **Feature-flag integration**: Profiling checks feature flag per-request. If flag is enabled for the current user/endpoint/segment, profiling is activated for that request. Use a fast in-memory check to minimize overhead.
- [ ] **Cost monitoring**: Profile profiling overhead as a metric. Track CPU % attributed to profiling per host. Alert when per-host profiling overhead exceeds the budget allocation.
- [ ] Document and follow through on architectural decision: Profiling in production safely
- [ ] Ensure architecture aligns with core concept: **SLO-driven profiling**: Profiling (high-frequency) is disabled by default. When an SLO breach alert fires (burn rate > 2x), profiling automatically activates on the affected hosts at 50-100 Hz. Deactivates when SLO is restored.
- [ ] Ensure architecture aligns with core concept: **Canary pool isolation**: Dedicated host(s) in the load balancer pool tagged for profiling. Only a fraction of user traffic (1-5%) hits these hosts. Profile data from canary represents the entire fleet without fleet-wide overhead.
- [ ] Ensure architecture aligns with core concept: **Feature-flag gating**: Use feature flags to enable profiling for specific endpoints, users, or A/B test groups. Example: `Profiling::enabledFor('checkout', auth()->id())` only profiles checkout for test users.
- [ ] Ensure architecture aligns with core concept: **Health check exclusion**: Never profile health check endpoints. They create noise in profiles and serve no diagnostic value. Configure profiling tools to skip known health check paths.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Allocate a profiling cost budget**: Reserve 2% of total CPU budget for profiling. At 5% fleet-wide overhead, reduce sample rate or canary percentage. Monitor profiling overhead as a dashboard metric.
- [ ] **Never enable profiling during an active incident on all hosts**: If the system is already CPU-bound, adding profiling overhead (5-10% in high-frequency mode) can cause complete collapse. Always activate profiling on canary hosts first.
- [ ] **Use canary pools for continuous profiling**: Run low-overhead profiling (Tideways/SPX at 10% sample rate) on canary hosts only. This provides representative data without fleet-wide overhead.
- [ ] **Automate SLO-driven activation**: Configure alert manager to trigger profiling activation when SLO burn rate exceeds 2x. Deactivate when SLO is restored. This ensures profiling is available when most needed.
- [ ] **Exclude health checks and monitoring paths**: Health check, metrics, and probe endpoints should never be profiled. Configure profiling tools with path exclusion lists.

# Performance Checklist (from 04/06)
- [ ] Profiling overhead varies by tool: Xdebug 50-200%, Blackfire 10-25%, Tideways/SPX 1-5%, eBPF <0.5%
- [ ] Without guardrails, profiling overhead can compound with traffic spikes, causing cascading failures
- [ ] Canary pool isolates profiling overhead to 1-5% of fleet â€” risk is bounded
- [ ] SLO-driven activation ensures profiling only runs when investigation value exceeds overhead cost
- [ ] Feature-flag gating enables surgical profiling â€” overhead is limited to targeted endpoints/users
- [ ] eBPF profiling has such low overhead (<0.5%) that guardrails may not be needed, but PID scoping is still recommended
- [ ] Xdebug (sampling)
- [ ] Blackfire
- [ ] Tideways
- [ ] eBPF

# Security Checklist (from 04/06 - only if relevant)
- [ ] Profile data from canary hosts is as sensitive as production data â€” apply same security controls
- [ ] Feature-flag gating must not profile authenticated user sessions that may contain PII in stack traces
- [ ] SLO-driven activation should use secure automation (alert â†’ API call with authentication)
- [ ] Canary hosts should be treated as production hosts for security patching and compliance
- [ ] Profiling overhead budget metrics should be monitored for anomalies (unexpected profiling activation may indicate a security event)

# Reliability Checklist (from 04/05/06)
- [ ] **Observer effect**: Profiling overhead alters application behavior. Symptom: Production profiling with heavy tools shows different performance profile than normal. Mitigation: Use low-overhead (<3%) profilers for production. Accept statistical approximation.
- [ ] **Profiling bias**: Timing signals in sampling profilers correlate with application intervals. Symptom: Under- or over-representation of certain code paths. Mitigation: Use random sampling intervals, vary sampling frequency.
- [ ] **Flame graph misinterpretation**: Wide bottom frames misidentified as bottlenecks. Symptom: Optimizing the wrong function. Mitigation: Always check whether width is self-time or inclusive. Wide bottom frame with many children = potentially architectural.
- [ ] **Production profiling safety**: Use sampling profilers (1-3% overhead) in production. Never use instrumentation profilers on live traffic. eBPF is ideal for production-zero overhead.
- [ ] **Alert-driven profiling**: Trigger flame graph capture automatically when latency crosses threshold. Store profiles for post-mortem analysis.
- [ ] **Profiling cadence**: Continuous profiling (Tideways/Blackfire) for baseline. On-demand deep profiling (Xdebug) for specific investigations.
- [ ] **Data retention**: Store flame graphs for 30 days minimum. Correlate with deploy events to identify performance regressions.

# Testing Checklist (from 04/06)
- [ ] SLO-driven profiling automation configured (alert â†’ profiling activation â†’ deactivation)
- [ ] Canary pool hosts identified and tagged for profiling (1-5% of fleet)
- [ ] Feature-flag gating implemented for endpoint/user-segment profiling
- [ ] Health check endpoints excluded from profiling configuration
- [ ] Profiling overhead budget defined (2% of CPU) and monitored as a dashboard metric
- [ ] Alert configured for when profiling overhead exceeds budget
- [ ] Profiling activation during incidents documented in runbook (always canary first)
- [ ] SLO burn rate alert tested end-to-end: alert triggers profiling activation
- [ ] Profiling deactivation verified: profiling stops when SLO is restored
- [ ] Automation runs with secure authentication (no manual API calls required during incident)
- [ ] Profiling overhead â‰¤2% of CPU at all times
- [ ] SLO-driven activation automates profiling during incidents
- [ ] Canary pool limits blast radius to 1-5% of traffic
- [ ] Health check endpoints excluded from profiling
- [ ] Incident runbook tested and documented
- [ ] No profiling-related cascading failures
- [ ] Profiling cost budget defined (2% CPU) and monitored
- [ ] Canary pool hosts tagged and configured for profiling
- [ ] SLO-driven activation automation configured (alert â†’ profiling â†’ deactivation)
- [ ] Feature-flag gating implemented for endpoint/user profiling
- [ ] Runbook documents profiling procedure during incidents
- [ ] End-to-end test: SLO breach triggers profiling, SLO restoration stops it

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Allocate a profiling cost budget**: Reserve 2% of total CPU budget for profiling. At 5% fleet-wide overhead, reduce sample rate or canary percentage. Monitor profiling overhead as a dashboard metric.
- [ ] **Never enable profiling during an active incident on all hosts**: If the system is already CPU-bound, adding profiling overhead (5-10% in high-frequency mode) can cause complete collapse. Always activate profiling on canary hosts first.
- [ ] **Use canary pools for continuous profiling**: Run low-overhead profiling (Tideways/SPX at 10% sample rate) on canary hosts only. This provides representative data without fleet-wide overhead.
- [ ] **Automate SLO-driven activation**: Configure alert manager to trigger profiling activation when SLO burn rate exceeds 2x. Deactivate when SLO is restored. This ensures profiling is available when most needed.
- [ ] **Exclude health checks and monitoring paths**: Health check, metrics, and probe endpoints should never be profiled. Configure profiling tools with path exclusion lists.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Enabling profiling during an active incident
- [ ] Avoid: Profiling health check endpoints
- [ ] Avoid: No profiling cost budget
- [ ] Avoid: Continuous 100% profiling on all hosts
- [ ] Avoid: Feature-flag checks adding overhead
- [ ] Avoid anti-pattern: **Always-on profiling without limits**: Continuous profiling across the entire fleet with no budget, no canary, and no SLO binding. This wastes CPU and risks production stability.
- [ ] Avoid anti-pattern: **Manual profiling activation during incidents**: Engineers manually enabling profiling under stress. Human error leads to fleet-wide activation, worsening the incident. Automate SLO-driven activation.
- [ ] Avoid anti-pattern: **Profiling everything, everywhere**: Profiling every endpoint, every user, every request generates excessive data and overhead. Target profiling to endpoints that need investigation.
- [ ] Avoid anti-pattern: **Ignoring the profiling tool's own overhead**: Some teams deploy profilers and never measure the overhead they introduce. Profiling overhead should be a dashboard metric.
- [ ] Guard against anti-pattern: Production Profiling Without Overhead Control
- [ ] Guard against anti-pattern: Firefighting Without Flame Graphs
- [ ] Guard against anti-pattern: Observability Without Traces
- [ ] Guard against anti-pattern: Dashboards Without Actionable Alerts
- [ ] Guard against anti-pattern: Ignoring Memory Profiling (CPU-Only Focus)

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
**Core Concepts:** **SLO-driven profiling**: Profiling (high-frequency) is disabled by default. When an SLO breach alert fires (burn rate > 2x), profiling automatically activates on the affected hosts at 50-100 Hz. Deactivates when SLO is restored., **Canary pool isolation**: Dedicated host(s) in the load balancer pool tagged for profiling. Only a fraction of user traffic (1-5%) hits these hosts. Profile data from canary represents the entire fleet without fleet-wide overhead., **Feature-flag gating**: Use feature flags to enable profiling for specific endpoints, users, or A/B test groups. Example: `Profiling::enabledFor('checkout', auth()->id())` only profiles checkout for test users., **Health check exclusion**: Never profile health check endpoints. They create noise in profiles and serve no diagnostic value. Configure profiling tools to skip known health check paths.
**Skills:** SLO Definition and Error Budgets, Continuous Profiling Strategy, APM Integration Patterns, Capacity Planning and Safety Margins
**Decision Trees:** Profiling in production safely
**Anti-Patterns:** Production Profiling Without Overhead Control, Firefighting Without Flame Graphs, Observability Without Traces, Dashboards Without Actionable Alerts, Ignoring Memory Profiling (CPU-Only Focus)
**Related Topics:** SLO Definition and Error Budgets, Continuous Profiling Strategy, APM Integration Patterns, Production Profiling Safety, Capacity Planning and Safety Margins

