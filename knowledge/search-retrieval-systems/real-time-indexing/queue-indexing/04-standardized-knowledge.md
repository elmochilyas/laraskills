| Metadata | |
|---|---|
| KU ID | ku-04 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Queue Indexing |
| Source | Laravel Scout |
| Maturity | Stable |

## Overview

Queue indexing moves search index synchronization off the HTTP request cycle into Laravel's queue system. Set 'queue' => true in config/scout.php to make all model syncs async. This prevents search engine latency from affecting user-facing response times and provides retry logic for failed indexing operations.

## Core Concepts

- **Async Sync**: Model saves dispatch a queue job instead of syncing inline
- **Queue Configuration**: 'queue' => true in config/scout.php
- **Job Retry**: Failed sync jobs are retried per queue configuration
- **Chunked Import**: scout:import dispatches chunked jobs for large imports
- **Scout Queue Jobs**: MakeSearchable, RemoveFromSearch, UpdateSearchable

## When To Use

- Production applications (always)
- High-traffic applications where sync latency matters
- Applications using remote search engines (network latency)
- Any indexing operation that could fail transiently

## When NOT To Use

- Development/CI environments (simplicity)
- Testing (use Scout::fake())
- Real-time search where immediate index consistency is critical

## Best Practices

1. **Enable queue for production**: Always set 'queue' => true.
2. **Use default queue connection**: Redis, database, or SQS.
3. **Configure retry count**: Default 3 retries, adjust based on transient failure rate.
4. **Monitor failed jobs**: queue:failed table for troubleshooting.
5. **Set appropriate timeout**: Indexing jobs may need longer timeouts for complex models.

## Related Topics

- K001 (Searchable trait)
- K009 (scout:import / scout:flush)
- K002 (Indexing strategies)

## AI Agent Notes

- Queue indexing is the standard for production Laravel search
- Prevents search latency from affecting HTTP response times
- For agents: always enable queue for production, disable for dev/testing

## Verification

- [ ] queue = true in config/scout.php
- [ ] Queue connection configured (Redis/database/SQS)
- [ ] Failed job monitoring in place
- [ ] Timeout configured for index jobs
- [ ] Dev environment has queue disabled
