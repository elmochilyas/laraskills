# Anti-Patterns: Idempotency Key TTL Expiration

## AP-1: Fixed TTL Without Sliding Extension
**Category**: Reliability

**Description**: Setting a fixed TTL on idempotency keys without extending it on retries. A consumer with a long retry chain (spanning multiple hours) may have their key expire mid-retry, causing the final retry to be processed as a new request instead of replaying the original response.

**Warning Signs**:
- Idempotency key TTL is set once at creation and never refreshed
- Retries received near the end of the TTL window are processed as new requests
- Duplicate processing incidents involve retries that spanned multiple hours
- Consumer complaints about idempotency failing after repeated retries

**Harms**:
- Idempotency guarantee broken for long retry chains
- Duplicate processing after key expiration
- Financial reconciliation issues (double charges)
- Consumer trust lost in retry safety

**Real-World Consequence**: A consumer's order creation request experiences network issues and retries every 30 minutes for 23 hours. On the 24th hour, the key expires. The consumer's final retry (which would have succeeded) is processed as a new request — creating a second order. The consumer is charged twice.

**Preferred Alternative**: Implement sliding TTL extension: on each successful replay, extend the key's TTL by 24 hours from that replay time.

**Refactoring Strategy**: Add `Cache::expire($key, 86400)` call on replay hit path, verify extension in tests, monitor TTL distribution to confirm extension is working.

**Detection Checklist**:
- `[ ]` Is TTL extended on each replay?
- `[ ]` Are there incidents where retries near TTL expiration caused duplicates?
- `[ ]` Do retry chains spanning >12 hours work correctly?
- `[ ]` Is sliding extension tested in integration tests?

**Related**: 05-rules.md (Rule 1: Set 24-Hour Base TTL with Sliding Extension), 04-standardized-knowledge.md, 07-decision-trees.md

---

## AP-2: No TTL on Keys (Indefinite Storage)
**Category**: Scalability

**Description**: Storing idempotency keys without a TTL or with an indefinite TTL. Keys persist forever, consuming unbounded storage and eventually causing memory exhaustion with no automatic cleanup mechanism.

**Warning Signs**:
- Idempotency keys stored without `EXPIRE` or TTL parameter
- Redis memory usage grows monotonically
- No automatic key cleanup mechanism
- Key count increases without bound
- Manual cleanup scripts needed periodically

**Harms**:
- Unbounded storage growth (86 GB per 1000 ops/s without expiration)
- Redis memory exhaustion crashes
- Eviction storm when Redis runs out of memory
- No guarantee that keys will eventually be removed

**Real-World Consequence**: A team uses Redis for idempotency with `SET NX` but forgets the `EX` parameter (no TTL). After 3 months at 500 ops/s, the Redis instance holds 400M keys consuming 380 GB. Redis runs out of memory, begins evicting active keys, and idempotency fails unpredictably for all consumers.

**Preferred Alternative**: Always set a finite TTL on every stored idempotency key. Use `SET key value NX EX 86400` to atomically create with 24-hour expiration.

**Refactoring Strategy**: Update all idempotency key storage calls to include TTL, add CI check enforcing EX parameter in Redis SET calls, monitor key count trend, add scheduled job to clean up any keys without TTL.

**Detection Checklist**:
- `[ ]` Do all idempotency keys have finite TTL?
- `[ ]` Is Redis memory usage stable or growing?
- `[ ]` Are there keys older than 48 hours in the store?
- `[ ]` Is there an alert for key count growth rate?

**Related**: 05-rules.md (Rule 6: Never Use Indefinite TTL), 04-standardized-knowledge.md, 06-skills.md

---

## AP-3: Immediate Hard Deletion at TTL Expiry (No Audit Trail)
**Category**: Maintainability

**Description**: Hard-deleting idempotency keys and cached responses immediately when the TTL expires. No soft-delete or audit trail is preserved, making it impossible to investigate expired-key issues from consumer reports.

**Warning Signs**:
- Keys are completely removed from Redis as soon as TTL expires
- No soft-delete or audit store for expired keys
- Support cannot investigate "my retry failed" complaints
- Expired-key debugging requires reproducing the original request
- No log of which keys existed and when they expired

**Harms**:
- Inability to debug consumer complaints about expired keys
- Lost audit trail for compliance investigations
- Support cannot determine whether a retry was genuinely new or a late replay
- Regulatory compliance gaps if retention is required

**Real-World Consequence**: A consumer reports that a payment retry resulted in a double charge. The idempotency key expired 2 hours before the final retry. The team cannot determine whether the key existed and expired naturally, or whether there was a bug. No soft-delete store exists. The investigation dead-ends and the consumer is refunded as a precaution.

**Preferred Alternative**: Implement two-tier expiration: soft-expire after 24 hours (move key and response to audit store for 7 days), then hard-delete.

**Refactoring Strategy**: Add an audit store (separate Redis namespace or database) for soft-deleted keys, create a scheduled job to move expired keys, set 7-day TTL on audit store, add support tooling to query the audit store.

**Detection Checklist**:
- `[ ]` Is there a soft-delete/audit store for expired keys?
- `[ ]` Can support investigate expired-key complaints?
- `[ ]` Is there a retention period before hard deletion?
- `[ ]` Are expired keys queryable for 7+ days?

**Related**: 05-rules.md (Rule 2: Implement Two-Tier Expiration), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-4: Wrong Redis Eviction Policy
**Category**: Performance

