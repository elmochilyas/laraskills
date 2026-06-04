## Always Set TTL on Presence Channel Redis Keys
---
## Reliability
---
Always configure TTL on Redis presence state keys to automatically clean up ghost members.
---
Without TTL, presence member entries persist indefinitely in Redis when a client disconnects abruptly. Over time, ghost members accumulate, inflating online counts and wasting memory.
---
```env
# No TTL configured — keys persist forever
```
---
```env
REVERB_ACTIVITY_TIMEOUT=30  # Redis TTL set automatically by Reverb
```
---
Database scaling driver (uses its own prune mechanism). No common exceptions for Redis driver.
---
Unbounded Redis memory growth; inflated online user counts.

## Always Tune Pulse Interval to Connection Churn Rate
---
## Performance
---
Always configure the pulse ingest interval based on your application's connection churn rate.
---
Default pulse intervals may be too slow for high-churn applications (ghost members persist too long) or too fast for stable connections (unnecessary write overhead).
---
```env
# Default pulse interval — may not match churn
REVERB_PULSE_INGEST_INTERVAL=15
```
---
```env
# High-churn chat app: shorter interval
REVERB_PULSE_INGEST_INTERVAL=5
# Stable dashboard: longer interval
REVERB_PULSE_INGEST_INTERVAL=30
```
---
Applications with very stable, long-lived connections. No common exceptions.
---
Ghost members persisting too long; or excessive write load.

## Always Schedule the Prune Job for the Database Scaling Driver
---
## Framework Usage
---
Always schedule `reverb:prune` when using Reverb's database scaling driver.
---
The database driver has no automatic TTL-based cleanup. Without a scheduled prune job, ghost members accumulate in the `reverb_pings` table, causing unbounded table growth.
---
```php
// No prune scheduled — table grows unbounded
```
---
```php
// App\Console\Kernel
$schedule->command('reverb:prune')->everyMinute();
```
---
Redis-based Reverb deployments (Redis TTL handles cleanup automatically). No common exceptions for database driver.
---
Unbounded table growth; database performance degradation.

## Always Monitor Ghost Member Ratio
---
## Maintainability
---
Always track ghost member ratio (ghost members / total members) as a dashboard metric.
---
Ghost members grow silently over time. Without monitoring, the problem is only discovered when online counts are obviously wrong or Redis memory is exhausted.
---
```bash
# No ghost monitoring metrics
```
---
```bash
# Alert when ghost ratio exceeds threshold
ghost_ratio=$(curl -s /apps/123/connections | jq '.ghosts / .total')
[ "$ghost_ratio" > "0.05" ] && alert "Ghost ratio ${ghost_ratio}%"
```
---
Ephemeral channels with very short lifetimes. No common exceptions for production.
---
Silent ghost accumulation; inaccurate presence data; Redis OOM.

## Never Set Activity Timeout Too Aggressively
---
## Reliability
---
Always set activity timeout to at least 2x the expected reconnection time to prevent premature ghost pruning.
---
Overly aggressive timeouts prune legitimate connections during transient network blips, causing unnecessary reconnections and user-facing disconnection indicators.
---
```env
REVERB_ACTIVITY_TIMEOUT=5  # Too short — disconnects during brief network issues
```
---
```env
REVERB_ACTIVITY_TIMEOUT=30  # 2x typical reconnect time
```
---
Mobile applications where network disconnections are frequent and expected. No common exceptions.
---
Premature disconnections; ghost and legitimate connections confused.

## Always Use Both TTL and Application-Level Prune for Defense in Depth
---
## Reliability
---
Always implement both Redis TTL-based cleanup and application-level pulse/prune mechanisms.
---
Relying solely on Redis TTL leaves ghost members until TTL expiry (which could be minutes). Relying solely on pulse/prune leaves ghosts if the pulse system crashes.
---
```env
# Only TTL — no pulse cleanup
```
---
```env
REVERB_ACTIVITY_TIMEOUT=30       # TTL safety net
REVERB_PULSE_INGEST_INTERVAL=15  # Proactive cleanup
```
---
No common exceptions; defense in depth is always preferred for production presence channels.
---
Ghost member persistence during individual mechanism failures.
