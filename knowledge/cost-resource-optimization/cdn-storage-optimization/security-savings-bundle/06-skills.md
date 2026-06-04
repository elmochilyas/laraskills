# Skill: Analyze and Optimize Security Savings Bundle

## Purpose

Analyze current infrastructure costs related to Security Savings Bundle and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Security Savings Bundle in a production Laravel application
- When optimizing or hardening Security Savings Bundle for operational use

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

1. Inventory current Security Savings Bundle resources, configurations, and usage patterns
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

- 1: Optimize CloudFront Before Evaluating Bundle
- **Category**: Cost Management
- **Rule**: Implement compression, caching, and Origin Shield optimization before purchasing the Security Savings Bundle
- **Reason**: Compression reduces transfer 60-70%; cache optimization reduces origin fetches 85%+; these optimizations reduce CloudFront cost first, making any bundle discount more meaningful
- **Bad Example**: Committing to an annual bundle at current usage levels, then later discovering compression could have reduced usage by 60%, making the bundle unnecessary
- **Good Example**: First enabling compression, optimizing cache headers, and enabling Origin Shield; then evaluating bundle only if still needed

## Related Skills

- Configure and Implement Security Savings Bundle
- Monitor and Maintain Security Savings Bundle

## Success Criteria

- Security Savings Bundle configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Security Savings Bundle Cost Controls

## Purpose

Establish governance and automated controls to maintain Security Savings Bundle cost optimization over time.

## When To Use

- When implementing Security Savings Bundle in a production Laravel application
- When optimizing or hardening Security Savings Bundle for operational use

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

1. Define budget thresholds and cost allocation tags for Security Savings Bundle
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

- 1: Optimize CloudFront Before Evaluating Bundle
- **Category**: Cost Management
- **Rule**: Implement compression, caching, and Origin Shield optimization before purchasing the Security Savings Bundle
- **Reason**: Compression reduces transfer 60-70%; cache optimization reduces origin fetches 85%+; these optimizations reduce CloudFront cost first, making any bundle discount more meaningful
- **Bad Example**: Committing to an annual bundle at current usage levels, then later discovering compression could have reduced usage by 60%, making the bundle unnecessary
- **Good Example**: First enabling compression, optimizing cache headers, and enabling Origin Shield; then evaluating bundle only if still needed

## Related Skills

- Configure and Implement Security Savings Bundle
- Monitor and Maintain Security Savings Bundle

## Success Criteria

- Security Savings Bundle configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
