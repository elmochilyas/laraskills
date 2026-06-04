# Anti-Patterns: GDPR Compliance Patterns

## "It's Just Analytics, Not Personal Data"
Assuming that analytics data (IP, user agent, behavior tracking) is not personal data because the application does not have user accounts. Even without user accounts, IP addresses and browser fingerprints are personal data under GDPR.

**Solution:** Treat all analytics tracking data as potentially personal data and apply GDPR protections by default.

## Consent Stored in the Same Table as Analytics Data
Storing consent records in the analytics events table creates a coupling that makes deletion complex and risks exposing consent status through analytics queries.

**Solution:** Store consent records in a separate database or schema with strict access controls.

## Relying on DNT/GPC Headers Alone
Implementing "Do Not Track" or "Global Privacy Control" support without also implementing consent management. These signals are not a substitute for GDPR-compliant consent.

**Solution:** DNT/GPC are one input to the consent system but must be combined with explicit consent management for full compliance.

## Manually Purging Analytics Data
Running manual DELETE queries for data deletion requests without logging or verification. This is not auditable and not verifiable.

**Solution:** Implement a documented, logged, and verified deletion process that can be demonstrated to auditors.

## Ignoring Processor Agreements
Using third-party analytics services (Google Analytics, Mixpanel) without a data processing agreement. The application owner (data controller) is responsible for ensuring all data processors have compliant agreements.

**Solution:** Review and sign DPAs with all analytics service providers before any data flows to them.
