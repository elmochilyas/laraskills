# Decomposition: Horizontal Reverb Scaling with Redis Pub/Sub Backbone

## Topic Overview
Horizontal scaling of Laravel Reverb uses a shared Redis pub/sub backbone to distribute WebSocket connections across multiple Reverb server instances. Each Reverb instance handles a subset of connected clients, but all instances share the same Redis pub/sub channels for publishing and receiving broadcasts. This enables linear connection scaling beyond a single server's limits (10,000-100,000+ concurrent connections) while maintaining sub-second broadcast latency.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k027-reverb-scaling/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Horizontal Reverb Scaling with Redis Pub/Sub Backbone
- **Purpose:** Horizontal scaling of Laravel Reverb uses a shared Redis pub/sub backbone to distribute WebSocket connections across multiple Reverb server instances.
- **Difficulty:** Advanced
- **Dependencies:** K010 (Reverb WebSocket): Base Reverb knowledge required before scaling, K041 (Custom Reverb Driver): Extending Reverb beyond the built-in scaling model, K021 (OHLCV Candle Upsert): Example of data broadcast through scaled Reverb, K016 (ClickHouse Materialized Views): Backend data pipeline feeding broadcasts

## Dependency Graph
**Depends on:**
- K010 (Reverb WebSocket): Base Reverb knowledge required before scaling
- K041 (Custom Reverb Driver): Extending Reverb beyond the built-in scaling model
- K021 (OHLCV Candle Upsert): Example of data broadcast through scaled Reverb
- K016 (ClickHouse Materialized Views): Backend data pipeline feeding broadcasts

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Reverb instance:
- Redis pub/sub backbone:
- Sticky sessions:
- Client connection registry:
- Scaling boundary:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K010 (Reverb WebSocket): Base Reverb knowledge required before scaling, K041 (Custom Reverb Driver): Extending Reverb beyond the built-in scaling model, K021 (OHLCV Candle Upsert): Example of data broadcast through scaled Reverb, K016 (ClickHouse Materialized Views): Backend data pipeline feeding broadcasts

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