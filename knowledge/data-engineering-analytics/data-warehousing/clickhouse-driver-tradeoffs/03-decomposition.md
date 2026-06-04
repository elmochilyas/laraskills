# Decomposition: HTTP-Based vs FFI-Based ClickHouse Driver Trade-offs

## Topic Overview
ClickHouse access from PHP/Laravel is primarily via HTTP-based drivers (using Guzzle/Curl to ClickHouse's HTTP interface), but alternative approaches exist: TCP native protocol drivers and FFI (Foreign Function Interface) drivers that bridge directly to the ClickHouse C++ client library. The choice between HTTP and non-HTTP drivers involves tradeoffs in latency, throughput, connection management, feature support, and deployment complexity. For Laravel applications, the HTTP driver (laravel-clickhouse/laravel-clickhouse) is the production standard, but understanding the alternatives reveals scenarios where non-HTTP approaches yield material benefits.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k032-clickhouse-driver-tradeoffs/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### HTTP-Based vs FFI-Based ClickHouse Driver Trade-offs
- **Purpose:** ClickHouse access from PHP/Laravel is primarily via HTTP-based drivers (using Guzzle/Curl to ClickHouse's HTTP interface), but alternative approaches exist: TCP native protocol drivers and FFI (Foreign Function Interface) drivers that bridge directly to the ClickHouse C++ client library.
- **Difficulty:** Intermediate
- **Dependencies:** K012 (ClickHouse MergeTree): ClickHouse table design (same regardless of driver), K035 (ClickHouse Codecs): Compression codec selection (driver-independent)

## Dependency Graph
**Depends on:**
- K012 (ClickHouse MergeTree): ClickHouse table design (same regardless of driver)
- K035 (ClickHouse Codecs): Compression codec selection (driver-independent)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- HTTP driver:
- TCP native protocol driver:
- FFI driver:
- Connection pooling:
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K012 (ClickHouse MergeTree): ClickHouse table design (same regardless of driver), K035 (ClickHouse Codecs): Compression codec selection (driver-independent)

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