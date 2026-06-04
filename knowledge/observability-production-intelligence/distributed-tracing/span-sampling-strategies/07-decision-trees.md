# Decision Trees: Span Sampling Strategies

**D-01: Head vs Tail vs Combined:** Head-based for simple fixed-rate cost control; tail-based for intelligent retention of interesting traces; combined (head pre-filter + tail retention) for optimal cost/completeness.

**D-02: Sampling rate selection:** < 100 req/s → 100%; 100-1000 req/s → 50%; 1000-10000 req/s → 10%; > 10000 req/s → 1-5%.

**D-03: Parent fallback:** Always use ParentBasedSampler in multi-service environments. Without it, trace completion rate drops to product of individual service rates.
