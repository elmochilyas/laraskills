# Skill: Analyze and Optimize Cloudfront Vs Direct S3

## Purpose

Analyze current infrastructure costs related to Cloudfront Vs Direct S3 and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Cloudfront Vs Direct S3 in a production Laravel application
- When optimizing or hardening Cloudfront Vs Direct S3 for operational use

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

1. Inventory current Cloudfront Vs Direct S3 resources, configurations, and usage patterns
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

- 1: Route All Public S3 Content Through CloudFront
- **Category**: Architecture
- **Rule**: Always put CloudFront in front of S3 for all publicly served content at every volume level
- **Reason**: CloudFront egress is cheaper than S3 direct at every tier ($0.085/GB vs $0.09/GB); free 1TB/month covers most apps; S3-to-CloudFront transfer is free
- **Bad Example**: Serving public images directly from S3 bucket URLs, paying $0.09/GB egress with no caching
- **Good Example**: CloudFront distribution with S3 origin; S3 bucket is fully private (OAC), all traffic goes through CloudFront

## Related Skills

- Configure and Implement Cloudfront Vs Direct S3
- Monitor and Maintain Cloudfront Vs Direct S3

## Success Criteria

- Cloudfront Vs Direct S3 configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Cloudfront Vs Direct S3 Cost Controls

## Purpose

Establish governance and automated controls to maintain Cloudfront Vs Direct S3 cost optimization over time.

## When To Use

- When implementing Cloudfront Vs Direct S3 in a production Laravel application
- When optimizing or hardening Cloudfront Vs Direct S3 for operational use

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

1. Define budget thresholds and cost allocation tags for Cloudfront Vs Direct S3
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

- 1: Route All Public S3 Content Through CloudFront
- **Category**: Architecture
- **Rule**: Always put CloudFront in front of S3 for all publicly served content at every volume level
- **Reason**: CloudFront egress is cheaper than S3 direct at every tier ($0.085/GB vs $0.09/GB); free 1TB/month covers most apps; S3-to-CloudFront transfer is free
- **Bad Example**: Serving public images directly from S3 bucket URLs, paying $0.09/GB egress with no caching
- **Good Example**: CloudFront distribution with S3 origin; S3 bucket is fully private (OAC), all traffic goes through CloudFront

## Related Skills

- Configure and Implement Cloudfront Vs Direct S3
- Monitor and Maintain Cloudfront Vs Direct S3

## Success Criteria

- Cloudfront Vs Direct S3 configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
