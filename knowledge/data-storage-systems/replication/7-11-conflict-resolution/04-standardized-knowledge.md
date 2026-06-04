# 7-11 Conflict Resolution

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Replication |
| Knowledge Unit ID | 7-11 |
| Knowledge Unit Title | Conflict Resolution |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 7.10 Multi-master replication | 7.20 Peer-to-peer replication |
| Last Updated | 2026-06-04 |

## Overview

Conflict resolution detects and resolves write conflicts in multi-master replication. Conflicts arise when two or more nodes concurrently modify the same data. Resolution strategies range from automatic database-level (Last-Write-Wins, First-Committer-Wins) to application-level (version vectors, CRDTs, manual merge).

---

## Core Concepts

- **Update-update conflict**: Two nodes update the same row simultaneously. Most common type.
- **Insert-insert conflict**: Two nodes insert with same primary key or unique constraint.
- **Delete-update conflict**: One node deletes while another updates the same row.
- **First-Committer-Wins (FCC)**: Galera default — first node to certify wins, others roll back.
- **Last-Write-Wins (LWW)**: Latest timestamp overwrites earlier writes. Simple but may lose data.
- **CRDT**: Conflict-free Replicated Data Types that merge without conflicts (counters, sets).

## When To Use

- Multi-master replication deployed
- Concurrent writes to same data on different nodes possible
- Application needs deterministic conflict resolution

## When NOT To Use

- Single-master topology (no conflicts)
- Application partitions data per node (no overlapping writes)

## Best Practices

- Test conflict resolution with concurrent writes before production
- Design schemas to minimize conflict probability (partition data by node)
- Log all conflict resolution events for auditing

## Architecture Guidelines

| Strategy | Type | Data Loss Risk | Complexity |
|----------|------|---------------|------------|
| First-Committer-Wins | Automatic | Low (loser retries) | Low |
| Last-Write-Wins | Automatic | High (overwrites) | None |
| CRDT | Automatic | None | High |
| Application-level | Manual | None | Highest |

## Performance Considerations

- FCC causes transaction rollbacks — application must retry
- LWW has zero overhead but may silently lose data
- Application-level resolution adds write latency for version vector management

## Security Considerations

- Conflict resolution must not bypass access controls
- Conflicts should be logged for audit trail

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Assuming LWW is safe | Simplicity | Important updates overwritten | Use FCC or application-level for critical data |
| 2 | No retry logic for FCC | Missing error handling | Writes fail silently | Implement retry with exponential backoff |
| 3 | Auto-increment collisions | No per-node config | Duplicate key errors | Set auto_increment_increment + offset |

## Anti-Patterns

- Using LWW for financial or audit-critical data
- Ignoring conflict rollback exceptions in application code
- Assuming conflicts will never happen

## Verification

- [ ] Conflict resolution is deterministic
- [ ] Insert-insert conflicts handled
- [ ] Application handles rollback on conflict
- [ ] No silent data corruption from unresolved conflicts
