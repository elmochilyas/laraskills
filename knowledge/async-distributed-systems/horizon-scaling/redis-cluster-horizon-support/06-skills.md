# Skill: Configure Redis Cluster Support in Horizon

## Purpose
Enable Redis Cluster support for Horizon (v5.46+) when single-Redis throughput is insufficient, configuring hash tags, queue key routing, and failover handling.

## When To Use
Single Redis throughput insufficient (>10K jobs/sec, >100K connections); HA with automatic Redis failover; horizontal write scaling needed.

## When NOT To Use
95% of deployments (single Redis with replica is simpler and fully compatible); when `BRPOP` reliability is critical (cluster mode has edge cases); without Redis Cluster operational expertise.

## Prerequisites
- Horizon v5.46+
- Redis Cluster deployed with hash slot consistency
- Predis or phpredis with cluster support

## Inputs
- Redis Cluster node addresses
- `queue_key_hash_tag` setting

## Workflow
1. Prefer single Redis with replica for most deployments
2. Enable `queue_key_hash_tag: true` in `config/horizon.php`
3. Configure Redis cluster in `config/database.php` under `clusters`
4. Ensure `{horizon}` hash tag covers all related keys
5. Test `BRPOP` behavior — most common source of issues in cluster mode
6. Test failover behavior — simulate node failure, verify Horizon reconnects
7. Avoid cross-slot multi-key operations

## Validation Checklist
- [ ] Single Redis with replica preferred unless throughput exceeds 10K jobs/sec
- [ ] `queue_key_hash_tag: true` set in Horizon config
- [ ] Redis cluster nodes configured in database config
- [ ] `BRPOP` tested — workers can pop jobs in cluster mode
- [ ] Failover tested — Horizon reconnects after node failure
- [ ] No cross-slot operations in custom code
- [ ] `{horizon}` hash tag on all related keys

## Common Failures
- Cluster without hash tags on queue keys — `BRPOP` connects to wrong node
- Assuming transparent cluster mode — client compatibility not tested
- Not testing failover — workers hang during node failure
- Cross-slot multi-key operations — `CROSSSLOT` errors
- Using Cluster unnecessarily when single Redis would suffice

## Decision Points
- <10K jobs/sec: single Redis with replica
- >10K jobs/sec: Redis Cluster with hash tags
- HA only: Redis Sentinel or replica (not Cluster)

## Related Rules
- Rule 1: prefer-single-redis-over-cluster
- Rule 2: enable-queue-key-hash-tag
- Rule 3: test-failover-behavior
- Rule 4: avoid-cross-slot-multi-key-ops

## Related Skills
- Deploy Multi-Server Horizon
- Configure Horizon Supervisors for Queue Workers
- Monitor Horizon Metrics — Throughput, Runtime, Wait Time

## Success Criteria
Redis Cluster only used when necessary, `queue_key_hash_tag` is enabled, `BRPOP` and failover are tested, and cross-slot operations are avoided.
