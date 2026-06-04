# Skill: Analyze and Optimize Origin Shielding

## Purpose

Analyze current infrastructure costs related to Origin Shielding and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Origin Shielding in a production Laravel application
- When optimizing or hardening Origin Shielding for operational use

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

1. Inventory current Origin Shielding resources, configurations, and usage patterns
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

- 1: Enable Origin Shield for Multi-Region Audiences
- **Category**: Architecture
- **Rule**: Enable CloudFront Origin Shield when the application has users in multiple geographic regions
- **Reason**: Without Shield, each of 10+ global edge POPs independently requests uncached content from origin; Shield aggregates these into a single origin request, reducing origin load by 70-90%
- **Bad Example**: Users in US, EU, and Asia all served from the same origin; each region sends independent requests for uncached content
- **Good Example**: Enabling Origin Shield with region set to the origin's AWS region; edge POPs route through Shield, aggregating cache misses into one origin request

## Related Skills

- Configure and Implement Origin Shielding
- Monitor and Maintain Origin Shielding

## Success Criteria

- Origin Shielding configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Origin Shielding Cost Controls

## Purpose

Establish governance and automated controls to maintain Origin Shielding cost optimization over time.

## When To Use

- When implementing Origin Shielding in a production Laravel application
- When optimizing or hardening Origin Shielding for operational use

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

1. Define budget thresholds and cost allocation tags for Origin Shielding
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

- 1: Enable Origin Shield for Multi-Region Audiences
- **Category**: Architecture
- **Rule**: Enable CloudFront Origin Shield when the application has users in multiple geographic regions
- **Reason**: Without Shield, each of 10+ global edge POPs independently requests uncached content from origin; Shield aggregates these into a single origin request, reducing origin load by 70-90%
- **Bad Example**: Users in US, EU, and Asia all served from the same origin; each region sends independent requests for uncached content
- **Good Example**: Enabling Origin Shield with region set to the origin's AWS region; edge POPs route through Shield, aggregating cache misses into one origin request

## Related Skills

- Configure and Implement Origin Shielding
- Monitor and Maintain Origin Shielding

## Success Criteria

- Origin Shielding configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
