# Decision Trees: OTel Collector Production Hardening

## 1. Deployment Topology

What is the scale of the observability pipeline?
├── Single host / low volume → Agent-only deployment
│   ├── Collector per host; forwards to backend
│   ├── Still configure: memory_limiter, batch, persistent queue
│   └── One Collector instance sufficient (downtime only affects that host)
├── Multi-service / production → Per-host agent + gateway cluster
│   ├── Agents: lightweight, per-host, buffer locally
│   ├── Gateway: 2+ replicas behind load balancer
│   └── This is the recommended production pattern
└── Multi-region → Regional agents + regional gateways + central gateway
    └── Each region independent; central aggregation for cross-region queries

## 2. Memory Protection Strategy

What is the available RAM for the Collector?
├── Dedicated RAM (512MB+) → memory_limiter at 70% of total
│   ├── limit_mib = total_RAM * 0.7
│   ├── spike_limit_mib = limit_mib * 0.15 (for burst)
│   └── Place memory_limiter BEFORE batch processor in pipeline
├── Shared/container with limits → memory_limiter at 60% of limit
│   └── More conservative headroom for other processes
└── No dedicated RAM → Use OTel Collector only in agent mode; very conservative limits

## 3. Queue Persistence

Is data loss during restarts acceptable?
├── No (critical production data) → Enable persistent disk-backed queue
│   ├── sending_queue.storage: file_storage
│   ├── Configure directory separate from OS disk
│   ├── Set queue_size and num_consumers based on throughput
│   └── Monitor disk usage of queue directory
├── Partially acceptable → In-memory queue; some loss OK
│   └── Keep enabled but accept restart data loss
└── Yes (development only) → No queue needed; simple pipeline

## 4. Self-Monitoring

Is the Collector's own health tracked?
├── Yes → Configure /metrics endpoint and monitor key metrics
│   ├── otelcol_dropped_spans (alert on >0)
│   ├── otelcol_exporter_send_failed_span_count (alert on >0)
│   ├── otelcol_process_memory_rss (alert on >80% limit_mib)
│   └── health_check extension for k8s probes
├── Yes, through dedicated dashboard → Same metrics in Grafana/Prometheus
└── No → Action: configure monitoring before production deployment
