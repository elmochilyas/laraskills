# S3 Lifecycle Policies Rules

## Rule 1: Implement Lifecycle Policies on Every S3 Bucket
- **Category**: Cost Management
- **Rule**: Always configure S3 lifecycle policies on every bucket to auto-transition objects to colder tiers based on age
- **Reason**: Keeping all objects on S3 Standard indefinitely is the #1 storage cost waste; lifecycle automation transitions cold data to IA (40% savings) or Glacier (80%+ savings) without human intervention
- **Bad Example**: A bucket with 2-year-old log files still on Standard, paying $0.023/GB/month instead of $0.00099/GB/month on Glacier Deep Archive
- **Good Example**: Lifecycle policy: Standard (0-30d) -> IA (30-90d) -> Glacier (90-365d) -> Deep Archive (365d+)
- **Exceptions**: Buckets with strictly short-lived objects (<7 days) may not need multi-tier transitions
- **Consequences Of Violation**: Paying 6-23x more for cold data storage than necessary

## Rule 2: Use Data Type-Specific Lifecycle Rules
- **Category**: Architecture
- **Rule**: Define separate lifecycle policies per data type (logs, uploads, backups, build artifacts)
- **Reason**: Different data types have different access patterns and retention requirements; a single lifecycle policy for all data either wastes money on cold data or deletes data prematurely
- **Bad Example**: Using the same lifecycle policy for user uploads (need 30-day Standard) and build artifacts (should delete after 7 days)
- **Good Example**: Logs -> IA at 14d, Glacier at 60d, delete at 365d; Uploads -> IA at 30d, Glacier at 180d; Backups -> Deep Archive at 7d; Build artifacts -> delete at 7d
- **Exceptions**: Buckets with a single data type may use a single policy
- **Consequences Of Violation**: Either paying too much for storage of certain data types, or deleting data before retention requirements are met

## Rule 3: Never Use Glacier for CDN Origin Buckets
- **Category**: Architecture
- **Rule**: Never configure lifecycle transitions to Glacier for S3 buckets used as CloudFront origins
- **Reason**: CloudFront needs millisecond object retrieval; Glacier transitions cause 12-hour cache misses if objects move to cold storage before CloudFront cache expires
- **Bad Example**: A CloudFront origin bucket with lifecycle policy moving objects to Glacier Flexible after 30 days; CloudFront cache miss triggers a 5-minute retrieval delay
- **Good Example**: Keeping CloudFront origin objects on Standard or IA, and using a separate archive bucket for Glacier-stored originals
- **Exceptions**: CDN origins serving only cached content with no expected cache misses
- **Consequences Of Violation**: Multi-hour retrieval delays for cache misses; broken user experience

## Rule 4: Use Intelligent-Tiering for Unpredictable Access Patterns
- **Category**: Cost Management
- **Rule**: Use S3 Intelligent-Tiering when object access patterns are unpredictable
- **Reason**: Intelligent-Tiering monitors and auto-moves objects between tiers based on access; the monitoring fee ($0.0025/1K objects) is worth it when you cannot predict which objects will be accessed how often
- **Bad Example**: Keeping all objects on Standard because "some might be accessed," when most are never accessed after 30 days
- **Good Example**: Using Intelligent-Tiering for a bucket with mixed access patterns; frequently accessed objects stay on Standard, rarely accessed ones auto-move to IA
- **Exceptions**: Very large buckets with many small objects where monitoring fee exceeds savings
- **Consequences Of Violation**: Paying Standard rates for cold data, or implementing complex custom tracking to determine access patterns

## Rule 5: Tag Objects for Granular Lifecycle Rules
- **Category**: Maintainability
- **Rule**: Use S3 object tags to enable selective lifecycle transitions within the same bucket
- **Reason**: Tags enable granular lifecycle policies without splitting objects into separate buckets; different object types can have different transition schedules based on tags
- **Bad Example**: Having all objects in one bucket with no tags, forcing a one-size-fits-all lifecycle policy
- **Good Example**: Tagging objects with `type=log`, `type=backup`, `type=archive` and creating lifecycle rules per tag
- **Exceptions**: Single-use buckets with uniform access patterns do not need tagging
- **Consequences Of Violation**: Either overpaying for storage or prematurely transitioning objects that need longer Standard access
