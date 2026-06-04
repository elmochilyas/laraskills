# Decision Trees: Kafka CDC with Debezium for Real-Time Analytics

## Decision: CDC vs Application Events

**Q: Who needs to react to data changes?**
- Multiple systems/services → CDC (captures all changes, not just application-emitted)
- Same service only → Application events may be simpler

**Q: Are changes made outside the application?**
- Yes (migrations, direct SQL, batch jobs) → CDC required
- No → Application events may suffice

**Q: Is sub-second latency required?**
- Yes → CDC (WAL-level capture is faster than application polling)
- No → Batch processing may be simpler

## Decision: Consumer Architecture

**Q: How many tables are tracked?**
- 1-5 → Single consumer group
- 5-20 → Per-domain consumer groups
- 20+ → Per-table consumer groups with auto-scaling
