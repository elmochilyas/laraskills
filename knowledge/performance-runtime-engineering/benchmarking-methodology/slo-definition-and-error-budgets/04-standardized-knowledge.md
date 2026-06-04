# Standardized Knowledge: SLO Definition and Error Budgets

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Performance Benchmarking & Methodology |
| Knowledge Unit | SLO Definition and Error Budgets |
| Difficulty | Enterprise |
| Lifecycle | Design, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Service Level Objectives (SLOs) define acceptable performance in user-facing terms. p50 SLO targets typical experience (e.g., p50 < 200ms for API). p95 SLO targets slow-but-tolerable (p95 < 500ms). p99 SLO targets worst-case acceptable (p99 < 2000ms). Error budget = 100% - SLO attainment. Budget burn rate controls deployment velocity — high burn rate approaching SLO violation gates deployments.

## Core Concepts

- **SLO Derivation**: User expectation → acceptable latency → SLO target. Example: p50 < 200ms, p95 < 500ms, p99 < 2000ms, error rate < 0.1%. SLO = percentage of requests meeting all targets.
- **Error Budget**: 100% - SLO target. For 99.5% SLO: 0.5% error budget. Monthly budget: 0.5% × 30 days × 86,400 seconds = ~12,960 seconds of "bad" requests allowed.
- **Burn Rate**: How fast error budget is consumed. 1x burn rate = budget lasts the full month. 2x = budget consumed in 2 weeks. 10x = budget consumed in 3 days → immediate deployment freeze.
- **Multi-Window Multi-Burn**: Alert when error budget is being consumed fast across multiple time windows (1h, 6h, 24h) to catch both fast and slow burn rates.

## When To Use

- Defining measurable performance targets for production services
- Implementing deployment gating based on error budget availability
- Balancing feature velocity against reliability
- Communicating performance requirements across engineering and product teams

## When NOT To Use

- Internal tooling without user-facing performance requirements
- Systems still in development without production traffic
- Environments where measurement infrastructure is not available
- Teams too small to manage SLO processes effectively

## Best Practices

- **Derive SLOs from user research, not guesswork**: Survey users, analyze competitive benchmarks, measure current performance before setting targets. An SLO of p99 < 100ms when current p99 is 800ms means zero error budget from day one.
- **Set SLOs as percentages, not absolute values**: "99.5% of requests complete in <500ms" is better than "p95 < 500ms" because the percentage captures both latency and error rate.
- **Budget-aware deployment**: CI checks current error budget. If budget >50% remaining, deploy normally. If budget <20%, slow deployments (canary only, longer observation).
- **Multi-window alerting**: Alert when burn rate exceeds thresholds across 1h, 6h, and 24h windows. This catches both sudden spikes and gradual degradation.
- **Review SLOs quarterly**: User expectations, system capabilities, and business requirements change. Revisit SLO targets every quarter.

## Architecture Guidelines

- **SLO Hierarchy**: Business SLOs (overall service health) → Technical SLOs (latency per endpoint) → Component SLOs (database, cache, queue). Lower-level SLOs must be tighter than higher-level ones.
- **SLI Definition**: Service Level Indicators (SLIs) are the actual measurements. Define SLIs clearly: "p95 of HTTP response time measured at the load balancer for 200-status responses, excluding health checks."
- **Error Budget Policy**: Define what happens at each error budget level. >50%: normal deployments. 20-50%: canary-only with extended observation. <20%: deployment freeze, focus on reliability.
- **Burn Rate Alerting**: Multi-window multi-burn alerts fire when the budget consumption rate exceeds thresholds. Example: >10% budget consumed in 1h → critical alert.

## Performance Considerations

- SLO measurement requires accurate latency data. Use open-loop tools for validation.
- Error budget calculation needs high-resolution metrics. 1-minute granularity minimum.
- Burn rate alerting adds monitoring overhead. Keep alerting rules simple to avoid excessive computation.
- SLOs should account for planned maintenance windows. Exclude known downtime from budget calculations.

## Security Considerations

- Error budget alerts are security signals — a sudden increase in latency or errors may indicate an attack.
- SLO attainment data is sensitive business information. Restrict access to production metrics.
- Deployment freezes due to budget depletion should have manual override for security patches.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Setting SLO targets without measuring baseline | Guessing targets | Zero error budget from day one, constant alert fatigue | Measure current performance, set SLOs at realistic levels |
| Too many SLOs | Over-engineering | Alert fatigue, diluted focus on what matters | Start with 3-5 critical SLOs, add more as practice matures |
| Not accounting for normal traffic patterns | Setting static SLOs | Weekends have excess budget, weekday peaks deplete budget | Use rolling windows (28-day sliding) for budget calculation |
| Ignoring SLOs after setting them | Process fatigue | SLOs become shelf-ware, no operational value | Review SLOs in every incident post-mortem |

## Anti-Patterns

- **Setting 100% SLO**: 100% reliability is impossible. 100% SLO means zero error budget — any single error violates the SLO. Target 99.9% or 99.99% instead.
- **Using SLOs as performance targets without error budgets**: SLOs without error budgets are just aspirations. The budget is what drives operational decisions.
- **SLO-driven deployment gates without manual override**: Bugs in the SLO measurement system can block all deployments. Always have a manual override with required approvals.
- **One-size-fits-all SLOs**: Different endpoints have different user expectations. API calls need tighter SLOs than admin pages.

## Examples

```
Service SLO:
- 99.5% of HTTP API requests complete in <500ms (p50 < 200, p95 < 400)
- 99.9% of HTTP API requests return 2xx/3xx status
- Measured at load balancer, 1-minute rolling window
- Error budget: 0.5% of monthly requests (≈ 2,160,000 requests out of 432M)
- Multi-window burn rate alerts at 2x/6x/15x over 1h/6h/24h
```

## Related Topics

- Continuous Profiling Strategy
- Performance Regression Detection
- Alert Design and Response Time Thresholds
- Metrics Definition and Interpretation

## AI Agent Notes

- SLOs must be derived from user research and validated against current capabilities.
- Error budget = 100% - SLO target. This budget is consumed by slow requests, errors, and downtime.
- Multi-window multi-burn alerting catches both fast spikes (1h window) and gradual degradation (24h window).
- Deployment velocity is gated by remaining error budget. Low budget = deployment freeze.
- Review SLOs quarterly — they should evolve with user expectations and system capabilities.

## Verification

- [ ] SLOs derived from user research or competitive analysis
- [ ] Error budget calculated from SLO target
- [ ] Multi-window multi-burn alerting configured
- [ ] CI pipeline checks error budget before deployment
- [ ] Deployment freeze policy documented for low-budget scenarios
- [ ] SLO attainment monitored and reported
- [ ] SLOs reviewed quarterly
- [ ] Manual override process documented for security patches
