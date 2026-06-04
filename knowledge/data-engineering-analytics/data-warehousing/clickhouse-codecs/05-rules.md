# Rules: Custom ClickHouse Codec Selection

## Rule CC-01: Per-Column Codec Selection
Every column in a MergeTree table MUST have a codec selected based on its data type and access pattern. Defaulting to the table codec leaves optimization on the table.

## Rule CC-02: Test Before Production
Codec combinations MUST be tested on representative data samples before deploying to production. Compare compressed size, insert speed, and query speed.

## Rule CC-03: LZ4 for Hot Data, ZSTD for Cold
Frequently queried columns MUST use LZ4 codec. Infrequently queried archival columns MAY use ZSTD (level 1-6) for better compression.

## Rule CC-04: DoubleDelta for Timestamps
DateTime and Date columns SHOULD use DoubleDelta codec combined with LZ4. This reduces timestamp storage by 40-60% with minimal performance impact.

## Rule CC-05: Gorilla for Floats Only
Gorilla codec MUST only be applied to Float/Float64 columns. It is not optimal for integers or strings.

## Rule CC-06: Light Codec on Primary Key
ORDER BY key columns MUST use LZ4 (or no codec). Heavy compression on primary key columns slows index analysis on every query.

## Rule CC-07: No ZSTD Level Above 6 for Inserts
Online insert pipelines MUST NOT use ZSTD levels above 6. Higher levels sacrifice insert throughput for marginal compression gains.

## Rule CC-08: Codec at Table Creation
Codecs SHOULD be defined at table creation time. Modifying codecs on existing tables requires a column rewrite.

## Rule CC-09: Tiered Codec Strategy
Tables with long retention SHOULD implement tiered codec transitions via TTL: LZ4 for recent partitions, ZSTD for older partitions.

## Rule CC-10: Compression Is Not Encryption
Codec compression MUST NOT be relied upon for data security. Use ClickHouse encryption or disk-level encryption for sensitive data.
