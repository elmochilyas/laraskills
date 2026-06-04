# 7-16 Multi-Source Replication

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-16 |
| Knowledge Unit Title | Multi-Source Replication |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 7.14 GTID-based replication | 7.1 Master-replica topology |
| Last Updated | 2026-06-04 |

## Overview

Multi-source replication configures a single replica to receive data from multiple primary sources. Each source is a separate replication channel with independent lag, credentials, and filtering. Used for consolidating shards, merging application databases, or building unified analytics replicas.

---

## Core Concepts

- **Replication channel**: Each source-to-replica connection is an independent channel with its own relay log and status.
- **Channel isolation**: Channels operate independently — one can fail without affecting others.
- **Table name conflicts**: The most common multi-source failure — data from different sources overwrites each other.
- **replicate_rewrite_db**: Maps source database names to distinct target database names on the replica.
- **Per-channel monitoring**: Each channel must be monitored independently for lag and errors.

## When To Use

- Consolidating multiple sharded databases into a single reporting replica
- Merging data from multiple applications into an analytics database
- Need unified read-only view across multiple primaries

## When NOT To Use

- Single primary (use standard master-replica)
- Replica must accept writes

## Best Practices

- Design schemas so table names are unique per source
- Use separate databases per source on the replica
- Monitor each channel independently

## Architecture Guidelines

| Approach | Data Isolation | Complexity | Supported |
|----------|---------------|------------|-----------|
| Separate databases per source | Strong | Medium | MariaDB 10+, MySQL 8.0.23+ |
| Table prefix per source | Moderate | Medium | Via application naming |
| Replication filters | Weak | Low | Both vendors |

## Performance Considerations

- Replica load = sum of write load from all sources
- Channels run in parallel (MariaDB) or sequentially (MySQL < 8.0.23)
- Each channel has its own apply thread

## Security Considerations

- Each channel has its own replication user credentials
- Consolidated data may have different access requirements

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Table name collisions | Same table names across sources | Data overwrite | Use separate databases per source |
| 2 | No per-channel monitoring | Using global status | Missed channel failures | Monitor each channel separately |
| 3 | GTID conflicts between sources | Duplicate server IDs | Replication failure | Ensure unique server_id/domain_id |

## Anti-Patterns

- Mixing sources without unique table/database names
- No per-channel lag monitoring
- Applying DDL from one source that conflicts with another

## Verification

- [ ] Each replication channel running and up to date
- [ ] Data from each source correctly routed
- [ ] No data conflicts or overwrites
- [ ] Per-channel monitoring operational
- [ ] DDL changes from each source compatible
