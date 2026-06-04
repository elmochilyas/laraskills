# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** cost-token-management
**Knowledge Unit:** usage-metering-billing
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Admin override
- [ ] AWS billing for AI
- [ ] Dual tracking
- [ ] Quota notification
- [ ] SaaS usage metering
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Usage Metering & Billing Integration

---

# Architecture Checklist

- [ ] Aggregation interval â†’ Hourly for high
- [ ] In
- [ ] Quota reset â†’ Align with subscription billing cycle. Monthly billing â†’ monthly quota reset. Annual billing â†’ annual quota
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Admin override
- [ ] AWS billing for AI
- [ ] Dual tracking
- [ ] Quota notification
- [ ] SaaS usage metering
- [ ] Tiered metering rates
- [ ] Rules for Usage Metering & Billing Integration

---

# Performance Checklist

- [ ] Aggregation job: scheduled, not real-time â€” negligible user-facing impact
- [ ] Quota check: <1ms (Redis counter read)
- [ ] Stripe API calls: batched per aggregation interval
- [ ] Stripe metering event: ~200ms per batch â€” run as queued job
- [ ] Usage recording: <5ms per request (Redis counter increment)

---

# Security Checklist

- [ ] GDPR: usage data is personal data â€” include in data retention policy
- [ ] Handle mid-cycle plan upgrades â€” pro-rate quota
- [ ] Handle Stripe API failures gracefully â€” queue events for retry, don't block app
- [ ] Implement meter event idempotency â€” prevent double-billing on retry
- [ ] Monitor Stripe metering event volume â€” high-volume apps may need batching
- [ ] Reconcile in-app vs. Stripe usage monthly â€” identify discrepancies
- [ ] Store usage records for audit â€” immutable log of all AI consumption

---

# Reliability Checklist

- [ ] Building billing on approximate token counts â€” always reconcile with provider-reported usage
- [ ] Ignoring multi-currency billing â€” AI pricing is USD, but customers may bill in local currency
- [ ] Mixing test and production usage data in Stripe â€” separate Stripe environments
- [ ] No idempotency on usage events â€” retry causes double-billing
- [ ] Not handling quota exhaustion gracefully â€” user gets hard error instead of upgrade prompt
- [ ] Synchronous Stripe API calls during AI request â€” adds 200-500ms latency

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.
- [ ] Security considerations are addressed.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Usage Metering â€” Costs Not Attributable]
- [ ] [Metering Without Real-Time Counters â€” Delayed Cost Data]
- [ ] [Not Separating Input vs. Output Token Costs]
- [ ] [No Metering Per Provider/Model â€” Can't Compare Costs]
- [ ] [Metering Data Not Exposed for User Dashboards]
- [ ] Meter event limit
- [ ] Mid-cycle data loss
- [ ] Quota race condition
- [ ] Stripe outage
- [ ] Usage reconciliation failure

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


