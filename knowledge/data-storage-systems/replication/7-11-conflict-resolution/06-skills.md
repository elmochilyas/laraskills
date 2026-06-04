# Skill: Implement Conflict Resolution for Multi-Master

## Purpose

Detect and resolve write conflicts in multi-master replication scenarios to maintain data consistency across nodes.

## When To Use

- Multi-master replication deployed (Galera, Group Replication, BDR)
- Concurrent writes to the same data on different nodes possible
- Application needs deterministic conflict resolution

## When NOT To Use

- Single-master topology (no conflicts possible)
- Application partitions data so each node writes different data
- Conflicts are acceptable to persist and reconcile asynchronously

## Prerequisites

- Multi-master replication configured
- Understanding of conflict types (update-update, insert-insert, delete-update)
- Conflict resolution strategy defined

## Inputs

- Replication configuration
- Conflict resolution rules
- Application write patterns

## Workflow (numbered steps)

1. Identify conflict types in your application:
   - Update-update: two nodes update the same row simultaneously
   - Insert-insert: concurrent INSERT with same primary key or unique constraint
   - Delete-update: one node deletes while another updates the same row
2. Choose conflict resolution strategy:
   - First-Writer-Wins / Last-Writer-Wins (based on timestamp or GTID order)
   - First-Committer-Wins (Galera): first node to certify wins, others roll back
   - CRDT (Conflict-free Replicated Data Types): merges without conflicts (counters, sets)
   - Application-level: store both versions, application resolves later
3. Configure database-level conflict resolution:
   - Galera: automatic (FCC), no configuration needed
   - MySQL Group Replication: automatic certification, last-write-wins
   - PostgreSQL BDR: last-write-wins or custom handler
4. For application-level resolution:
   - Detect conflicts: version vectors, compare-and-swap
   - Store conflicting versions in a conflict log table
   - Implement resolution workflow (manual or automated merge)
   - Apply resolved version to database
5. Test conflicts: write same row from two nodes simultaneously, verify outcome

## Validation Checklist

- [ ] Conflict resolution is deterministic and well-understood
- [ ] Insert-insert conflicts handled (unique key conflicts)
- [ ] Update-update conflicts resolved without data loss
- [ ] Application handles rollback on conflict (Galera: deadlock error)
- [ ] No silent data corruption from unresolved conflicts
- [ ] Conflict log captures resolution history

## Common Failures

- Assuming last-write-wins is safe (may lose important updates)
- Auto-increment conflicts (configure step/increment per node)
- Galera certification failures cause unnecessary transaction rollbacks
- Application doesn't retry after conflict rollback

## Decision Points

- Database-level vs application-level conflict resolution
- Automatic (FCC, LWW) vs manual (store all versions)
- Pessimistic (lock to prevent conflicts) vs optimistic (resolve after conflict)

## Performance Considerations

- Galera FCC: conflicts cause transaction rollback and retry (application must retry)
- LWW: no rollback but may lose data
- Application-level: additional write overhead (version vectors)

## Security Considerations

- Conflict resolution must not bypass access controls
- Conflicts should be logged for audit

## Related Rules

- 7-11-1: Always Handle Conflict Rollback in Application
- 7-11-2: Never Assume Conflicts Don't Happen

## Related Skills

- Implement Multi-Master Replication
- Implement CRDT-Based Conflict Resolution
- Implement Retry Logic for Transaction Conflicts

## Success Criteria

- Conflicts detected and resolved without data corruption
- Application handles conflict rollbacks gracefully (retry)
- Deterministic resolution: same conflict always resolves same way
- Conflict log captures all resolution events
