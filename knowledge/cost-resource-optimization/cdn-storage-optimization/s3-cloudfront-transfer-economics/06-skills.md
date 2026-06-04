# Skill: Analyze and Optimize S3 Cloudfront Transfer Economics

## Purpose

Analyze current infrastructure costs related to S3 Cloudfront Transfer Economics and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing S3 Cloudfront Transfer Economics in a production Laravel application
- When optimizing or hardening S3 Cloudfront Transfer Economics for operational use

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

1. Inventory current S3 Cloudfront Transfer Economics resources, configurations, and usage patterns
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

- 1: Use S3 as Origin for All Static Assets
- **Category**: Cost Management
- **Rule**: Always use S3 as the origin for CloudFront serving static assets; never serve directly from S3
- **Reason**: S3-to-CloudFront transfer is free; CloudFront egress is cheaper than S3 direct ($0.085/GB vs $0.09/GB); free 1TB/month tier makes CloudFront cheaper at every volume
- **Bad Example**: Serving images directly from S3 public URLs, paying $0.09/GB egress with no caching
- **Good Example**: S3 origin with CloudFront in front; S3->CloudFront transfer is free, CloudFront egress is $0.085/GB, and caching reduces origin requests by 85%+

## Related Skills

- Configure and Implement S3 Cloudfront Transfer Economics
- Monitor and Maintain S3 Cloudfront Transfer Economics

## Success Criteria

- S3 Cloudfront Transfer Economics configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement S3 Cloudfront Transfer Economics Cost Controls

## Purpose

Establish governance and automated controls to maintain S3 Cloudfront Transfer Economics cost optimization over time.

## When To Use

- When implementing S3 Cloudfront Transfer Economics in a production Laravel application
- When optimizing or hardening S3 Cloudfront Transfer Economics for operational use

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

1. Define budget thresholds and cost allocation tags for S3 Cloudfront Transfer Economics
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

- 1: Use S3 as Origin for All Static Assets
- **Category**: Cost Management
- **Rule**: Always use S3 as the origin for CloudFront serving static assets; never serve directly from S3
- **Reason**: S3-to-CloudFront transfer is free; CloudFront egress is cheaper than S3 direct ($0.085/GB vs $0.09/GB); free 1TB/month tier makes CloudFront cheaper at every volume
- **Bad Example**: Serving images directly from S3 public URLs, paying $0.09/GB egress with no caching
- **Good Example**: S3 origin with CloudFront in front; S3->CloudFront transfer is free, CloudFront egress is $0.085/GB, and caching reduces origin requests by 85%+

## Related Skills

- Configure and Implement S3 Cloudfront Transfer Economics
- Monitor and Maintain S3 Cloudfront Transfer Economics

## Success Criteria

- S3 Cloudfront Transfer Economics configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
