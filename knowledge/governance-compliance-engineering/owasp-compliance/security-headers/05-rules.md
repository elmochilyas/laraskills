# Rules: Security Headers

**Domain:** governance-compliance-engineering
**Subdomain:** owasp-compliance
**Knowledge Unit:** Security Headers

---

## Rule 1: Authenticate Before Authorizing
**Condition:** When implementing access control checks
**Action:** Ensure authentication middleware runs before any authorization check
**Consequence:** Prevents unauthenticated users from reaching authorization logic where error messages might leak information about the system

## Rule 2: Log All Authorization Denials
**Condition:** A Gate, Policy, or permission check returns false
**Action:** Log the user ID, resource identifier, attempted action, and reason for denial
**Consequence:** Provides audit trail for security incident investigation and access pattern analysis

## Rule 3: Default-Denied Access
**Condition:** Defining new permissions or policies
**Action:** Return false or throw AuthorizationException unless access is explicitly granted
**Consequence:** Prevents accidental privilege escalation through omission or incomplete configuration

## Rule 4: Fail Closed on Control Failure
**Condition:** A compliance control (audit log, encryption, access check) encounters an error
**Action:** Deny the operation and log the failure with full context
**Consequence:** Ensures no data is processed without compliance verification, preventing regulatory gaps

## Rule 5: Secrets Never Co-locate with Data
**Condition:** Encryption keys, HMAC secrets, API tokens, database credentials
**Action:** Store in environment variables, vault services, or HSMs — never in the application database or source code
**Consequence:** Prevents a single breach from compromising both access credentials and protected data

## Rule 6: Immutable Audit Records
**Condition:** An audit log entry has been written
**Action:** Never allow UPDATE or DELETE operations on audit records within their retention window
**Consequence:** Maintains integrity and admissibility of audit evidence for regulatory review

## Rule 7: Legal Hold Overrides All Retention
**Condition:** A record is subject to an active legal hold
**Action:** Exclude from all automated pruning, anonymization, or hard-deletion processes
**Consequence:** Prevents spoliation of evidence that may be relevant to legal or regulatory proceedings

## Rule 8: Async Audit Writes
**Condition:** Audit logging occurs on a request-hot path
**Action:** Dispatch audit writes to a queue for asynchronous processing
**Consequence:** Prevents compliance overhead from degrading application response times

## Rule 9: Version-Controlled Compliance Config
**Condition:** Changes to compliance policies, control mappings, or retention rules
**Action:** Commit all changes to version control with a descriptive message explaining the reason
**Consequence:** Provides audit trail for configuration changes and enables rollback if needed

## Rule 10: Compliance Tests Required
**Condition:** Any change that affects a compliance-relevant control
**Action:** Include automated tests that verify the control is active and correctly configured
**Consequence:** Prevents regressions where controls are accidentally disabled or misconfigured during deployment