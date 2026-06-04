# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Audit Logging |
| Knowledge Unit | Immutable Audit Hash Chains (SHA-256) |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Emerging |

---

## Overview

Immutable audit hash chains (implemented by `graymattertechnology/laravel-audit-chain`) create a cryptographically verifiable chain of log entries where each entry's hash includes the previous entry's hash. Any modification to any entry in the chain (tampering, deletion, insertion) changes all subsequent hashes, making tampering detectable. This is the blockchain concept applied to audit logs — without the distributed consensus. Verification is performed by re-computing the chain and comparing hashes. The primary use case is regulatory compliance (GDPR, NIS2, SOX) requiring tamper-proof audit trails.

---

## Core Concepts

- **Hash Chain**: Entry 1: `hash_1 = SHA256(data_1 || previous_hash_0 (genesis))`. Entry 2: `hash_2 = SHA256(data_2 || hash_1)`. Each hash includes the previous, forming a chain.
- **Genesis Entry**: The first entry in the chain with a defined initial hash (typically zero or a known constant).
- **Verification**: Re-compute all hashes sequentially. If any computed hash differs from the stored hash, the chain is broken — tampering detected.
- **Trapdoor Entry**: Optional periodic checkpoint entries whose hashes are published externally (DNS TXT record, blockchain). Provides external verification that the log existed at a point in time.

---

## When To Use

- Regulatory compliance (GDPR, NIS2, SOX) requiring tamper-proof audit trails
- Any audit trail where tampering must be detectable
- Multi-party audit scenarios where trust in the log is distributed

## When NOT To Use

- Simple activity feeds — use Spatie Activitylog
- When append-only database enforcement is sufficient and cryptographic overhead is not justified
- Systems without the ability to serialize concurrent inserts (hash chain requires linear sequencing)

---

## Best Practices

- **Serialize Inserts**: Use database transaction + `SELECT ... FOR UPDATE` on the last entry to prevent hash chain forks from concurrent inserts.
- **Use Binary Hash Storage**: `BINARY(32)` instead of `CHAR(64)` for storage efficiency.
- **External Checkpoints**: Publish chain state periodically (weekly) to an external, immutable store (DNS TXT record, blockchain). Provides trust outside the application database.
- **Append-Only Database Enforcement**: Database triggers prevent `DELETE` and `UPDATE`. Application DB user has `INSERT` only.

---

## Architecture Guidelines

- Hash chain in DB with periodic checkpoints to external store (best of both worlds)
- Hourly verification for active investigations; daily for routine compliance
- Use SHA256 of application name + version as genesis hash for application-specific chain root
- Partition verification by date range — verify recent entries frequently, older entries less often
- Separate `appendonly` database user from `readwrite` user

---

## Performance Considerations

- Hash computation per insert: SHA-256 of data + previous hash — ~0.01ms
- Verification time: O(n). 1M entries at 0.01ms per hash = 10 seconds. Parallel partition verification for larger tables.
- Storage overhead: 32 bytes per entry (BINARY(32)). Negligible.
- Index on `id` (or sequence) for sequential iteration.

---

## Security Considerations

- **Tamper-Evident, Not Tamper-Proof**: An attacker with DB write access can re-compute all hashes after modification. External checkpoints provide actual proof.
- **Chain Break Detection**: Any modification to any entry breaks the chain. Scheduled verification detects breaks.
- **Concurrent Insert Forking**: Without serialization, two simultaneous inserts produce a tree, not a chain — verification fails.
- **Database Permissions**: Application DB user should not have UPDATE/DELETE on the log table.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Hash collision on concurrent inserts | No serialization | Chain forks — verification fails | Use `SELECT ... FOR UPDATE` |
| Using CHAR(64) for hash storage | Default hex representation | 2x storage cost | Use BINARY(32) instead |
| Allowing updates to log entries | Fixing typos in log entries | Breaks the hash chain | Create corrective entries instead |
| Assuming chain = tamper-proof | Overestimating security model | False sense of security | Understand tamper-evident vs tamper-proof |

---

## Anti-Patterns

- **Only one database user for the logging connection**: Application should not have UPDATE/DELETE permission
- **No external checkpoints**: Without external verification, the entire chain is modifiable by anyone with DB access
- **Ignoring concurrent insert risks**: Production scale requires serialization — don't skip it
- **Recomputing hashes for modified entries**: If you can re-compute, the chain provides no protection

---

## Examples

**Hash chain insert:**
```php
// Pseudo-code for hash chaining
$previousEntry = ActivityLog::orderBy('id', 'desc')
    ->lockForUpdate()
    ->first();

$hash = hash('sha256', json_encode($data) . '|' . $previousEntry->hash);

ActivityLog::create([
    'data' => $data,
    'previous_hash' => $previousEntry->hash,
    'hash' => $hash,
]);
```

**Chain verification:**
```php
// Verify hash chain from start to end
$entries = ActivityLog::orderBy('id')->cursor();
$expectedHash = 'genesis_hash_value';

foreach ($entries as $entry) {
    $computedHash = hash('sha256', json_encode($entry->data) . '|' . $expectedHash);
    if ($computedHash !== $entry->hash) {
        throw new \Exception("Chain broken at entry {$entry->id}");
    }
    $expectedHash = $entry->hash;
}
```

---

## Related Topics

- Spatie laravel-activitylog
- Comprehensive audit logging (HMAC, diffs, alerts)
- Multi-tenant audit logging
- HMAC/SHA-256 fundamentals

---

## AI Agent Notes

- Immutable audit chains are the most advanced audit integrity mechanism in the Laravel ecosystem. Only recommend for compliance-grade requirements.
- The concurrent insert race condition is the most common production issue — always recommend serialization.
- External checkpoints transform tamper-evident into practical tamper-proof. Recommend weekly publishing to a public blockchain or DNS.
- Package maturity: `audit-chain` has limited adoption. For critical compliance, evaluate maturity before implementation.

---

## Verification

- [ ] Hash chain implemented with SHA-256
- [ ] Concurrent insert serialization via `SELECT ... FOR UPDATE`
- [ ] Binary hash storage (BINARY(32))
- [ ] Application DB user has INSERT-only (no UPDATE/DELETE)
- [ ] Scheduled chain verification configured (hourly/daily)
- [ ] External checkpoints published (weekly)
- [ ] Chain recovery procedure documented
- [ ] DB triggers prevent DELETE/UPDATE on log table (if feasible)
