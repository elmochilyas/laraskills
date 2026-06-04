# Rules: Zero-Downtime Migration

## ZDM-001: Size Threshold for Online Tools
**Condition:** Migration on table > 1 million rows
**Action:** Use pt-online-schema-change or gh-ost instead of standard ALTER TABLE
**Rationale:** Standard ALTER TABLE locks the table for extended duration
**Consequences:** Violation causes write downtime for duration of schema change

## ZDM-002: Throttle During Peak Traffic
**Condition:** Online schema change running during business hours
**Action:** Configure throttling based on replication lag and server load
**Rationale:** Unthrottled migration consumes server resources needed for production traffic
**Consequences:** Violation degrades production database performance during migration

## ZDM-003: Test on Staging First
**Condition:** Online schema change tool used
**Action:** Run migration on staging with production-sized data
**Rationale:** Unforeseen tool issues are discovered during production migration
**Consequences:** Violation causes unexpected production database impact

## ZDM-004: Fallback Plan Required
**Condition:** Online migration initiated
**Action:** Verify that original table remains untouched until migration completes
**Rationale:** Online schema change tools use shadow table pattern; original must be intact for fallback
**Consequences:** Violation risks data loss if migration fails mid-process
