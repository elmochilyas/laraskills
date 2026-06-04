# Decomposition: Laravel Reverb WebSocket Broadcasting

## Topic Overview
Laravel Reverb is a first-party, self-hosted WebSocket server for Laravel broadcasting, built on ReactPHP. It replaces third-party services like Pusher with a native PHP WebSocket server that integrates directly with Laravel's event broadcasting system via `ShouldBroadcast` and Laravel Echo on the client side. Reverb enables real-time features — live dashboards, notifications, presence channels — without external dependencies, scaling from a single server to a horizontally clustered Redis-backed deployment.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k010-reverb-websocket/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Reverb WebSocket Broadcasting
- **Purpose:** Laravel Reverb is a first-party, self-hosted WebSocket server for Laravel broadcasting, built on ReactPHP.
- **Difficulty:** Foundation
- **Dependencies:** K027 (Reverb Scaling): Horizontal Reverb scaling with shared Redis backbone, K041 (Custom Reverb Driver): Extending Reverb with custom broadcasting drivers, K021 (OHLCV Candle Upsert): Real-time financial data broadcasting pattern, K016 (ClickHouse Materialized Views): Backend analytics computation feeding real-time broadcasts

## Dependency Graph
**Depends on:**
- K027 (Reverb Scaling): Horizontal Reverb scaling with shared Redis backbone
- K041 (Custom Reverb Driver): Extending Reverb with custom broadcasting drivers
- K021 (OHLCV Candle Upsert): Real-time financial data broadcasting pattern
- K016 (ClickHouse Materialized Views): Backend analytics computation feeding real-time broadcasts

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Broadcasting system:
- Reverb server:
- Channels:
- Echo:
- Presence channels:
- Database driver:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K027 (Reverb Scaling): Horizontal Reverb scaling with shared Redis backbone, K041 (Custom Reverb Driver): Extending Reverb with custom broadcasting drivers, K021 (OHLCV Candle Upsert): Real-time financial data broadcasting pattern, K016 (ClickHouse Materialized Views): Backend analytics computation feeding real-time broadcasts

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