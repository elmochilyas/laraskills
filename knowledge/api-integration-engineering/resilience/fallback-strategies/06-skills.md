# Skill: Implement Fallback Strategies for Failed API Calls

## Purpose
Define and implement fallback strategies when primary API calls fail: cached responses, alternative providers, default values, or graceful degradation.

## When To Use
- API calls where failure is expected and acceptable fallback exists
- Read-only/non-critical API calls
- Features where stale data is better than no data
- Multi-vendor integrations where alternative providers exist

## When NOT To Use
- Mutating API calls (no safe fallback for writes)
- Critical transactions where fallback could mask real problems

## Prerequisites
- Fallback data source (cache, alternative API, local DB)
- Failure detection mechanism

## Workflow
1. Classify API calls: critical vs non-critical, reads vs writes
2. Choose fallback strategy per call:
   - Cache fallback: serve stale cached data
   - Alternative provider: switch to backup service
   - Default value: return sensible defaults
   - Graceful empty: return empty result set
3. Implement try-primary-then-fallback pattern in service layer
4. Log each fallback activation for monitoring
5. Test fallback behavior with simulated primary failures
6. Set fallback TTL for cache-based fallbacks
7. Alert on frequent fallback activation

## Validation Checklist
- [ ] Fallback strategy chosen per API call type
- [ ] Cache fallback: stale data served with indicator headers
- [ ] Alternative provider switchover implemented
- [ ] Default values returned for non-critical calls
- [ ] Fallback activation logged
- [ ] Fallback behavior tested with simulated failures
- [ ] Alerts configured for frequent fallback use
