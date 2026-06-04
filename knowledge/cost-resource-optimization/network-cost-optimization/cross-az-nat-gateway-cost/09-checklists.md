# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 08-network-cost-optimization
**Knowledge Unit:** Cross-AZ and NAT Gateway Cost
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Collocate web servers and database in same AZ applied
- [ ] Use VPC Gateway Endpoints for S3 and DynamoDB applied
- [ ] Use VPC Interface Endpoints for other AWS services applied
- [ ] Collocate Application and Database in the Same AZ followed
- [ ] Use VPC Gateway Endpoints for S3 and DynamoDB Ã¢â‚¬â€ Free followed
- [ ] Use VPC Interface Endpoints for AWS Services Ã¢â‚¬â€ Cheaper Than NAT at Scale followed
- [ ] NAT Gateway for all AWS traffic prevented
- [ ] Multi-AZ without analysis prevented
- [ ] Running multiple NAT Gateways without evaluating cross-AZ traffic prevented
- [ ] Not using VPC endpoints for high-volume AWS services prevented

---

# Architecture Checklist

- [ ] Architecture guideline: One NAT Gateway per AZ is required for high availability; avoid unnecessary AZ expansion
- [ ] Architecture guideline: Use VPC endpoints for all AWS services accessed from private subnets
- [ ] Architecture guideline: Place application and database in same AZ for lowest network cost
- [ ] Architecture guideline: For production HA, use multi-AZ but accept the $100-300/month network overhead
- [ ] Architecture guideline: RDS Proxy for Lambda/Fargate connection pooling; PgBouncer for stable server fleets
- [ ] Architecture guideline: Network cost optimization hierarchy
- [ ] Collocate Application and Database in the Same AZ followed
- [ ] Use VPC Gateway Endpoints for S3 and DynamoDB Ã¢â‚¬â€ Free followed
- [ ] Use VPC Interface Endpoints for AWS Services Ã¢â‚¬â€ Cheaper Than NAT at Scale followed
- [ ] Minimize Cross-AZ Traffic Ã¢â‚¬â€ Place Frequently Communicating Services in Same AZ followed
- [ ] Monitor NAT Gateway BytesProcessed with Budget Alarm followed

---

# Implementation Checklist

- [ ] Best practice applied: Collocate web servers and database in same AZ
- [ ] Best practice applied: Use VPC Gateway Endpoints for S3 and DynamoDB
- [ ] Best practice applied: Use VPC Interface Endpoints for other AWS services
- [ ] Best practice applied: Minimize cross-AZ traffic
- [ ] Best practice applied: Monitor NAT Gateway BytesProcessed
- [ ] Collocate Application and Database in the Same AZ followed
- [ ] Use VPC Gateway Endpoints for S3 and DynamoDB Ã¢â‚¬â€ Free followed
- [ ] Use VPC Interface Endpoints for AWS Services Ã¢â‚¬â€ Cheaper Than NAT at Scale followed
- [ ] Minimize Cross-AZ Traffic Ã¢â‚¬â€ Place Frequently Communicating Services in Same AZ followed
- [ ] Monitor NAT Gateway BytesProcessed with Budget Alarm followed
- [ ] Workflow step completed: Inventory current Cross Az Nat Gateway Cost resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] NAT Gateway adds ~1-3ms latency per packet; VPC endpoints add <1ms
- [ ] RDS Proxy adds ~1-2ms per database connection; negligible for most workloads
- [ ] Cross-AZ latency
- [ ] Connection pooling reduces connection establishment overhead from ~10ms to <1ms
- [ ] VPC endpoints have a bandwidth limit of 10Gbps; request increase for high-throughput scenarios

---

# Security Checklist

- [ ] NAT Gateway traffic traverses internet; VPC endpoints stay within AWS backbone
- [ ] VPC Gateway Endpoints use IAM policies for access control; no security groups needed
- [ ] VPC Interface Endpoints support security groups for finer control
- [ ] VPC endpoints prevent data exfiltration via S3 (compliance requirement)
- [ ] Enable VPC Flow Logs to monitor data transfer patterns and detect anomalies

---

# Reliability Checklist

- [ ] Mistake prevented: Running multiple NAT Gateways without evaluating cross-AZ traffic
- [ ] Mistake prevented: Not using VPC endpoints for high-volume AWS services
- [ ] Mistake prevented: Placing app and database in different AZs
- [ ] Mistake prevented: Ignoring cross-AZ cost in migration

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Cross Az Nat Gateway Cost configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Collocate Application and Database in the Same AZ followed
- [ ] Use VPC Gateway Endpoints for S3 and DynamoDB Ã¢â‚¬â€ Free followed
- [ ] Use VPC Interface Endpoints for AWS Services Ã¢â‚¬â€ Cheaper Than NAT at Scale followed
- [ ] Minimize Cross-AZ Traffic Ã¢â‚¬â€ Place Frequently Communicating Services in Same AZ followed
- [ ] Monitor NAT Gateway BytesProcessed with Budget Alarm followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: NAT Gateway for all AWS traffic
- [ ] Anti-pattern prevented: Multi-AZ without analysis
- [ ] Anti-pattern prevented: No VPC endpoints
- [ ] Anti-pattern prevented: Spread-eagle service placement
- [ ] Common mistake prevented: Running multiple NAT Gateways without evaluating cross-AZ traffic
- [ ] Common mistake prevented: Not using VPC endpoints for high-volume AWS services
- [ ] Common mistake prevented: Placing app and database in different AZs
- [ ] Common mistake prevented: Ignoring cross-AZ cost in migration

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

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
