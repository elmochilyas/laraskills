# Foothing GDPR Consent

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** gdpr-regulatory-compliance
- **Knowledge Unit:** Foothing GDPR Consent
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Foothing GDPR Consent is a Laravel package focused specifically on consent management, providing granular consent tracking for multiple processing purposes with user-friendly interfaces. It enables applications to collect, store, and manage GDPR-compliant consent with clear audit trails and consent revocation capabilities.

---

## Core Concepts

- **Multi-purpose consent** allows users to consent to different processing activities independently
- **Consent history** records every consent action (grant, withdraw, change) with timestamps and evidence
- **Purpose-based consent grouping** organizes processing activities under named purposes with descriptions
- **Consent expiration** allows time-limited consent for purposes where ongoing consent is required
- **Consent proof** cryptographically signs consent records for tamper evidence
- **Consent withdrawal** processes revocation and propagates to connected processing systems

---

## Mental Models

- **The Permission Slip:** Like a school permission slip — parents check which activities they consent to (field trip, photos, medical treatment). Each purpose is a checkbox with independent consent.
- **The Checkbox Hierarchy:** Consent purposes are organized like form checkboxes — some are required (contractual necessity), some optional (marketing), and users can toggle each independently.
- **The Expiration Stamp:** Like a parking permit with an expiration date, some consents are valid for a limited time and require renewal.

---

## Internal Mechanics

Foothing stores consent records in a dedicated database table. Each consent record links a user to a processing purpose with status (granted/withdrawn/expired), timestamp, IP address, user agent, and a cryptographic proof (hash of consent data + server secret). The package provides middleware to check consent before processing. Blade components render consent management UI. A scheduled command checks for expired consents and triggers withdrawal workflows. Consent records are immutable — changes create new records rather than updating existing ones.

---

## Patterns

**Granular Consent Collection Pattern:** Present consent purposes individually with clear descriptions and independent toggles. Benefit: GDPR compliant (specific, informed, unambiguous consent). Tradeoff: UI complexity increases with number of purposes.

**Consent Gating Pattern:** Use middleware or service-layer checks to gate data processing based on consent status. Benefit: Processing only occurs with valid consent. Tradeoff: Every processing operation must resolve consent status.

**Consent Refresh Pattern:** Periodically ask users to re-confirm consent for ongoing processing purposes. Benefit: Ensures consent remains valid for active processing. Tradeoff: Consent fatigue may lead to unnecessary withdrawals.

---

## Architectural Decisions

Present consent purposes as clearly separated options — bundling purposes violates GDPR consent requirements. Store consent records permanently — consent proof must be maintainable for regulatory demonstration. Implement consent gating at the service layer for transactional processing and at the middleware level for request-based processing. Use cryptographic consent proofs for tamper evidence. Handle consent withdrawal propagation to downstream systems and third-party processors.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Granular, purpose-specific consent | More consent options increase UI complexity | Better GDPR compliance but more user friction |
| Cryptographic consent proof | Proof verification adds processing overhead | Tamper evidence for regulatory defense |
| Immutable consent history | Storage grows permanently with each consent action | Plan for long-term consent storage |
| Consent expiration management | Renewal workflows require user engagement | Consents for ongoing processing stay current |

---

## Performance Considerations

Consent checks add minimal overhead when indexed properly. Cryptographic proof generation and verification adds microseconds per operation. The consent table grows with each consent action — partition by year for management. Index on user_id, purpose, and status for efficient gating queries. Cache consent status in session or application cache for request-scope performance.

---

## Production Considerations

Implement consent check middleware on all personal data processing routes. Monitor consent withdrawal rates — sudden increases may indicate issues. Set up alerts for consent expiration — notify users before their consent expires for ongoing processing. Test consent proof verification periodically to ensure cryptographic integrity. Export consent records for regulatory inspection. Document consent purposes and their legal bases for compliance evidence.

---

## Common Mistakes

**Bundling multiple processing purposes into one consent checkbox** — GDPR requires specific, separate consent for each purpose. Each purpose must have its own consent option.

**Not handling consent withdrawal during active processing sessions** — if a user withdraws consent during a session, processing for withdrawn purposes must stop immediately.

**Deleting consent records when users delete accounts** — consent proof must be retained even if the account is deleted. Anonymize the link while keeping the consent record.

---

## Failure Modes

- **Consent proof verification failure:** Algorithm change or key rotation invalidates existing proofs. Maintain backwards compatibility for historical proofs.
- **Consent propagation failure:** Withdrawal not propagated to connected systems. Implement retry mechanism with alerting.
- **Consent expiration notification failure:** User not notified of pending expiration. Monitor and retry notification delivery.
- **Consent UI rendering error:** Users unable to manage their consents. Implement fallback consent management via API.

---

## Ecosystem Usage

Foothing GDPR Consent integrates with Laravel's authentication system and can be combined with other GDPR packages for complete compliance coverage. The consent middleware protects routes that process personal data. Consent management UI components can be embedded in user settings pages. The package works alongside data scrubbers for erasure request fulfillment.

---

## Related Knowledge Units

### Prerequisites
- GDPR Consent Requirements (Article 4(11), Article 7)
- Laravel Middleware and Blade Components
- Cryptographic Concepts (hashing, signing)

### Related Topics
- Sellinnate GDPR Consent (alternative consent management)
- Dialect GDPR Compliance (broader compliance framework)
- Rights Data Erasure (delete after consent withdrawal)

### Advanced Follow-up Topics
- Consent Management Platform (CMP) Integration
- Cross-System Consent Synchronization
- GDPR Consent Record Long-Term Archival

---

## Research Notes

Foothing GDPR Consent focuses specifically on GDPR consent management rather than providing a full compliance framework. This focused approach is appropriate for organizations that already have other compliance tooling and need consent-specific functionality. The multi-purpose consent model directly implements GDPR Article 7 requirements for specific, informed, and unambiguous consent. The cryptographic consent proof provides the tamper evidence that regulators expect during investigations. The consent expiration feature is particularly important for ongoing processing where valid consent must be maintained.
