# ECC Anti-Patterns — Gateway Request Caching

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Middleware & Gateways |
| **Knowledge Unit** | Gateway Request Caching |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Caching at Gateway — Repeated Identical Requests Hit Provider
2. Caching Dynamic Requests — Stale Answers for Time-Sensitive Queries
3. Cache Key Without Model/Provider — Wrong Cache Hit
4. Long TTL on Cache — Outdated Information Served
5. No Cache Invalidation — Content Change Not Reflected

---

## Repository-Wide Anti-Patterns

- Cache hit rate not monitored
- No cache warming for common queries

---

## Anti-Pattern 1: No Gateway Caching

### Category
Performance

### Description
Identical requests sent to provider repeatedly — cost and latency multiplied.

### Preferred Alternative
Cache LLM responses at gateway. Use normalized query hash as cache key. Include model and temperature.

### Detection Checklist
- [ ] No caching at gateway
- [ ] Identical requests hit provider
- [ ] Higher latency and cost than needed

---

## Anti-Pattern 2: Cache Key Missing Model/Provider

### Category
Reliability

### Description
Cache key includes only query text — same cache entry returned for different models.

### Preferred Alternative
Include model, temperature, max_tokens, and provider in cache key.

### Detection Checklist
- [ ] Model not in cache key
- [ ] Wrong response from cache on model switch
- [ ] Temperature differences ignored
