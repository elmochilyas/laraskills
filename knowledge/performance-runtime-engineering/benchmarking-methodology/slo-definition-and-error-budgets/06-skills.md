# Skill: Define SLOs with Error Budgets and Measurement Windows

## Purpose
Define SLOs from benchmark-driven p95/p99 latency targets with 30-day rolling measurement windows, allocate and manage error budgets with 10% monthly burn rate warnings, and tune SLO targets quarterly based on observed performance — providing a clear, objective measurement of service health.

## When To Use
- Setting initial SLOs for a new or existing service
- Establishing performance contracts between teams
- Measuring and improving operational maturity
- Making data-driven decisions about release velocity

## When NOT To Use
- Without benchmarking data to establish realistic targets
- Services not yet meeting any SLO (fix foundational issues first)
- When the SLO cost (monitoring, alerts) exceeds value

## Prerequisites
- 2+ weeks of production latency and error rate data
- Benchmarking results for p95 and p99 under typical load
- Understanding of SLI (what to measure), SLO (target), error budget (margin)

## Inputs
- Production p95/p99 latency histogram (30 days)
- Production error rate time series
- Business requirements for reliability (user impact tolerance)
- Deployment frequency (releases per month)

## Workflow

### 1. Define the SLI
- Select one user-facing metric: request latency, error rate, availability
- For latency: p95 response time at the load balancer or application layer
- For availability: ratio of successful requests / total requests
- Keep SLIs simple — one per SLO, max 5 SLOs per service

### 2. Set the SLO Target from Benchmark Data
- Build the SLO from benchmarks first, then validate against production
- Start with p95 benchmark result × 1.5 as realistic SLO target
- Validate against 30-day production p95 — adjust up if production is slower
- Validate against 30-day production p95 — adjust down if production is consistently faster
- Set availability SLO at 99.5% minimum for most services

### 3. Calculate Error Budget
- Error budget = allowed failures in 30-day window
- For 99.5% availability: 0.5% × total requests = budget
- For p95 latency SLO: acceptable number of slow requests per month
- Define budget as a rate (percentage), not a count

### 4. Track Error Budget Burn Rate
- Measure budget consumption daily: `(SLO violations / total requests) × 100`
- 10% monthly burn rate: trigger investigation (alert on-call)
- 25% monthly burn rate: trigger incident response
- 50% monthly burn rate: freeze deployments until budget recovers
- Dashboard showing remaining error budget with burn rate projection

### 5. Manage Releases with Error Budget
- Any release that consumes error budget must justify the consumption
- If release causes budget consumption >10%: rollback is required
- Consecutive releases consuming budget: escalate to release process review
- Budget consumption from infrastructure failure: investigate, not just monitor

### 6. Review and Tune SLOs Quarterly
- Review SLO targets every quarter
- Compare target vs actual for trailing 3 months
- If actual is consistently 2x better than target: tighten SLO
- If actual is consistently at or below target: SLO is too loose or service is unhealthy
- Involve stakeholders in SLO review

## Validation Checklist
- [ ] SLI defined (latency p95, error rate, or availability)
- [ ] SLO target set from benchmark data × 1.5, validated against 30-day production
- [ ] Error budget calculated (30-day rolling window)
- [ ] Burn rate alerts configured (10% warning, 25% incident, 50% freeze)
- [ ] Release gating configured based on error budget consumption
- [ ] SLO reviewed and tuned quarterly

## Related Rules
- SLO from benchmarks × 1.5 (`05-rules.md:1`)
- 30-day rolling window (`05-rules.md:27`)
- 10% burn rate alert (`05-rules.md:54`)
- 50% burn rate freeze (`05-rules.md:81`)
- Quarterly SLO review (`05-rules.md:108`)

## Related Skills
- Metrics Definition and Interpretation
- Performance Regression Detection
- CI Integration and Baseline Comparison
- Capacity Forecasting and Planning

## Success Criteria
- SLO defined with benchmark-driven target and 30-day measurement window
- Error budget tracked with burn rate alerts at 10%, 25%, 50%
- Releases gated by error budget consumption
- SLO reviewed quarterly with stakeholder involvement
- SLO targets tuned based on observed vs actual performance
