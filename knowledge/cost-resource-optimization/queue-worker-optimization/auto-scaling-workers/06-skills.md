# Skill: Analyze and Optimize Auto Scaling Workers

## Purpose

Analyze current infrastructure costs related to Auto Scaling Workers and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Auto Scaling Workers in a production Laravel application
- When optimizing or hardening Auto Scaling Workers for operational use

## When NOT To Use

- In prototype or throwaway applications where defaults suffice
- When the required infrastructure or dependencies are not available

## Prerequisites

- Laravel application with appropriate packages installed
- Access to required infrastructure and credentials
- Understanding of the relevant search/analytics/compliance concepts

## Inputs

- Business requirements and acceptance criteria
- Infrastructure access and configuration parameters

## Workflow (numbered steps)

1. Inventory current Auto Scaling Workers resources, configurations, and usage patterns
2. Calculate current monthly spend and cost per unit of work
3. Identify optimization opportunities: right-sizing, reserved capacity, spot usage
4. Implement highest-ROI optimizations first
5. Measure cost impact after each optimization change
6. Set up budget alerts and cost anomaly detection
7. Document optimization decisions and expected savings

## Validation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

## Common Failures

- Missing or incorrect environment variable configuration
- Insufficient permissions or credentials for the service
- Configuration drift between environments

## Decision Points

- Which engine/service provider best fits the use case requirements
- Tradeoffs between cost, performance, and feature completeness

## Performance/Security Considerations

- Keep all credentials and secrets in environment variables, never in code
- Monitor performance baselines before and after changes
- Follow least-privilege access for all services

## Related Rules (from 05-rules.md)

- 1: Scale on backlogPerWorker, Not Queue Depth Alone
- **Category**: Performance
- **Rule**: Scale workers based on backlog per worker (queue depth / active workers), not raw queue depth
- **Reason**: 1000 messages with 10 workers = 100 backlog each (fine); 1000 messages with 2 workers = 500 backlog each (need more); backlogPerWorker normalizes scaling for current capacity
- **Bad Example**: Adding 2 workers at depth=1000 regardless of current workers; if 10 workers are already active, adding more over-provisions
- **Good Example**: Scaling when backlogPerWorker exceeds threshold (e.g., >100); adding workers proportionally to backlog above target

## Related Skills

- Configure and Implement Auto Scaling Workers
- Monitor and Maintain Auto Scaling Workers

## Success Criteria

- Auto Scaling Workers configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Auto Scaling Workers Cost Controls

## Purpose

Establish governance and automated controls to maintain Auto Scaling Workers cost optimization over time.

## When To Use

- When implementing Auto Scaling Workers in a production Laravel application
- When optimizing or hardening Auto Scaling Workers for operational use

## When NOT To Use

- In prototype or throwaway applications where defaults suffice
- When the required infrastructure or dependencies are not available

## Prerequisites

- Laravel application with appropriate packages installed
- Access to required infrastructure and credentials
- Understanding of the relevant search/analytics/compliance concepts

## Inputs

- Business requirements and acceptance criteria
- Infrastructure access and configuration parameters

## Workflow (numbered steps)

1. Define budget thresholds and cost allocation tags for Auto Scaling Workers
2. Implement automated scaling policies based on utilization metrics
3. Configure lifecycle policies for resource cleanup
4. Set up scheduled start/stop for non-production resources
5. Implement commitment-based discounts (Reserved Instances, Savings Plans)
6. Create cost reporting dashboards for stakeholder visibility
7. Schedule regular cost review cadence

## Validation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

## Common Failures

- Missing or incorrect environment variable configuration
- Insufficient permissions or credentials for the service
- Configuration drift between environments

## Decision Points

- Which engine/service provider best fits the use case requirements
- Tradeoffs between cost, performance, and feature completeness

## Performance/Security Considerations

- Keep all credentials and secrets in environment variables, never in code
- Monitor performance baselines before and after changes
- Follow least-privilege access for all services

## Related Rules (from 05-rules.md)

- 1: Scale on backlogPerWorker, Not Queue Depth Alone
- **Category**: Performance
- **Rule**: Scale workers based on backlog per worker (queue depth / active workers), not raw queue depth
- **Reason**: 1000 messages with 10 workers = 100 backlog each (fine); 1000 messages with 2 workers = 500 backlog each (need more); backlogPerWorker normalizes scaling for current capacity
- **Bad Example**: Adding 2 workers at depth=1000 regardless of current workers; if 10 workers are already active, adding more over-provisions
- **Good Example**: Scaling when backlogPerWorker exceeds threshold (e.g., >100); adding workers proportionally to backlog above target

## Related Skills

- Configure and Implement Auto Scaling Workers
- Monitor and Maintain Auto Scaling Workers

## Success Criteria

- Auto Scaling Workers configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
