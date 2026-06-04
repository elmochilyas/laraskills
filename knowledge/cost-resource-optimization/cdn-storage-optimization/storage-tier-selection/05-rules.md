# Storage Tier Selection Rules

## Rule 1: Implement Lifecycle Policies on All Buckets
- **Category**: Cost Management
- **Rule**: Always configure lifecycle policies on every S3 bucket to transition objects to colder tiers based on age
- **Reason**: Keeping every object on S3 Standard indefinitely is the #1 storage cost waste; automated tier transitions save 40-96% on cold data with zero human intervention
- **Bad Example**: 2-year-old database backups on S3 Standard at $0.023/GB/month when they could be on Glacier Deep Archive at $0.00099/GB/month
- **Good Example**: Lifecycle policy: Standard (0-30d) -> IA (30-90d) -> Glacier (90-365d) -> Deep Archive (365d+)
- **Exceptions**: Buckets serving as CDN origin should not transition to Glacier due to retrieval delays
- **Consequences Of Violation**: Paying 6-23x more for cold data storage than necessary

## Rule 2: Match Storage Tier to Access Pattern
- **Category**: Architecture
- **Rule**: Choose storage tier based on access frequency, retrieval time requirements, and durability needs
- **Reason**: Standard = frequent access, IA = infrequent with 3-AZ, One Zone-IA = recreatable data, Glacier = archival with retrieval delay; wrong tier either wastes money or causes access failures
- **Bad Example**: Using Glacier Instant Retrieval ($0.004/GB/month) for daily-accessed user avatars when Standard ($0.023/GB/month) is appropriate; or vice versa
- **Good Example**: User uploads (accessed daily) -> Standard; thumbnails (recreatable) -> One Zone-IA; backups (rare access) -> Glacier; compliance (7-year retention) -> Deep Archive
- **Exceptions**: Intelligent-Tiering for unpredictable access patterns
- **Consequences Of Violation**: Overpaying for hot data on cold tiers (retrieval costs), or paying Standard prices for data accessed once a year

## Rule 3: Keep Originals on Standard, Derivatives on One Zone-IA
- **Category**: Cost Management
- **Rule**: Store original master files on Standard (3-AZ, durable) and generated derivatives (thumbnails, resized variants) on One Zone-IA
- **Reason**: Thumbnails and resized images are easily regenerated from originals; One Zone-IA is 50% cheaper than Standard; if an AZ fails, regenerate from originals
- **Bad Example**: Storing both original 20MB images and their 50KB thumbnails on Standard, paying full price for easily recreatable derivatives
- **Good Example**: Originals on Standard ($0.023/GB), generated thumbnails on One Zone-IA ($0.01/GB); 56% savings on derivative storage
- **Exceptions**: Non-recreatable derivative data (user-modified files, custom crops) should stay on Standard
- **Consequences Of Violation**: Paying 2x more for storage of derivative data that could be regenerated

## Rule 4: Never Use Glacier for CDN Origin Buckets
- **Category**: Architecture
- **Rule**: Keep S3 buckets used as CloudFront origins on Standard or Infrequent Access only
- **Reason**: CloudFront needs millisecond object retrieval; Glacier transitions cause hours-long retrieval delays on cache misses, breaking CDN performance and user experience
- **Bad Example**: CloudFront origin bucket with objects transitioning to Glacier after 30 days; a cache miss on a popular file triggers 12-hour retrieval
- **Good Example**: Keeping origin objects on Standard or IA (same latency as Standard), and moving original masters to a separate archive bucket with Glacier lifecycle
- **Exceptions**: CDN origins with 100% predictable caching (no expected cache misses after initial fetch)
- **Consequences Of Violation**: Multi-hour retrieval delays; broken user downloads; CDN performance degradation

## Rule 5: Account for Minimum Storage Charges in Glacier Tiers
- **Category**: Cost Management
- **Rule**: Factor in Glacier minimum storage duration charges (90 days for Glacier, 180 days for Deep Archive) when planning lifecycle transitions
- **Reason**: Objects deleted before the minimum period incur charges for the remaining days; short-lived objects on Glacier cost more than keeping them on Standard
- **Bad Example**: Transitioning daily log files to Glacier Deep Archive and deleting them after 30 days; incurring 150 days of minimum storage charges
- **Good Example**: Analyzing object lifetime: daily logs that live <90 days should stay on IA, not Glacier; only transition objects that will remain for >180 days
- **Exceptions**: Compliance requirements that mandate long-term retention (>180 days) automatically satisfy minimum storage periods
- **Consequences Of Violation**: Unexpected costs from minimum storage duration charges on frequently-deleted Glacier objects
