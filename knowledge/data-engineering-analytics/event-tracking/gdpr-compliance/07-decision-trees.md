# Decision Trees: GDPR Compliance Patterns

## Decision: When to Anonymize IP

**Q: Is the IP stored at any point?**
- Yes → Anonymize before any storage (middleware layer)
- No → Determine if IP is logged or queued

**Q: Is the IP passed through a queue?**
- Yes → Anonymize before dispatch; queue messages retain personal data
- No → Anonymize before database insert

## Decision: Consent Required or Exempt

**Q: Is the data strictly necessary for website operation?**
- Yes → Legitimate interest basis; consent not required but disclosure still mandatory
- No → Explicit consent required before tracking begins

**Q: Is the tracking cookieless and anonymous?**
- Yes → May qualify for lighter consent (implied or soft opt-in)
- No → Full GDPR consent flow required with CMP

## Decision: Retention Period

**Q: What type of analytics data is this?**
- Aggregate (page views, unique visitors) → 14-26 months
- Detailed event data with any user context → 30-90 days
- Raw logs → 7-30 days

## Decision: Right to Erasure Strategy

**Q: How many records per user?**
- < 1,000 → Synchronous deletion in request lifecycle (with timeout)
- 1,000-100,000 → Queue-based chunked deletion
- 100,000+ → Queue-based deletion with progress tracking and notification

## Decision: Storage Location

**Q: Are analytics data stored in the same database as OLTP data?**
- Yes → Implement row-level security and read-only analytics user
- No → Ensure cross-database deletion coordination
