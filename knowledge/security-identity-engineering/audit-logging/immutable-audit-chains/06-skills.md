# Skill: Build Immutable Audit Hash Chains for Tamper-Proof Logs

## Purpose
Create an immutable audit trail using SHA-256 hash chaining where each log entry includes the hash of the previous entry, making any retroactive modification detectable across the entire chain.

## When To Use
- Forensics-grade audit trails requiring absolute tamper evidence
- Compliance with regulations requiring immutable audit logs
- Security incident investigation where log integrity is critical
- Multi-service audit trails where centralized log storage is untrusted

## When NOT To Use
- Simple activity feeds or UI activity streams (use Spatie Activitylog)
- Short-lived logs that are purged frequently (hash chain loses integrity on purge)
- When append-only database guarantees are sufficient

## Prerequisites
- Audit logging mechanism (custom or Spatie-based)
- Storage for hash chain state (current tail hash)
- SHA-256 hashing capability (built into PHP)

## Workflow
1. Define audit log entry structure: timestamp, action, user, subject, previous_hash
2. Compute entry hash: `hash('sha256', json_encode($entryData) . $previousHash)`
3. Store entry with its computed hash and the hash of the previous entry
4. Retrieve and validate chain on read: recompute each entry's hash and verify chain continuity
5. For multi-service: use a central hash chain registry or distributed ledger
6. Periodically publish the latest chain hash to an external anchor (newspaper, blockchain, public log)
7. Implement chain repair process for legitimate data pruning (re-chain remaining entries)
8. Alert on chain break (hash mismatch = tampering detected)

## Validation Checklist
- [ ] Each entry stores hash of previous entry (chain continuity)
- [ ] Entry hash computed from content + previous hash
- [ ] Chain validation on read verifies every entry integrity
- [ ] External anchor published periodically (chain head hash)
- [ ] Chain break generates immediate alert
- [ ] Pruning procedure re-chains remaining entries correctly
