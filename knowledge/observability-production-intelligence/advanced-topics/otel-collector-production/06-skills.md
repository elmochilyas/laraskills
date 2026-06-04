# Skill: Deploy OpenTelemetry Collector in Production for Laravel Traces
## Purpose
Deploy and operate the OpenTelemetry Collector in production to receive, process, and export observability data from Laravel applications, with high availability, security, and efficiency.
## When To Use
- Production Laravel deployments needing reliable trace/log/metric collection pipeline
- Multi-service architectures requiring centralized trace routing
- Teams wanting to reduce vendor lock-in (single pipeline, multiple backends)
## When NOT To Use
- Single-service, low-traffic apps where direct export suffices
- Teams not yet using OpenTelemetry instrumentation
## Prerequisites
- OpenTelemetry Collector binary or container image
- Kubernetes or Docker infrastructure
- Destination backends (Jaeger, Tempo, Prometheus, Loki)
- Laravel apps with OpenTelemetry SDK instrumented
## Inputs
- Collector configuration YAML
- Deployment topology (sidecar vs centralized)
- Backend destination configurations
- Resource limits and scaling policy
## Workflow
1. Choose deployment topology: sidecar (one collector per node) for simplicity; centralized for multi-service routing; gateway for edge processing
2. Deploy Collector via Helm chart (`open-telemetry/opentelemetry-collector`) or Docker Compose
3. Configure receivers: OTLP (gRPC 4317, HTTP 4318), Prometheus (metrics scraping), Jaeger (legacy)
4. Configure processors: batch (2048/5s), memory limiter (80% hard, 10% spike), attributes (add service.name, env), filter (drop health check spans)
5. Configure exporters: OTLP to Tempo, Prometheus remote write, Loki, or multiple backends
6. Set up TLS: mTLS between app and Collector, TLS between Collector and backends
7. Configure high availability: multiple Collector replicas, load-balanced OTLP receivers
8. Enable Collector telemetry: expose Collector's own metrics for monitoring (port 8888)
9. Configure rate limiting: per-service rate limits to prevent one service from overwhelming the pipeline
10. Create Collector dashboard: ingested spans/s, export rate, error rate, memory usage
## Validation Checklist
- [ ] Collector deployed with correct topology (sidecar/centralized/gateway)
- [ ] OTLP receivers configured on correct ports with TLS
- [ ] Processors: batch, memory limiter, attributes, filter configured
- [ ] Exporters configured for all required backends
- [ ] TLS/mTLS secured for all communication
- [ ] High availability: multiple replicas with load balancing
- [ ] Collector's own metrics exposed and monitored
- [ ] Rate limiting configured per service
- [ ] Collector dashboard showing pipeline health
- [ ] End-to-end trace flow: Laravel → Collector → backend verified
## Common Failures
- **Collector OOM:** No memory limiter. Must configure immediately.
- **Span loss on restart:** No persistent queue. Use `queued_retry` processor.
- **High latency under load:** Batch too large or timeout too high.
- **Single point of failure:** Single Collector instance. Deploy HA with load balancer.
- **TLS certificate expiration:** Certificates not renewed, pipeline drops all traffic.
## Decision Points
- **Sidecar vs centralized vs gateway:** Sidecar for simplicity; centralized for routing; gateway for edge processing.
- **Core vs Contrib Collector:** Core for receivers/exporters; Contrib for advanced processors (filter, k8s attributes, transform).
- **gRPC vs HTTP receivers:** gRPC for performance; HTTP for compatibility.
- **Collector as proxy vs direct export:** Collector as proxy for processing; direct for simplicity (no infra overhead).
## Performance Considerations
- Collector adds 50-500ms latency (batch, process, export pipeline)
- Memory: expect 500MB-2GB per Collector instance depending on traffic
- With 10k spans/s: ~1GB memory for batch buffering
- CPU: 1-2 cores per Collector instance
## Security Considerations
- TLS/mTLS for all Collector communication
- Collector API not exposed to public internet
- OTLP receiver requires authentication (API key or client cert)
- Collector logs may contain span attributes — sanitize
## Related Skills
- OpenTelemetry PHP SDK (distributed-tracing)
- OTLP Exporter Collector (distributed-tracing)
- Span Sampling Strategies (distributed-tracing)
- Grafana Dashboard Design (dashboards)
## Success Criteria
- Collector pipeline reliably ingests Laravel observability data
- Batch processing and memory limiting prevent outages
- TLS secures all pipeline communication
- HA deployment eliminates single points of failure
- Collector health monitored and dashboards operational
