# Rules: GDPR Compliance Patterns

## Rule GDPR-01: Anonymize at Capture
IP addresses MUST be anonymized at the middleware layer before any storage, queuing, or logging occurs. Storing a full IP even temporarily constitutes processing of personal data.

## Rule GDPR-02: Explicit Opt-In Required
Analytics tracking MUST NOT begin until the user has given explicit, informed consent. Pre-checked consent boxes or implied consent by continued use are non-compliant.

## Rule GDPR-03: Granular Consent Storage
Consent MUST be stored with granularity by purpose (analytics, marketing, personalization), not as a single boolean. Each consent must include the timestamp and privacy policy version.

## Rule GDPR-04: Retention Enforcement at Storage Layer
Data retention periods MUST be enforced at the database/storage layer (TTL, partition drop), not only in application code. Application-level deletion is a supplementary mechanism.

## Rule GDPR-05: Right to Erasure Must Be Efficient
The system MUST support deletion of all analytics data for a specific user and execute this deletion within a reasonable timeframe. Use chunked queue jobs for large datasets.

## Rule GDPR-06: Consent Audit Trail
Every consent action (given, withdrawn, scope changed) MUST be logged with timestamp, consent scope, and anonymized IP. This audit trail must be immutable and retained for at least the applicable regulatory period.

## Rule GDPR-07: Log Anonymization
Server and application logs MUST NOT contain full IP addresses or other personal data. Configure log anonymization at the Monolog handler level.

## Rule GDPR-08: Analytics Database Access Control
The analytics database connection MUST be read-only for all standard application operations. Only the deletion and maintenance services should have write access to personal data.

## Rule GDPR-09: Rate Limit Consent Endpoints
Consent management and data deletion endpoints MUST be rate limited per user but not so aggressively that legitimate requests fail. Use sliding window rate limiters.

## Rule GDPR-10: Retention Audit
Retention periods MUST be reviewed and documented annually. Changes to retention policy require an audit trail entry explaining the change and its effective date.
