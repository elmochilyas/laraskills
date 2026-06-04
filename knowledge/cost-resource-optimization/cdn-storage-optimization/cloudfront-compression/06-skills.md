# Skill: Analyze and Optimize Cloudfront Compression

## Purpose

Analyze current infrastructure costs related to Cloudfront Compression and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Cloudfront Compression in a production Laravel application
- When optimizing or hardening Cloudfront Compression for operational use

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

1. Inventory current Cloudfront Compression resources, configurations, and usage patterns
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

- 1: Enable CloudFront Automatic Compression
- **Category**: Cost Management
- **Rule**: Always enable CloudFront automatic compression for text-based content types
- **Reason**: Compression reduces data transfer by 60-70% for HTML, CSS, JS, JSON, XML, SVG; CloudFront compression is free; single toggle with no ongoing cost
- **Bad Example**: Serving uncompressed CSS and JS through CloudFront; a 100KB file stays 100KB over the wire
- **Good Example**: Enabling `compress: true` in CloudFront distribution; same 100KB file serves as ~30KB compressed

## Related Skills

- Configure and Implement Cloudfront Compression
- Monitor and Maintain Cloudfront Compression

## Success Criteria

- Cloudfront Compression configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Cloudfront Compression Cost Controls

## Purpose

Establish governance and automated controls to maintain Cloudfront Compression cost optimization over time.

## When To Use

- When implementing Cloudfront Compression in a production Laravel application
- When optimizing or hardening Cloudfront Compression for operational use

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

1. Define budget thresholds and cost allocation tags for Cloudfront Compression
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

- 1: Enable CloudFront Automatic Compression
- **Category**: Cost Management
- **Rule**: Always enable CloudFront automatic compression for text-based content types
- **Reason**: Compression reduces data transfer by 60-70% for HTML, CSS, JS, JSON, XML, SVG; CloudFront compression is free; single toggle with no ongoing cost
- **Bad Example**: Serving uncompressed CSS and JS through CloudFront; a 100KB file stays 100KB over the wire
- **Good Example**: Enabling `compress: true` in CloudFront distribution; same 100KB file serves as ~30KB compressed

## Related Skills

- Configure and Implement Cloudfront Compression
- Monitor and Maintain Cloudfront Compression

## Success Criteria

- Cloudfront Compression configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
