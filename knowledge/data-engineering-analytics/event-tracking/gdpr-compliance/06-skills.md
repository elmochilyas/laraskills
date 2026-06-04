# Skills: GDPR Compliance Patterns

## Skill: GDPR-Compliant Analytics Middleware
**Purpose:** Implement privacy-first event tracking that complies with GDPR requirements.
**When to use:** Adding analytics tracking to any Laravel application serving EU users.
**Steps:**
1. Implement IP anonymization middleware that zeroes the last octet/bits before any processing
2. Implement consent check middleware that skips tracking unless explicit consent is present
3. Configure cookieless tracking using hash-based visitor identification
4. Implement granular consent storage with purpose-specific fields and timestamps
5. Set up retention enforcement via database TTLs or partition schedules
6. Implement right-to-erasure endpoint with chunked queue-based deletion
7. Configure log anonymization at the Monolog handler level
8. Set up read-only analytics database user for all application operations

## Skill: Consent Management Platform Integration
**Purpose:** Integrate a CMP with Laravel analytics for compliant consent collection.
**When to use:** Adding consent management to an existing or new analytics pipeline.
**Steps:**
1. Define consent purposes and required granularity
2. Implement consent API endpoints (give, withdraw, scope change)
3. Store consent records with timestamp and policy version
4. Implement consent caching for middleware performance
5. Create consent audit log with immutable record storage
6. Implement rate limiting on consent endpoints
7. Verify CSRF and replay attack resistance

## Skill: Analytics Data Deletion Service
**Purpose:** Implement efficient right-to-erasure for analytics data.
**When to use:** Adding GDPR-mandated data deletion capability to an existing analytics system.
**Steps:**
1. Identify all tables and columns that store user-identifiable data
2. Create a `UserAnalyticsData` service with chunked deletion per table
3. Implement queue-based deletion for users with large data footprints
4. Ensure idempotency: deleting the same user twice is safe
5. Log every deletion request with timestamp and user identifier
6. Implement verification: confirm deletion by querying remaining records
7. Handle edge cases: partially deleted data due to errors, concurrent deletion requests
