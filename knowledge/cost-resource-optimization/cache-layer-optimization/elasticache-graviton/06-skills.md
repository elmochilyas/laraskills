# Skill: Analyze and Optimize Elasticache Graviton

## Purpose

Analyze current infrastructure costs related to Elasticache Graviton and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Elasticache Graviton in a production Laravel application
- When optimizing or hardening Elasticache Graviton for operational use

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

1. Inventory current Elasticache Graviton resources, configurations, and usage patterns
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

- 1: Default to Graviton for All New Deployments
- **Category**: Cost Management
- **Rule**: Always select Graviton node types (m7g/r7g) for new ElastiCache clusters
- **Reason**: Graviton nodes are 20% cheaper than equivalent x86 nodes with identical or better performance for Redis/Valkey workloads; no code changes needed
- **Bad Example**: Selecting m7i.xlarge (x86) for a new ElastiCache cluster, paying 20% more than the equivalent m7g.xlarge (Graviton)
- **Good Example**: Choosing r7g.large from the start, saving 20% with no performance tradeoff

## Related Skills

- Configure and Implement Elasticache Graviton
- Monitor and Maintain Elasticache Graviton

## Success Criteria

- Elasticache Graviton configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Elasticache Graviton Cost Controls

## Purpose

Establish governance and automated controls to maintain Elasticache Graviton cost optimization over time.

## When To Use

- When implementing Elasticache Graviton in a production Laravel application
- When optimizing or hardening Elasticache Graviton for operational use

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

1. Define budget thresholds and cost allocation tags for Elasticache Graviton
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

- 1: Default to Graviton for All New Deployments
- **Category**: Cost Management
- **Rule**: Always select Graviton node types (m7g/r7g) for new ElastiCache clusters
- **Reason**: Graviton nodes are 20% cheaper than equivalent x86 nodes with identical or better performance for Redis/Valkey workloads; no code changes needed
- **Bad Example**: Selecting m7i.xlarge (x86) for a new ElastiCache cluster, paying 20% more than the equivalent m7g.xlarge (Graviton)
- **Good Example**: Choosing r7g.large from the start, saving 20% with no performance tradeoff

## Related Skills

- Configure and Implement Elasticache Graviton
- Monitor and Maintain Elasticache Graviton

## Success Criteria

- Elasticache Graviton configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
