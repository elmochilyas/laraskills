# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** SLO Definition and Error Budgets â€” p50/p95/p99 Targets from User Experience Requirements
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Derive SLOs from user research, not guesswork**: Survey users, analyze competitive benchmarks, measure current performance before setting targets. An SLO of p99 < 100ms when current p99 is 800ms means zero error budget from day one.
- [ ] **Set SLOs as percentages, not absolute values**: "99.5% of requests complete in <500ms" is better than "p95 < 500ms" because the percentage captures both latency and error rate.
- [ ] **Budget-aware deployment**: CI checks current error budget. If budget >50% remaining, deploy normally. If budget <20%, slow deployments (canary only, longer observation).
- [ ] **Multi-window alerting**: Alert when burn rate exceeds thresholds across 1h, 6h, and 24h windows. This catches both sudden spikes and gradual degradation.
- [ ] **Review SLOs quarterly**: User expectations, system capabilities, and business requirements change. Revisit SLO targets every quarter.
- [ ] SLOs derived from user research or competitive analysis
- [ ] Error budget calculated from SLO target
- [ ] Multi-window multi-burn alerting configured
- [ ] CI pipeline checks error budget before deployment
- [ ] Deployment freeze policy documented for low-budget scenarios
- [ ] SLO defined with benchmark-driven target and 30-day measurement window
- [ ] Error budget tracked with burn rate alerts at 10%, 25%, 50%
- [ ] Releases gated by error budget consumption
- [ ] SLO reviewed quarterly with stakeholder involvement
- [ ] SLO targets tuned based on observed vs actual performance
- [ ] SLI defined (latency p95, error rate, or availability)
- [ ] SLO target set from benchmark data Ã— 1.5, validated against 30-day production
- [ ] Error budget calculated (30-day rolling window)
- [ ] Burn rate alerts configured (10% warning, 25% incident, 50% freeze)
- [ ] Release gating configured based on error budget consumption

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- [ ] **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.
- [ ] **SLO Hierarchy**: Business SLOs (overall service health) â†’ Technical SLOs (latency per endpoint) â†’ Component SLOs (database, cache, queue). Lower-level SLOs must be tighter than higher-level ones.
- [ ] **SLI Definition**: Service Level Indicators (SLIs) are the actual measurements. Define SLIs clearly: "p95 of HTTP response time measured at the load balancer for 200-status responses, excluding health checks."
- [ ] **Error Budget Policy**: Define what happens at each error budget level. >50%: normal deployments. 20-50%: canary-only with extended observation. <20%: deployment freeze, focus on reliability.
- [ ] **Burn Rate Alerting**: Multi-window multi-burn alerts fire when the budget consumption rate exceeds thresholds. Example: >10% budget consumed in 1h â†’ critical alert.
- [ ] Document and follow through on architectural decision: SLO target definition
- [ ] Document and follow through on architectural decision: Error budget policy
- [ ] Ensure architecture aligns with core concept: **SLO Derivation**: User expectation â†’ acceptable latency â†’ SLO target. Example: p50 < 200ms, p95 < 500ms, p99 < 2000ms, error rate < 0.1%. SLO = percentage of requests meeting all targets.
- [ ] Ensure architecture aligns with core concept: **Error Budget**: 100% - SLO target. For 99.5% SLO: 0.5% error budget. Monthly budget: 0.5% Ã— 30 days Ã— 86,400 seconds = ~12,960 seconds of "bad" requests allowed.
- [ ] Ensure architecture aligns with core concept: **Burn Rate**: How fast error budget is consumed. 1x burn rate = budget lasts the full month. 2x = budget consumed in 2 weeks. 10x = budget consumed in 3 days â†’ immediate deployment freeze.
- [ ] Ensure architecture aligns with core concept: **Multi-Window Multi-Burn**: Alert when error budget is being consumed fast across multiple time windows (1h, 6h, 24h) to catch both fast and slow burn rates.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Derive SLOs from user research, not guesswork**: Survey users, analyze competitive benchmarks, measure current performance before setting targets. An SLO of p99 < 100ms when current p99 is 800ms means zero error budget from day one.
- [ ] **Set SLOs as percentages, not absolute values**: "99.5% of requests complete in <500ms" is better than "p95 < 500ms" because the percentage captures both latency and error rate.
- [ ] **Budget-aware deployment**: CI checks current error budget. If budget >50% remaining, deploy normally. If budget <20%, slow deployments (canary only, longer observation).
- [ ] **Multi-window alerting**: Alert when burn rate exceeds thresholds across 1h, 6h, and 24h windows. This catches both sudden spikes and gradual degradation.
- [ ] **Review SLOs quarterly**: User expectations, system capabilities, and business requirements change. Revisit SLO targets every quarter.

# Performance Checklist (from 04/06)
- [ ] SLO measurement requires accurate latency data. Use open-loop tools for validation.
- [ ] Error budget calculation needs high-resolution metrics. 1-minute granularity minimum.
- [ ] Burn rate alerting adds monitoring overhead. Keep alerting rules simple to avoid excessive computation.
- [ ] SLOs should account for planned maintenance windows. Exclude known downtime from budget calculations.
- [ ] wrk/wrk2
- [ ] k6
- [ ] Closed-loop
- [ ] Open-loop

