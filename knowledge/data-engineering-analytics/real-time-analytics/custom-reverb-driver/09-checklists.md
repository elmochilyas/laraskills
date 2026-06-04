# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** custom-reverb-driver
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Reverb Broadcaster and Subscriber interfaces understood (contract, lifecycle, delivery guarantees)
- [ ] Custom transport selected (NATS, RabbitMQ, SQS, Google Pub/Sub, IPC)
- [ ] Broadcaster interface implemented for custom transport
- [ ] Subscriber interface implemented for custom transport
- [ ] Server manager integration configured to register custom driver
- [ ] Driver lifecycle management documented (startup, shutdown, reconnect)

---

# Architecture Checklist

- [ ] Custom Broadcaster class implements Reverb\Contracts\Broadcaster interface
- [ ] Custom Subscriber class implements Reverb\Contracts\Subscriber interface
- [ ] Message envelope format defined for custom transport (channel, event, payload)
- [ ] Server manager configured to use custom driver class instead of Redis
- [ ] Driver delivery guarantees specified (at-most-once, at-least-once, exactly-once)
- [ ] Custom driver replaces Redis in CDC-to-Reverb pipeline (K017) for lower latency

---

# Implementation Checklist

- [ ] Broadcaster::broadcast() implemented: publishes message to custom transport
- [ ] Subscriber::subscribe() implemented: subscribes to channels on custom transport
- [ ] Message envelope created: { channel, event, payload, message_id, timestamp }
- [ ] Driver registered in config/reverb.php: 'driver' => 'custom'
- [ ] Service provider registers custom Broadcaster/Subscriber in Reverb namespace
- [ ] OHLCV Candle Upsert (K021) as test case for low-latency driver evaluation

---

# Performance Checklist

- [ ] Custom driver p50/p99 broadcast latency compared to Redis baseline
- [ ] Custom driver throughput (messages/second) compared to Redis baseline
- [ ] Connection overhead measured — persistent connection vs per-message connect
- [ ] Message serialization format chosen for performance (Protobuf vs JSON)
- [ ] Payload size impact on latency measured — smaller envelope = faster broadcast
- [ ] Scaling (K027) test with multiple Reverb nodes sharing custom driver backend

---

# Security Checklist

- [ ] Custom transport connections authenticated with credentials/config
- [ ] Transport connection encrypted (TLS) for cross-network message delivery
- [ ] Message envelope fields not logged (avoid channel/payload in logs)
- [ ] Custom driver credentials stored in environment config, not hardcoded
- [ ] Transport ACLs configured to restrict Reverb channel access

---

# Reliability Checklist

- [ ] Driver reconnection logic implemented — auto-reconnect on transport failure
- [ ] Message delivery acknowledged — Broadcaster returns success/failure
- [ ] Failed broadcast does not crash Reverb — logged and retried
- [ ] Subscriber re-subscribes to channels after connection drop
- [ ] Driver health check integrated into Reverb server health endpoint
- [ ] Exactly-once delivery semantics evaluated for critical event types

---

# Testing Checklist

- [ ] Test custom Broadcaster publishes message to transport correctly
- [ ] Test custom Subscriber receives message and delivers to WebSocket client
- [ ] Test driver reconnects after transport restart
- [ ] Test driver handles transport connection timeout gracefully
- [ ] Test concurrent connections through custom driver — multiple subscribers
- [ ] Test custom driver latency vs Redis baseline under same load

---

# Maintainability Checklist

- [ ] Custom driver classes in App\Reverb\Drivers\ directory
- [ ] Driver configuration in config/reverb.php with transport-specific options
- [ ] Driver interface documented with method contracts and edge case handling
- [ ] Transport choice documented with rationale (latency, infra compatibility, etc.)
- [ ] Driver upgrade procedure documented for transport client library version bumps

---

# Anti-Pattern Prevention Checklist

- [ ] Do not implement custom driver if Redis meets latency requirements
- [ ] Do not skip reconnect logic — driver must survive transport restart
- [ ] Do not block broadcast on synchronous I/O — use async transport clients
- [ ] Do not hardcode transport endpoints — use environment configuration
- [ ] Do not skip fallback — log and degrade instead of crash when transport unavailable

---

# Production Readiness Checklist

- [ ] Prometheus metrics for custom driver broadcast latency, throughput, error count
- [ ] Logged warning when broadcast error rate exceeds 1%
- [ ] Alert if driver reconnection count spikes (unstable transport)
- [ ] Transport connection pool size monitored
- [ ] Deploy checklist includes custom driver registration verification
- [ ] Staging Reverb test with custom driver validates real-time message delivery

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: Broadcaster/Subscriber implementation, server manager integration, envelope format
- [ ] Security requirements satisfied: authenticated connections, encrypted transport, credential protection
- [ ] Performance requirements satisfied: latency/throughput comparison to Redis, serialization optimization
- [ ] Testing requirements satisfied: publish/subscribe correctness, reconnect, timeout, concurrency, baseline comparison
- [ ] Anti-pattern checks passed: need justified over Redis, reconnect implemented, async I/O, env-based config
- [ ] Production readiness verified: broadcast metrics, error alerts, reconnection monitoring, staging validation

---

# Related References

- K010 (Reverb WebSocket): Base Reverb architecture that custom drivers extend
- K027 (Reverb Scaling): Scaling considerations for custom driver deployments
- K021 (OHLCV Candle Upsert): Example that benefits from low-latency custom drivers
- K017 (Kafka CDC Debezium): Custom driver can replace Redis in CDC-to-Reverb pipeline
