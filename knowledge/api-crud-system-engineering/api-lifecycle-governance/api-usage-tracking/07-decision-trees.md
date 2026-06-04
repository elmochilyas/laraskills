# Decision Trees — API Usage Tracking

## Tree 1: Event Pipeline Architecture

**Decision Context**: Choosing the event pipeline architecture for usage tracking — synchronous vs async, buffer technology, and enrichment strategy.

**Decision Criteria**:
- Request latency sensitivity
- Event volume and throughput
- Infrastructure complexity tolerance
- Real-time vs batch reporting needs

**Decision Tree**:
```
Does the API have strict latency requirements (<50ms p99)?
├── YES → Must use async pipeline with lightweight buffer (Redis Stream, sub-ms write)
└── NO → Is the request volume > 10,000 events per second?
    ├── YES → Async pipeline with Kafka (higher throughput, durable, replayable)
    └── NO → Is real-time consumer usage dashboard critical?
        ├── YES → Async with Redis Stream + enrichment worker + TimescaleDB
        │        Enrich at write time: add consumer metadata (tier, company, billing plan)
        └── NO → Is team familiar with Laravel ecosystem?
            ├── YES → Redis Stream (simple, fast, native tooling)
            └── NO → Async with queue worker (simpler, less config)
```

**Rationale**: Async pipeline is non-negotiable — never block request path. Redis Stream balances simplicity and performance for most Laravel APIs. Kafka for high-throughput needs.

**Recommended Default**: Redis Stream buffer + enrichment worker + TimescaleDB storage. Enrich events at write time with consumer metadata.

**Risks**:
- Synchronous tracking adds latency to every request
- No buffer (direct DB writes) creates database bottleneck
- Enrichment at query time causes expensive joins on millions of events

**Related Rules/Skills**: Rules: Never Block the Request Path for Usage Tracking, Enrich Events at Write Time. Skills: Track API Usage.

---

## Tree 2: Sampling Strategy

**Decision Context**: Determining what percentage of requests to track — whether to sample reads, track all mutations, and how to set sampling rates.

**Decision Criteria**:
- Billing accuracy requirements (100% for mutations)
- Read-to-write ratio
- Storage cost constraints
- Analytics requirements

**Decision Tree**:
```
Is the request a mutation (POST, PATCH, PUT, DELETE)?
├── YES → Track 100% of requests (billing accuracy requirement)
└── NO → Is the request a read (GET, HEAD)?
    ├── YES → Is the read endpoint high-volume (>1000 req/s)?
    │   ├── YES → Sample at 1% (sufficient for analytics, minimal storage cost)
    │   └── NO → Is the read endpoint low-volume (<100 req/s)?
    │       ├── YES → Sample at 10% (enough data for meaningful analytics)
    │       └── NO → Sample at 5% (balanced default for medium-volume reads)
    └── NO → OPTIONS or other method: track at 1% sample (no billing relevance)
```

**Rationale**: 100% mutation tracking ensures billing accuracy. Read sampling at 1-10% provides sufficient analytics data while controlling storage costs.

**Recommended Default**: 100% mutations, 5% reads. Adjust read sampling down for high-volume endpoints, up for low-volume.

**Risks**:
- Tracking all reads at 100% multiplies storage cost 10x without billing benefit
- Too low sampling for low-volume endpoints produces statistically insignificant data
- No tracking of reads misses analytics for popular read endpoints

**Related Rules/Skills**: Rules: Track 100% of Writes, Sample Reads. Skills: Track API Usage.

---

## Tree 3: Data Retention and Aggregation

**Decision Context**: Setting data retention periods and aggregation schedules — how long to keep raw events, what aggregation granularity, and when to purge.

**Decision Criteria**:
- Storage cost constraints
- Analytics granularity needs
- Compliance/regulatory requirements
- Billing cycle timing

**Decision Tree**:
```
Are you subject to regulatory data retention limits (GDPR, PCI)?
├── YES → Apply minimum retention required by regulation; purge raw events at compliance deadline
└── NO → Do you need per-request debugging for consumer support?
    ├── YES → Keep raw events for 90 days; aggregate hourly for dashboards; aggregate daily for billing
    │        Retention: raw 90d → hourly 1yr → daily 2yr → purge
    └── NO → Do you need historical analytics beyond 90 days?
        ├── YES → Keep raw events for 30 days; aggregate hourly for 6 months; aggregate daily for 2 years
        └── NO → Keep raw events for 30 days; aggregated daily for 1 year
```

**Rationale**: Raw events are expensive to store and rarely queried after 90 days. Aggregation preserves analytics value while reducing storage by orders of magnitude.

**Recommended Default**: Raw events 90 days, hourly aggregations 1 year, daily aggregations 2 years.

**Risks**:
- Storing raw events indefinitely causes unbounded storage growth
- Purging raw events too early loses debugging capability
- No automated purge leads to escalating storage costs

**Related Rules/Skills**: Rules: Set Clear Data Retention Policies. Skills: Track API Usage.
