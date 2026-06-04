# Decomposition: Span Sampling Strategies

## Topic Overview
Span sampling determines which traces are recorded and exported. Without sampling, every request generates spans that consume storage and incur costs. Head-based sampling decides at trace start; tail-based sampling buffers traces and decides after seeing the full trace. The choice between them involves tradeoffs between memory usage, latency, and completeness. Parent-based sampling preserves distributed trace integrity across service boundaries.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
distributed-tracing/span-sampling-strategies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Span Sampling Strategies
- **Purpose:** Span sampling determines which traces are recorded and exported. Without sampling, every request generates spans that consume storage and incur costs. Head-based sampling decides at trace start; tail-based sampling buffers traces and decides after seeing the full trace. The choice between them involves tradeoffs between memory usage, latency, and completeness. Parent-based sampling preserves distributed trace integrity across service boundaries.
- **Difficulty:** Advanced
- **Dependencies:
  - OTLP Exporter & Collector Configuration (tail sampling in Collector)
  - OpenTelemetry PHP SDK (SDK-level samplers)
  - PII Redaction & Log Sampling (related logging sampling strategies)

## Dependency Graph
**Depends on:**
  - OTLP Exporter & Collector Configuration (tail sampling in Collector)
  - OpenTelemetry PHP SDK (SDK-level samplers)
  - PII Redaction & Log Sampling (related logging sampling strategies)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Head-based sampling
  - Tail-based sampling
  - Parent-based sampling
  - TraceIdRatio sampler
  - Consistent sampling
  - Sampling context

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization