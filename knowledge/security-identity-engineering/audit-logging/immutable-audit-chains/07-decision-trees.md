# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Audit Logging
**Knowledge Unit:** Immutable Audit Hash Chains (SHA-256)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Hash Chain vs HMAC Signing | Audit integrity mechanism | security, complexity |
| 2 | External Checkpoint Strategy | Publishing chain state for external verification | compliance, trust |
| 3 | Chain Verification Frequency | How often to verify the hash chain | operational |

---

# Architecture-Level Decision Trees

---

## Hash Chain vs HMAC Signing

---

## Decision Context

Choosing between hash chaining (blockchain-style) and HMAC signing for audit log tamper detection.

---

## Decision Criteria

* security
* complexity

---

## Decision Tree

Is continuous tamper detection required (any modification to any entry detected)?
↓
YES → Hash chain (modification to any entry breaks all subsequent hashes)
NO → HMAC signing (detects tampering per-entry, but attacker with DB access can replace signature)

Can the application enforce append-only write patterns?
↓
YES → Hash chain feasible (sequential inserts required)
NO → HMAC signing easier (no ordering requirement)

What is the threat model?
↓
DB admin or application-level attacker with DB write access → Hash chain + external checkpoints (cannot recalculate hashes without detection)
Application-level attacker without DB write access → HMAC signing sufficient

Is the audit log append-only (no legitimate deletions)?
↓
YES → Hash chain (deletion breaks the chain — immediately detectable)
NO → HMAC signing (allows legitimate pruning without breaking integrity)

What is the implementation complexity tolerance?
↓
Low → HMAC signing (simpler: hash + compare)
High → Hash chain (requires serialization, genesis entry, verification routines)

---

## Rationale

Hash chains provide stronger integrity guarantees — any modification to any entry breaks all subsequent hashes, making tampering broadly detectable. HMAC signing per-entry is simpler but allows an attacker with DB access to replace the HMAC signature after modification. Hash chains should be used for compliance-grade audit trails. HMAC signing is sufficient for less critical audit logs.

---

## Recommended Default

**Default:** Hash chain for compliance-grade audit trails (tampering breaks the entire chain); HMAC signing for operational audit logs (simpler, per-entry verification)
**Reason:** Hash chains provide the strongest tamper detection — modifying any entry cascades through all subsequent entries. However, they require serialized inserts and cannot support legitimate deletions. HMAC signing is practical for logs that need pruning or where concurrent insert patterns make chain ordering difficult.

---

## Risks Of Wrong Choice

- Hash chain without serialization: concurrent inserts fork the chain, verification fails
- HMAC key in database: DB compromise allows signature forgery
- Hash chain with legitimate deletions: deletion breaks the chain permanently
- No integrity mechanism at all: tampering undetected

---

## Related Rules

- Append Audit Entries, Never Update or Delete (05-rules.md)
- Include a SHA-256 Hash of the Previous Entry (Blockchain-Style Chain) (05-rules.md)
- Use Signed Audit Entries (HMAC) for Additional Integrity (05-rules.md)

---

## Related Skills

- Build Immutable Audit Hash Chains for Tamper-Proof Logs (06-skills.md)

---

## External Checkpoint Strategy

---

## Decision Context

How to publish hash chain state externally for independent verification.

---

## Decision Criteria

* compliance
* trust

---

## Decision Tree

Is the audit trail used for regulatory compliance (GDPR, SOX, NIS2)?
↓
YES → External checkpoints required (regulators need independent verification)
NO → Internal hash chain verification is sufficient

What is the trust model?
↓
Zero trust (organization cannot trust itself) → Blockchain or public DNS (immutable, external)
Moderate trust → Internal WORM storage (S3 Object Lock, Azure immutable blob)
Full trust → No external checkpoints needed

What is the acceptable cost for checkpoints?
↓
Low → DNS TXT records (free, publicly verifiable)
Medium → Public blockchain (per-transaction cost, extremely immutable)
High → Newspaper publication (physical proof, rarely needed)

