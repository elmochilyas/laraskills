# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** ohlcv-candle-upsert
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] OHLCV candle structure (Open, High, Low, Close, Volume) understood for time-series bucketing
- [ ] Upsert semantics (INSERT ... ON CONFLICT DO UPDATE) chosen for PostgreSQL or ReplacingMergeTree for ClickHouse
- [ ] Time bucketing strategy defined (1m, 5m, 1h, 1d candles)
- [ ] Rolling window update implemented — new tick updates current candle in-place
- [ ] Multi-granularity upsert evaluated — write amplification (K026) impact measured
- [ ] Reverb WebSocket (K010) broadcasts candle updates to clients in real-time

---

# Architecture Checklist

- [ ] Candle table: time_bucket, open, high, low, close, volume, updated_at
- [ ] Upsert logic: INSERT new candle or UPDATE existing bucket with higher/lower/close
- [ ] ReplacingMergeTree (ClickHouse) with ORDER BY (time_bucket, symbol) for upsert semantics
- [ ] PostgreSQL upsert: INSERT ... ON CONFLICT (time_bucket, symbol) DO UPDATE SET ...
- [ ] Multi-granularity: separate tables or summarizing query for different bucket sizes
- [ ] ClickHouse Materialized View (K016) evaluated as alternative to upsert

---

# Implementation Checklist

- [ ] Candle table migration: time_bucket (TIMESTAMP), symbol, open, high, low, close, volume, counter
- [ ] Upsert query: INSERT INTO candles VALUES (...) ON CONFLICT (time_bucket, symbol) DO UPDATE
- [ ] Open preserved from first tick in bucket; High/Low/Volume updated per new tick; Close from latest
- [ ] Tick receiver function: compute bucket key, execute upsert, return current candle
- [ ] Reverb broadcast after upsert: event pushed to channel for real-time chart update (K010)
- [ ] ReplacingMergeTree ORDER BY (time_bucket, symbol) for ClickHouse upsert equivalent

---

# Performance Checklist

- [ ] Upsert query benchmarked — sub-millisecond target for tick-rate inserts
- [ ] ON CONFLICT index on (time_bucket, symbol) for constant-time conflict detection
- [ ] Multi-granularity upsert writes amplified — each tick updates N granularity tables
- [ ] Reverb broadcast latency from upsert to WebSocket delivery measured
- [ ] ClickHouse ReplacingMergeTree finalize SELECT for accurate candle values
- [ ] Autovacuum / merge behavior monitored for upsert-heavy tables

---

# Security Checklist

- [ ] Upsert endpoint authenticated — prevents spoofed candle data injection
- [ ] Candle data validated before upsert — open/high/low/close in expected ranges
- [ ] Reverb channel access restricted to authorized subscribers
- [ ] Tick source identity verified (API key or signed payload)
- [ ] Historical candle data immutable after finalization (past buckets read-only)

---

# Reliability Checklist

- [ ] Upsert idempotent — re-sending same tick does not corrupt candle (counter or "at least once" safe)
- [ ] Reverb broadcast failure does not affect candle storage (broadcast after upsert)
- [ ] Candle recovery from raw tick data — replay ticks to rebuild candles
- [ ] ReplacingMergeTree merge does not lose unmerged candle updates
- [ ] Counter column prevents stale tick overrides (reject ticks with counter <= current)

---

# Testing Checklist

- [ ] Test upsert: insert tick, verify candle open/high/low/close/volume values
- [ ] Test duplicate tick idempotency — re-inserting same tick does not change candle
- [ ] Test multi-granularity: 1m and 1h candles for same tick stream
- [ ] Test Reverb broadcast delivers candle data to subscriber
- [ ] Test candle recovery from raw tick replay
- [ ] Test ReplacingMergeTree SELECT final for accurate candle after merge

---

# Maintainability Checklist

- [ ] Candle upsert logic in dedicated service class (CandleService)
- [ ] Time bucket resolution configurable per symbol
- [ ] Multi-granularity decision documented with write amplification budget
- [ ] Raw tick store retained for candle replay (optional)
- [ ] Upsert query benchmark results archived for performance regression detection

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use SELECT-before-upsert pattern — upsert is single operation
- [ ] Do not use separate INSERT and UPDATE — race condition on concurrent ticks
- [ ] Do not skip counter/version column — upsert needs ordering for late-arriving ticks
- [ ] Do not broadcast before upsert — WebSocket clients get stale candle
- [ ] Do not use ClickHouse ReplacingMergeTree for real-time OLTP upserts — PostgreSQL upsert is safer

---

# Production Readiness Checklist

- [ ] Prometheus metrics for upsert latency, ticks per second, Reverb broadcast latency
- [ ] Logged warning when upsert latency exceeds 10ms (tick bottleneck)
- [ ] Alert if Reverb broadcast failure rate exceeds 1%
- [ ] Candle table storage growth projected per tick rate
- [ ] Deploy checklist includes upsert index verification (time_bucket, symbol)
- [ ] Staging tick generator validates upsert throughput at expected peak rate

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: upsert semantics, time bucketing, multi-granularity, broadcast-after-store
- [ ] Security requirements satisfied: authenticated upsert, validated data, channel access control, origin verification
- [ ] Performance requirements satisfied: sub-ms upsert, index collision detection, write amplification measurement
- [ ] Testing requirements satisfied: candle correctness, idempotency, multi-granularity, broadcast, recovery
- [ ] Anti-pattern checks passed: upsert single operation, counter for ordering, broadcast after write
- [ ] Production readiness verified: latency metrics, tick rate alerts, broadcast monitoring, storage projection, staging

---

# Related References

- K010 (Reverb WebSocket): Real-time broadcast of candle updates to clients
- K016 (ClickHouse Materialized Views): Alternative to upsert for candle aggregation
- K026 (Write Amplification): Multi-granularity upsert increases write amplification
- K024 (AggregatingMergeTree): State-based aggregation as alternative to upsert
