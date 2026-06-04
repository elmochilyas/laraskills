# Skill: Analyze and Optimize Worker Failure Cost

## Purpose

Analyze current infrastructure costs related to Worker Failure Cost and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Worker Failure Cost in a production Laravel application
- When optimizing or hardening Worker Failure Cost for operational use

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

1. Inventory current Worker Failure Cost resources, configurations, and usage patterns
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

- 1: Implement DLQ on Every Queue
- **Category**: Reliability
- **Rule**: Always configure a Dead Letter Queue for every SQS queue with max receive count of 3-5
- **Reason**: Poison pill messages (always fail) consume 100% worker time on unprocessable jobs; DLQ stops the waste after N attempts and enables manual review
- **Bad Example**: A malformed message retries 500 times, each taking 5 seconds (2,500 seconds wasted), before someone notices the issue
- **Good Example**: DLQ configured with maxReceiveCount=3; poison pill goes to DLQ in 30 seconds; alert triggers manual review

## Related Skills

- Configure and Implement Worker Failure Cost
- Monitor and Maintain Worker Failure Cost

## Success Criteria

- Worker Failure Cost configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Worker Failure Cost Cost Controls

## Purpose

Establish governance and automated controls to maintain Worker Failure Cost cost optimization over time.

## When To Use

- When implementing Worker Failure Cost in a production Laravel application
- When optimizing or hardening Worker Failure Cost for operational use

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

1. Define budget thresholds and cost allocation tags for Worker Failure Cost
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

- 1: Implement DLQ on Every Queue
- **Category**: Reliability
- **Rule**: Always configure a Dead Letter Queue for every SQS queue with max receive count of 3-5
- **Reason**: Poison pill messages (always fail) consume 100% worker time on unprocessable jobs; DLQ stops the waste after N attempts and enables manual review
- **Bad Example**: A malformed message retries 500 times, each taking 5 seconds (2,500 seconds wasted), before someone notices the issue
- **Good Example**: DLQ configured with maxReceiveCount=3; poison pill goes to DLQ in 30 seconds; alert triggers manual review

## Related Skills

- Configure and Implement Worker Failure Cost
- Monitor and Maintain Worker Failure Cost

## Success Criteria

- Worker Failure Cost configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
