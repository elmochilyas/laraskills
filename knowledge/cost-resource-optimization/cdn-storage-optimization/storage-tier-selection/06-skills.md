# Skill: Analyze and Optimize Storage Tier Selection

## Purpose

Analyze current infrastructure costs related to Storage Tier Selection and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Storage Tier Selection in a production Laravel application
- When optimizing or hardening Storage Tier Selection for operational use

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

1. Inventory current Storage Tier Selection resources, configurations, and usage patterns
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

- 1: Implement Lifecycle Policies on All Buckets
- **Category**: Cost Management
- **Rule**: Always configure lifecycle policies on every S3 bucket to transition objects to colder tiers based on age
- **Reason**: Keeping every object on S3 Standard indefinitely is the #1 storage cost waste; automated tier transitions save 40-96% on cold data with zero human intervention
- **Bad Example**: 2-year-old database backups on S3 Standard at $0.023/GB/month when they could be on Glacier Deep Archive at $0.00099/GB/month
- **Good Example**: Lifecycle policy: Standard (0-30d) -> IA (30-90d) -> Glacier (90-365d) -> Deep Archive (365d+)

## Related Skills

- Configure and Implement Storage Tier Selection
- Monitor and Maintain Storage Tier Selection

## Success Criteria

- Storage Tier Selection configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Storage Tier Selection Cost Controls

## Purpose

Establish governance and automated controls to maintain Storage Tier Selection cost optimization over time.

## When To Use

- When implementing Storage Tier Selection in a production Laravel application
- When optimizing or hardening Storage Tier Selection for operational use

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

1. Define budget thresholds and cost allocation tags for Storage Tier Selection
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

- 1: Implement Lifecycle Policies on All Buckets
- **Category**: Cost Management
- **Rule**: Always configure lifecycle policies on every S3 bucket to transition objects to colder tiers based on age
- **Reason**: Keeping every object on S3 Standard indefinitely is the #1 storage cost waste; automated tier transitions save 40-96% on cold data with zero human intervention
- **Bad Example**: 2-year-old database backups on S3 Standard at $0.023/GB/month when they could be on Glacier Deep Archive at $0.00099/GB/month
- **Good Example**: Lifecycle policy: Standard (0-30d) -> IA (30-90d) -> Glacier (90-365d) -> Deep Archive (365d+)

## Related Skills

- Configure and Implement Storage Tier Selection
- Monitor and Maintain Storage Tier Selection

## Success Criteria

- Storage Tier Selection configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