How frequently should checkpoints be published?
↓
Real-time → Not possible with most external stores (blockchain has latency)
Hourly → DNS TXT record updates (TTL-dependent propagation)
Daily → Blockchain transaction (reasonable cadence for most compliance)
Weekly → Newspaper publication (archival, not operational)

---

## Rationale

External checkpoints transform tamper-evident (attacker can modify DB + recalculate hashes) into tamper-proof (attacker cannot modify external store). The checkpoint is the hash of the latest chain entry, published to an immutable external store. If the chain is later tampered with, the external checkpoint proves the chain state at a point in time. DNS TXT records and blockchain transactions are the most practical external stores.

---

## Recommended Default

**Default:** Daily external checkpoint to DNS TXT record (cheap, publicly verifiable, immutable); blockchain only for highest compliance requirements
**Reason:** DNS TXT records provide a free, publicly verifiable external store with reasonable immutability guarantees (DNS history is not easily rewritten). Blockchain provides stronger immutability at a per-transaction cost. Daily checkpoints balance security with operational overhead.

---

## Risks Of Wrong Choice

- No external checkpoints: attacker with DB access can modify chain and recalculate hashes
- Checkpoint in same database: attacker modifies both together (no independent verification)
- Checkpoint too infrequent: tampering between checkpoints undetected until next checkpoint
- Checkpoint not published: verification has no external reference

---

## Related Rules

- Back Up Audit Logs to Write-Once Storage (05-rules.md)
- Monitor Hash Chain Integrity Periodically (05-rules.md)

---

## Related Skills

- Build Immutable Audit Hash Chains for Tamper-Proof Logs (06-skills.md)

---

## Chain Verification Frequency

---

## Decision Context

How often to verify the hash chain integrity — hourly, daily, or on-demand.

---

## Decision Criteria

* operational

---

## Decision Tree

What is the regulatory requirement?
↓
Continuous verification → Hourly or real-time verification
Periodic verification → Daily or weekly

What is the audit log write volume?
↓
High (millions of entries/day) → Verify in partitions (verify recent entries hourly, full chain daily)
Low (thousands of entries/day) → Full chain verification daily

What is the acceptable detection latency for tampering?
↓
Low (minutes) → Hourly verification
Medium (hours) → Daily verification
High (days) → Weekly verification

Are there active compliance audits?
↓
YES → Hourly verification (minimum)
NO → Daily verification (standard)

What is the verification cost?
↓
O(n) chain verification: 1M entries ~10 seconds. Partition for large tables.
Low volume → Full verification daily
High volume → Verify most recent partition + periodic full verification

---

## Rationale

Hash chain verification is O(n) — every entry's hash must be recomputed and compared. For large tables, full verification can take seconds to minutes. Partitioned verification (recent entries frequently, full chain less often) balances detection latency with verification cost. Daily full verification is the standard for most compliance requirements.

---

## Recommended Default

**Default:** Daily full chain verification; hourly verification on the most recent partition (last 24 hours) for early tampering detection
**Reason:** Daily full verification catches any tampering within 24 hours. Hourly verification of the most recent entries provides faster detection of recent tampering. Partitioned verification keeps the cost manageable — recent entries are few, so hourly verification is fast; full daily verification adds < 30 seconds of overhead.

---

## Risks Of Wrong Choice

- Verification too infrequent: tampering goes undetected for extended periods
- Full verification on high-volume table: minutes to hours of processing
- No verification at all: hash chain provides no value (tampering never detected)
- Verification that blocks writes: chain verification should not hold locks on the log table

---

## Related Rules

- Back Up Audit Logs to Write-Once Storage (05-rules.md)
- Use a Separate Database User for Audit Log Writes (05-rules.md)

---

## Related Skills

- Build Immutable Audit Hash Chains for Tamper-Proof Logs (06-skills.md)
