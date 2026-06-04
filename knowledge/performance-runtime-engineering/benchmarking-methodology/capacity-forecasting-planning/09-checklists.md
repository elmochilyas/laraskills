# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Benchmarking Methodology
**Knowledge Unit:** Capacity Forecasting â€” Request Growth Modeling, Worker Scaling Calculations, Hardware Planning
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Forecast from peak traffic, not average**: Average traffic is typically 30-50% of peak. Sizing for average guarantees saturation during peak hours. Always use P95 daily peak for capacity planning.
- [ ] **Calculate 6-month forecast**: Determine current headroom. At projected growth rate, calculate months until headroom reaches 10%. That's the upgrade deadline. Plan procurement 2 months before.
- [ ] **Include safety margins**: 1.2x for normal operations, 1.5x for critical services, 2x for services without auto-scaling. Safety margins absorb traffic spikes and deployment headroom.
- [ ] **Model multiple growth scenarios**: Best case (current growth continues), expected case (growth slows 50%), worst case (growth doubles). Plan for the expected case but have budget for the worst case.
- [ ] **Review forecasts monthly**: Actual traffic may diverge from projections. Compare forecast vs actual monthly and adjust plans accordingly.
- [ ] Current peak traffic measured (P95 daily peak RPS)
- [ ] Growth rate calculated from historical data
- [ ] 6-month forecast modeled with safety margins
- [ ] RPS_per_worker measured from current benchmarks
- [ ] P95 worker RSS measured after 30+ minutes steady state
- [ ] 6-month forecast completed with expected/best/worst case scenarios
- [ ] Upgrade deadline calculated with procurement lead time buffer
- [ ] Database connection budget included as primary constraint
- [ ] Monthly review cadence established
- [ ] Infrastructure ordered before headroom drops below 15%
- [ ] P95 daily peak traffic measured (not average)
- [ ] Growth rate calculated from 3+ months of data
- [ ] Three scenarios modeled (best, expected, worst)
- [ ] Required workers calculated with safety margin
- [ ] Database connection budget included

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Closed-loop vs Open-loop**: Closed-loop tools (wrk, ab, hey) are simpler but systematically underestimate tail latency under load due to coordinated omission. Open-loop tools (wrk2, k6) are more complex but produce accurate latency distributions. Use closed-loop for quick throughput estimates; use open-loop for production-relevant latency data.
- [ ] **Synthetic vs Realistic benchmarks**: Synthetic benchmarks (single endpoint, fixed payload) are repeatable and useful for regression detection. Realistic benchmarks (user journey, variable think times) predict production behavior. Use both: synthetic in CI, realistic for capacity planning.
- [ ] **Capacity Planning as a Process**: Not a one-time calculation. Monthly review: compare forecast vs actual, adjust growth rate, recalculate upgrade timeline. Quarterly: review hardware plan and budget.
- [ ] **Headroom Calculation**: Headroom = `(current_capacity - current_demand) / current_capacity Ã— 100`. Below 30% headroom: investigate capacity increase. Below 15%: critical â€” plan immediate upgrade.
- [ ] **Horizontal vs Vertical Scaling**: Horizontal (more servers) is preferred for stateless PHP workloads. Vertical (bigger servers) when horizontal scaling is constrained by database connections or licensing.
- [ ] **Auto-Scaling Integration**: Design for auto-scaling but plan for base capacity. Auto-scaling handles spikes above the base. Base capacity handles normal peak traffic without scaling delay.
- [ ] Document and follow through on architectural decision: Capacity planning approach
- [ ] Ensure architecture aligns with core concept: **Request Growth Modeling**: Analyze traffic trends (daily/weekly/monthly). Apply growth rate to project future peak traffic. Use P95 daily peak, not average. Formula: `projected_peak_RPS = current_peak_RPS Ã— (1 + growth_rate)^months`.
- [ ] Ensure architecture aligns with core concept: **Worker Scaling**: `Required_workers = projected_peak_RPS / (RPS_per_worker Ã— safety_factor)`. RPS_per_worker measured from benchmarks. Safety factor = 0.7 for headroom during spikes.
- [ ] Ensure architecture aligns with core concept: **Hardware Planning**: CPU cores = `required_workers Ã— CPU_time_per_request / 1000ms` (for CPU-bound). RAM = `required_workers Ã— P95_RSS Ã— 1.5 safety factor`.
- [ ] Ensure architecture aligns with core concept: **Downgrade Scenarios**: Plan for 2x unexpected traffic spike. Over-provision by 100% for critical services. Over-provision by 30% for standard services.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Forecast from peak traffic, not average**: Average traffic is typically 30-50% of peak. Sizing for average guarantees saturation during peak hours. Always use P95 daily peak for capacity planning.
- [ ] **Calculate 6-month forecast**: Determine current headroom. At projected growth rate, calculate months until headroom reaches 10%. That's the upgrade deadline. Plan procurement 2 months before.
- [ ] **Include safety margins**: 1.2x for normal operations, 1.5x for critical services, 2x for services without auto-scaling. Safety margins absorb traffic spikes and deployment headroom.
- [ ] **Model multiple growth scenarios**: Best case (current growth continues), expected case (growth slows 50%), worst case (growth doubles). Plan for the expected case but have budget for the worst case.
- [ ] **Review forecasts monthly**: Actual traffic may diverge from projections. Compare forecast vs actual monthly and adjust plans accordingly.

