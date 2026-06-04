# Skill: Analyze and Optimize Sqs Idle Lambda Polling

## Purpose

Analyze current infrastructure costs related to Sqs Idle Lambda Polling and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Sqs Idle Lambda Polling in a production Laravel application
- When optimizing or hardening Sqs Idle Lambda Polling for operational use

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

1. Inventory current Sqs Idle Lambda Polling resources, configurations, and usage patterns
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

- 1: Enable Long Polling on All Queues
- **Category**: Cost Management
- **Rule**: Always use long polling (ReceiveMessageWaitTimeSeconds=20) on every SQS queue with Lambda event source mappings
- **Reason**: Lambda ESM uses long polling by default, but custom workers and misconfigured mappings may use short polling, generating ~1.7M empty receives/month per idle queue at $0.68/month in SQS costs
- **Bad Example**: A custom Lambda consumer using short polling on an idle queue, generating 2.6M empty receives/month at $1.04/month in unnecessary costs
- **Good Example**: Ensuring all queue consumers (Lambda ESM or custom) use long polling, reducing empty receives from 1.7M to ~85K/month, dropping cost from $0.68 to ~$0.03 per idle queue

## Related Skills

- Configure and Implement Sqs Idle Lambda Polling
- Monitor and Maintain Sqs Idle Lambda Polling

## Success Criteria

- Sqs Idle Lambda Polling configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Sqs Idle Lambda Polling Cost Controls

## Purpose

Establish governance and automated controls to maintain Sqs Idle Lambda Polling cost optimization over time.

## When To Use

- When implementing Sqs Idle Lambda Polling in a production Laravel application
- When optimizing or hardening Sqs Idle Lambda Polling for operational use

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

1. Define budget thresholds and cost allocation tags for Sqs Idle Lambda Polling
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

- 1: Enable Long Polling on All Queues
- **Category**: Cost Management
- **Rule**: Always use long polling (ReceiveMessageWaitTimeSeconds=20) on every SQS queue with Lambda event source mappings
- **Reason**: Lambda ESM uses long polling by default, but custom workers and misconfigured mappings may use short polling, generating ~1.7M empty receives/month per idle queue at $0.68/month in SQS costs
- **Bad Example**: A custom Lambda consumer using short polling on an idle queue, generating 2.6M empty receives/month at $1.04/month in unnecessary costs
- **Good Example**: Ensuring all queue consumers (Lambda ESM or custom) use long polling, reducing empty receives from 1.7M to ~85K/month, dropping cost from $0.68 to ~$0.03 per idle queue

## Related Skills

- Configure and Implement Sqs Idle Lambda Polling
- Monitor and Maintain Sqs Idle Lambda Polling

## Success Criteria

- Sqs Idle Lambda Polling configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
