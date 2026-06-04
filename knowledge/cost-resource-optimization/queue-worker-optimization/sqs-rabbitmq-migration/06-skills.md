# Skill: Analyze and Optimize Sqs Rabbitmq Migration

## Purpose

Analyze current infrastructure costs related to Sqs Rabbitmq Migration and implement optimizations to reduce spending while maintaining performance.

## When To Use

- When implementing Sqs Rabbitmq Migration in a production Laravel application
- When optimizing or hardening Sqs Rabbitmq Migration for operational use

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

1. Inventory current Sqs Rabbitmq Migration resources, configurations, and usage patterns
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

- 1: Evaluate Breakeven Before Migration
- **Category**: Cost Management
- **Rule**: Do not migrate from SQS to RabbitMQ until message volume exceeds 100M messages/day
- **Reason**: SQS's pay-per-use pricing is cheaper at low-to-medium volume; RabbitMQ's fixed operational cost only becomes favorable above breakeven
- **Bad Example**: Migrating to RabbitMQ at 10M messages/day and paying $2,800/month for RabbitMQ infrastructure when SQS would cost ~$400/month
- **Good Example**: At 150M messages/day, computing SQS cost ($6,000/month) vs RabbitMQ total cost ($2,800/month + ops), then migrating for 50%+ savings

## Related Skills

- Configure and Implement Sqs Rabbitmq Migration
- Monitor and Maintain Sqs Rabbitmq Migration

## Success Criteria

- Sqs Rabbitmq Migration configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Implement Sqs Rabbitmq Migration Cost Controls

## Purpose

Establish governance and automated controls to maintain Sqs Rabbitmq Migration cost optimization over time.

## When To Use

- When implementing Sqs Rabbitmq Migration in a production Laravel application
- When optimizing or hardening Sqs Rabbitmq Migration for operational use

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

1. Define budget thresholds and cost allocation tags for Sqs Rabbitmq Migration
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

- 1: Evaluate Breakeven Before Migration
- **Category**: Cost Management
- **Rule**: Do not migrate from SQS to RabbitMQ until message volume exceeds 100M messages/day
- **Reason**: SQS's pay-per-use pricing is cheaper at low-to-medium volume; RabbitMQ's fixed operational cost only becomes favorable above breakeven
- **Bad Example**: Migrating to RabbitMQ at 10M messages/day and paying $2,800/month for RabbitMQ infrastructure when SQS would cost ~$400/month
- **Good Example**: At 150M messages/day, computing SQS cost ($6,000/month) vs RabbitMQ total cost ($2,800/month + ops), then migrating for 50%+ savings

## Related Skills

- Configure and Implement Sqs Rabbitmq Migration
- Monitor and Maintain Sqs Rabbitmq Migration

## Success Criteria

- Sqs Rabbitmq Migration configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
