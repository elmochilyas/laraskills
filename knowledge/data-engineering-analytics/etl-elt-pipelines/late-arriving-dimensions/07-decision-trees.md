# Decision Trees: Late-Arriving Dimension Handling in Fact Table Loading

## Decision: Strategy Selection

**Q: How often do late-arriving dimensions occur?**
- Frequently (> 5% of facts) → Placeholder row strategy (lowest overhead)
- Occasionally (0.1-5%) → Deferred resolution with natural keys
- Rarely (< 0.1%) → Reprocessing strategy (trigger-based)

**Q: What is the fact throughput?**
- High (> 10K/hour) → Placeholder row (no per-fact lookup overhead)
- Moderate → Deferred resolution acceptable
- Low (< 100/hour) → Any strategy works; choose based on accuracy requirements

**Q: Is SCD Type 2 in use?**
- Yes → Combined strategy: placeholder + SCD merge logic
- No → Simple placeholder or deferred resolution

## Decision: Resolution Timing

**Q: When are dimension updates expected?**
- Within minutes → Real-time resolution (trigger on dimension insert)
- Within hours → Scheduled resolution every hour
- Within days → Daily batch resolution
- Unknown → Scheduled resolution + manual trigger option
