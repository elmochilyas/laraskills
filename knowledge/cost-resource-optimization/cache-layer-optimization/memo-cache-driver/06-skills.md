# Skill: Analyze and Optimize Memo Cache Driver

## Purpose

Analyze current infrastructure costs related to Memo Cache Driver and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Memo Cache Driver in a production Laravel application
- When optimizing or hardening Memo Cache Driver for operational use

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

1. Inventory current Memo Cache Driver resources, configurations, and usage patterns
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

- 1: Use Memo as a Wrapper Around Redis
- **Category**: Performance
- **Rule**: Configure the Laravel cache driver as 'memo' wrapping a Redis store in Laravel 13+
- **Reason**: Memo adds an in-memory layer on top of Redis; repeated lookups hit local memory (0ns latency) instead of querying Redis, reducing Redis GET commands by 50-80%
- **Bad Example**: Using Redis directly without memo; the same config value is fetched from Redis 10 times per request
- **Good Example**: Configuring `'default' => 'memo'` in config/cache.php with Redis as the underlying store; repeated lookups hit local memory

## Related Skills

- Configure and Implement Memo Cache Driver
- Monitor and Maintain Memo Cache Driver

## Success Criteria

- Memo Cache Driver configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Memo Cache Driver Cost Controls

## Purpose

Establish governance and automated controls to maintain Memo Cache Driver cost optimization over time.

## When To Use

- When implementing Memo Cache Driver in a production Laravel application
- When optimizing or hardening Memo Cache Driver for operational use

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

1. Define budget thresholds and cost allocation tags for Memo Cache Driver
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

- 1: Use Memo as a Wrapper Around Redis
- **Category**: Performance
- **Rule**: Configure the Laravel cache driver as 'memo' wrapping a Redis store in Laravel 13+
- **Reason**: Memo adds an in-memory layer on top of Redis; repeated lookups hit local memory (0ns latency) instead of querying Redis, reducing Redis GET commands by 50-80%
- **Bad Example**: Using Redis directly without memo; the same config value is fetched from Redis 10 times per request
- **Good Example**: Configuring `'default' => 'memo'` in config/cache.php with Redis as the underlying store; repeated lookups hit local memory

## Related Skills

- Configure and Implement Memo Cache Driver
- Monitor and Maintain Memo Cache Driver

## Success Criteria

- Memo Cache Driver configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
