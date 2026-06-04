# Skill: Configure and Implement Hybrid Ranking Fusion

## Purpose

Set up and configure Hybrid Ranking Fusion for search functionality in a Laravel application using Scout integration. This skill covers installation, configuration, indexing, and basic search operations.

## When To Use

- When implementing Hybrid Ranking Fusion in a production Laravel application
- When optimizing or hardening Hybrid Ranking Fusion for operational use

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

1. Install the required package or extension for Hybrid Ranking Fusion via Composer or system package manager
2. Configure the search engine connection in `config/scout.php` with appropriate credentials and environment variables
3. Set the `SCOUT_DRIVER` environment variable to point to the configured engine
4. Define searchable attributes on your Eloquent model using `toSearchableArray()`
5. Configure index settings (filterable, sortable, ranking attributes) in scout config
6. Run `php artisan scout:import "App\\Models\\YourModel"` to index existing records
7. Test search with `Model::search('query')->get()` and verify results
8. Sync index settings with `php artisan scout:sync-index-settings`

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

- Name
- Name

## Related Skills

- Configure and Implement Hybrid Ranking Fusion
- Monitor and Maintain Hybrid Ranking Fusion

## Success Criteria

- Hybrid Ranking Fusion configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active

---

# Skill: Optimize and Monitor Hybrid Ranking Fusion Production Search

## Purpose

Tune Hybrid Ranking Fusion for production workloads including performance optimization, monitoring, and maintenance operations.

## When To Use

- When implementing Hybrid Ranking Fusion in a production Laravel application
- When optimizing or hardening Hybrid Ranking Fusion for operational use

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

1. Benchmark search query latency with representative production data volumes
2. Tune index parameters based on dataset size and query patterns
3. Configure monitoring for search latency, index size, and error rates
4. Implement search result caching for repeated queries if applicable
5. Set up index maintenance schedules for reindexing or optimization
6. Configure alerting for search degradation or indexing failures
7. Document the search architecture and operational procedures

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

- Name
- Name

## Related Skills

- Configure and Implement Hybrid Ranking Fusion
- Monitor and Maintain Hybrid Ranking Fusion

## Success Criteria

- Hybrid Ranking Fusion configured and functioning correctly
- Operational runbooks documented
- Monitoring dashboards and alerts active
