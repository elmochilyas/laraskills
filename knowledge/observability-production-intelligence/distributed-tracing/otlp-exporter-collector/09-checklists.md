# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 04-distributed-tracing
**Knowledge Unit:** otlp-exporter-collector
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] OpenTelemetry Collector deployment strategy decided (sidecar vs daemonset)
- [ ] OTLP exporter configured in PHP SDK (gRPC or HTTP/protobuf)
- [ ] Collector pipeline defined: receiver, processor, exporter
- [ ] Buffering and retry configured for telemetry resilience
- [ ] Tail-based sampling evaluated for cost optimization
- [ ] Collector infrastructure decoupled from application redeployment

---

# Architecture Checklist

- [ ] Collector pipeline components understood: receiver, processor, exporter, extension
- [ ] Sidecar vs daemonset deployment tradeoffs documented
- [ ] Receiver configured for OTLP (gRPC port 4317, HTTP port 4318)
- [ ] Batch processor configured in Collector for throughput
- [ ] Exporter configured for backend destination (Jaeger, Tempo, Datadog)
- [ ] Collector as proxy decouples app instrumentation from backend infrastructure

---

# Implementation Checklist

- [ ] Collector config YAML created with receiver, processor, exporter sections
- [ ] OTLP gRPC endpoint set in PHP SDK config
- [ ] Collector `OTEL_COLLECTOR_` environment variables configured
- [ ] Memory limiter processor configured to prevent OOM
- [ ] Batch processor settings tuned (`timeout`, `send_batch_size`, `send_batch_max_size`)
- [ ] Health check extension enabled on Collector for monitoring

---

# Performance Checklist

- [ ] Collector memory limit configured based on max span throughput
- [ ] Batch processor send interval tuned for latency vs throughput
- [ ] gRPC vs HTTP/protobuf protocol benchmarked for OTLP
- [ ] Collector CPU/memory profiled under expected load
- [ ] Queue size configured (`queued.retry`) for backpressure handling
- [ ] Tail-based sampling memory buffer sized for peak trace load

---

# Security Checklist

- [ ] Collector endpoint not exposed publicly (internal network only)
- [ ] TLS configured between SDK and Collector (or localhost sidecar)
- [ ] Collector exporter backend authentication configured
- [ ] Collector config reviewed for hardcoded backend credentials
- [ ] Collector logs monitored for security events
- [ ] Network policy restricts Collector access to application containers

---

# Reliability Checklist

- [ ] Collector failure documented failover: degrade gracefully, no app crash
- [ ] Export retry with backoff configured (`queued.retry`)
- [ ] Disk fallback queue configured if backend unreachable
- [ ] Collector health check monitored and self-healing
- [ ] Span data loss acceptable for buffer overflow quantified
- [ ] Collector upgrade strategy (blue-green or rolling)

---

# Testing Checklist

- [ ] Integration test: Collector receives OTLP spans from SDK
- [ ] Integration test: Collector exports to backend successfully
- [ ] Stress test: Collector handles 2x expected span throughput
- [ ] Failure test: Collector restart does not lose queued spans
- [ ] Security test: Collector rejects unauthenticated connections
- [ ] Upgrade test: config change applied without data loss

---

# Maintainability Checklist

- [ ] Collector config YAML version-controlled with deployment configs
- [ ] Collector pipeline documented with data flow diagram
- [ ] Backend exporter change documented in runbook
- [ ] Collector metrics exported for internal monitoring
- [ ] Tail sampling policy documented with rationale and expected savings
- [ ] Team trained on Collector troubleshooting (config debug, logs)

---

# Anti-Pattern Prevention Checklist

- [ ] Collector not used as a monolithic single point of failure (redundancy)
- [ ] SDK not configured to export directly to backend (always via Collector)
- [ ] Collector not deployed without memory limits
- [ ] Pipeline not configured with infinite retry (backpressure)
- [ ] Batch processor not set with too-large batch size causing latency
- [ ] Tail sampling not used without monitoring sampling decision accuracy

---

# Production Readiness Checklist

- [ ] Collector deployed in staging for pre-production validation
- [ ] Memory and CPU limits configured in container orchestration
- [ ] Collector health check integrated into platform monitoring
- [ ] Backup exporter route configured (secondary backend)
- [ ] Collector version pinned with changelog reviewed
- [ ] On-call runbook includes Collector restart and config reload steps

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: pipeline components deployed, sidecar vs daemonset decided, receipt-processor-exporter pipeline defined
- [ ] Security requirements satisfied: endpoint not public, TLS configured, backend auth in place
- [ ] Performance requirements satisfied: memory limit set, batch interval tuned, gRPC/HTTP evaluated, buffer sized
- [ ] Testing requirements satisfied: span receipt verified, backend export confirmed, stress test passed, loss quantified
- [ ] Anti-pattern checks passed: not monolithic, not exporting directly, memory limited, retry bounded
- [ ] Production readiness verified: staging validated, limits set, health integrated, backup route configured

---

# Related References

- OpenTelemetry PHP SDK (OTLP Exporter client-side config)
- Span Sampling Strategies (tail sampling policies in Collector)
- OTel Auto-Instrumentation (Collector receives auto-instrumented traces)
- OTel Collector Production Hardening (advanced production deployment)
