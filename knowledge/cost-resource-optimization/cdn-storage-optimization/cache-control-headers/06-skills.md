# Skill: Analyze and Optimize Cache Control Headers

## Purpose

Analyze current infrastructure costs related to Cache Control Headers and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Cache Control Headers in a production Laravel application
- When optimizing or hardening Cache Control Headers for operational use

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

1. Inventory current Cache Control Headers resources, configurations, and usage patterns
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

- 1: Set Immutable Cache for Versioned Static Assets
- **Category**: Performance
- **Rule**: Use `Cache-Control: public, max-age=31536000, immutable` for all content-hashed static assets
- **Reason**: Hash changes when content changes; browser/CDN never re-requests until the file changes, achieving zero origin load for assets and fastest possible client caching
- **Bad Example**: Setting `max-age=3600` for `app.a1b2c3d4.js`; browsers revalidate every hour despite the URL being unique per version
- **Good Example**: `Cache-Control: public, max-age=31536000, immutable` on hashed assets; browser never re-requests until a new version is deployed

## Related Skills

- Configure and Implement Cache Control Headers
- Monitor and Maintain Cache Control Headers

## Success Criteria

- Cache Control Headers configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Cache Control Headers Cost Controls

## Purpose

Establish governance and automated controls to maintain Cache Control Headers cost optimization over time.

## When To Use

- When implementing Cache Control Headers in a production Laravel application
- When optimizing or hardening Cache Control Headers for operational use

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

1. Define budget thresholds and cost allocation tags for Cache Control Headers
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

- 1: Set Immutable Cache for Versioned Static Assets
- **Category**: Performance
- **Rule**: Use `Cache-Control: public, max-age=31536000, immutable` for all content-hashed static assets
- **Reason**: Hash changes when content changes; browser/CDN never re-requests until the file changes, achieving zero origin load for assets and fastest possible client caching
- **Bad Example**: Setting `max-age=3600` for `app.a1b2c3d4.js`; browsers revalidate every hour despite the URL being unique per version
- **Good Example**: `Cache-Control: public, max-age=31536000, immutable` on hashed assets; browser never re-requests until a new version is deployed

## Related Skills

- Configure and Implement Cache Control Headers
- Monitor and Maintain Cache Control Headers

## Success Criteria

- Cache Control Headers configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
