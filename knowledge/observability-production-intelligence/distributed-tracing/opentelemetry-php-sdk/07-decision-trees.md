# Decision Trees: OpenTelemetry PHP SDK

**D-01: SpanProcessor selection:** SimpleSpanProcessor for development; BatchSpanProcessor for production. Always BatchSpanProcessor in production — never compromise.

**D-02: Export protocol:** gRPC for ~30% better throughput; HTTP/protobuf for environments where gRPC extension is unavailable. Prefer gRPC.

**D-03: SDK configuration approach:** Environment variables for deploy-time settings (endpoint, sampling, propagators); programmatic config for pipeline components (processors, exporters). Use env vars for flexibility.
