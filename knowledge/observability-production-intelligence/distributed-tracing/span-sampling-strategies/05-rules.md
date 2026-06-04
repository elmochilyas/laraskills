# Rules: Span Sampling Strategies

## Rule SSS-01: Always sample error traces at 100%
**Condition:** In any sampling configuration.
**Action:** Ensure traces containing error spans are always sampled. In head sampling, use sampler callback to check span status. In tail sampling, configure policy to keep error traces.
**Consequence:** No error traces are lost to sampling. Debugging is always possible for error conditions.

## Rule SSS-02: Use ParentBasedSampler in multi-service architectures
**Condition:** When multiple services participate in distributed traces.
**Action:** Configure `ParentBasedSampler` wrapping the base rate sampler. This preserves the parent service's sampling decision.
**Consequence:** Trace continuity across service boundaries. Downstream services do not independently drop traces.
**Violation:** Each service independently samples, reducing effective trace completion rate to product of individual rates.

## Rule SSS-03: Always exclude health check endpoints from sampling
**Condition:** When configuring sampling policies.
**Action:** Return 0.0 sampling rate for health check, readiness, and liveness probe requests in the sampler callback.
**Consequence:** 10-30% of span budget is reclaimed. Sampling budget spent on meaningful traffic.

## Rule SSS-04: Configure sampling rate via environment variable
**Condition:** When setting the base sampling rate.
**Action:** Use `OTEL_TRACES_SAMPLER_ARG` to set rate. Reference in sampler callback if dynamic logic is needed.
**Consequence:** Rate changes are deploy-time configuration, not code changes.

## Rule SSS-05: Tail-based sampling requires documented memory budget
**Condition:** When implementing tail-based sampling in Collector.
**Action:** Calculate buffer memory: concurrent traces × average trace duration × average trace size. Budget accordingly. Set `memory_limiter` to protect Collector.
**Consequence:** Predictable memory usage. No OOM from unbounded buffering.

## Rule SSS-06: Maintain consistent sampling ratio across all services
**Condition:** In multi-service architectures using independent sampling decisions.
**Action:** Use the same `TraceIdRatioSampler` rate across all services. This ensures traces are consistently sampled or dropped.
**Consequence:** Cross-service trace integrity is maintained without coordination.

## Rule SSS-07: Never set sampling to 100% in production without budget approval
**Condition:** When configuring production sampling rate.
**Action:** Default to 10-50% for moderate traffic, 1-10% for high traffic. 100% sampling requires documented budget approval and cost projection.
**Consequence:** No surprise cost overruns from ingestion volume.
