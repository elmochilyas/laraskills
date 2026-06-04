# Skill: Integrate Automated Benchmarks into CI with Baseline Comparison

## Purpose
Add automated performance benchmarks to the CI/CD pipeline with dedicated runners, baseline comparison against last-known-good commits, threshold-based pass/fail (5% warning, 10% failure), and historical tracking for trend analysis.

## When To Use
- Automated performance regression detection in CI/CD pipelines
- Every pull request that may affect performance
- Release validation before deploying to production
- Performance budget enforcement for critical endpoints

## When NOT To Use
- Environments where CI runners have high variance (>15% run-to-run)
- Very early development stages with rapid code changes
- When benchmarks take longer than the build itself

## Prerequisites
- Dedicated CI runners for benchmarking (isolated from build jobs)
- Benchmarking tools installed on runners (wrk2 or k6)
- Target endpoint running in CI staging environment
- Baseline database or platform (bencher.dev or similar)

## Inputs
- CI pipeline configuration (GitHub Actions, GitLab CI, etc.)
- Target endpoint URL for benchmarking
- Previous baseline metrics (from last-known-good commit)
- Threshold definitions (p95, error rate, throughput)

## Workflow

### 1. Provision Dedicated Benchmarking Runners
- Dedicate CI runners exclusively for performance benchmarks
- Isolate from compilation, test, and deployment jobs
- Ensure runners have consistent CPU, memory, and network
- If shared runners are unavoidable, increase thresholds to 10-15%

### 2. Create Benchmark Script
- Include warm-up phase (30s, discard data)
- Run minimum 3 iterations, take median
- Use open-loop mode (wrk2 `--rate` or k6 constant arrival rate)
- Capture: RPS, p50/p95/p99 latency, error rate
- Parse output into structured format (JSON)

### 3. Define Pass/Fail Thresholds
- p95 regression >5%: warning (investigate within 24h)
- p95 regression >10%: failure (block merge)
- Throughput drop >10%: failure
- Error rate >0.5%: failure
- Account for normal variance (3-5%) — never use thresholds below 5%

### 4. Implement Baseline Comparison
- Store baselines in database (bencher.dev, PostgreSQL) — not in Git
- Compare against rolling window of 30+ recent runs
- Use statistical tests (Mann-Whitney U) to distinguish real changes from noise
- Refresh baseline monthly or after infrastructure changes

### 5. Add Pipeline Step
- Run benchmarks after unit tests, before deployment
- Fail the pipeline on hard threshold breach
- Generate report with comparison against baseline
- Store results in database for trend analysis

### 6. Monitor and Tune
- Track false positive rate — target <5%
- Adjust thresholds if variance changes
- Review benchmark history weekly for gradual drift
- Re-validate benchmark script quarterly

## Validation Checklist
- [ ] Dedicated benchmarking runners configured
- [ ] Warm-up phase included in script
- [ ] 3+ iterations per benchmark, median reported
- [ ] Thresholds defined: 5% warning, 10% failure
- [ ] Baseline stored in database (not Git)
- [ ] Baseline refreshed monthly or after infra changes
- [ ] Pipeline step runs after unit tests, before deploy
- [ ] False positive rate <5%

## Related Rules
- Dedicated benchmarking runners (`05-rules.md:1`)
- Thresholds at 5-10% (`05-rules.md:25`)
- 3+ iterations, take median (`05-rules.md:53`)
- Baselines in database (`05-rules.md:80`)
- Refresh baseline monthly (`05-rules.md:105`)

## Related Skills
- Performance Regression Detection
- Statistical Significance in Benchmarking
- Methodology Warmup Sample Size
- SLO Definition and Error Budgets

## Success Criteria
- CI pipeline includes automated benchmarks that gate deployments
- Baseline stored in database with trend analysis
- False positive rate <5%
- Regressions detected within minutes of commit
- Team trusts and responds to CI performance gates