**Description**: Using `noeviction`, `allkeys-lru`, or `allkeys-random` as the Redis eviction policy for the idempotency store. These policies either reject writes under memory pressure or evict active keys alongside expired ones.

**Warning Signs**:
- Redis returns OOM errors on idempotency writes (`noeviction` policy)
- Active idempotency keys fail to store (consumer requests processed as new instead of replay)
- Key evictions include recently created keys
- Redis `evicted_keys` metric shows many evictions
- Idempotency failures correlate with Redis memory pressure

**Harms**:
- Active idempotency keys evicted under memory pressure
- Cache misses cause duplicate processing
- Idempotency guarantee broken without warning
- Write failures from `noeviction` policy
- Idempotency failures correlate with Redis memory usage spikes

**Real-World Consequence**: A Redis instance with `allkeys-lru` policy is used for idempotency. Under memory pressure, Redis evicts the least-recently-used keys — which are old idempotency keys that haven't been replayed. However, a consumer retries one of those evicted keys expecting a replay — instead the request is processed as new, creating a duplicate order.

**Preferred Alternative**: Configure `maxmemory-policy volatile-ttl` to evict keys closest to expiration first. This aligns with idempotency key lifecycle.

**Refactoring Strategy**: Update Redis config `maxmemory-policy volatile-ttl`, verify no active keys are evicted under memory pressure, monitor `evicted_keys` metric, add alert for eviction rate spikes.

**Detection Checklist**:
- `[ ]` Is Redis eviction policy set to `volatile-ttl`?
- `[ ]` Are active idempotency keys being evicted?
- `[ ]` Is `evicted_keys` metric monitored and alerted?
- `[ ]` Do idempotency failures correlate with Redis memory usage?

**Related**: 05-rules.md (Rule 3: Configure Redis volatile-ttl Eviction Policy), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-5: Uniform TTL for All Consumer Types
**Category**: Reliability

**Description**: Applying the same 24-hour TTL to all consumers regardless of their latency profile. Mobile apps, batch processors, and IoT devices with long offline periods or retry chains lose idempotency guarantees because their retry window exceeds the standard TTL.

**Warning Signs**:
- All consumers get the same 24-hour TTL
- Mobile consumers report idempotency failures after weekend breaks
- Batch processing consumers see duplicate operations on Monday morning
- IoT devices with intermittent connectivity lose idempotency
- Consumer complaints follow predictable patterns (after weekends, holidays)

**Harms**:
- High-latency consumers lose idempotency guarantee
- Duplicate operations on mobile/batch/IoT retries
- Consumer-specific retry patterns not accommodated
- Support escalations for mass retry failures

**Real-World Consequence**: A mobile payment app's users often experience network issues in subway tunnels. The standard 24-hour idempotency TTL works for most users, but a user going on a weekend trip (48 hours offline) has their payment retry processed as new on Monday morning — duplicate charge for the same purchase.

**Preferred Alternative**: Extend TTL for high-latency consumer tiers: 48 hours for mobile, 72 hours for batch processors and IoT devices.

**Refactoring Strategy**: Add consumer tier identification to request pipeline, implement tier-based TTL configuration (mobile=48h, batch=72h, default=24h), document TTL per consumer type in developer portal, add monitoring for TTL expiration by consumer type.

**Detection Checklist**:
- `[ ]` Are there different TTLs for different consumer types?
- `[ ]` Do mobile consumers have adequate TTL?
- `[ ]` Do batch/IoT consumers have adequate TTL?
- `[ ]` Are there consumer complaints about idempotency failures after long gaps?

**Related**: 05-rules.md (Rule 5: Extend TTL for High-Latency Consumers), 04-standardized-knowledge.md, 06-skills.md

---

## AP-6: No Store Size Monitoring
**Category**: Scalability

**Description**: Running the idempotency store without monitoring key count or memory usage. Redis runs out of memory silently, evictions begin, and idempotency failures cascade without warning.

**Warning Signs**:
- No monitoring dashboard for idempotency store
- Redis memory usage is unknown
- No alert for capacity thresholds
- Eviction-related idempotency failures are investigated post-mortem
- Team is surprised by Redis memory exhaustion incidents

**Harms**:
- Redis memory exhaustion without warning
- Eviction storm affects all consumers simultaneously
- Idempotency fails for all requests during eviction period
- Investigation and recovery time adds to incident duration
- 86 GB per 1000 ops/s can exhaust memory in days without monitoring

**Real-World Consequence**: A team provisions 50 GB Redis for idempotency with no monitoring. At 600 ops/s, the store grows at ~52 GB/day. After 23 hours, Redis reaches 50 GB and begins evicting keys. All idempotency replays for the next 4 hours are processed as new requests. The team discovers the incident when consumers report duplicate charges.

**Preferred Alternative**: Monitor idempotency store size (key count, memory usage) and alert when utilization exceeds 70% of provisioned capacity.

**Refactoring Strategy**: Add Redis INFO memory monitoring, create dashboard showing used_memory vs maxmemory, set alert at 70% threshold, plan capacity based on 86 GB per 1000 ops/s (at 24h TTL), add growth trend forecasting.

**Detection Checklist**:
- `[ ]` Is idempotency store memory usage monitored?
- `[ ]` Are there alerts for capacity thresholds?
- `[ ]` Is there a capacity plan based on request volume?
- `[ ]` Has Redis ever reached memory capacity unexpectedly?

**Related**: 05-rules.md (Rule 4: Monitor Idempotency Store Size and Growth), 04-standardized-knowledge.md, 06-skills.md
