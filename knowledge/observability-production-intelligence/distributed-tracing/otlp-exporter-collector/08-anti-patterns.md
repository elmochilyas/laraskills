# Anti-Patterns: OTLP Exporter & Collector

## AP-OEC-01: No Memory Limiter
Collector OOM during traffic spikes. Memory limiter must be the first processor in every pipeline.

## AP-OEC-02: Direct SDK-to-Backend Export
Skipping Collector means no buffering, no retry, no tail sampling, no multi-backend routing. Tight coupling to backend infrastructure.

## AP-OEC-03: Single Collector Without HA
One Collector instance is a single point of failure. Deploy multiple replicas with load balancing for production.

## AP-OEC-04: Config Not Version-Controlled
Collector YAML defines critical data flow. Stored outside version control means changes are untracked and unrevertable.
