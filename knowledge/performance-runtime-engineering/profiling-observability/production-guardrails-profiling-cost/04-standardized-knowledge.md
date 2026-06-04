# Standardized Knowledge: Production Guardrails — SLO-Driven Profiling Activation, Canary Pool Isolation, Feature-Flag Gating

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Profiling & Observability |
| Knowledge Unit | Production Guardrails — SLO-Driven Profiling Activation, Canary Pool Isolation, Feature-Flag Gating |
| Difficulty | Advanced |
| Lifecycle | Configure, Monitor |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Production profiling must be safe by default. Guardrails: SLO-driven activation (profiling only enabled when SLO attainment is at risk), canary pool isolation (profile on a subset of hosts, not all), feature-flag gating (profiling enabled per-endpoint or per-user-segment). Without guardrails, profiling overhead during traffic spikes can push an already-degraded system past its breaking point.

## Core Concepts

- **SLO-driven profiling**: Profiling (high-frequency) is disabled by default. When an SLO breach alert fires (burn rate > 2x), profiling automatically activates on the affected hosts at 50-100 Hz. Deactivates when SLO is restored.
- **Canary pool isolation**: Dedicated host(s) in the load balancer pool tagged for profiling. Only a fraction of user traffic (1-5%) hits these hosts. Profile data from canary represents the entire fleet without fleet-wide overhead.
- **Feature-flag gating**: Use feature flags to enable profiling for specific endpoints, users, or A/B test groups. Example: `Profiling::enabledFor('checkout', auth()->id())` only profiles checkout for test users.
- **Health check exclusion**: Never profile health check endpoints. They create noise in profiles and serve no diagnostic value. Configure profiling tools to skip known health check paths.

## When To Use

- Any production environment where profiling overhead must be managed
- Teams using SLOs/error budgets to govern observability tooling cost
- High-traffic systems where even 1% profiling overhead translates to significant CPU cost
- Multi-tenant or shared infrastructure where profiling one tenant affects others
- Incident response workflows that need automated profiling activation

## When NOT To Use

- Development/staging environments (guardrails add unnecessary complexity — profile freely)
- Low-traffic systems where overhead impact is negligible
- Systems already using eBPF profiling (<0.5% overhead may not need SLO-driven activation)
- Teams without SLOs or error budgets defined

## Best Practices

- **Allocate a profiling cost budget**: Reserve 2% of total CPU budget for profiling. At 5% fleet-wide overhead, reduce sample rate or canary percentage. Monitor profiling overhead as a dashboard metric.
- **Never enable profiling during an active incident on all hosts**: If the system is already CPU-bound, adding profiling overhead (5-10% in high-frequency mode) can cause complete collapse. Always activate profiling on canary hosts first.
- **Use canary pools for continuous profiling**: Run low-overhead profiling (Tideways/SPX at 10% sample rate) on canary hosts only. This provides representative data without fleet-wide overhead.
- **Automate SLO-driven activation**: Configure alert manager to trigger profiling activation when SLO burn rate exceeds 2x. Deactivate when SLO is restored. This ensures profiling is available when most needed.
- **Exclude health checks and monitoring paths**: Health check, metrics, and probe endpoints should never be profiled. Configure profiling tools with path exclusion lists.

## Architecture Guidelines

- **SLO-driven pipeline**: SLO monitoring → burn rate alert → profiling activation API → PHP-FPM reload with profiling enabled → profile collection → stop profiling → PHP-FPM reload without profiling
- **Canary pool architecture**: Load balancer → production pool (95% traffic, no profiling) + canary pool (5% traffic, profiling enabled). Canary pool mirrors production configuration (same code, same infrastructure).
- **Feature-flag integration**: Profiling checks feature flag per-request. If flag is enabled for the current user/endpoint/segment, profiling is activated for that request. Use a fast in-memory check to minimize overhead.
- **Cost monitoring**: Profile profiling overhead as a metric. Track CPU % attributed to profiling per host. Alert when per-host profiling overhead exceeds the budget allocation.

## Performance Considerations

- Profiling overhead varies by tool: Xdebug 50-200%, Blackfire 10-25%, Tideways/SPX 1-5%, eBPF <0.5%
- Without guardrails, profiling overhead can compound with traffic spikes, causing cascading failures
- Canary pool isolates profiling overhead to 1-5% of fleet — risk is bounded
- SLO-driven activation ensures profiling only runs when investigation value exceeds overhead cost
- Feature-flag gating enables surgical profiling — overhead is limited to targeted endpoints/users
- eBPF profiling has such low overhead (<0.5%) that guardrails may not be needed, but PID scoping is still recommended

