# Skill: Analyze and Optimize Sqs Chunking 64kb

## Purpose

Analyze current infrastructure costs related to Sqs Chunking 64kb and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Sqs Chunking 64kb in a production Laravel application
- When optimizing or hardening Sqs Chunking 64kb for operational use

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

1. Inventory current Sqs Chunking 64kb resources, configurations, and usage patterns
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

- 1: Keep Messages Under 64KB
- **Category**: Cost Management
- **Rule**: Always keep SQS message payloads under 64KB to avoid chunking into multiple billable requests
- **Reason**: SQS bills in 64KB chunks; a 65KB message counts as 2 requests, doubling the per-message cost; compression typically reduces payloads by 60-80%
- **Bad Example**: Sending a 100KB JSON payload as an SQS message, incurring 2 chunks and paying double per message
- **Good Example**: Compressing the payload with gzip to 25KB or sending only identifiers and fetching full data in the worker

## Related Skills

- Configure and Implement Sqs Chunking 64kb
- Monitor and Maintain Sqs Chunking 64kb

## Success Criteria

- Sqs Chunking 64kb configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Sqs Chunking 64kb Cost Controls

## Purpose

Establish governance and automated controls to maintain Sqs Chunking 64kb cost optimization over time.

## When To Use

- When implementing Sqs Chunking 64kb in a production Laravel application
- When optimizing or hardening Sqs Chunking 64kb for operational use

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

1. Define budget thresholds and cost allocation tags for Sqs Chunking 64kb
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

- 1: Keep Messages Under 64KB
- **Category**: Cost Management
- **Rule**: Always keep SQS message payloads under 64KB to avoid chunking into multiple billable requests
- **Reason**: SQS bills in 64KB chunks; a 65KB message counts as 2 requests, doubling the per-message cost; compression typically reduces payloads by 60-80%
- **Bad Example**: Sending a 100KB JSON payload as an SQS message, incurring 2 chunks and paying double per message
- **Good Example**: Compressing the payload with gzip to 25KB or sending only identifiers and fetching full data in the worker

## Related Skills

- Configure and Implement Sqs Chunking 64kb
- Monitor and Maintain Sqs Chunking 64kb

## Success Criteria

- Sqs Chunking 64kb configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
