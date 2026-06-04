# Phase 5: Rules — Idempotency Key TTL Expiration

## Rule 1: Set 24-Hour Base TTL with Sliding Extension
---
## Category
Reliability
---
## Rule
Always set a 24-hour base TTL on idempotency keys and extend the TTL by 24 hours from the last request on each successful replay. Never use a fixed TTL that does not extend on retries.
---
## Reason
Retry chains can span hours. A fixed TTL may expire mid-retry chain, causing the final retry to be processed as a new request instead of replaying the original response.
---
## Bad Example
```php
// Fixed TTL — no extension on retry
Cache::put($key, $response, 86400); // never extended
```
---
## Good Example
```php
public function handle(Request $request, Closure $next) {
    // On replay hit, extend TTL
    if (Cache::has($key)) {
        Cache::expire($key, 86400); // sliding extension
        return $this->storedResponse($key);
    }
    return $next($request);
}
```
---
## Exceptions
Compliance requirements may mandate shorter or fixed TTL without extension.
---
## Consequences Of Violation
Retries at hour 23 cause key expiration; duplicate processing occurs; idempotency guarantee broken.
---

## Rule 2: Implement Two-Tier Expiration (Soft + Hard Delete)
---
## Category
Maintainability
---
## Rule
Always implement two-tier expiration: soft-expire keys after 24 hours (retain response for audit for 7 days), then hard-delete after 7 more days. Never hard-delete immediately after TTL expires.
---
## Reason
Soft deletion preserves debugging and audit capability for expired-key issues. Immediate hard deletion makes it impossible to investigate consumer complaints about expired keys.
---
## Bad Example
```php
// Hard delete at TTL — no audit trail
Cache::put($key, $response, 86400); // completely gone after 24h
```
---
## Good Example
```php
// Soft delete: move to audit store
if (Cache::ttl($key) <= 0) {
    // Move to audit store with 7-day retention
    AuditStore::put("idempotency_audit:{$key}", $response, 604800);
    Cache::forget($key);
}
```
---
## Exceptions
Compliance requirements (GDPR right to deletion, PCI) may mandate immediate hard deletion.
---
## Consequences Of Violation
Debugging expired-key issues impossible; compliance gaps for sensitive data retention; support tickets unresolvable.
---

## Rule 3: Configure Redis `volatile-ttl` Eviction Policy
---
## Category
Performance
---
## Rule
Always set Redis `maxmemory-policy volatile-ttl` when using Redis as an idempotency store. Never use `noeviction` or `allkeys-lru`.
---
## Reason
`volatile-ttl` evicts keys closest to expiration first when memory is full, which aligns with idempotency key lifecycle (older keys are more likely to be expired anyway). `noeviction` causes write failures; `allkeys-lru` may evict active keys.
---
## Bad Example
```bash
# allkeys-lru may evict active idempotency keys
maxmemory-policy allkeys-lru
```
---
## Good Example
```bash
# volatile-ttl evicts keys closest to expiration first
maxmemory-policy volatile-ttl
maxmemory 100gb
```
---
## Exceptions
Dedicated Redis instances for idempotency (no other data) may use `allkeys-lru`.
---
## Consequences Of Violation
Active idempotency keys evicted under memory pressure; cache misses cause duplicate processing; idempotency broken.
---

## Rule 4: Monitor Idempotency Store Size and Growth
---
## Category
Scalability
---
## Rule
Always monitor idempotency store size (key count, memory usage) and alert when utilization exceeds 70% of provisioned capacity. Never let the store grow without monitoring.
---
## Reason
Unmonitored growth leads to memory exhaustion, eviction storms, and idempotency failures. At ~1 KB per key, 1000 ops/s generates ~86 GB/day.
---
## Bad Example
```php
// No monitoring of idempotency store
// Redis runs out of memory silently; evictions begin
```
---
## Good Example
```php
// Monitor key count and memory
public function monitor(): void {
    $info = Redis::info('memory');
    $usedPercent = ($info['used_memory'] / $info['maxmemory']) * 100;
    if ($usedPercent > 70) {
        Alert::warning("Idempotency store at {$usedPercent}% capacity");
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Redis memory exhaustion; eviction storm; idempotency keys silently dropped; duplicate processing.
---

## Rule 5: Extend TTL for High-Latency Consumers
---
## Category
Reliability
---
## Rule
Always consider longer TTLs (48-72 hours) for consumer tiers known to have high latency or long retry chains (mobile apps, batch processors, IoT devices). Never apply the same TTL to all consumer types.
---
## Reason
Mobile devices and batch processors may have retry windows exceeding 24 hours due to offline periods, long queues, or manual retry workflows.
---
## Bad Example
```php
// Same 24-hour TTL for all consumers
$ttl = 86400; // mobile app offline for 48 hours loses idempotency
```
---
## Good Example
```php
$ttl = match ($consumer->tier) {
    'mobile' => 172800,    // 48 hours
    'batch'  => 259200,    // 72 hours
    default  => 86400,     // 24 hours
};
```
---
## Exceptions
Compliance requirements may limit maximum retention regardless of consumer type.
---
## Consequences Of Violation
High-latency consumers lose idempotency guarantee; duplicate operations on mobile/batch retries.
---

## Rule 6: Never Use Indefinite TTL
---
## Category
Scalability
---
## Rule
Never store idempotency keys without a TTL or with an indefinite TTL. Always set a finite expiration on every stored key.
---
## Reason
No-TTL keys grow unbounded, consuming storage indefinitely and causing eventual memory exhaustion with no mechanism for cleanup.
---
## Bad Example
```php
// No TTL — key stored forever
$redis->set($key, $response, 'NX'); // no EX — unbounded growth
```
---
## Good Example
```php
// Finite TTL required
$redis->set($key, $response, 'NX', 'EX', 86400);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unbounded storage growth; Redis memory exhaustion; eventual evictions impact all consumers.
---

## Rule 7: Schedule Active Cleanup for Compliance-Driven Deletion
---
## Category
Security
---
## Rule
Always implement a scheduled job to actively purge idempotency keys that must be removed for compliance (GDPR, PCI) before their natural TTL expiration. Never rely solely on passive TTL expiration for compliance-sensitive keys.
---
## Reason
Passive expiration via TTL may retain data longer than compliance mandates if TTLs extend on retries or if soft-delete retention exceeds compliance limits.
---
## Bad Example
```php
// No active cleanup — only passive TTL depends on last-request time
// GDPR deletion request: key may still exist if recently replayed
```
---
## Good Example
```php
$schedule->call(function () {
    PurgeIds::where('consumer_id', $consumerId)
        ->orWhere('created_at', '<', now()->subDays(90))
        ->chunk(100, fn($keys) => Redis::del(...$keys));
})->dailyAt('02:00');
```
---
## Exceptions
APIs in regions without data retention compliance requirements may skip active cleanup.
---
## Consequences Of Violation
Compliance violations; data retained beyond regulatory limits; fines or legal liability.