## Security

- Profile data from canary hosts is as sensitive as production data — apply same security controls
- Feature-flag gating must not profile authenticated user sessions that may contain PII in stack traces
- SLO-driven activation should use secure automation (alert → API call with authentication)
- Canary hosts should be treated as production hosts for security patching and compliance
- Profiling overhead budget metrics should be monitored for anomalies (unexpected profiling activation may indicate a security event)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Enabling profiling during an active incident | Needing data to debug, activating fleet-wide | Added overhead collapses already-degraded system | Always activate profiling on canary hosts first |
| Profiling health check endpoints | No exclusion list configured | Noise in profiles, wasted storage, misleading flame graphs | Configure path exclusion for health checks and probes |
| No profiling cost budget | Assuming profiling overhead is negligible | Unmonitored profiling causes unexpected CPU utilization during peak traffic | Allocate 2% CPU budget; monitor and alert on profiling overhead |
| Continuous 100% profiling on all hosts | "More data is better" mindset | 5-15% sustained overhead, cascading failures during traffic spikes | Use canary pool isolation and SLO-driven activation |
| Feature-flag checks adding overhead | Poor implementation (e.g., DB call per request) | Feature flag profiling check adds more overhead than profiling itself | Use fast in-memory cache for flag checks (APCu, local variable) |

## Anti-Patterns

- **Always-on profiling without limits**: Continuous profiling across the entire fleet with no budget, no canary, and no SLO binding. This wastes CPU and risks production stability.
- **Manual profiling activation during incidents**: Engineers manually enabling profiling under stress. Human error leads to fleet-wide activation, worsening the incident. Automate SLO-driven activation.
- **Profiling everything, everywhere**: Profiling every endpoint, every user, every request generates excessive data and overhead. Target profiling to endpoints that need investigation.
- **Ignoring the profiling tool's own overhead**: Some teams deploy profilers and never measure the overhead they introduce. Profiling overhead should be a dashboard metric.

## Examples

```bash
# SLO-driven profiling automation (pseudo-config)
alert:
  - name: SLOBurnRate
    condition: burn_rate > 2x
    action: enable_profiling(scope="canary", frequency=99)
    deactivate: burn_rate < 0.5x

# Canary pool configuration (Kubernetes)
apiVersion: v1
kind: Service
spec:
  selector:
    app: php-app
    role: production  # 95% traffic
---
apiVersion: v1
kind: Service
spec:
  selector:
    app: php-app
    role: canary     # 5% traffic, profiling enabled

# Feature-flag gating (PHP)
if (FeatureFlag::isEnabled('profiling.checkout') && $request->is('checkout/*')) {
    tideways_enable_profiling();
}

# Profiling cost budget monitoring
# Metric: profiling_overhead_percent
# Alert: > 2% of total CPU for > 5 minutes
```

## Related Topics

- SLO Definition and Error Budgets
- Continuous Profiling Strategy
- APM Integration Patterns
- Production Profiling Safety
- Capacity Planning and Safety Margins

## AI Agent Notes

- Production profiling must be safe by default — guardrails are not optional
- SLO-driven activation is the most sophisticated approach: profiling activates automatically when most needed
- Canary pool isolation limits blast radius of profiling overhead to 1-5% of traffic
- Feature-flag gating enables surgical profiling of specific endpoints/users
- Always exclude health check endpoints from profiling
- Monitor profiling overhead as a first-class metric; alert when it exceeds the budget
- eBPF (<0.5% overhead) is the safest for always-on profiling but still needs PID scoping

## Verification

- [ ] SLO-driven profiling automation configured (alert → profiling activation → deactivation)
- [ ] Canary pool hosts identified and tagged for profiling (1-5% of fleet)
- [ ] Feature-flag gating implemented for endpoint/user-segment profiling
- [ ] Health check endpoints excluded from profiling configuration
- [ ] Profiling overhead budget defined (2% of CPU) and monitored as a dashboard metric
- [ ] Alert configured for when profiling overhead exceeds budget
- [ ] Profiling activation during incidents documented in runbook (always canary first)
- [ ] SLO burn rate alert tested end-to-end: alert triggers profiling activation
- [ ] Profiling deactivation verified: profiling stops when SLO is restored
- [ ] Automation runs with secure authentication (no manual API calls required during incident)
