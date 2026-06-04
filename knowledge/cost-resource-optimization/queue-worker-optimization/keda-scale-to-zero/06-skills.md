# Skill: Analyze and Optimize Keda Scale To Zero

## Purpose

Analyze current infrastructure costs related to Keda Scale To Zero and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Keda Scale To Zero in a production Laravel application
- When optimizing or hardening Keda Scale To Zero for operational use

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

1. Inventory current Keda Scale To Zero resources, configurations, and usage patterns
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

- 1: Scale Workers to Zero on Idle Queues
- **Category**: Cost Management
- **Rule**: Configure KEDA ScaledObject to scale worker pods to zero when queues are empty
- **Reason**: Idle queue workers running 24/7 incur compute costs without processing any messages; scale-to-zero eliminates this baseline cost, reducing worker costs by 60-90% for variable-traffic apps
- **Bad Example**: Running 3 worker pods 24/7 on a queue that processes messages only during business hours, paying for idle capacity 16 hours/day
- **Good Example**: Deploying KEDA with ScaledObject scaling from 0 to 20 workers based on SQS queue depth, with zero pods during off-hours

## Related Skills

- Configure and Implement Keda Scale To Zero
- Monitor and Maintain Keda Scale To Zero

## Success Criteria

- Keda Scale To Zero configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Keda Scale To Zero Cost Controls

## Purpose

Establish governance and automated controls to maintain Keda Scale To Zero cost optimization over time.

## When To Use

- When implementing Keda Scale To Zero in a production Laravel application
- When optimizing or hardening Keda Scale To Zero for operational use

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

1. Define budget thresholds and cost allocation tags for Keda Scale To Zero
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

- 1: Scale Workers to Zero on Idle Queues
- **Category**: Cost Management
- **Rule**: Configure KEDA ScaledObject to scale worker pods to zero when queues are empty
- **Reason**: Idle queue workers running 24/7 incur compute costs without processing any messages; scale-to-zero eliminates this baseline cost, reducing worker costs by 60-90% for variable-traffic apps
- **Bad Example**: Running 3 worker pods 24/7 on a queue that processes messages only during business hours, paying for idle capacity 16 hours/day
- **Good Example**: Deploying KEDA with ScaledObject scaling from 0 to 20 workers based on SQS queue depth, with zero pods during off-hours

## Related Skills

- Configure and Implement Keda Scale To Zero
- Monitor and Maintain Keda Scale To Zero

## Success Criteria

- Keda Scale To Zero configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
