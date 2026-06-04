# Idempotency Key TTL Expiration

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Lifecycle & Governance
- **Last Updated:** 2026-06-02

## Executive Summary
Idempotency key TTL (time-to-live) and expiration management governs how long idempotency keys are retained, how they are cleaned up, and how expired keys are handled. Proper TTL management balances storage efficiency with the need to support retry windows for consumers with varying latency requirements.

## Core Concepts
- **TTL (Time-to-Live):** The duration for which an idempotency key and its cached response remain valid.
- **Key Expiration:** The point at which a key is removed from the store; subsequent requests with that key are treated as new.
- **Passive Expiration:** Keys are automatically removed by the data store (Redis `EXPIRE`) when TTL elapses.
- **Active Cleanup:** A scheduled job that removes expired keys and associated data.
- **Soft Expiration:** Key is expired but the response is retained for a grace period for debugging/audit.
- **Hard Expiration:** Key and response are permanently deleted.

## Mental Models
- **Library Book Due Date:** Like a library book that must be returned by a due date (TTL). After the due date, the book is considered returned (key expired) and can be checked out again (new request).
- **Parking Meter:** You pay for a set amount of time (TTL). When time runs out (expiration), you risk a ticket (duplicate processing) if you haven't moved your car (completed the operation).

## Internal Mechanics
1. **TTL Assignment:** On first request (`Idempotency-Key` cache miss), the key is stored with a TTL of 24 hours.
2. **Passive Expiration:** Redis automatically evicts the key after 24 hours using `EXPIRE`.
3. **TTL Extension:** If a consumer retries within the window, the TTL may be extended by an additional 24 hours from the last request.
4. **Soft Expiration Check:** Before eviction, a background job copies the key to a "soft delete" store for 7 days (audit trail).
5. **Hard Deletion:** After 7 days in soft-delete, the key is permanently removed.
6. **Expired Key Handling:** If a request arrives with an expired key, the API treats it as a new request (cache miss).

## Patterns
- **Sliding TTL Extension:** Extend the key's TTL on each successful replay within the window — prevents mid-retry expiration.
- **Two-Tier Expiration:** Soft expiration (response retained but key invalidated) followed by hard deletion.
- **TTL Monitoring:** Track the distribution of "time since first request" for replays to inform optimal TTL.
- **Consumer-Specific TTLs:** High-latency consumers (batch processors) may get extended TTLs.

## Architectural Decisions
| Decision | Option | Chosen | Rationale |
|---|---|---|---|
| Base TTL | 1h / 24h / 7d | 24 hours | Balances retry window with storage cost |
| TTL extension | None / Sliding / Fixed | Sliding (24h from last request) | Prevents expiration during long retry chains |
| Soft delete window | 0 / 7d / 30d | 7 days | Enables audit and debugging without indefinite storage |
| Cleanup mechanism | Redis only / Redis + Scheduler | Redis passive + scheduled purge | Passive for normal operation; scheduled for compliance |

## Tradeoffs
| Tradeoff | Consideration |
|---|---|
| Long TTL vs storage cost | Long TTL supports slow consumers but grows the idempotency store |
| Sliding vs fixed TTL | Sliding TTL prevents mid-retry expiration; fixed TTL is simpler and predictable |
| Soft vs hard deletion | Soft deletion enables audit but requires additional storage |

## Performance Considerations
- Redis `EXPIRE` is O(1) — no performance concern for passive expiration.
- Soft-delete copy job runs once per hour and should batch-process to minimize load.
- Idempotency store size: approximately 1 KB per key (key + response body). 24-hour window with 1000 ops/s ≈ 86M keys ≈ 86 GB. Plan Redis memory accordingly.

## Production Considerations
- **Monitoring:** Track idempotency store size, eviction rate, and expiration distribution.
- **Logging:** Log when a key expires with outstanding retries (consumer retried after expiration).
- **Backup:** Redis persistence (RDB) enables recovery of idempotency state after restart.
- **Rollback:** Clearing the idempotency store should be a manual, documented operation.
- **Testing:** Verify that keys expire at the correct time; test retry-after-expiration behavior.

## Common Mistakes
- Setting TTL too short for real-world retry patterns (network issues can cause delays > 1 hour).
- Not extending TTL on retries — a consumer retrying at hour 23 gets expired at hour 24 before retry completes.
- Using passive expiration only (no cleanup monitoring) — may hit Redis memory limits.
- Forgetting that idempotency keys are PII-adjacent (can be used to correlate consumer activity).
- Not having a strategy for key store overflow (what happens when Redis runs out of memory?).

## Failure Modes
- **Store Exhaustion:** More keys than available memory → Redis evicts keys early (LRU). Mitigation: monitor memory; set `maxmemory-policy volatile-ttl` to evict expiring keys first.
- **TTL Drift:** Clock skew between services causes premature expiration. Mitigation: use a single time source (NTP-synchronized Redis).
- **Orphaned Keys:** Keys that never expire due to missing TTL. Mitigation: periodic audit of key store for keys without TTL.
- **Retry Storm After Expiration:** Many consumers retry simultaneously after keys expire → load spike. Mitigation: jittered retry backoff guidelines.

## Ecosystem Usage
- **Stripe:** 24-hour idempotency key TTL; no extension on retry.
- **Twilio:** Keys expire after 24 hours with sliding window extension.
- **AWS:** Idempotency tokens in various services (e.g., `ClientToken` in EC2) have TTLs ranging from 1 hour to 7 days.

## Related Knowledge Units

### Prerequisites
- [Idempotency Key Design](ku-10-idempotency-key-design)
- [Idempotency Key Error Handling](ku-12-idempotency-key-error-handling)

### Related Topics
- [Rate Limit Tier Design](ku-15-rate-limit-tier-design)
- [API Usage Tracking](ku-16-api-usage-tracking)

### Advanced Follow-up Topics
- Storage-efficient idempotency key encoding (Bloom filters)
- Idempotency key analytics for consumer behavior insights
- Cross-region idempotency store replication

## Research Notes

### Source Analysis
Redis `EXPIRE` with `volatile-ttl` eviction policy is the standard approach used by Stripe and others. The key insight is that passive expiration alone is not enough — monitoring and active cleanup are needed for production reliability.

### Key Insight
The optimal TTL is not purely a technical decision — it depends on consumer latency profiles. If your consumers are mobile apps with unreliable networks, 24 hours may be too short. If they are server-side batch processors, 7 days may be appropriate. **Consumer-aware TTL scaling** is an advanced pattern worth implementing.

### Version-Specific Notes
- Laravel 11.x: Redis TTL via `Cache::put($key, $value, $seconds)` — use 86400 for 24-hour TTL.
- PHP 8.4: `Redis::expire()` and `Redis::ttl()` provide direct TTL management.
