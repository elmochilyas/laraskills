# `retry_after` vs `--timeout` Semantics — Checklist

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Worker Management
- **Knowledge Unit:** K079 — `retry_after` vs `--timeout` Semantics
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand the difference between connection config (`retry_after`) and worker flag (`--timeout`)
- [ ] Know that `retry_after` is per-connection, not per-queue
- [ ] Know that job `$timeout` property overrides worker's `--timeout`

## Implementation Checklist
- [ ] `--timeout` set at least 10 seconds less than `retry_after`
- [ ] `retry_after` = `--timeout` + 10+ seconds (buffer for clock skew)
- [ ] `--timeout` = max expected job runtime + 30% buffer
- [ ] All job classes with `$timeout` property checked — must be < `retry_after`
- [ ] `retry_after` configured per connection appropriately for longest job on that connection

## Verification Checklist
- [ ] No jobs run longer than `--timeout` (worker kills them)
- [ ] `retry_after` never expires before `--timeout` triggers
- [ ] Double-processing verified absent (no duplicate job execution)
- [ ] Jobs with custom `$timeout` respect the safety buffer
- [ ] Multiple queues on same connection all conform to same `retry_after`

## Security Checklist
- [ ] Double-processing doesn't cause data corruption (defense in depth)
- [ ] Job idempotency implemented as additional safeguard

## Performance Checklist
- [ ] `retry_after` has no CPU impact (backend timer only)
- [ ] `--timeout` uses signals or process monitoring — minimal CPU
- [ ] Double-processing from misconfiguration wastes 2x worker resources

## Production Readiness Checklist
- [ ] All queue connections have `retry_after` explicitly configured
- [ ] All worker commands have `--timeout` explicitly set
- [ ] Job `$timeout` properties audited for compliance
- [ ] Monitoring on job execution times to detect approaching limits

## Common Mistakes to Avoid
- [ ] `--timeout` > `retry_after` (guaranteed double processing)
- [ ] `--timeout` = `retry_after` (clock skew causes race — intermittent double processing)
- [ ] Not accounting for job `$timeout` property (silently bypasses worker `--timeout`)
