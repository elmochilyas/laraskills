# Skill: Configure Span Sampling Strategies for Laravel

## Purpose
Configure span sampling strategies for Laravel applications to balance trace completeness with ingestion cost.

## When To Use
- Production applications with >100 req/s
- Multi-service architectures needing trace integrity
- Cost-constrained observability budgets

## Prerequisites
- OpenTelemetry SDK configured
- Collector deployed (for tail sampling)

## Workflow
1. Estimate daily span volume: req/s × avg spans/request × 86400 × sampling rate
2. Choose strategy: head-based for simple cost control; tail-based for intelligent retention
3. Configure SDK sampler: `ParentBasedSampler(TraceIdRatioSampler(rate))`
4. Configure Collector tail sampling: `tail_sampling` processor with policies (errors always kept, latency threshold)
5. Exclude health checks from sampling at SDK level
6. Monitor effective sampling rate and adjust

## Validation Checklist
- [ ] Error traces sampled at 100%
- [ ] Health checks excluded from sampling
- [ ] Parent-based sampler configured in multi-service env
- [ ] Sampling rate environment-configurable
- [ ] Tail sampling buffer memory budgeted
- [ ] Effective rate within 10% of configured rate
