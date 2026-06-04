# Decision Trees: Queue Dispatching for Analytics Event Processing

## Decision: Queue Connection Selection

**Q: What is the expected event throughput?**
- < 100 events/sec → Database queue (simplest setup)
- 100-10,000 events/sec → Redis queue
- 10,000+ events/sec → SQS or dedicated Redis cluster

**Q: Is exactly-once processing required?**
- Yes → Use Redis (supports atomic locks for ShouldBeUnique)
- No → Any queue driver works

**Q: Is the infrastructure AWS-native?**
- Yes → SQS for analytics (auto-scaling, no Redis to manage)
- No → Redis (predictable latency, easy self-hosting)

## Decision: Payload Size Management

**Q: Does the event payload exceed 64KB?**
- Yes → Split into multiple smaller events or truncate context
- No → Proceed with standard dispatch

**Q: Is full request context needed for enrichment?**
- Yes → Extract only enrichment-relevant fields (not the full request)
- No → Store only the event name, timestamp, and user ID

## Decision: Retry Strategy

**Q: What type of failure is expected?**
- Transient (network, timeout) → Retry with exponential backoff (5-10 attempts)
- Permanent (validation, schema) → Fail immediately, log for review
- Unknown → Retry with moderate attempts (5) and monitor failure patterns

## Decision: Queue Isolation Level

**Q: Is the system multi-tenant?**
- Yes → Per-tenant queue names or priority queue per tenant tier
- No → Single analytics pipeline queue topology
