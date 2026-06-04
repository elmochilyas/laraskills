# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** reverb-scaling
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Shared Redis pub/sub backbone configured for multi-instance Reverb deployment
- [ ] Sticky sessions configured at load balancer for WebSocket connection affinity
- [ ] Client connection registry managed via Redis — each instance aware of all connections
- [ ] Scaling boundary understood: single server limits, multi-server linear scaling
- [ ] Custom Reverb driver (K041) evaluated for non-Redis scaling backends
- [ ] Backend data pipeline (K016) feeds broadcasts through scaled Reverb deployment

---

# Architecture Checklist

- [ ] Each Reverb instance handles subset of clients (sharded by connection)
- [ ] Redis pub/sub backbone shares broadcasts across all instances
- [ ] Sticky sessions (cookie or IP hash) maintain client-to-instance affinity
- [ ] Client connection registry stored in Redis — available to all instances
- [ ] Scaling boundary determined by Redis pub/sub throughput, not PHP connection handling
- [ ] Custom driver (NATS, RabbitMQ) considered when Redis pub/sub limits reached (K041)

---

# Implementation Checklist

- [ ] config/reverb.php: 'apps' => [ 'app_key', 'app_secret', 'allowed_origins' ] per instance
- [ ] Redis config: 'client' => 'phpredis', 'options' => [ 'prefix' => 'reverb:' ]
- [ ] Load balancer: sticky session cookie (REVERB_SERVER_ID) for connection affinity
- [ ] Reverb server started on each instance: php artisan reverb:start --host=0.0.0.0 --port=8080
- [ ] Scaling test: N instances, M connections, measure broadcast latency
- [ ] Supervisor/process manager configured per instance for Reverb process monitoring

---

# Performance Checklist

- [ ] Redis pub/sub throughput measured (messages/second) as scaling limit
- [ ] Broadcast latency measured as instances scale up (p95 target < 200ms)
- [ ] Sticky session overhead measured — load balancer cookie vs IP hash
- [ ] Memory per connection profiled — thousands of connections = GB of RAM
- [ ] Scaling test: 10k, 50k, 100k concurrent connections across instances
- [ ] Connection churn impact measured — rapid connect/disconnect cycles

---

# Security Checklist

- [ ] Redis pub/sub channels scoped per Reverb app key to prevent cross-app leakage
- [ ] Load balancer terminates TLS for WebSocket connections
- [ ] WebSocket connection authenticated via token in initial handshake
- [ ] Sticky session cookie secured (HttpOnly, Secure, SameSite)
- [ ] Redis authentication and TLS between Reverb instances and Redis

---

# Reliability Checklist

- [ ] Instance failure — connections lost, remaining instances continue serving
- [ ] Client reconnect handled via Echo reconnection with exponential backoff
- [ ] Redis pub/sub failure — broadcasts paused, connections maintained
- [ ] Sticky session misrouting handled — client can reconnect to any instance
- [ ] Graceful shutdown — drain connections before instance termination

---

# Testing Checklist

- [ ] Test single Reverb instance handles expected connection count
- [ ] Test two instances broadcast message correctly to clients on both instances
- [ ] Test instance failure — remaining instances serve clients without data loss
- [ ] Test client reconnect after load balancer reroute
- [ ] Test Redis pub/sub throughput limit with synthetic load
- [ ] Test custom driver (NATS) as Pub/Sub backbone (K041)

---

# Maintainability Checklist

- [ ] Reverb deployment architecture documented with instance count, Redis config, LB config
- [ ] Scaling test results archived for capacity planning
- [ ] Redis config (maxmemory, eviction policy) documented for Reverb use case
- [ ] Load balancer sticky session configuration in version-controlled config
- [ ] Monitoring dashboard for connections per instance, broadcast latency, Redis pub/sub throughput

---

# Anti-Pattern Prevention Checklist

- [ ] Do not scale Reverb without sticky sessions — clients lose connection on broadcast
- [ ] Do not use default Redis config without maxmemory limit — can fill Redis
- [ ] Do not ignore broadcast latency as instances scale — monitor p95
- [ ] Do not deploy single instance for production if HA required — at least 2 instances
- [ ] Do not skip load testing — Reverb performance degrades differently per workload pattern

---

# Production Readiness Checklist

- [ ] Prometheus metrics for connections per instance, broadcast latency, Redis pub/sub throughput
- [ ] Logged warning when broadcast latency exceeds 200ms at p95
- [ ] Alert if any Reverb instance connection count drops to zero
- [ ] Redis memory usage monitored with alert at 80% maxmemory
- [ ] Deploy checklist includes Reverb scaling config and LB sticky session verification
- [ ] Staging load test validates scaling at expected peak connection count

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Redis backbone, sticky sessions, connection registry, scaling boundary understood
- [ ] Security requirements satisfied: channel scoping, TLS termination, token authentication, secured cookies
- [ ] Performance requirements satisfied: Redis throughput, broadcast latency p95, memory per connection, load test
- [ ] Testing requirements satisfied: single/multi-instance correctness, instance failure, reconnect, Redis capacity
- [ ] Anti-pattern checks passed: sticky sessions configured, Redis maxmemory set, latency monitored, load tested
- [ ] Production readiness verified: connection metrics, broadcast latency alerts, Redis memory, sticky session verification

---

# Related References

- K010 (Reverb WebSocket): Base Reverb knowledge required before scaling
- K041 (Custom Reverb Driver): Extending Reverb beyond the built-in scaling model
- K021 (OHLCV Candle Upsert): Example of data broadcast through scaled Reverb
- K016 (ClickHouse Materialized Views): Backend data pipeline feeding broadcasts
