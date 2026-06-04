| Metadata | |
|---|---|
| KU ID | ku-06 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Sync Indexing in Laravel |
| Source | Laravel Scout |
| Maturity | Stable |

## Overview

Sync indexing (inline, non-queued) performs search index updates immediately during the HTTP request. This ensures index consistency but adds latency to write operations. Used in development, testing, and scenarios where immediate index consistency is required.

## Core Concepts

- **Inline Sync**: Index updated during model save, before HTTP response
- **Consistency Guarantee**: Index always reflects latest database state
- **Latency Cost**: Search engine round-trip adds to response time
- **Error Propagation**: Search engine failure causes HTTP 500
- **Dev Environment**: Default mode when queue is disabled

## When To Use

- Development environments
- Tests (with Scout::fake())
- Real-time applications where index consistency is critical
- Very low-traffic applications

## When NOT To Use

- Production applications (use queue)
- High-traffic applications (latency impact)
- Remote search engines (network latency)

## Best Practices

1. **Use sync in dev, queue in production**: Different config per environment.
2. **Test with sync**: Catch indexing errors early.
3. **Monitor sync latency**: High latency indicates queue should be enabled.
4. **Use withoutSyncingToSearch() for bulk**: Don't sync individual records in loops.

## Related Topics

- K004 (Queue indexing)
- K001 (Searchable trait)

## AI Agent Notes

- Sync mode is for development only in practice
- Always use queue for production
- For agents: env-specific config: sync for dev, queue for production

## Verification

- [ ] Dev environment uses sync
- [ ] Production uses queue
- [ ] Sync latency acceptable
- [ ] withoutSyncingToSearch used for bulk
