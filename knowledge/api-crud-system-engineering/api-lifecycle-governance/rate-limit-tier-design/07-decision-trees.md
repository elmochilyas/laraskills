# Decision Trees — Rate Limit Tier Design

## Tree 1: Tier Structure Definition

**Decision Context**: Choosing the number of consumer tiers and their rate limits — whether to use 3 tiers, more granular tiers, or dynamic per-consumer limits.

**Decision Criteria**:
- Consumer base diversity
- Pricing/monetization model
- Infrastructure capacity
- Operational complexity tolerance

**Decision Tree**:
```
Are you monetizing the API with usage-based pricing?
├── YES → Is your consumer base highly diverse (hobbyists to enterprises)?
│   ├── YES → 4-5 tiers: Free, Starter, Pro, Enterprise, Custom
│   └── NO → 3 tiers: Free (10 req/s, 10K/mo), Pro (100 req/s, 1M/mo), Enterprise (1000 req/s, 10M/mo)
└── NO → Is the API primarily internal with few consumers?
    ├── YES → Single tier with per-consumer overrides (for internal tools/teams)
    └── NO → Is this a developer API with free access model?
        ├── YES → 2 tiers: Free (100 req/s) + Pro/Unlimited (negotiated)
        └── NO → 3 tiers minimum (standard best practice)
```

**Rationale**: Three tiers is the minimum for meaningful differentiation. More tiers enable finer pricing granularity but increase operational complexity.

**Recommended Default**: Three tiers: Free (10 req/s, 10K/mo), Pro (100 req/s, 1M/mo), Enterprise (1000 req/s, 10M/mo) with 2x burst for max 10 seconds.

**Risks**:
- Too many tiers create confusing product and maintenance burden
- Too few tiers fail to capture different consumer segments
- Single tier without differentiation invites free-tier abuse

**Related Rules/Skills**: Rules: Define Minimum Three Consumer Tiers. Skills: Design Rate Limit Tiers.

---

## Tree 2: Rate Limiting Algorithm Selection

**Decision Context**: Choosing the rate limiting algorithm — sliding window, token bucket, fixed window, or hybrid approach.

**Decision Criteria**:
- Burst handling requirements
- Accuracy requirements at window boundaries
- Redis/backend infrastructure capabilities
- Performance overhead tolerance

**Decision Tree**:
```
Do you need to allow short traffic bursts above the sustained limit?
├── YES → Do you need accurate sustained rate limiting across window boundaries?
│   ├── YES → Hybrid: sliding window (Redis sorted set for sustained) + token bucket (Redis Lua for burst)
│   └── NO → Token bucket alone (refill at fixed rate, allow bursts up to bucket size)
└── NO → Is your API high-throughput with simple requirements?
    ├── YES → Sliding window using Redis sorted sets (accurate, moderate memory per key)
    └── NO → Is this an internal API with trusted consumers?
        ├── YES → Fixed window with jitter (simplest, accepts 2x at boundaries)
        └── NO → Sliding window with token bucket (hybrid — industry standard)
```

**Rationale**: Hybrid sliding window + token bucket is the industry standard, balancing sustained accuracy with burst handling. Simpler algorithms suit internal/low-accuracy needs.

**Recommended Default**: Hybrid approach — sliding window for sustained rate accuracy, token bucket for 2x burst allowance up to 10 seconds.

**Risks**:
- Fixed window alone allows 2x traffic at boundary spikes
- Pure token bucket without sliding window allows sustained overage
- Redis sorted sets use O(window size) memory per consumer

**Related Rules/Skills**: Rules: Use Hybrid Sliding Window + Token Bucket. Skills: Design Rate Limit Tiers.

---

## Tree 3: Rate Limit Headers Strategy

**Decision Context**: Which rate limit headers to include on API responses and whether to include them on all responses or only when throttled.

**Decision Criteria**:
- Consumer tooling expectations
- Header overhead
- IETF standard compliance
- Consumer proactivity requirements

**Decision Tree**:
```
Should consumers be able to proactively avoid rate limiting?
├── YES → Include rate limit headers on ALL responses:
│   - X-RateLimit-Limit (tier max)
│   - X-RateLimit-Remaining (current window remaining)
│   - X-RateLimit-Reset (Unix timestamp of reset)
│   - Retry-After (only on 429 responses)
└── NO → Headers only on 429 responses:
    - Retry-After (seconds until retry allowed)
    - X-RateLimit-Limit (tier max)
```

**Rationale**: Proactive consumers need remaining capacity before hitting limits. Including headers on all responses (not just 429) enables this with negligible overhead.

**Recommended Default**: Include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` on all responses. `Retry-After` on 429 responses only.

**Risks**:
- Headers only on 429 force consumers into reactive backoff
- No headers at all leave consumers blind
- Header computation overhead is negligible (<0.1ms)

**Related Rules/Skills**: Rules: Include Rate Limit Headers on All Responses. Skills: Design Rate Limit Tiers.
