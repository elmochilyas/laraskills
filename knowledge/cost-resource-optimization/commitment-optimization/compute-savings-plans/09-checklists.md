# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 06-commitment-optimization
**Knowledge Unit:** Compute Savings Plans
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Compute Savings Plans purchased for baseline compute
- [ ] Commitment based on minimum hourly usage (floor), not peak
- [ ] Right-sizing analysis completed before commitment
- [ ] SP utilization >90% (monitored via Cost Explorer)
- [ ] Expiration notifications configured 30 days before end
- [ ] Commit to floor, not ceiling applied
- [ ] Right-size before committing applied
- [ ] Start with 1-year Partial Upfront for first purchase applied
- [ ] Always Purchase Compute SP Before Any Other Commitment Instrument followed
- [ ] Commit to Floor (80-90% of Minimum Hourly Usage), Not Ceiling followed
- [ ] Right-Size Instances Before Committing Ã¢â‚¬â€ Always followed
- [ ] Buying RIs instead of Compute SPs prevented
- [ ] 100% On-Demand prevented
- [ ] Over-committing prevented
- [ ] Not right-sizing first prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Purchase Compute SPs before considering EC2 Instance SPs (flexibility first)
- [ ] Architecture guideline: Set expiration notifications 30 days before SP end date (prevents On-Demand revert)
- [ ] Architecture guideline: Use AWS Organizations consolidated billing to share SPs across accounts
- [ ] Architecture guideline: Monitor SP utilization monthly; target >90% utilization
- [ ] Architecture guideline: If utilization >95% consistently for 60 days, increase commitment at next renewal
- [ ] Always Purchase Compute SP Before Any Other Commitment Instrument followed
- [ ] Commit to Floor (80-90% of Minimum Hourly Usage), Not Ceiling followed
- [ ] Right-Size Instances Before Committing Ã¢â‚¬â€ Always followed
- [ ] Start with 1-Year Partial Upfront for First Purchase followed
- [ ] Use Cost Explorer Recommendations Ã¢â‚¬â€ Never Guess Commitment Amounts followed

---

# Implementation Checklist

- [ ] Best practice applied: Commit to floor, not ceiling
- [ ] Best practice applied: Right-size before committing
- [ ] Best practice applied: Start with 1-year Partial Upfront for first purchase
- [ ] Best practice applied: Use Cost Explorer recommendations
- [ ] Best practice applied: Combine SP + Spot for layered strategy
- [ ] Always Purchase Compute SP Before Any Other Commitment Instrument followed
- [ ] Commit to Floor (80-90% of Minimum Hourly Usage), Not Ceiling followed
- [ ] Right-Size Instances Before Committing Ã¢â‚¬â€ Always followed
- [ ] Start with 1-Year Partial Upfront for First Purchase followed
- [ ] Use Cost Explorer Recommendations Ã¢â‚¬â€ Never Guess Commitment Amounts followed
- [ ] Combine SP + Spot for Layered Cost Strategy followed
- [ ] Workflow step completed: Inventory current Compute Savings Plans resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] SPs are a billing mechanism only Ã¢â‚¬â€ no performance impact
- [ ] Same instance performance as On-Demand (identical hardware)
- [ ] No cold start, latency, or throughput difference
- [ ] Spot instances used alongside SPs have identical hardware performance

---

# Security Checklist

- [ ] SP purchase requires IAM permissions
- [ ] Limit SP purchasing authority to specific IAM roles (financial impact)
- [ ] SPs are financial commitment; monitor via AWS Budgets to prevent unexpected auto-renewal
- [ ] No security boundary implications (SPs are billing, not infrastructure)

---

# Reliability Checklist

- [ ] Mistake prevented: Over-committing
- [ ] Mistake prevented: Not right-sizing first
- [ ] Mistake prevented: Choosing 3-year before testing 1-year

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Compute Savings Plans purchased for baseline compute
- [ ] Commitment based on minimum hourly usage (floor), not peak
- [ ] Right-sizing analysis completed before commitment
- [ ] SP utilization >90% (monitored via Cost Explorer)
- [ ] Expiration notifications configured 30 days before end
- [ ] Spot instances used for overflow/variable capacity

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Compute Savings Plans configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Always Purchase Compute SP Before Any Other Commitment Instrument followed
- [ ] Commit to Floor (80-90% of Minimum Hourly Usage), Not Ceiling followed
- [ ] Right-Size Instances Before Committing Ã¢â‚¬â€ Always followed
- [ ] Start with 1-Year Partial Upfront for First Purchase followed
- [ ] Use Cost Explorer Recommendations Ã¢â‚¬â€ Never Guess Commitment Amounts followed
- [ ] Combine SP + Spot for Layered Cost Strategy followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Buying RIs instead of Compute SPs
- [ ] Anti-pattern prevented: 100% On-Demand
- [ ] Anti-pattern prevented: Auto-renew without review
- [ ] Anti-pattern prevented: Single-account SP management
- [ ] Common mistake prevented: Over-committing
- [ ] Common mistake prevented: Not right-sizing first
- [ ] Common mistake prevented: Choosing 3-year before testing 1-year

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Compute Savings Plans purchased for baseline compute
- [ ] Verification passed: Commitment based on minimum hourly usage (floor), not peak
- [ ] Verification passed: Right-sizing analysis completed before commitment

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