# Security Checklist (from 04/06 - only if relevant)
- [ ] Error budget alerts are security signals â€” a sudden increase in latency or errors may indicate an attack.
- [ ] SLO attainment data is sensitive business information. Restrict access to production metrics.
- [ ] Deployment freezes due to budget depletion should have manual override for security patches.

# Reliability Checklist (from 04/05/06)
- [ ] **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- [ ] **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- [ ] **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Testing Checklist (from 04/06)
- [ ] SLOs derived from user research or competitive analysis
- [ ] Error budget calculated from SLO target
- [ ] Multi-window multi-burn alerting configured
- [ ] CI pipeline checks error budget before deployment
- [ ] Deployment freeze policy documented for low-budget scenarios
- [ ] SLO attainment monitored and reported
- [ ] SLOs reviewed quarterly
- [ ] Manual override process documented for security patches
- [ ] SLO defined with benchmark-driven target and 30-day measurement window
- [ ] Error budget tracked with burn rate alerts at 10%, 25%, 50%
- [ ] Releases gated by error budget consumption
- [ ] SLO reviewed quarterly with stakeholder involvement
- [ ] SLO targets tuned based on observed vs actual performance
- [ ] SLI defined (latency p95, error rate, or availability)
- [ ] SLO target set from benchmark data Ã— 1.5, validated against 30-day production
- [ ] Error budget calculated (30-day rolling window)
- [ ] Burn rate alerts configured (10% warning, 25% incident, 50% freeze)
- [ ] Release gating configured based on error budget consumption
- [ ] SLO reviewed and tuned quarterly

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Derive SLOs from user research, not guesswork**: Survey users, analyze competitive benchmarks, measure current performance before setting targets. An SLO of p99 < 100ms when current p99 is 800ms means zero error budget from day one.
- [ ] **Set SLOs as percentages, not absolute values**: "99.5% of requests complete in <500ms" is better than "p95 < 500ms" because the percentage captures both latency and error rate.
- [ ] **Budget-aware deployment**: CI checks current error budget. If budget >50% remaining, deploy normally. If budget <20%, slow deployments (canary only, longer observation).
- [ ] **Multi-window alerting**: Alert when burn rate exceeds thresholds across 1h, 6h, and 24h windows. This catches both sudden spikes and gradual degradation.
- [ ] **Review SLOs quarterly**: User expectations, system capabilities, and business requirements change. Revisit SLO targets every quarter.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting SLO targets without measuring baseline
- [ ] Avoid: Too many SLOs
- [ ] Avoid: Not accounting for normal traffic patterns
- [ ] Avoid: Ignoring SLOs after setting them
- [ ] Avoid anti-pattern: **Setting 100% SLO**: 100% reliability is impossible. 100% SLO means zero error budget â€” any single error violates the SLO. Target 99.9% or 99.99% instead.
- [ ] Avoid anti-pattern: **Using SLOs as performance targets without error budgets**: SLOs without error budgets are just aspirations. The budget is what drives operational decisions.
- [ ] Avoid anti-pattern: **SLO-driven deployment gates without manual override**: Bugs in the SLO measurement system can block all deployments. Always have a manual override with required approvals.
- [ ] Avoid anti-pattern: **One-size-fits-all SLOs**: Different endpoints have different user expectations. API calls need tighter SLOs than admin pages.
- [ ] Guard against anti-pattern: Benchmarking Without Warm-Up Rounds
- [ ] Guard against anti-pattern: Reporting Mean Without Percentiles
- [ ] Guard against anti-pattern: Benchmarking on Development Hardware
- [ ] Guard against anti-pattern: Single-Request Benchmarks (wrk -c1)
- [ ] Guard against anti-pattern: P-Hacking Benchmark Results
- [ ] Warm-up rounds conducted

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **SLO Derivation**: User expectation â†’ acceptable latency â†’ SLO target. Example: p50 < 200ms, p95 < 500ms, p99 < 2000ms, error rate < 0.1%. SLO = percentage of requests meeting all targets., **Error Budget**: 100% - SLO target. For 99.5% SLO: 0.5% error budget. Monthly budget: 0.5% Ã— 30 days Ã— 86,400 seconds = ~12,960 seconds of "bad" requests allowed., **Burn Rate**: How fast error budget is consumed. 1x burn rate = budget lasts the full month. 2x = budget consumed in 2 weeks. 10x = budget consumed in 3 days â†’ immediate deployment freeze., **Multi-Window Multi-Burn**: Alert when error budget is being consumed fast across multiple time windows (1h, 6h, 24h) to catch both fast and slow burn rates.
**Skills:** Metrics Definition and Interpretation, Performance Regression Detection, CI Integration and Baseline Comparison, Capacity Forecasting and Planning
**Decision Trees:** SLO target definition, Error budget policy
**Anti-Patterns:** Benchmarking Without Warm-Up Rounds, Reporting Mean Without Percentiles, Benchmarking on Development Hardware, Single-Request Benchmarks (wrk -c1), P-Hacking Benchmark Results
**Related Topics:** Continuous Profiling Strategy, Performance Regression Detection, Alert Design and Response Time Thresholds, Metrics Definition and Interpretation

