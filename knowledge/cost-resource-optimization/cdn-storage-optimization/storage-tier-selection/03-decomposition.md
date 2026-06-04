# Decomposition: Storage Tier Selection

## Topic Overview
S3 storage tiers (Standard, Infrequent Access, One Zone-IA, Glacier) have different cost profiles based on access patterns. In Laravel applications, file storage includes user uploads (avatars, documents), application backups (database dumps), log archives, and static assets. Each type has different access frequency, retrieval time requirements, and durability needs. Choosing the right tier reduces storage costs by 40-80%.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-07-storage-tier-selection/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Storage Tier Selection
- **Purpose:** S3 storage tiers (Standard, Infrequent Access, One Zone-IA, Glacier) have different cost profiles based on access patterns. In Laravel applications, file storage includes user uploads (avatars, documents), application backups (database dumps), log archives, and static assets. Each type has different access frequency, retrieval time requirements, and durability needs. Choosing the right tier reduces storage costs by 40-80%.
- **Difficulty:** Foundation
- **Dependencies:** - Data Archival (ku-03 in database-cost-optimization), - S3 Lifecycle Policy Configuration, - CDN Integration (ku-01)

## Dependency Graph
**Depends on:**
- Data Archival (ku-03 in database-cost-optimization)
- S3 Lifecycle Policy Configuration
- CDN Integration (ku-01)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Standard: Active files accessed >1x/month; user uploads in current use; static assets for CDN
- Infrequent Access: Backups aged 30-90 days; older but keepable files; logs requiring occasional access
- One Zone-IA: Non-critical, reproducible data (thumbnails that can be regenerated from originals)
- Glacier Instant: Archival with immediate retrieval needs (compliance records)
- Glacier Deep Archive: Legal holds, 7-year retention compliance, never-accessed backups
**Out of scope:**
- Standard for cold data: Don't keep 2-year-old backups on Standard (costs 6x Glacier Deep Archive)
- IA for frequently accessed data: IA has $0.01/GB retrieval fee; frequently accessed files cost more on IA than Standard
- One Zone-IA for critical data: Single AZ failure = total data loss; never for irreplaceable files
- Glacier for data needing instant access: 12-hour retrieval from Deep Archive is unacceptable for user downloads
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization