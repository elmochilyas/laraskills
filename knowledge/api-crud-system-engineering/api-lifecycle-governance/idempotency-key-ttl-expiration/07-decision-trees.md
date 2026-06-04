# Decision Trees — Idempotency Key TTL Expiration

## Tree 1: Base TTL Duration Selection

**Decision Context**: Choosing the base TTL for idempotency keys — how long to retain keys and their associated responses before expiration.

**Decision Criteria**:
- Consumer retry patterns and maximum expected retry window
- Storage cost per key (~1 KB)
- Total request volume
- Compliance retention requirements
- Consumer latency profile (mobile, batch, real-time)

**Decision Tree**:
```
Does your API handle financial operations (payments, transfers)?
├── YES → 48-hour TTL with sliding extension; financial retries may span business days
└── NO → Are your consumers primarily mobile apps with intermittent connectivity?
    ├── YES → 48-hour TTL; mobile retries can span days due to offline periods
    └── NO → Do you have batch-processing consumers with long-running jobs?
        ├── YES → 72-hour TTL with sliding extension; batch jobs retry over multi-day windows
        └── NO → Are you subject to GDPR/CCPA right-to-deletion requirements?
            ├── YES → 24-hour TTL, no sliding extension, immediate hard-delete on expiry
            └── NO → Standard 24-hour TTL with sliding extension (default)
```

**Rationale**: TTL balances retry window against storage cost. 24 hours covers the vast majority of retry scenarios. Longer TTLs for mobile/financial/batch use cases where retry chains are longer.

**Recommended Default**: 24-hour base TTL with sliding extension (reset to 24h from last replay).

**Risks**:
- Too short TTL breaks retries for slow consumers
- Too long TTL increases storage cost (86 GB per 1000 ops/s at 24h)
- No sliding extension causes mid-retry-chain expiration

**Related Rules/Skills**: Rules: Set 24-Hour Base TTL with Sliding Extension, Implement Two-Tier Expiration. Skills: Manage Idempotency Key TTL and Expiration.

---

## Tree 2: Expiration and Cleanup Strategy

**Decision Context**: Choosing the expiration and cleanup model — passive-only (Redis EXPIRE), soft-delete with audit trail, or hard-delete with compliance purging.

**Decision Criteria**:
- Audit/debugging requirements for expired keys
- Compliance data retention requirements
- Storage constraints
- Consumer complaint investigation needs

**Decision Tree**:
```
Do you need to investigate expired-key issues from consumer reports?
├── YES → Implement two-tier: soft-delete (7-day retention) + hard-delete after grace period
└── NO → Are you subject to regulations requiring immediate deletion (GDPR, PCI)?
    ├── YES → Hard-delete at TTL expiry; no soft-delete; log deletion events for audit
    └── NO → Is storage cost a primary concern (>100 TB of idempotency data)?
        ├── YES → Passive expiration only (Redis EXPIRE); no soft-delete store
        └── NO → Passive expiration (Redis EXPIRE) + active purge job for stale keys
```

**Rationale**: Two-tier expiration provides audit capability without indefinite storage. Passive-only is simpler but loses debugging ability. Hard-delete is required for compliance but rare for general use.

**Recommended Default**: Two-tier expiration — soft-delete for 7 days (move to audit store), then hard-delete via scheduled purge.

**Risks**:
- No soft-delete makes expired-key investigations impossible
- Soft-delete without hard-delete becomes indefinite storage
- Compliance violations if regulations require immediate deletion

**Related Rules/Skills**: Rules: Implement Two-Tier Expiration (Soft + Hard Delete), Configure Redis `volatile-ttl` Eviction Policy. Skills: Manage Idempotency Key TTL and Expiration.

---

## Tree 3: Redis Eviction Policy Configuration

**Decision Context**: Selecting the Redis eviction policy for the idempotency store — which policy best aligns with idempotency key lifecycle.

**Decision Criteria**:
- Redis instance sharing (dedicated vs shared with other data)
- Key lifecycle (TTL-based expiration)
- Acceptable eviction behavior
- Memory capacity relative to expected load

**Decision Tree**:
```
Is the Redis instance dedicated to idempotency keys only?
├── YES → Can you predict maximum key count and allocate sufficient memory?
│   ├── YES → Use `volatile-ttl` (safest — evicts keys closest to expiration)
│   └── NO → Use `allkeys-lru` with monitoring; acceptable if keys have similar access patterns
└── NO → Is Redis shared with cache and other ephemeral data?
    ├── YES → Use `volatile-ttl` — ensures idempotency keys near expiration are evicted before active keys
    └── NO → Use `volatile-ttl` (always the safest default for TTL-based workloads)
```

**Rationale**: `volatile-ttl` evicts keys closest to expiration first, which aligns perfectly with idempotency key lifecycle. Older keys are naturally more likely to be expired anyway.

**Recommended Default**: `maxmemory-policy volatile-ttl` with `maxmemory` set to accommodate peak load plus 30% headroom.

**Risks**:
- `noeviction` causes write failures during memory pressure
- `allkeys-lru` may evict active keys with infrequent access
- `allkeys-random` provides no predictable eviction behavior

**Related Rules/Skills**: Rules: Configure Redis `volatile-ttl` Eviction Policy. Skills: Manage Idempotency Key TTL and Expiration.
