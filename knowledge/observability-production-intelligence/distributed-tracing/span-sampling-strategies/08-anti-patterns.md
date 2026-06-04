# Anti-Patterns: Span Sampling Strategies

## AP-SSS-01: 100% Sampling in Production
On any application with >100 req/s, 100% sampling generates millions of spans daily. Costs are proportional to volume. Always configure sampling.

## AP-SSS-02: Errors Sampled at Base Rate
If base rate is 10%, only 1 in 10 errors is recorded. Debugging requires the error trace that was dropped. Always sample errors at 100%.

## AP-SSS-03: No Parent Sampling in Multi-Service
Each service independently samples at 10%. Effective trace completion: 10% × 10% = 1%. Three services = 0.1%. Always use ParentBasedSampler.

## AP-SSS-04: Tail Sampling Without Memory Budget
Tail sampling buffers full traces in memory. Without memory limits, Collector OOMs during traffic spikes. Always budget and limit tail sampling buffer.
