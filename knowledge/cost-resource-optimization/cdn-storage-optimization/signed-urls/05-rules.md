# Signed URLs Rules

## Rule 1: Use CloudFront Signed URLs Instead of S3 Presigned URLs
- **Category**: Architecture
- **Rule**: Always use CloudFront signed URLs or signed cookies for private content access; avoid S3 presigned URLs
- **Reason**: S3 presigned URLs bypass CloudFront entirely, losing caching, lower egress costs, and edge performance; CloudFront signed URLs provide equivalent access control with CDN benefits
- **Bad Example**: Generating S3 presigned URLs for paywalled PDF downloads; each download goes directly to S3 with no caching, higher egress cost
- **Good Example**: Generating CloudFront signed URLs with 5-minute expiry; CloudFront caches and serves the PDF at edge
- **Exceptions**: Legacy systems or IoT devices that cannot use CloudFront endpoints
- **Consequences Of Violation**: Higher data transfer costs; no edge caching for private content

## Rule 2: Enable Origin Access Control (OAC)
- **Category**: Security
- **Rule**: Use CloudFront Origin Access Control (OAC) to make S3 buckets fully private with access limited to CloudFront only
- **Reason**: Defense in depth—even if someone discovers the S3 bucket URL, they cannot download files directly; all access must go through CloudFront where signed URLs are enforced
- **Bad Example**: Keeping S3 bucket publicly readable and relying only on obfuscated URLs for "security"
- **Good Example**: OAC enabled, bucket policy blocks all public access, only CloudFront can read objects
- **Exceptions**: Public content in separate buckets does not need OAC
- **Consequences Of Violation**: Direct S3 access bypasses CloudFront signed URL enforcement; files accessible without authorization

## Rule 3: Use Short Signed URL Expiration
- **Category**: Security
- **Rule**: Set signed URL expiration to the shortest practical duration (1-5 minutes for downloads, hours for galleries)
- **Reason**: Prevents URL sharing and reduces the window of unauthorized access if a URL is intercepted
- **Bad Example**: Setting signed URL expiration to 24 hours for a one-time PDF download; the URL can be shared widely within that window
- **Good Example**: Setting 5-minute expiration; user must visit the site and authenticate to get a new URL
- **Exceptions**: Long-running batch processes that need extended access to specific files
- **Consequences Of Violation**: Increased risk of unauthorized file access through shared or intercepted URLs

## Rule 4: Use Signed Cookies for Multi-File Access
- **Category**: Performance
- **Rule**: Use CloudFront signed cookies when a user needs access to many files in a directory (galleries, member vaults)
- **Reason**: One signed cookie covers all files in a path; avoids generating hundreds of individual signed URLs and reduces URL length issues
- **Bad Example**: Generating 50 individual signed URLs for a user's document gallery; each URL is ~300 characters, causing header size issues
- **Good Example**: Setting a signed cookie for `/private/user/{id}/*`; all 50 images load with a single cookie
- **Exceptions**: Per-file granularity where each file has different access permissions requires individual signed URLs
- **Consequences Of Violation**: Unnecessary complexity; HTTP header size issues from multiple long signed URLs

## Rule 5: Never Store CloudFront Private Key in Repository
- **Category**: Security
- **Rule**: Store the CloudFront private key for URL signing in Secrets Manager or environment variables, never in the code repository
- **Reason**: Compromised private key allows anyone to generate valid signed URLs for any file; key rotation is complex and requires CloudFront key group updates
- **Bad Example**: Committing the `.pem` private key file to the Git repository for "deployment convenience"
- **Good Example**: Storing key in AWS Secrets Manager, retrieving at runtime, rotating every 90 days
- **Exceptions**: Local development environments may use a separate non-production key
- **Consequences Of Violation**: If repository is breached, attacker can generate unlimited valid signed URLs for any private content
