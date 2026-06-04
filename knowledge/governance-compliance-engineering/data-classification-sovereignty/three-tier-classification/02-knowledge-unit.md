# Three-Tier Classification

## Metadata
- **Domain:** Governance & Compliance Engineering
- **Subdomain:** data-classification-sovereignty
- **Knowledge Unit:** Three-Tier Classification
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Three-Tier Classification is a data governance framework that categorizes information into Public, Internal, and Restricted tiers, each with progressively stricter handling, storage, and access requirements. For Laravel applications in regulated environments, this classification ensures that security controls and compliance measures are proportional to data sensitivity, preventing both over-protection (wasted resources) and under-protection (compliance risk).

---

## Core Concepts

- **Public tier:** Data with no access restrictions — can be freely shared, cached, and distributed. Examples: marketing content, documentation, product descriptions.
- **Internal tier:** Data restricted to authorized personnel and systems — requires access control but not encryption at rest. Examples: internal communications, operational metrics, non-sensitive business records.
- **Restricted tier:** Highly sensitive data requiring maximum protection — encryption at rest and in transit, strict access logging, data residency controls. Examples: PII, financial records, health information, authentication credentials.
- **Classification metadata:** Tags or attributes attached to data entities indicating their classification tier
- **Automated enforcement:** Middleware, policies, and storage drivers that enforce handling rules based on classification
- **Data inventory:** An up-to-date registry of all data entities and their classification

---

## Mental Models

- **The Building Security Levels:** Public = lobby/entrance (no badge needed), Internal = office floors (badge required), Restricted = server room (badge + biometric + audit log).
- **The Library Classification:** Public = open shelves (anyone can read), Internal = reference section (must be checked out with librarian), Restricted = special collections vault (supervised access only).
- **The Postal Service:** Public = postcard (anyone can read), Internal = sealed envelope (addressee only), Restricted = registered mail with signature confirmation (tracked, verified delivery).

---

## Internal Mechanics

Classification is implemented as an attribute on data entities — a model property, database column, or metadata tag. Laravel middleware checks classification before serving data to users. Model observers enforce classification on create/update. Storage drivers route data to appropriate storage tiers based on classification (e.g., public → CDN, internal → standard storage, restricted → encrypted storage). Access policies use classification as a primary dimension. Audit logging is proportional — restricted data has full audit trails, internal has summary logs, public has minimal or no logging. Data lineage tracking is required for restricted data to trace all copies and transformations.

---

## Patterns

**Attribute-Based Classification Pattern:** Store classification as a model attribute or DB column. Benefit: Simple, queryable, inspectable. Tradeoff: Requires schema migration to add classification field.

**Metadata Tagging Pattern:** Use a tags/metadata system to apply classification to data entities without schema changes. Benefit: Flexible, can apply classification without modifying database. Tradeoff: More complex querying, risk of tag inconsistency.

**Classification Inheritance Pattern:** Child entities inherit classification from parent entities (e.g., order line items inherit from order). Benefit: Ensures consistent classification across related data. Tradeoff: Requires classification resolution logic for deep inheritance chains.

---

## Architectural Decisions

Implement classification at the model layer using a trait or base class. Use middleware for request-level enforcement — reject requests for restricted data without proper authorization. Choose three tiers as the default — more tiers increase complexity with diminishing returns. Implement classification review as part of data governance — periodically review data entities for correct classification. Enforce classification in storage selection — restricted data should never be stored on public-accessible storage.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Proportional security controls | Classification implementation overhead | Tier management across all data entities |
| Clear data handling guidelines | Misclassification risk (human error) | Need classification review and audit processes |
| Regulatory compliance alignment | Classification awareness in all data operations | Developer training and documentation requirements |
| Efficient resource allocation (right-sized protection) | Over-classification tendency (default Restricted) | Storage costs increase if too much data classified as Restricted |

---

## Performance Considerations

Classification checks in middleware add request latency proportional to number of classification rules. Cache classification metadata in application memory. Restricted data encryption/decryption adds latency — only apply to truly sensitive data. Separate storage tiers have different performance characteristics — public data on CDN is fastest, restricted data on encrypted storage is slowest. Query planning should account for classification — restricted data queries may need additional authorization checks.

---

## Production Considerations

Implement automated classification scanning — scheduled jobs that identify unclassified data and flag for review. Create a data classification dashboard showing inventory by tier. Set up alerts for classification violations — restricted data accessible without proper controls. Train all developers on classification guidelines. Include classification review in the code review process. Establish classification exemption procedures for edge cases. Monitor storage distribution across tiers — unexpected growth in Restricted storage may indicate over-classification.

---

## Common Mistakes

**Defaulting everything to Restricted** — defeats the purpose of classification by treating all data equally. Restricted should be the exception, not the default.

**Classifying data only at creation time** — data sensitivity can change over time. Implement periodic reclassification review.

**No classification for derived data** — reports, exports, and analytics outputs may contain restricted data. Classify derived data based on source data classification.

---

## Failure Modes

- **Misclassification:** Restricted data classified as Public. Data breach risk. Mitigate with automated scanning and reclassification.
- **Classification metadata loss:** Data loses its classification tag. Treat unclassified data as Restricted by default until reclassified.
- **Inheritance breakage:** Child entity loses link to parent for classification inheritance. Default to parent's classification or Restricted.
- **Storage tier mismatch:** Restricted data stored on public storage. Implement storage policy enforcement at the Filesystem driver level.

---

## Ecosystem Usage

Laravel applications implement three-tier classification through: model traits (`Classifiable`) that add a classification attribute, middleware (`EnsureDataClassification`) that checks authorization before serving data, Filesystem drivers that route files by classification to appropriate storage, and Blade directives that conditionally display data based on user clearance level. Spatie Permission can be integrated to manage access roles corresponding to classification clearance.

---

## Related Knowledge Units

### Prerequisites
- Data Governance Fundamentals
- Information Security Concepts
- Laravel Middleware and Policy System

### Related Topics
- BYOK/HYOK Encryption (encryption strategy for Restricted tier)
- Data Residency Tenants (geo-restriction by classification)
- Access Control Authorization (clearance-based access)

### Advanced Follow-up Topics
- Dynamic Classification Based on Context and Aggregation
- Automated Data Discovery and Classification
- Cross-System Classification Synchronization

---

## Research Notes

Three-tier classification is a well-established data governance pattern from government (Confidential, Secret, Top Secret) adapted for commercial use. The specific tier names vary (Public/Internal/Confidential, Tier 1/2/3, Green/Yellow/Red), but the three-level structure reflects the practical reality that binary classification (public/private) is insufficient and more than three tiers creates manageability problems. For Laravel applications, the most common implementation challenge is ensuring derived data (reports, exports, API responses) inherits the correct classification from source data — this requires careful data flow analysis and consistent enforcement.