# Performance Checklist (from 04/06)
- [ ] P95 worker RSS should be measured after 30+ minutes of steady-state operation
- [ ] RPS_per_worker varies by endpoint complexity. Measure per-endpoint for accurate planning.
- [ ] CPU time per request changes with optimizations. Re-measure after significant performance work.
- [ ] Database connection limits (max_connections) often become the bottleneck before CPU or memory.
- [ ] wrk/wrk2
- [ ] k6
- [ ] Closed-loop
- [ ] Open-loop

# Security Checklist (from 04/06 - only if relevant)
- [ ] Capacity data reveals infrastructure scale. Treat as confidential business information.
- [ ] Capacity planning documents should be access-restricted â€” they detail your scaling limits and growth strategy.
- [ ] OOM risks from miscalculated capacity are security availability issues. Always include safety margins.

# Reliability Checklist (from 04/05/06)
- [ ] **Coordinated omission invalidates results**: Closed-loop tool reports falsely low latency. Symptom: Benchmarks show 50ms p99 in test, 500ms p99 in production. Mitigation: Use open-loop tools (wrk2, k6) for accurate latency.
- [ ] **Warm-up bias**: First 100 requests are 10x slower than steady state. Symptom: Benchmark includes cold cache data. Mitigation: Always warm up before recording, discard warm-up data.
- [ ] **Sample size too small**: Fewer than 1000 samples per measurement point. Symptom: High variance between runs, non-reproducible results. Mitigation: Run longer, target 10000+ samples per data point.
- [ ] **CI integration**: Run baseline benchmarks in CI on every commit. Compare against previous commit. Fail build if throughput drops >5% or p99 latency increases >10%.
- [ ] **Environment consistency**: Run benchmarks on dedicated instances (no noisy neighbors). Pin CPU frequency. Disable turbo boost. Report environment details (PHP version, CPU, RAM, disk type).
- [ ] **Warm-up**: Minimum 1000 requests or 30 seconds of warm-up before recording measurements. Discard warm-up data.
- [ ] **Multiple runs**: Run each benchmark at least 3 times and report median. Report variance Ã¢â‚¬â€ high variance indicates measurement problems.

