# Anti-Patterns: Launchdarkly

**Domain:** governance-compliance-engineering
**Subdomain:** feature-flag-governance
**Knowledge Unit:** Launchdarkly

---

## Anti-Pattern 1: Compliance as an Afterthought
**Description:** Adding compliance controls after the application is fully built and deployed.
**Why It Happens:** Teams prioritize feature delivery, assuming controls can be retrofitted later.
**Consequences:**
- Missing audit trail for historical data
- Expensive schema migrations to add encrypted columns or audit tables
- Architectural compromises as controls are bolted on, not integrated
- Potential compliance gaps for the period before controls were added
**Solution:** Include compliance in initial architecture planning. Use Laravel's middleware, policies, and observer patterns from day one.

## Anti-Pattern 2: Excessive Audit Logging
**Description:** Logging every database change without filtering, masking, or retention planning.
**Why It Happens:** Fear-based logging — "we might need it for compliance."
**Consequences:**
- Massive table growth causing query degradation
- Uncontrolled storage costs
- PII leaking into audit logs without masking
- Difficulty finding relevant entries among noise
**Solution:** Define explicit audit requirements. Configure attribute filtering and sensitive field masking. Prune on schedule.

## Anti-Pattern 3: Key Storage Co-location
**Description:** Storing encryption keys in the same database or system as the encrypted data.
**Why It Happens:** Development convenience, assumption of internal network isolation.
**Consequences:**
- A single breach compromises both keys and data
- PCI-DSS and HIPAA explicitly prohibit this
- No separation of duties between data access and key management
**Solution:** Store keys in environment variables, vault services (AWS KMS, HashiCorp Vault), or HSMs. Never in the application database.

## Anti-Pattern 4: Manual Evidence Gathering
**Description:** Relying on humans to collect screenshots and documentation before audits.
**Why It Happens:** Automated evidence collection requires upfront engineering investment.
**Consequences:**
- Evidence gaps during observation windows
- Auditor rejection of manually gathered evidence
- Significant team time wasted before each audit cycle
- Evidence can be accidentally modified or incorrectly timestamped
**Solution:** Automate evidence collection from the start. Immutable snapshots with timestamps.

## Anti-Pattern 5: One-Size-Fits-All Isolation
**Description:** Same tenant isolation strategy for all data regardless of sensitivity.
**Why It Happens:** Simpler initial architecture, avoiding complexity.
**Consequences:**
- Over-isolation of low-risk data wastes resources
- Under-isolation of high-risk data creates compliance exposure
- Inflexible when new compliance requirements emerge
**Solution:** Match isolation level to data sensitivity. Column-scoped for public, schema-per-tenant for business, database-per-tenant for regulated data.

## Anti-Pattern 6: Check-Box Compliance
**Description:** Implementing controls that look correct on paper but do not actually protect data.
**Why It Happens:** Audit-driven mentality, prioritizing passing reviews over real security.
**Consequences:**
- False sense of security
- Real breaches despite passing compliance audits
- Regulatory penalties for ineffective controls
**Solution:** Test controls against real attack scenarios. Verify encryption, access controls, and audit trails under production-like conditions.

## Anti-Pattern 7: Stale Feature Flags
**Description:** Feature flags left indefinitely in code after the feature is fully released.
**Why It Happens:** No cleanup process, fear of removing flags.
**Consequences:**
- Code complexity from stale conditional branches
- Developer cognitive load maintaining dead paths
- Risk of accidental flag toggles re-enabling old behavior
- Noisy audit trails with irrelevant flag states
**Solution:** Lifecycle management for every flag. Owner, creation date, target removal date. Regular stale flag reviews.