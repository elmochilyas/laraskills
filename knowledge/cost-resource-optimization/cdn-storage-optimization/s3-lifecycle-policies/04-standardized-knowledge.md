# S3 Lifecycle Policies

## Metadata
- **ID**: KU-21-S3-LIFECYCLE
- **Subdomain**: cdn-storage-optimization
- **Domain**: cost-resource-optimization
- **Topic**: S3 Lifecycle Policies
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
S3 lifecycle policies automatically transition objects to lower-cost storage tiers based on age. Moving objects to S3 Infrequent Access after 30 days saves ~40% vs Standard. Transitioning to Glacier Flexible Retrieval after 90 days saves ~80%. S3 Intelligent-Tiering automatically optimizes storage cost for unknown access patterns with a small monitoring fee. For Laravel apps with log files, user uploads, and backups, lifecycle policies are the primary storage cost control mechanism.

## Best Practices
- **Logs → IA at 14d, Glacier at 60d, delete at 365d**: Standard lifecycle for application logs (WHY: logs are rarely accessed after 14 days; IA saves 40%; after 60 days, Glacier minutes-retrieval is sufficient; delete after 1 year for compliance)
- **User uploads → IA at 30d, Glacier at 180d**: Standard lifecycle for user-generated content (WHY: user uploads accessed frequently initially; after 30 days, access drops significantly; after 180 days, only legal/compliance access remains; preserve in Glacier Deep Archive for 7 years if required)
- **Backups → Glacier Deep Archive at 7d**: Production backups to coldest storage quickly (WHY: backups only needed for disaster recovery; Deep Archive at $0.00099/GB is 96% cheaper than Standard; hours retrieval is acceptable for DR scenarios; minimum 90-day storage charge applies)
- **Build artifacts → delete after 7d**: CI/CD pipeline artifacts (WHY: build artifacts are ephemeral; keeping them in Standard storage indefinitely wastes money; delete lifecycle after 7 days; artifacts can be rebuilt if needed)
- **Use Intelligent-Tiering for unpredictable access patterns**: Auto-optimizes without lifecycle rules (WHY: when access patterns are unknown, Intelligent-Tiering monitors and moves objects; $0.0025/1K objects monitoring fee; may cost more than manual rules for very large buckets with many small objects)

## Related Topics
- CloudFront vs Direct S3 (ku-18)
- S3 to CloudFront Transfer (ku-19)
- Data Archival (ku-??)

## AI Agent Notes
- Default: lifecycle policies on ALL S3 buckets (no default Standard-tier retention)
- Logs → IA → Glacier → Delete at 1 year
- User uploads → IA → Glacier at 6 months
- Backups → Deep Archive at 7 days
- Build artifacts → delete at 7 days
