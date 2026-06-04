# Skill: Analyze and Optimize Redis Memory Optimization

## Purpose

Analyze current infrastructure costs related to Redis Memory Optimization and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Redis Memory Optimization in a production Laravel application
- When optimizing or hardening Redis Memory Optimization for operational use

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

1. Inventory current Redis Memory Optimization resources, configurations, and usage patterns
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

- 1: Use Hash Structures for Related Object Fields
- **Category**: Design
- **Rule**: Store related object fields as Redis hash fields instead of individual string keys
- **Reason**: Redis stores hashes more efficiently than strings for small-to-medium objects; hash encoding uses shared dictionary, saving 40-70% memory compared to flat string keys
- **Bad Example**: Storing `user:123:name`, `user:123:email`, `user:123:role` as three separate string keys
- **Good Example**: Storing all fields in a single hash `user:123` with fields `name`, `email`, `role`

## Related Skills

- Configure and Implement Redis Memory Optimization
- Monitor and Maintain Redis Memory Optimization

## Success Criteria

- Redis Memory Optimization configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Redis Memory Optimization Cost Controls

## Purpose

Establish governance and automated controls to maintain Redis Memory Optimization cost optimization over time.

## When To Use

- When implementing Redis Memory Optimization in a production Laravel application
- When optimizing or hardening Redis Memory Optimization for operational use

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

1. Define budget thresholds and cost allocation tags for Redis Memory Optimization
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

- 1: Use Hash Structures for Related Object Fields
- **Category**: Design
- **Rule**: Store related object fields as Redis hash fields instead of individual string keys
- **Reason**: Redis stores hashes more efficiently than strings for small-to-medium objects; hash encoding uses shared dictionary, saving 40-70% memory compared to flat string keys
- **Bad Example**: Storing `user:123:name`, `user:123:email`, `user:123:role` as three separate string keys
- **Good Example**: Storing all fields in a single hash `user:123` with fields `name`, `email`, `role`

## Related Skills

- Configure and Implement Redis Memory Optimization
- Monitor and Maintain Redis Memory Optimization

## Success Criteria

- Redis Memory Optimization configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
