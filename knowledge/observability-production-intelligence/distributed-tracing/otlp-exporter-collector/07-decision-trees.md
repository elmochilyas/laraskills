# Decision Trees: OTLP Exporter & Collector

**D-01: Sidecar vs Gateway:** Sidecar for simplicity and single-service deployments; gateway for multi-service routing and tail sampling across services.

**D-02: gRPC vs HTTP for OTLP:** gRPC for lower latency and higher throughput; HTTP/protobuf for environments without gRPC extension. Prefer gRPC.

**D-03: Batch processor settings:** 5s timeout / 2048 batch size as starting point. Increase batch size for higher throughput; decrease timeout for lower latency.
