# Skill: Analyze and Optimize Sqs Pricing Model

## Purpose

Analyze current infrastructure costs related to Sqs Pricing Model and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Sqs Pricing Model in a production Laravel application
- When optimizing or hardening Sqs Pricing Model for operational use

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

1. Inventory current Sqs Pricing Model resources, configurations, and usage patterns
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

- 1: Batch All SQS Operations
- **Category**: Cost Management
- **Rule**: Always batch Send, Receive, and Delete SQS operations to the maximum of 10 messages per request
- **Reason**: SQS charges per API request, not per message; batching reduces request count by 90%, dropping effective cost from $0.40/M to $0.04/M for equivalent message volume
- **Bad Example**: Receiving 1 message per poll and deleting individually, generating 20 API calls for 10 messages
- **Good Example**: Using ReceiveMessage with MaxNumberOfMessages=10 and DeleteMessageBatch, generating 2 API calls for 10 messages

## Related Skills

- Configure and Implement Sqs Pricing Model
- Monitor and Maintain Sqs Pricing Model

## Success Criteria

- Sqs Pricing Model configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Sqs Pricing Model Cost Controls

## Purpose

Establish governance and automated controls to maintain Sqs Pricing Model cost optimization over time.

## When To Use

- When implementing Sqs Pricing Model in a production Laravel application
- When optimizing or hardening Sqs Pricing Model for operational use

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

1. Define budget thresholds and cost allocation tags for Sqs Pricing Model
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

- 1: Batch All SQS Operations
- **Category**: Cost Management
- **Rule**: Always batch Send, Receive, and Delete SQS operations to the maximum of 10 messages per request
- **Reason**: SQS charges per API request, not per message; batching reduces request count by 90%, dropping effective cost from $0.40/M to $0.04/M for equivalent message volume
- **Bad Example**: Receiving 1 message per poll and deleting individually, generating 20 API calls for 10 messages
- **Good Example**: Using ReceiveMessage with MaxNumberOfMessages=10 and DeleteMessageBatch, generating 2 API calls for 10 messages

## Related Skills

- Configure and Implement Sqs Pricing Model
- Monitor and Maintain Sqs Pricing Model

## Success Criteria

- Sqs Pricing Model configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
