# Skill: Analyze and Optimize Worker Scaling

## Purpose

Analyze current infrastructure costs related to Worker Scaling and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Worker Scaling in a production Laravel application
- When optimizing or hardening Worker Scaling for operational use

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

1. Inventory current Worker Scaling resources, configurations, and usage patterns
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

- 1: Scale Workers on SQS Queue Depth
- **Category**: Performance
- **Rule**: Use SQS ApproximateNumberOfMessagesVisible as the primary metric for worker auto-scaling
- **Reason**: Queue depth directly reflects job backlog and processing demand; scaling on CPU or memory does not correlate with queue processing needs
- **Bad Example**: Scaling workers based on EC2 CPU utilization—CPU stays low while queue depth grows to 10K because workers are waiting on database I/O
- **Good Example**: Target tracking on ApproximateNumberOfMessagesVisible to maintain a target queue depth (e.g., 1000 messages)

## Related Skills

- Configure and Implement Worker Scaling
- Monitor and Maintain Worker Scaling

## Success Criteria

- Worker Scaling configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Worker Scaling Cost Controls

## Purpose

Establish governance and automated controls to maintain Worker Scaling cost optimization over time.

## When To Use

- When implementing Worker Scaling in a production Laravel application
- When optimizing or hardening Worker Scaling for operational use

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

1. Define budget thresholds and cost allocation tags for Worker Scaling
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

- 1: Scale Workers on SQS Queue Depth
- **Category**: Performance
- **Rule**: Use SQS ApproximateNumberOfMessagesVisible as the primary metric for worker auto-scaling
- **Reason**: Queue depth directly reflects job backlog and processing demand; scaling on CPU or memory does not correlate with queue processing needs
- **Bad Example**: Scaling workers based on EC2 CPU utilization—CPU stays low while queue depth grows to 10K because workers are waiting on database I/O
- **Good Example**: Target tracking on ApproximateNumberOfMessagesVisible to maintain a target queue depth (e.g., 1000 messages)

## Related Skills

- Configure and Implement Worker Scaling
- Monitor and Maintain Worker Scaling

## Success Criteria

- Worker Scaling configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
