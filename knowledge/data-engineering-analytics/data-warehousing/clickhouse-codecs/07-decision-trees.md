# Decision Trees: Custom ClickHouse Codec Selection

## Decision: Codec Selection by Column Type

**Q: What is the column data type?**
- DateTime / Date → DoubleDelta + LZ4
- Integer (monotonically increasing) → Delta + LZ4
- Integer (arbitrary) → LZ4
- Float / Decimal → Gorilla + LZ4
- Short string (< 50 chars) → LZ4
- Long string (50+ chars) → ZSTD 1-3
- Enum / LowCardinality → LZ4

## Decision: Compression Level

**Q: How often is the column queried?**
- Every query → LZ4 (fastest decompression)
- Frequently → LZ4
- Occasionally → ZSTD 1-3
- Rarely / Archival → ZSTD 3-6

**Q: Is this a primary key column?**
- Yes → LZ4 only (no heavy codec)
- No → Any appropriate codec
