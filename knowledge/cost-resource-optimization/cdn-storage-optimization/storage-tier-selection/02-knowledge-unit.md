# KU-07-STORAGE-TIER-SELECTION: Storage Tier Selection

## Metadata
- **ID**: KU-07-STORAGE-TIER-SELECTION
- **Subdomain**: CDN & Storage Optimization
- **Topic**: Storage Tier Selection
- **Source**: CDN & Storage Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
S3 storage tiers (Standard, Infrequent Access, One Zone-IA, Glacier) have different cost profiles based on access patterns. In Laravel applications, file storage includes user uploads (avatars, documents), application backups (database dumps), log archives, and static assets. Each type has different access frequency, retrieval time requirements, and durability needs. Choosing the right tier reduces storage costs by 40-80%.

## Core Concepts
- **S3 Standard**: $0.023/GB/month; high access frequency, 3-AZ durability
- **S3 Infrequent Access (IA)**: $0.0125/GB/month; lower access, 3-AZ durability; $0.01/GB retrieval cost
- **S3 One Zone-IA**: $0.01/GB/month; lowest cost for frequently accessed in single AZ; no AZ failure protection
- **S3 Glacier Instant Retrieval**: $0.004/GB/month; ms retrieval; min 90-day storage
- **S3 Glacier Flexible Retrieval**: $0.0036/GB/month; 1-5 min or 5-12 hour retrieval
- **S3 Glacier Deep Archive**: $0.00099/GB/month; 12-hour retrieval; min 180-day storage
- **Lifecycle policies**: Automated rules to transition objects between tiers based on age

## Mental Models
- Default: lifecycle policy for every bucket; never leave objects on Standard indefinitely
- For Laravel uploads, recommend Standard -> IA -> Glacier lifecycle with 30/180 day transitions
- Warn against Glacier for CDN origins

## Internal Mechanics
- Standard: sub-ms latency for first byte
- IA: same latency as Standard; no retrieval delay
- Glacier Instant: same latency as Standard
- Glacier Flexible: 1-5 minutes (expedited) or 5-12 hours (bulk)
- Glacier Deep Archive: 12 hours retrieval time
- Cache at CloudFront to minimize direct S3 retrievals from cold tiers

## Patterns
- Implement lifecycle policies
- Keep originals on Standard, derivatives on One Zone-IA
- Never use Glacier for CDN origin
- Tag objects for lifecycle rules

## Architectural Decisions
- Separate S3 buckets: `app-uploads-prod` (user files), `app-backups-prod` (logs/db dumps), `app-archive-prod` (legal/compliance)
- Lifecycle policy on uploads bucket: Standard (0-30d) -> IA (30-180d) -> Glacier (180d+)
- Lifecycle policy on backups bucket: Standard (0-7d) -> Glacier (7-365d) -> Deep Archive (365d+)
- Monitor transition costs: Glacier has minimum 90/180 day storage charges; deleting early incurs penalty
- Use S3 Intelligent-Tiering for unpredictable access patterns (monitoring fee applies)

## Tradeoffs
**When To Use:**
- Standard: Active files accessed >1x/month; user uploads in current use; static assets for CDN
- Infrequent Access: Backups aged 30-90 days; older but keepable files; logs requiring occasional access
- One Zone-IA: Non-critical, reproducible data (thumbnails that can be regenerated from originals)
- Glacier Instant: Archival with immediate retrieval needs (compliance records)
- Glacier Deep Archive: Legal holds, 7-year retention compliance, never-accessed backups

**When NOT To Use:**
- Standard for cold data: Don't keep 2-year-old backups on Standard (costs 6x Glacier Deep Archive)
- IA for frequently accessed data: IA has $0.01/GB retrieval fee; frequently accessed files cost more on IA than Standard
- One Zone-IA for critical data: Single AZ failure = total data loss; never for irreplaceable files
- Glacier for data needing instant access: 12-hour retrieval from Deep Archive is unacceptable for user downloads

## Performance Considerations
- Standard: sub-ms latency for first byte
- IA: same latency as Standard; no retrieval delay
- Glacier Instant: same latency as Standard
- Glacier Flexible: 1-5 minutes (expedited) or 5-12 hours (bulk)
- Glacier Deep Archive: 12 hours retrieval time
- Cache at CloudFront to minimize direct S3 retrievals from cold tiers

## Production Considerations
- Glacier vault lock policy for compliance (WORM storage)
- Object lock prevents deletion/modification during retention period
- Cross-region replication for critical archived data
- Server-side encryption (SSE-S3 or SSE-KMS) applies to all tiers
- Lifecycle policies do not bypass IAM permissions; access remains controlled

## Common Mistakes
- **Standard for all data**: Keeping every object on S3 Standard regardless of access (Cause: set-and-forget bucket setup; Consequence: paying 23x more for cold data than Deep Archive; Better: lifecycle policy to auto-transition aged objects)
- **Using Glacier for frequently accessed objects**: Moving actively accessed files to Glacier (Cause: "cheapest tier" mentality; Consequence: 12-hour retrieval delays, failed user downloads; Better: use Standard for active files; lifecycle transition only for truly cold data)
- **No backup tiering**: Database dumps from 2 years ago on Standard (Cause: no lifecycle policy on backup bucket; Consequence: $27.60/GB/year vs $1.20/GB/year on Deep Archive; Better: transition backups to Glacier after 30 days)

## Failure Modes
- **Single bucket, no lifecycle**: Every object stays on Standard forever, regardless of age or access
- **Glacier as CDN origin**: Direct HTTP access to Glacier-backed objects causes multi-hour delays
- **Manual object tiering**: Engineers manually moving files between tiers; misses objects, error-prone

## Ecosystem Usage
- **User uploads lifecycle**: Standard (30 days for latest uploads) -> IA (150 days for older but accessible) -> Glacier (for 3+ year old uploads, retrievable in 5 min)
- **Database backups lifecycle**: Standard (7 days for immediate disaster recovery) -> Glacier Instant (90 days for weekly/monthly) -> Deep Archive (7 years for compliance)
- **Log archive**: Standard (1 day for active processing) -> Glacier (after log analysis complete, 5-min retrieval if needed)

## Related Knowledge Units
- Data Archival (ku-03 in database-cost-optimization)
- S3 Lifecycle Policy Configuration
- CDN Integration (ku-01)

## Research Notes
Derived from CDN & Storage Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.