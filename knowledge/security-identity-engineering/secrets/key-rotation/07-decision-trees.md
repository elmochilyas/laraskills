# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Secrets Management
**Knowledge Unit:** Zero-Downtime API Key Rotation
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Rotation Strategy | Immediate vs grace-period rotation | operational, risk |
| 2 | Rotation Automation | Manual vs scheduled automated rotation | operational, compliance |
| 3 | Key Storage During Rotation | Dual-key vs single-key approach | architectural |

---

# Architecture-Level Decision Trees

---

## Rotation Strategy

---

## Decision Context

Whether to rotate keys immediately (replace old key with new key) or use a grace period where both keys are valid.

---

## Decision Criteria

* operational
* risk

---

## Decision Tree

Is this a scheduled (planned) rotation?
↓
YES → Use grace period (24-72 hours) for zero-downtime migration
NO → Is this an emergency (key compromise)?
    YES → Short grace period (1 hour minimum) — compromise requires fast rotation but avoid total outage
    NO → Grace period with full standard duration

Can all clients update their keys immediately?
↓
YES → Immediate rotation possible (rare — only if all clients are under your control)
NO → Grace period required (external clients, mobile apps, third-party integrations)

What is the impact of service disruption?
↓
Low (internal tool) → Immediate rotation acceptable
High (customer-facing API) → Grace period mandatory

Are there compliance requirements for key rotation?
↓
YES → Document rotation with grace period evidence
NO → Grace period still recommended for safety

---

## Rationale

Grace periods allow clients to migrate from old to new keys without disruption. The old key remains valid during the grace period, giving clients time to update. For emergency rotations (compromise), the grace period should be minimized (1 hour) but not eliminated — a total outage from immediate rotation is worse than a short exposure window. Regular rotations should use 24-72 hour grace periods.

---

## Recommended Default

**Default:** Grace period of 24 hours for regular rotation; 1 hour for emergency compromise; immediate rotation only for fully controlled internal systems
**Reason:** Grace periods prevent service disruption while allowing migration. 24 hours covers most client update patterns (cached keys, delayed processing). Even for compromise, a 1-hour grace period is safer than immediate rotation which could take down critical services.

---

## Risks Of Wrong Choice

- No grace period (immediate): clients with cached keys experience downtime
- Too long grace period (30 days): old key exposed longer, larger attack surface
- Emergency without grace period: total service disruption if new key has issues
- No rollback plan: if new key fails, cannot restore old key

---

## Related Rules

- Implement a Key Rotation Artisan Command (05-rules.md)
- Rotate APP_KEY at Least Once Every 12 Months (05-rules.md)
- Test Key Rotation in a Staging Environment First (05-rules.md)

---

## Related Skills

- Rotate Encryption Keys Without Data Loss (06-skills.md)

---

## Rotation Automation

---

## Decision Context

Whether to rotate keys manually (on-demand) or through automated scheduled tasks.

---

## Decision Criteria

* operational
* compliance

---

## Decision Tree

Is key rotation required by compliance (annually, semi-annually)?
↓
YES → Automated rotation scheduled (cron or CI/CD pipeline)
NO → Manual rotation acceptable if infrequent (compromise-only)

How many keys need rotation?
↓
Few (1-3 keys) → Manual manageable
Many (10+ service keys, multiple environments) → Automated rotation required

What is the team size?
↓
Small team (1-3 devs) → Manual rotation with documented process
Large team (10+ devs) → Automated rotation (human forgetfulness risk)

Is there a rotation automation tool available (Locksmith, custom command)?
↓
YES → Automate (reduce human error)
NO → Manual with checklist

What is the rotation frequency?
↓
Monthly or more → Automate (too frequent for manual)
Quarterly or less → Manual acceptable with checklist

---

## Rationale

Automated rotation ensures consistency and reduces human error (forgetting to rotate, incorrect rotation procedure). For compliance-required rotation (annual), automation ensures the rotation happens on schedule. For infrequent emergency rotations, manual rotation with a documented procedure may be acceptable. The complexity of automation is justified when rotation is frequent or when many keys must be rotated.

---

## Recommended Default

**Default:** Automated rotation via scheduled Artisan command for compliance-driven rotation; documented manual procedure for emergency rotation
**Reason:** Automation ensures rotation happens on schedule without human error. A documented emergency procedure covers the rare case where immediate manual intervention is needed. The automation should log each rotation and notify the team.

---

## Risks Of Wrong Choice

- Manual only: rotation is skipped or forgotten (compliance violation)
- Automated without monitoring: rotation succeeds silently but new keys don't work
- Automated without staging test: production rotation fails (data loss)
- Both manual and automated: conflicting rotation operations

---

## Related Rules

- Implement a Key Rotation Artisan Command (05-rules.md)
- Maintain a Key History for Rolling Back Rotations (05-rules.md)
- Monitor for Decryption Failures After Rotation (05-rules.md)

---

## Related Skills

- Rotate Encryption Keys Without Data Loss (06-skills.md)

---

## Key Storage During Rotation

---

## Decision Context

Whether to store only the current key, or maintain both old and new keys during the rotation grace period.

---

## Decision Criteria

* architectural

---

## Decision Tree

Is there a grace period active?
↓
YES → Store both keys (old for decryption, new for encryption/decryption)
NO → Store only current key

Are there records encrypted with the old key that have not been re-encrypted?
↓
YES → Old key must remain accessible (dual-read capability)
NO → Old key can be discarded

Do any services cache the old key?
↓
YES → Old key must remain valid until cache TTL expires
NO → Only current key needed

Is there a key history for rollback?
↓
YES → Store old keys encrypted in database (for rollback scenarios)
NO → Implement key history (maintain at least last N keys for rollback)

Are there multiple environments with different rotation schedules?
↓
YES → Separate key storage per environment
NO → Single environment key storage

---

## Rationale

During rotation, both old and new keys must be accessible. The old key is needed to decrypt existing data; the new key encrypts new data. After the grace period and full re-encryption, the old key can be archived (encrypted) for potential rollback. Key history enables recovery if a rotation causes unforeseen issues.

---

## Recommended Default

**Default:** Maintain dual keys during grace period (old + new); archive old keys encrypted in a `key_versions` table after full migration
**Reason:** Dual-key approach enables zero-downtime rotation — old data remains decryptable while new data uses the new key. Archived old keys provide rollback capability if needed. Archive storage must be encrypted with a separate key to prevent compromise.

---

## Risks Of Wrong Choice

- Discarding old key during grace period: old records become undecryptable
- No key history: cannot rollback after rotation issues
- Old key stored insecurely: attacker can decrypt old data if old key compromised
- Same key storage for all environments: dev key exposure compromises production

---

## Related Rules

- Maintain a Key History for Rolling Back Rotations (05-rules.md)
- Use a Dual-Key Approach During Rotation (Read Old, Write New) (05-rules.md)

---

## Related Skills

- Rotate Encryption Keys Without Data Loss (06-skills.md)