# Testing Checklist (from 04/06)
- [ ] Current peak traffic measured (P95 daily peak RPS)
- [ ] Growth rate calculated from historical data
- [ ] 6-month forecast modeled with safety margins
- [ ] RPS_per_worker measured from current benchmarks
- [ ] P95 worker RSS measured after 30+ minutes steady state
- [ ] Database connection budget included in calculations
- [ ] Expected, best, and worst case scenarios modeled
- [ ] Procurement timeline established with 2-month lead time buffer
- [ ] Monthly forecast review scheduled
- [ ] 6-month forecast completed with expected/best/worst case scenarios
- [ ] Upgrade deadline calculated with procurement lead time buffer
- [ ] Database connection budget included as primary constraint
- [ ] Monthly review cadence established
- [ ] Infrastructure ordered before headroom drops below 15%
- [ ] P95 daily peak traffic measured (not average)
- [ ] Growth rate calculated from 3+ months of data
- [ ] Three scenarios modeled (best, expected, worst)
- [ ] Required workers calculated with safety margin
- [ ] Database connection budget included
- [ ] Procurement timeline with 2-month lead time buffer
- [ ] Monthly review scheduled

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Forecast from peak traffic, not average**: Average traffic is typically 30-50% of peak. Sizing for average guarantees saturation during peak hours. Always use P95 daily peak for capacity planning.
- [ ] **Calculate 6-month forecast**: Determine current headroom. At projected growth rate, calculate months until headroom reaches 10%. That's the upgrade deadline. Plan procurement 2 months before.
- [ ] **Include safety margins**: 1.2x for normal operations, 1.5x for critical services, 2x for services without auto-scaling. Safety margins absorb traffic spikes and deployment headroom.
- [ ] **Model multiple growth scenarios**: Best case (current growth continues), expected case (growth slows 50%), worst case (growth doubles). Plan for the expected case but have budget for the worst case.
- [ ] **Review forecasts monthly**: Actual traffic may diverge from projections. Compare forecast vs actual monthly and adjust plans accordingly.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Forecasting from average traffic
- [ ] Avoid: Not including safety margins
- [ ] Avoid: One-time capacity plan
- [ ] Avoid: Ignoring database connection limits
- [ ] Avoid anti-pattern: **Procrastinating capacity upgrades**: Waiting until saturation causes performance degradation. Plan upgrades when headroom reaches 30%, not 10%.
- [ ] Avoid anti-pattern: **Oversizing without data**: Guessing capacity needs without measurement leads to waste. Measure RPS, latency, and RSS before planning.
- [ ] Avoid anti-pattern: **Ignoring seasonal patterns**: Traffic varies by day of week, month, and season. Capacity for Black Friday shouldn't be the same as average Tuesday.
- [ ] Avoid anti-pattern: **Assuming linear scaling**: Doubling servers doesn't always double capacity. Bottlenecks in shared infrastructure (database, cache) limit scaling.
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
**Core Concepts:** **Request Growth Modeling**: Analyze traffic trends (daily/weekly/monthly). Apply growth rate to project future peak traffic. Use P95 daily peak, not average. Formula: `projected_peak_RPS = current_peak_RPS Ã— (1 + growth_rate)^months`., **Worker Scaling**: `Required_workers = projected_peak_RPS / (RPS_per_worker Ã— safety_factor)`. RPS_per_worker measured from benchmarks. Safety factor = 0.7 for headroom during spikes., **Hardware Planning**: CPU cores = `required_workers Ã— CPU_time_per_request / 1000ms` (for CPU-bound). RAM = `required_workers Ã— P95_RSS Ã— 1.5 safety factor`., **Downgrade Scenarios**: Plan for 2x unexpected traffic spike. Over-provision by 100% for critical services. Over-provision by 30% for standard services.
**Skills:** Metrics Definition and Interpretation, Worker RSS Capacity Ceiling, PM Max Children P95 Calculation, Horizontal Scaling Architecture
**Decision Trees:** Capacity planning approach
**Anti-Patterns:** Benchmarking Without Warm-Up Rounds, Reporting Mean Without Percentiles, Benchmarking on Development Hardware, Single-Request Benchmarks (wrk -c1), P-Hacking Benchmark Results
**Related Topics:** Capacity Planning Safety Margins, PM Max Children P95 Calculation, Horizontal Scaling Architecture, Worker RSS Capacity Ceiling

