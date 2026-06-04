# Decision Trees: W3C Trace Context Propagation

**D-01: Propagation format selection:** W3C TraceContext is the universal standard. Only use legacy formats (B3, Jaeger, Datadog) when integrating with services that do not support W3C.

**D-02: Trace context in queues:** Serialize traceparent into job payload as JSON. On execution, set as context before creating spans. Use queue-specific middleware for automatic propagation.

**D-03: Baggage vs dedicated headers:** Use baggage for lightweight cross-service metadata (< 1KB, < 10 entries). Use dedicated HTTP headers for larger or structured data.
