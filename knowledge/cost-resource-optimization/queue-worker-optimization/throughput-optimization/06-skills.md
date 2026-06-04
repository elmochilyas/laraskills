# Skill: Analyze and Optimize Throughput Optimization

## Purpose

Analyze current infrastructure costs related to Throughput Optimization and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Throughput Optimization in a production Laravel application
- When optimizing or hardening Throughput Optimization for operational use

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

1. Inventory current Throughput Optimization resources, configurations, and usage patterns
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

- 1: Use Long Polling with Maximum Wait Time
- **Category**: Performance
- **Rule**: Always set ReceiveMessageWaitTimeSeconds to 20 for maximum long polling benefit
- **Reason**: Long polling reduces empty responses by 95%+; each empty poll costs $0.40/M; at 1 poll/sec/worker, 10 workers generate $1,036/year in empty polls; long polling reduces to $52/year
- **Bad Example**: Using 0-second wait time (short polling), polling SQS every second even when the queue is empty
- **Good Example**: Setting WaitTimeSeconds=20 so the worker waits up to 20 seconds for messages before returning

## Related Skills

- Configure and Implement Throughput Optimization
- Monitor and Maintain Throughput Optimization

## Success Criteria

- Throughput Optimization configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Throughput Optimization Cost Controls

## Purpose

Establish governance and automated controls to maintain Throughput Optimization cost optimization over time.

## When To Use

- When implementing Throughput Optimization in a production Laravel application
- When optimizing or hardening Throughput Optimization for operational use

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

1. Define budget thresholds and cost allocation tags for Throughput Optimization
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

- 1: Use Long Polling with Maximum Wait Time
- **Category**: Performance
- **Rule**: Always set ReceiveMessageWaitTimeSeconds to 20 for maximum long polling benefit
- **Reason**: Long polling reduces empty responses by 95%+; each empty poll costs $0.40/M; at 1 poll/sec/worker, 10 workers generate $1,036/year in empty polls; long polling reduces to $52/year
- **Bad Example**: Using 0-second wait time (short polling), polling SQS every second even when the queue is empty
- **Good Example**: Setting WaitTimeSeconds=20 so the worker waits up to 20 seconds for messages before returning

## Related Skills

- Configure and Implement Throughput Optimization
- Monitor and Maintain Throughput Optimization

## Success Criteria

- Throughput Optimization configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
