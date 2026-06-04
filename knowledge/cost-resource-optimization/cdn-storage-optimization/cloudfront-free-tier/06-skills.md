# Skill: Analyze and Optimize Cloudfront Free Tier

## Purpose

Analyze current infrastructure costs related to Cloudfront Free Tier and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Cloudfront Free Tier in a production Laravel application
- When optimizing or hardening Cloudfront Free Tier for operational use

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

1. Inventory current Cloudfront Free Tier resources, configurations, and usage patterns
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

- 1: Always Put CloudFront in Front of S3
- **Category**: Cost Management
- **Rule**: Always route all public S3 asset delivery through CloudFront
- **Reason**: CloudFront offers 1TB free egress/month permanently + 10M free HTTP/HTTPS requests; S3 direct egress has no free tier and is more expensive per GB
- **Bad Example**: Serving assets directly from S3 at 500GB/month, paying ~$46/month in egress costs
- **Good Example**: CloudFront in front of S3; first 1TB/month is free, saving $46+ per month

## Related Skills

- Configure and Implement Cloudfront Free Tier
- Monitor and Maintain Cloudfront Free Tier

## Success Criteria

- Cloudfront Free Tier configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Cloudfront Free Tier Cost Controls

## Purpose

Establish governance and automated controls to maintain Cloudfront Free Tier cost optimization over time.

## When To Use

- When implementing Cloudfront Free Tier in a production Laravel application
- When optimizing or hardening Cloudfront Free Tier for operational use

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

1. Define budget thresholds and cost allocation tags for Cloudfront Free Tier
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

- 1: Always Put CloudFront in Front of S3
- **Category**: Cost Management
- **Rule**: Always route all public S3 asset delivery through CloudFront
- **Reason**: CloudFront offers 1TB free egress/month permanently + 10M free HTTP/HTTPS requests; S3 direct egress has no free tier and is more expensive per GB
- **Bad Example**: Serving assets directly from S3 at 500GB/month, paying ~$46/month in egress costs
- **Good Example**: CloudFront in front of S3; first 1TB/month is free, saving $46+ per month

## Related Skills

- Configure and Implement Cloudfront Free Tier
- Monitor and Maintain Cloudfront Free Tier

## Success Criteria

- Cloudfront Free Tier configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
