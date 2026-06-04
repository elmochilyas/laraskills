# Decomposition: Sampling Strategies

## Topic Overview
Sampling reduces observability costs by collecting data from only a subset of requests while maintaining statistical significance. For Laravel applications, the key insight is that 99% of debugging value comes from error and slow requests. Sampling strategies determine which subset of data to retain, balancing cost against observability quality. A well-designed sampling strategy reduces monitoring costs by 90-99% while preserving incident-response capability.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-04-sampling-strategies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Sampling Strategies
- **Purpose:** Sampling reduces observability costs by collecting data from only a subset of requests while maintaining statistical significance. For Laravel applications, the key insight is that 99% of debugging value comes from error and slow requests. Sampling strategies determine which subset of data to retain, balancing cost against observability quality. A well-designed sampling strategy reduces monitoring costs by 90-99% while preserving incident-response capability.
- **Difficulty:** Foundation
- **Dependencies:** - Tracing Cost Optimization (ku-03), - Log Cost Optimization (ku-01), - Metric Cost Optimization (ku-02), - Data Retention Tiering (ku-05)

## Dependency Graph
**Depends on:**
- Tracing Cost Optimization (ku-03)
- Log Cost Optimization (ku-01)
- Metric Cost Optimization (ku-02)
- Data Retention Tiering (ku-05)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Head-based sampling: Low-complexity needs; single-service apps; budget-constrained monitoring
- Tail-based sampling: Multi-service apps; need to capture all errors/slow requests; incident response focus
- Priority sampling: All production apps (always retain errors, sample healthy)
- Dynamic sampling: Apps with 10x+ traffic variation between peak and off-peak
- Log sampling: High-volume endpoints (API logs, health checks, cron outputs)
- Metric sampling: Pre-aggregation for high-cardinality data (per-user metrics)
- Trace sampling: Distributed tracing at scale (>100 req/s)
**Out of scope:**
- No sampling: Low-traffic apps (<10 req/s) don't need sampling; collect everything
- Head-based for error capture: Head-based sampling may miss rare errors; use tail-based if errors are priority
- Tail-based for simple apps: Overkill for single-server Laravel app; head-based is simpler and sufficient
- Sampling for compliance monitoring: If you need 100% audit trail; don't sample
- Random sampling for debugging: If you're actively debugging a specific issue, disable sampling temporarily
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization