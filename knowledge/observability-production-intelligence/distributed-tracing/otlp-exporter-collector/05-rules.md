# Rules: OTLP Exporter & Collector

## Rule OEC-01: Deploy OpenTelemetry Collector in all production environments
**Condition:** When running OTel-instrumented applications in production.
**Action:** Deploy Collector as a sidecar or per-host agent. Configure OTLP receiver. Never export directly from PHP SDK to backend.
**Consequence:** Buffering, retry, sampling, and multi-backend export are available. Application is decoupled from backend infrastructure.

## Rule OEC-02: Configure memory limiter processor as the first processor
**Condition:** In every Collector pipeline configuration.
**Action:** Add `memory_limiter` processor before `batch` processor. Set `limit_mib` to 80% of available memory.
**Consequence:** Collector never OOMs under traffic spikes. Graceful degradation instead of crash.

## Rule OEC-03: Never expose Collector OTLP receivers to the public internet
**Condition:** When deploying Collector networking.
**Action:** Bind OTLP receivers to localhost (sidecar) or internal network (gateway). Use firewall rules to restrict access.
**Consequence:** Telemetry ingestion endpoint is not discoverable by external attackers.

## Rule OEC-04: Store Collector config in version control
**Condition:** When managing Collector configuration.
**Action:** Store `config.yaml` in the application repository alongside deployment configs. Review changes via PR process.
**Consequence:** Configuration is auditable, revertable, and deployable through standard CI/CD.

## Rule OEC-05: Configure TLS for SDK-to-Collector communication
**Condition:** When SDK and Collector are on different hosts.
**Action:** Enable TLS on OTLP receiver. Configure SDK exporter with TLS. For same-host (sidecar), localhost is acceptable without TLS.
**Consequence:** Telemetry data encrypted in transit.

## Rule OEC-06: Enable Collector health check extension
**Condition:** In every Collector deployment.
**Action:** Configure `health_check` extension. Expose health endpoint for orchestration probes. Add to monitoring dashboards.
**Consequence:** Collector health is visible to orchestration and monitoring systems.
