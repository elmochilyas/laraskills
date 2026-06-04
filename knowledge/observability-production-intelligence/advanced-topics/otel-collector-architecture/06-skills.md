# Skill: Harden OpenTelemetry Collector for Production

## Purpose
Configure the OTel Collector with memory limits, buffering, retry policies, and high availability to prevent data loss and OOM in production Laravel deployments.

## When To Use
- Production OTel deployments handling significant telemetry volume
- Multi-service architectures needing centralized telemetry processing
- Environments requiring high availability for observability pipeline

## When NOT To Use
- Development environments (simple direct export is fine)
- Low-traffic applications where Collector overhead is not justified
- Managed OTel services (Honeycomb, Grafana Cloud Alloy)

## Prerequisites
- OTel Collector binary installed
- Network access from application to Collector
- Backend destination configured (vendor API, self-hosted storage)

## Inputs
- Expected telemetry volume (spans/second)
- Available RAM and disk for Collector
- Backend endpoint and authentication

## Workflow
1. Deploy two-tier architecture: Agent Collector per host + Gateway Collector cluster
2. Set memory_limiter processor at 70% of available RAM with spike_limit_mib for bursts
3. Configure batch processor with timeout and max batch size matching backend throughput
4. Enable persistent queue with disk-backed buffering for restart survival
5. Set queued retry on export failure with exponential backoff
6. Deploy Gateway Collector as replicated deployment behind load balancer
7. Monitor Collector health metrics (memory, dropped spans, queue depth)

## Validation Checklist
- [ ] Memory limiter configured at 70% of available RAM
- [ ] Batch processor set with timeout and size limits
- [ ] Persistent queue enabled for restart survival
- [ ] Gateway Collector replicated for HA
- [ ] Collector health dashboards created

## Common Failures
- No memory limiter — Collector OOMs under load, losing all data
- No persistent queue — restart drops in-flight spans
- Single Collector — single point of failure for entire pipeline

## Decision Points
- Agent-only vs two-tier (agent + gateway) deployment?
- Memory limiter percentage based on workload burstiness?
- Batch size vs latency for export?

## Performance Considerations
- Batch processor reduces backend request count but adds latency
- Persistent queue uses disk I/O — monitor disk performance
- Gateway Collector must be sized for peak aggregate throughput

## Security Considerations
- Collector should run with least-privilege service account
- mTLS between Agent and Gateway Collectors for production
- OTLP endpoint should not be publicly accessible

## Related Skills
- Configure OpenTelemetry Auto-Instrumentation
- Set Up Distributed Tracing with OTel
- Monitor OTel Collector Health

## Success Criteria
- Collector survives peak load without OOM or data loss
- Collector restarts do not drop in-flight spans
- Backend receives complete telemetry within acceptable latency
