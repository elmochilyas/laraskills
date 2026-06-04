# Skill: Analyze and Optimize File Compression

## Purpose

Analyze current infrastructure costs related to File Compression and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing File Compression in a production Laravel application
- When optimizing or hardening File Compression for operational use

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

1. Inventory current File Compression resources, configurations, and usage patterns
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
- **Rule**: Always enable CloudFront automatic compression for all text-based content types
- **Reason**: Compression reduces data transfer by 60-80% for HTML, CSS, JS, JSON, XML, SVG; CloudFront compression is free; it is a single toggle with no ongoing maintenance
- **Bad Example**: Serving uncompressed CSS/JS through CloudFront; a 150KB bundle remains 150KB over the wire
- **Good Example**: Enabling "Compress objects automatically" in CloudFront; same 150KB bundle serves as ~35KB compressed

## Related Skills

- Configure and Implement File Compression
- Monitor and Maintain File Compression

## Success Criteria

- File Compression configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement File Compression Cost Controls

## Purpose

Establish governance and automated controls to maintain File Compression cost optimization over time.

## When To Use

- When implementing File Compression in a production Laravel application
- When optimizing or hardening File Compression for operational use

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

1. Define budget thresholds and cost allocation tags for File Compression
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
- **Rule**: Always enable CloudFront automatic compression for all text-based content types
- **Reason**: Compression reduces data transfer by 60-80% for HTML, CSS, JS, JSON, XML, SVG; CloudFront compression is free; it is a single toggle with no ongoing maintenance
- **Bad Example**: Serving uncompressed CSS/JS through CloudFront; a 150KB bundle remains 150KB over the wire
- **Good Example**: Enabling "Compress objects automatically" in CloudFront; same 150KB bundle serves as ~35KB compressed

## Related Skills

- Configure and Implement File Compression
- Monitor and Maintain File Compression

## Success Criteria

- File Compression configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
