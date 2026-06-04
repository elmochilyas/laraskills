# Skill: Analyze and Optimize Cache Warming Invalidation

## Purpose

Analyze current infrastructure costs related to Cache Warming Invalidation and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Cache Warming Invalidation in a production Laravel application
- When optimizing or hardening Cache Warming Invalidation for operational use

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

1. Inventory current Cache Warming Invalidation resources, configurations, and usage patterns
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

- 1: Use Laravel Cache Tags for Invalidation
- **Category**: Framework Usage
- **Rule**: Use `Cache::tags()` for atomic group invalidation rather than manual prefix scanning or full cache flush
- **Reason**: Tag-based invalidation is atomic with zero race conditions compared to prefix scanning; `Cache::tags(['posts'])->flush()` invalidates all post cache instantly
- **Bad Example**: Using `Cache::flush()` on deploy, invalidating all cache and causing 10 minutes of origin overload
- **Good Example**: Using `Cache::tags(['posts', 'users'])->flush()` to selectively invalidate only the relevant cache groups

## Related Skills

- Configure and Implement Cache Warming Invalidation
- Monitor and Maintain Cache Warming Invalidation

## Success Criteria

- Cache Warming Invalidation configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Cache Warming Invalidation Cost Controls

## Purpose

Establish governance and automated controls to maintain Cache Warming Invalidation cost optimization over time.

## When To Use

- When implementing Cache Warming Invalidation in a production Laravel application
- When optimizing or hardening Cache Warming Invalidation for operational use

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

1. Define budget thresholds and cost allocation tags for Cache Warming Invalidation
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

- 1: Use Laravel Cache Tags for Invalidation
- **Category**: Framework Usage
- **Rule**: Use `Cache::tags()` for atomic group invalidation rather than manual prefix scanning or full cache flush
- **Reason**: Tag-based invalidation is atomic with zero race conditions compared to prefix scanning; `Cache::tags(['posts'])->flush()` invalidates all post cache instantly
- **Bad Example**: Using `Cache::flush()` on deploy, invalidating all cache and causing 10 minutes of origin overload
- **Good Example**: Using `Cache::tags(['posts', 'users'])->flush()` to selectively invalidate only the relevant cache groups

## Related Skills

- Configure and Implement Cache Warming Invalidation
- Monitor and Maintain Cache Warming Invalidation

## Success Criteria

- Cache Warming Invalidation configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
