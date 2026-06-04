# Laravel Data Scrubber

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** data-retention-anonymization
- **Knowledge Unit:** Laravel Data Scrubber
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Data Scrubber patterns provide automated anonymization, pseudonymization, and sanitization of sensitive data in existing database records. For GDPR compliance (right to erasure, data minimization) and internal data governance, scrubbers ensure that personally identifiable information (PII) is irreversibly removed or obfuscated when it's no longer needed for its original purpose.

---

## Core Concepts

- **Anonymization:** Irreversibly removing PII so the data subject can no longer be identified. The resulting data is no longer personal data under GDPR.
- **Pseudonymization:** Replacing identifiers with pseudonyms, keeping the reidentification key separate. Data remains personal data but with reduced risk.
- **Scrubber classes:** Dedicated classes that define how specific data types or models are scrubbed, implementing a common interface
- **Dry-run mode:** Preview which records would be affected without actually modifying data
- **Batch processing:** Scrubbing large datasets in configurable chunks to avoid memory and timeout issues
- **Audit trail:** Logging all scrubbing operations for compliance evidence

---

## Mental Models

- **The Paper Shredder:** Structured data is fed through a shredder that destroys specific sensitive fields while leaving non-sensitive data intact.
- **The Redaction Pen:** Like redacting a document — blacking out sensitive portions while keeping the document's overall structure and non-sensitive content.
- **The Witness Protection:** Data subject identities are changed while their underlying data (purchases, behaviors) is preserved for analytics.

---

## Internal Mechanics

A data scrubber is an Artisan command or queued job that queries eligible records (based on age, status, or criteria), then applies configured transformations to specified fields. Transformations include: setting null, replacing with random data, replacing with fixed placeholder, masking (e.g., `j***@example.com`), hashing, or shuffling. The scrubber processes records in chunks, respecting a configurable batch size. A dry-run mode logs what would change without modifying data. Transformations are logged for audit purposes. The scrubber can be scheduled (cron) or triggered on-demand.

---

## Patterns

**Field-Level Scrubber Pattern:** Define transformations for individual fields on a model. Benefit: Granular control over which data elements are scrubbed. Tradeoff: Requires field-level configuration for each sensitive attribute.

**Model-Level Scrubber Pattern:** Define a complete scrubbing strategy for a model, handling all its sensitive fields and relationships. Benefit: Single class per model, easy to test. Tradeoff: Couples scrubbing logic to specific model structure.

**Criteria-Based Scrubber Pattern:** Define eligibility criteria (e.g., records older than X days with no activity) that trigger scrubbing. Benefit: Automates retention policy enforcement. Tradeoff: Criteria logic must align with regulatory and business requirements.

---

## Architectural Decisions

Implement scrubbers as Artisan commands for manual triggering and scheduled tasks for automation. Always implement dry-run mode for review before execution. Use the queue for large operations to avoid timeout. Log all scrubbing operations for audit evidence. Implement reversibility flags — pseudonymization may need reidentification capability for certain use cases. Test scrubbers in staging environments with realistic data volumes.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Automated compliance enforcement | Scrubber maintenance as models evolve | Update scrubbers when adding/modifying sensitive fields |
| Irreversible anonymization for GDPR | Reversibility options limited | Cannot recover original data after anonymization |
| Dry-run mode prevents accidents | Dry-run and actual run must match | Configuration drift between dry-run and execution |
| Batch processing handles large datasets | Long-running operations for large tables | Schedule during maintenance windows |

---

## Performance Considerations

Scrubbing operations modify many records — use chunked queries to avoid table locks and memory exhaustion. Batch size should be tuned per model — larger models need smaller batches. Index the columns used in eligibility criteria (created_at, updated_at, status) for efficient queries. Monitor I/O during scrubbing — heavy write operations may impact production performance. Run scrubbers during off-peak hours. Estimate scrub duration based on record count and average transformation time.

---

## Production Considerations

Always run dry-run before production scrubbing and get approval on the preview. Implement a kill switch — ability to stop a running scrub operation without data corruption. Monitor scrub progress and send notifications on completion or failure. Maintain a scrub log for audit evidence — what was scrubbed, when, by whom, and what rules were applied. Establish a scrub schedule aligned with regulatory retention requirements. Test scrub recovery — verify that scrubbed data cannot be recovered through database logs or backups.

---

## Common Mistakes

**Irreversible anonymization without business need verification** — once anonymized, data cannot be used for future legitimate purposes. Confirm the data is no longer needed.

**Forgetting to scrub related data** — scrubbing a user record but leaving their orders, comments, or logs identifying them. Scrub all related data.

**Not accounting for soft deletes** — soft-deleted records may still contain PII. Include soft-deleted records in scrubbing eligibility where required.

---

## Failure Modes

- **Scrubber timeout:** Large dataset exceeds execution timeout. Use smaller batch sizes and queued jobs.
- **Partial scrub due to error:** Some records processed, others not. Implement transactional batch processing with rollback on failure.
- **Transformation rule error:** Field renamed or removed, scrubber transforms wrong field. Field mapping validation before execution.
- **Reidentification via remaining data:** Anonymized records can still identify subjects through data combination. Verify scrub completeness against reidentification risk.

---

## Ecosystem Usage

Laravel data scrubbers are typically implemented as custom Artisan commands within applications. Community packages like `laravel-cleaners`, `laravel-gdpr`, and privacy-focused packages provide reusable scrubber patterns. The `Laravel Prunable` trait can be combined with scrubbers — prune after scrubbing for complete data lifecycle management. Scrubbers integrate with Laravel's scheduling for automated execution and Horizon for queue management.

---

## Related Knowledge Units

### Prerequisites
- Eloquent ORM (querying and updating records)
- GDPR Right to Erasure requirements
- Data Anonymization Techniques (masking, hashing, shuffling)

### Related Topics
- Laravel Prunable Trait (deletion after scrubbing)
- Retainable Contract Pattern (data retention scheduling)
- GDPR Compliance (regulatory context)

### Advanced Follow-up Topics
- K-Anonymity and Differential Privacy for Analytics Data
- Automated Data Classification-Driven Scrubbing
- Cross-System Data Synchronization after Scrub

---

## Research Notes

Data scrubbing is distinct from deletion — deletion removes entire records while scrubbing preserves non-sensitive data for business analytics. The GDPR distinction between anonymization (data no longer personal) and pseudonymization (data remains personal but with reduced risk) is crucial for determining whether scrubbed data falls under GDPR requirements. For Laravel applications, the most challenging aspect of scrubbing is ensuring data flows (backups, caches, logs, third-party services) are also scrubbed — scrubbing the primary database alone is insufficient for complete compliance.
