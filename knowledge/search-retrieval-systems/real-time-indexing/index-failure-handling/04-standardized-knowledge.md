| Metadata | |
|---|---|
| KU ID | ku-14 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Index Failure Handling |
| Source | Laravel Scout / Industry |
| Maturity | Stable |

## Overview

Index failure handling manages scenarios where search index synchronization fails — network errors, search engine downtime, schema mismatches, or data validation errors. Strategies include retry logic, dead letter queues, health checks, and graceful degradation.

## Core Concepts

- **Queue Retries**: Scout queue jobs retry on failure (configurable attempts)
- **Failed Jobs**: Queue workers log failures to ailed_jobs table
- **Health Checks**: Monitor search engine availability
- **Graceful Degradation**: Fall back to database search when engine is down
- **Data Consistency Checks**: Periodic verification of DB ↔ index parity

## When To Use

- Any production search implementation
- Applications using remote search engines
- High-availability search systems

## When NOT To Use

- Development environments
- Search with 100% uptime SLA from provider (still handle failures)

## Best Practices

1. **Monitor failed jobs**: Check queue:failed regularly.
2. **Implement health checks**: Monitor search engine endpoint.
3. **Set up alerting**: Notify on indexing failure thresholds.
4. **Use dead letter queue**: Store permanently failed indexing operations.
5. **Implement fallback**: Database query when search engine is unavailable.
6. **Run consistency checks**: Compare DB record count vs index document count.

## Related Topics

- K004 (Queue indexing)
- K009 (scout:import)
- K017 (Soft delete handling)

## AI Agent Notes

- Queue retries handle transient failures automatically
- Graceful degradation is often overlooked but critical for production
- For agents: implement health checks + fallback + failed job monitoring

## Verification

- [ ] Queue retry configured
- [ ] Failed job monitoring in place
- [ ] Health checks for search engine
- [ ] Fallback to database on engine failure
- [ ] Alerting on indexing failure thresholds
- [ ] Periodic consistency checks scheduled
- [ ] Dead letter queue for persistent failures
