# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 09-analytical-queries
**Knowledge Unit:** ai-olap-modeling
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] LLM-powered schema optimization workflow designed — query logs -> LLM -> recommendations
- [ ] ClickHouse/Snowflake query log collected for LLM analysis input
- [ ] Star-schema design (K006) improvements recommended by LLM evaluated
- [ ] MergeTree ORDER BY and PARTITION BY (K012) recommendations from LLM reviewed
- [ ] Projection vs Materialized View (K031) recommendations assessed
- [ ] Codec selection (K035) suggestions incorporated into DDL

---

# Architecture Checklist

- [ ] Query log pipeline: system.query_log -> analytics table -> LLM prompt template
- [ ] LLM prompt structured: schema DDL + query examples + statistics -> optimization suggestions
- [ ] LLM recommendations reviewed by human before DDL changes — no auto-apply
- [ ] Schema recommendation targets star-schema dimension/fact optimization (K006)
- [ ] Projection/MV recommendation includes storage and latency tradeoffs (K031)
- [ ] Codec recommendation based on actual data distribution from column statistics

---

# Implementation Checklist

- [ ] system.query_log (ClickHouse) or INFORMATION_SCHEMA.QUERY_HISTORY (Snowflake) extracted to analysis table
- [ ] LLM prompt template: "Given this schema DDL and these query patterns, suggest ORDER BY, PARTITION BY, projections, MVs, and codecs"
- [ ] Python/phps script prepares analysis input: top-10 slowest queries, table stats, current DDL
- [ ] LLM response parsed: recommended DDL changes with rationale
- [ ] Human review workflow: recommended change -> review -> approve -> apply
- [ ] A/B test: before/after query performance compared for applied recommendations

---

# Performance Checklist

- [ ] Query latency improvement measured before vs after LLM-recommended change
- [ ] LLM recommendation ranked by estimated performance impact
- [ ] False positive rate tracked — LLM recommendations that did not improve performance
- [ ] Query log collection overhead measured — system.query_log enabled with minimal retention
- [ ] LLM API cost per analysis measured and budgeted
- [ ] A/B test period sufficient for statistically significant results

---

# Security Checklist

- [ ] Query log may contain sensitive table/column names — LLM prompt filtered
- [ ] Data sample sent to LLM anonymous — no PII in prompt
- [ ] LLM provider terms reviewed — no data retention for API usage
- [ ] Recommended DDL changes reviewed for security implications before apply
- [ ] Automated apply not allowed — human approval required for all schema changes

---

# Reliability Checklist

- [ ] LLM recommendation is advisory only — non-deterministic output
- [ ] Rollback plan for each applied recommendation (ALTER to revert)
- [ ] Query log pipeline failure does not impact production query execution
- [ ] LLM API outage handled gracefully — schema optimization waits or uses cached analysis
- [ ] Recommendation automated test: apply to staging, run queries, compare performance

---

# Testing Checklist

- [ ] Test LLM recommendation applied to staging — query performance before/after
- [ ] Test LLM rollback — ALTER TABLE to restore original configuration
- [ ] Test LLM prompt sanitization — no PII or sensitive data in prompt
- [ ] Test query log collection completeness — all query patterns captured
- [ ] Test A/B test validity — same query workload before and after change
- [ ] Test false positive detection — LLM recommendations validated against actual benchmarks

---

# Maintainability Checklist

- [ ] LLM analysis script in version-controlled repository
- [ ] Prompt templates versioned alongside schema changes
- [ ] Recommendation history logged with outcome (accepted/rejected/performance impact)
- [ ] Query log analysis results published to data team wiki
- [ ] LLM API cost tracked monthly for ROI calculation

---

# Anti-Pattern Prevention Checklist

- [ ] Do not auto-apply LLM recommendations — human review required
- [ ] Do not send raw query logs to LLM — filter sensitive information first
- [ ] Do not skip A/B testing — LLM recommendations may not improve performance
- [ ] Do not use LLM for schema design from scratch — LLM optimizes existing schema
- [ ] Do not ignore non-LLM optimization techniques — LLM is one tool among many

---

# Production Readiness Checklist

- [ ] Prometheus metrics for query latency improvement per LLM-recommended change
- [ ] Logged warning when LLM recommendation would increase storage cost
- [ ] Alert if LLM API returns errors (rate limit, timeout)
- [ ] Schema optimization ticker: open recommendations pending review
- [ ] Deploy checklist includes LLM recommendation human approval step
- [ ] Staging A/B test validates recommendation before production schema change

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: query log pipeline, LLM prompt, human review, A/B test
- [ ] Security requirements satisfied: filtered prompts, no PII exposure, provider terms, human approval
- [ ] Performance requirements satisfied: before/after measurement, impact ranking, false positive tracking
- [ ] Testing requirements satisfied: staging apply/rollback, prompt sanitization, A/B validity, benchmark
- [ ] Anti-pattern checks passed: no auto-apply, filtered logs, A/B testing, existing schema focus
- [ ] Production readiness verified: latency metrics, storage cost warnings, API health, ticket tracker, staging

---

# Related References

- K006 (Star Schema): LLM recommendations target star-schema design improvements
- K012 (ClickHouse MergeTree): ORDER BY and partition recommendations affect MergeTree config
- K031 (Projections vs Materialized Views): LLM often recommends projections or MVs as optimizations
- K035 (ClickHouse Codecs): LLM-assisted codec selection
