# Skill: Implement Temporal Queries

## Purpose

Set up Temporal Queries for data engineering and analytics workflows in a Laravel application, covering ingestion, processing, and storage.

## When To Use

- When implementing Temporal Queries in a production Laravel application
- When optimizing or hardening Temporal Queries for operational use

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

1. Define the data schema and structure for Temporal Queries
2. Configure the connection or driver for the analytics data store
3. Implement data ingestion: event tracking, ETL pipeline, or direct writes
4. Set up queue dispatching for asynchronous processing if applicable
5. Implement data transformation logic as required
6. Query and verify data correctness with test events
7. Document the data flow architecture

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

- 1: Periodic Snapshots to Bound Replay
->where('created_at', '<=', $timestamp)
->orderBy('version')
->get(); // Replays from beginning — gets slower over time
->where('created_at', '<=', $timestamp)
->latest('version')

## Related Skills

- Configure and Implement Temporal Queries
- Monitor and Maintain Temporal Queries

## Success Criteria

- Temporal Queries configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Optimize Temporal Queries for Scale

## Purpose

Scale and optimize Temporal Queries for production analytics workloads including performance tuning, cost management, and reliability.

## When To Use

- When implementing Temporal Queries in a production Laravel application
- When optimizing or hardening Temporal Queries for operational use

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

1. Profile data ingestion throughput and identify bottlenecks
2. Optimize batch sizes and queue configurations for higher throughput
3. Implement data retention policies and archival strategies
4. Set up monitoring dashboards for data pipeline health
5. Configure alerting for pipeline failures or latency spikes
6. Plan capacity based on data growth projections
7. Document operational runbooks for the pipeline

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

- 1: Periodic Snapshots to Bound Replay
->where('created_at', '<=', $timestamp)
->orderBy('version')
->get(); // Replays from beginning — gets slower over time
->where('created_at', '<=', $timestamp)
->latest('version')

## Related Skills

- Configure and Implement Temporal Queries
- Monitor and Maintain Temporal Queries

## Success Criteria

- Temporal Queries configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
