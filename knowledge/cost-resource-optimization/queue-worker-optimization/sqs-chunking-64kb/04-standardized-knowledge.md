# SQS 64KB Chunking

## Metadata
- **ID**: KU-46-SQS-CHUNKING
- **Subdomain**: queue-worker-optimization
- **Domain**: cost-resource-optimization
- **Topic**: SQS 64KB Chunking
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
SQS messages are billed in 64KB chunks. A 65KB message counts as 2 requests (one for each 64KB chunk). This effectively doubles the cost of messages that exceed 64KB. The maximum message size is 256KB (4 chunks = 4 requests). Compressing message payloads to stay under 64KB is a critical cost optimization. For payloads over 256KB, use S3 Extended Client Library (claim-check pattern).

## Core Concepts
- **64KB chunk**: Every SQS request is billed per 64KB increment
- **65KB message**: Counts as 2 requests (double cost)
- **256KB maximum**: 4 chunks = 4 requests per message
- **Batching + chunks**: Each message in a batch is independently chunked
- **Solution**: Compress payloads, minimize metadata, use references instead of full payloads

## When To Use
- Applications serializing large Eloquent models directly into SQS messages
- Systems sending JSON payloads that may exceed 64KB
- High-volume queues where per-message cost matters
- Data pipelines with variable message sizes

## When NOT To Use
- Messages consistently under 10KB (chunking doesn't apply)
- Systems that only send message IDs (minimal payload)
- FIFO queues where payload size is tightly controlled

## Best Practices
- **Store only identifiers in SQS messages**: Send model IDs, not serialized models (WHY: Eloquent serialization often exceeds 64KB with relations; a single model ID is <1KB; worker fetches data from DB/cache when processing; reduces message size by 95%+)
- **Compress JSON payloads with gzip before sending**: Reduces size 60-80% (WHY: JSON compresses well; gzip on a 100KB payload typically yields 20-30KB — well under 64KB threshold; decompress on worker side; saves 50%+ on message cost for large payloads)
- **Use S3 claim-check pattern for payloads >256KB**: Store payload in S3, put S3 reference in SQS message (WHY: SQS max is 256KB; for larger payloads, S3 Extended Client Library stores payload in S3 and sends a reference pointer; worker reads from S3; cost shifts to S3 GET requests ($0.0004/10K) vs SQS chunks)
- **Monitor average message size in CloudWatch**: Track SQS metric ApproximateAgeOfOldestMessage + custom message size logging (WHY: message sizes drift over time as models grow; a 50KB message today becomes 70KB after new relation is added; regular monitoring catches threshold breaches)

## Related Topics
- SQS Pricing Model (ku-10)
- SQS Batching Savings (ku-11)
- File Compression (ku-??)

## AI Agent Notes
- Default: send identifiers, not serialized models, in SQS messages
- Default: compress JSON payloads >30KB with gzip
- Monitor message sizes; they grow over time as models add relations
- S3 claim-check pattern for payloads >256KB
