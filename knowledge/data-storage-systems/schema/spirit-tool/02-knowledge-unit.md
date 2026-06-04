# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.13 Spirit tool (gh-ost successor for MySQL 8.0+)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Spirit is a modern online schema migration tool for MySQL 8.0+, designed as a successor to gh-ost. It uses the same binlog-based, trigger-free approach but is built specifically for MySQL 8.0+ features (better performance schema, improved binlog handling). Developed to address gh-ost's limitations with newer MySQL versions and larger datasets.

---

# Core Concepts

- **MySQL 8.0+ focus**: Built for and tested on MySQL 8.0+ only. Leverages MySQL 8.0's improved performance schema for throttling feedback.
- **Binlog-based, trigger-free**: Same architecture as gh-ost — no triggers, reads binary log for change capture.
- **Improved cut-over**: Faster, more reliable atomic swap than gh-ost in high-concurrency environments.
- **Built-in throttling**: Performance schema-based metrics for more accurate self-regulation.

---

# Mental Models

Spirit is gh-ost v2 for MySQL 8.0+. Same fundamental approach (binlog, ghost table, atomic swap), but improved performance, reliability, and MySQL 8.0+ compatibility.

---

# Internal Mechanics

Same general flow as gh-ost: ghost table creation, chunked row copy, binlog streaming, atomic cut-over. Improvements include: better parallelism during row copy, more efficient binlog position tracking, and performance schema-aware throttling.

---

# Patterns

**Migration from gh-ost**: If already using gh-ost, Spirit is a drop-in replacement for most use cases. The configuration interface is similar.

**Performance schema reliance**: Spirit uses `performance_schema` metrics for throttling decisions. Ensure `performance_schema` is enabled on MySQL 8.0+.

---

# Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| Spirit over gh-ost | MySQL 8.0+ with large tables | < MySQL 8.0 (use gh-ost or pt-osc) |
| Spirit over pt-osc | Trigger-deadlock concerns | FK-heavy schemas needing Percona support |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Faster than gh-ost on MySQL 8.0+ | MySQL 8.0+ only requirement | Cannot use with MySQL 5.7 or MariaDB
Improved cut-over reliability | Less battle-tested than gh-ost | Fewer production deployments
Performance schema integration | Requires enabled performance_schema | Minor overhead (~3-5%)

---

# Performance Considerations

- Up to 2x faster row copy than gh-ost on large tables in benchmarks.
- Reduced binlog storage requirements during migration.
- More accurate throttling via performance_schema reduces workload impact.

---

# Common Mistakes

**Using it on MySQL 5.7**: Not supported. Use gh-ost or pt-osc for 5.7 environments.

**Disabling performance_schema**: Spirit loses its primary throttling data source. Falls back to less accurate metrics.

---

# Related Knowledge Units

1.11 gh-ost tool | 1.12 pt-online-schema-change | 1.10 Zero-downtime migration patterns

---

# Ecosystem Usage

Spirit was developed by Block (formerly Square) for their MySQL 8.0+ production infrastructure and is used in production at scale. The tool is available as a single Go binary and integrates into deployment pipelines via shell commands. The `spirit migrate` subcommand handles online schema changes, `spirit move` handles cross-server table migration, and `spirit diff` enables schema comparison. Laravel teams managing MySQL 8.0+ databases adopt Spirit as a gh-ost replacement for zero-downtime migrations. The tool is designed for environments with binlog-based replication and requires specific MySQL configuration (`log_bin=ON`, `binlog_format=ROW`, `performance_schema=1`).

# Failure Modes

- **MySQL 5.7 incompatibility**: Spirit only supports MySQL 8.0+. Attempting to run it on 5.7 fails with no graceful fallback. Use gh-ost for legacy MySQL versions.
- **Configuration requirement failures**: Spirit requires specific MySQL settings (`binlog_format=ROW`, `innodb_autoinc_lock_mode=2`, `performance_schema=1`). Missing configuration causes runtime failures.
- **Replica lag amplification**: Spirit's multi-threaded row copying can cause significant replica lag (seconds to minutes), especially on systems where replicas serve read traffic.
- **Cut-over failures**: The atomic table swap during cut-over can fail under high write load, leaving both old and new tables in an intermediate state. The old table is preserved, but the migration must be retried.
- **Disk space pressure**: Row copying doubles storage requirements for the target table during migration. Monitor free space closely.
- **Checksum mismatches**: The verification checksum between old and new tables may fail due to data drift, requiring manual investigation and potential rollback.

# Production Considerations

- **Pre-migration validation**: Spirit validates MySQL configuration before starting. Run `spirit migrate --dry-run` to verify compatibility before attempting the actual migration.
- **Throttling configuration**: Set `--max-threads` and `--target-chunk-time` based on available IOPS. Default chunk time is 100ms per chunk. Monitor CPU and IO during migration.
- **Replica lag tolerance**: Spirit supports throttling based on replica lag but only at thresholds of 10s or greater. For environments sensitive to replica lag, use gh-ost instead, which supports sub-second lag thresholds.
- **Checksum verification**: Spirit automatically verifies the migrated table with a full checksum after cut-over. Monitor `spirit migrate --progress` for checksum status.
- **Rollback procedure**: If Spirit fails mid-migration, the original table is preserved intact. Drop the ghost table manually and retry after resolving the issue.

---

# Research Notes

Spirit adoption is growing as teams migrate from MySQL 5.7 to 8.0+. It represents the next generation of binlog-based migration tools. For new MySQL 8.0+ deployments, Spirit is the recommended default over gh-ost.
