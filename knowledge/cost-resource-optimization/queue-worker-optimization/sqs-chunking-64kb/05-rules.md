# SQS 64KB Chunking Rules

## Rule 1: Keep Messages Under 64KB
- **Category**: Cost Management
- **Rule**: Always keep SQS message payloads under 64KB to avoid chunking into multiple billable requests
- **Reason**: SQS bills in 64KB chunks; a 65KB message counts as 2 requests, doubling the per-message cost; compression typically reduces payloads by 60-80%
- **Bad Example**: Sending a 100KB JSON payload as an SQS message, incurring 2 chunks and paying double per message
- **Good Example**: Compressing the payload with gzip to 25KB or sending only identifiers and fetching full data in the worker
- **Exceptions**: Payloads that cannot be compressed further (already compressed, encrypted binary) may accept the chunking cost
- **Consequences Of Violation**: 2x-4x higher SQS costs for messages exceeding the 64KB threshold

## Rule 2: Send Identifiers, Not Serialized Models
- **Category**: Design
- **Rule**: Store only model IDs or references in SQS messages instead of serialized Eloquent models
- **Reason**: Eloquent serialization often exceeds 64KB due to relations and eager-loaded data; a single model ID is <1KB, reducing message size by 95%+
- **Bad Example**: Dispatching a job with `$user->toArray()` (80KB with relations) as the SQS message payload
- **Good Example**: Dispatching `['user_id' => 123]` and fetching fresh data from database in the job handler
- **Exceptions**: Caches or snapshots where the exact data at dispatch time must be preserved without database changes
- **Consequences Of Violation**: Unnecessary chunking costs and larger message sizes that increase SQS API costs

## Rule 3: Compress Large Payloads with gzip
- **Category**: Performance
- **Rule**: Compress JSON payloads over 30KB with gzip before sending to SQS
- **Reason**: JSON compresses well; gzip on a 100KB payload typically yields 20-30KB—well under the 64KB threshold, saving 50%+ on message cost
- **Bad Example**: Sending a 100KB uncompressed JSON payload (2 chunks) when gzip would reduce it to ~25KB (1 chunk)
- **Good Example**: Compressing with `gzcompress($json, 9)` before sending and `gzuncompress()` after receiving
- **Exceptions**: Very small messages (<1KB) may not benefit; compression overhead may not be worth it
- **Consequences Of Violation**: Paying 2x for messages that could fit in a single chunk after compression

## Rule 4: Use S3 Claim-Check Pattern for Payloads Over 256KB
- **Category**: Architecture
- **Rule**: Use S3 claim-check pattern when message payloads exceed the 256KB SQS maximum
- **Reason**: SQS maximum message size is 256KB (4 chunks); for larger payloads, store in S3 and send the S3 reference in the SQS message
- **Bad Example**: Attempting to fit a 500KB payload into SQS, which is rejected at the API level with an InvalidMessageContents error
- **Good Example**: Storing the 500KB payload in S3, putting the S3 object key in the SQS message (<1KB), and having the worker read from S3
- **Exceptions**: Payloads under 256KB should use SQS directly without S3 overhead
- **Consequences Of Violation**: Job failures due to SQS message size limits; application errors in production

## Rule 5: Monitor Message Size Trends
- **Category**: Maintainability
- **Rule**: Monitor average SQS message size over time and alert when approaching the 64KB threshold
- **Reason**: Message sizes drift over time as models grow, relations are added, and new fields are included; a 50KB message today becomes 70KB after schema changes
- **Bad Example**: A job payload that was 45KB at launch grows to 68KB over 6 months due to added model relations, silently doubling its SQS cost
- **Good Example**: Setting a CloudWatch alarm on custom metric `AverageMessageSize` and reviewing payload composition when it exceeds 50KB
- **Exceptions**: Messages with strictly controlled schemas (versioned payloads) that cannot grow unexpectedly
- **Consequences Of Violation**: Silent cost increases as message sizes drift past the 64KB threshold
