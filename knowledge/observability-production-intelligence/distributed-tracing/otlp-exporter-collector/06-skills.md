# Skill: Deploy and Configure OpenTelemetry Collector

## Purpose
Deploy the OpenTelemetry Collector alongside Laravel applications to buffer, process, and export telemetry data with resilience and flexibility.

## When To Use
- Production Laravel deployments with OTel instrumentation
- Multi-backend observability strategies
- Cost control through sampling and filtering

## Prerequisites
- OTel-instrumented Laravel applications
- Collector binary or container image
- Backend destinations configured (Tempo, Prometheus, etc.)

## Workflow
1. Choose deployment topology: sidecar for simple setups, gateway for multi-service routing
2. Create config.yaml with receivers (otlp), processors (memory_limiter, batch), exporters (otlp)
3. Deploy via Docker Compose, Kubernetes Helm chart, or systemd
4. Configure environment: enable TLS, set resource limits, enable health check
5. Test end-to-end: generate trace in Laravel, verify it reaches backend via Collector
6. Monitor Collector health: memory, CPU, export error rate, queue depth

## Validation Checklist
- [ ] Memory limiter processor configured
- [ ] Batch processor tuned for throughput
- [ ] TLS enabled for SDK→Collector communication
- [ ] Health check extension active
- [ ] Collector metrics exposed and monitored
- [ ] Config version-controlled
- [ ] End-to-end trace verified through Collector
